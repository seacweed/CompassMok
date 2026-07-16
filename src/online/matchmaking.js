import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { createInitialGame } from '../game/engine';
import { getCurrentUserOrThrow, getFirebase, userDisplayName } from './firebase';
import { DEFAULT_RATING } from './ratings';
import { ensureUserProfile, profileRef } from './profiles';
import { roomRef } from './rooms';

const QUEUE_COLLECTION = 'matchQueue';
const BASE_RANGE = 100;
const RANGE_STEP = 100;
const MAX_RANGE = 600;
const EXPAND_EVERY_MS = 10000;

function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function getRatingRange(waitedMs) {
  const steps = Math.floor(Math.max(0, waitedMs) / EXPAND_EVERY_MS);
  return Math.min(MAX_RANGE, BASE_RANGE + steps * RANGE_STEP);
}

export function queueRef(db, uid) {
  return doc(db, QUEUE_COLLECTION, uid);
}

export async function enterMatchQueue({ size = 13, winLength = 7 } = {}) {
  const user = getCurrentUserOrThrow();
  const profile = await ensureUserProfile(user);
  const { db } = getFirebase();
  const now = Date.now();

  const entry = {
    uid: user.uid,
    displayName: profile?.displayName ?? userDisplayName(user),
    rating: profile?.rating ?? DEFAULT_RATING,
    isGuest: user.isAnonymous,
    boardSize: size,
    winLength,
    status: 'waiting',
    joinedAtMs: now,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(queueRef(db, user.uid), entry);
  return entry;
}

export async function leaveMatchQueue() {
  const user = getCurrentUserOrThrow();
  const { db } = getFirebase();
  await deleteDoc(queueRef(db, user.uid));
}

export async function findRankedMatch({ size = 13, winLength = 7 } = {}) {
  const user = getCurrentUserOrThrow();
  const { db } = getFirebase();
  const selfRef = queueRef(db, user.uid);
  const selfQueueDoc = await getDoc(selfRef);

  if (!selfQueueDoc.exists()) return null;

  const selfEntry = selfQueueDoc.data();
  if (selfEntry.status === 'matched' && selfEntry.roomCode) {
    return {
      matched: true,
      code: selfEntry.roomCode,
      role: selfEntry.role,
      range: selfEntry.range,
    };
  }

  if (selfEntry.status !== 'waiting') return null;

  const selfRating = selfEntry.rating ?? DEFAULT_RATING;
  const waitedMs = Date.now() - (selfEntry.joinedAtMs ?? Date.now());
  const range = getRatingRange(waitedMs);
  const minRating = selfRating - range;
  const maxRating = selfRating + range;

  const candidatesQuery = query(
    collection(db, QUEUE_COLLECTION),
    where('status', '==', 'waiting'),
    where('boardSize', '==', size),
    where('winLength', '==', winLength),
    where('rating', '>=', minRating),
    where('rating', '<=', maxRating),
    orderBy('rating', 'asc'),
    limit(25),
  );

  const candidatesSnap = await getDocs(candidatesQuery);
  const candidates = candidatesSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((candidate) => candidate.uid !== user.uid)
    .sort((a, b) => {
      const ratingDiff = Math.abs((a.rating ?? DEFAULT_RATING) - selfRating) - Math.abs((b.rating ?? DEFAULT_RATING) - selfRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (a.joinedAtMs ?? 0) - (b.joinedAtMs ?? 0);
    });

  if (candidates.length === 0) {
    return { matched: false, range };
  }

  for (const candidate of candidates.slice(0, 5)) {
    const result = await tryCreateMatchRoom({
      selfUid: user.uid,
      candidateUid: candidate.uid,
      size,
      winLength,
      range,
    });

    if (result?.matched) return result;
  }

  return { matched: false, range };
}

async function tryCreateMatchRoom({ selfUid, candidateUid, size, winLength, range }) {
  const { db } = getFirebase();
  const code = generateRoomCode();
  const ref = roomRef(db, code);
  const selfQueueRef = queueRef(db, selfUid);
  const candidateQueueRef = queueRef(db, candidateUid);
  const selfProfileRef = profileRef(db, selfUid);
  const candidateProfileRef = profileRef(db, candidateUid);

  return runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(ref);
    const selfQueueSnap = await transaction.get(selfQueueRef);
    const candidateQueueSnap = await transaction.get(candidateQueueRef);
    const selfProfileSnap = await transaction.get(selfProfileRef);
    const candidateProfileSnap = await transaction.get(candidateProfileRef);

    if (roomSnap.exists()) return null;
    if (!selfQueueSnap.exists() || !candidateQueueSnap.exists()) return null;

    const selfEntry = selfQueueSnap.data();
    const candidateEntry = candidateQueueSnap.data();

    if (selfEntry.status === 'matched' && selfEntry.roomCode) {
      return {
        matched: true,
        code: selfEntry.roomCode,
        role: selfEntry.role,
        range: selfEntry.range,
      };
    }

    if (selfEntry.status !== 'waiting' || candidateEntry.status !== 'waiting') return null;
    if (selfEntry.boardSize !== size || candidateEntry.boardSize !== size) return null;
    if (selfEntry.winLength !== winLength || candidateEntry.winLength !== winLength) return null;

    const selfProfile = selfProfileSnap.exists() ? selfProfileSnap.data() : selfEntry;
    const candidateProfile = candidateProfileSnap.exists() ? candidateProfileSnap.data() : candidateEntry;
    const selfIsBlack = Math.random() < 0.5;

    const players = selfIsBlack
      ? { B: selfUid, W: candidateUid }
      : { B: candidateUid, W: selfUid };

    const playerProfiles = selfIsBlack
      ? {
          B: makeRoomProfile(selfProfile, selfEntry),
          W: makeRoomProfile(candidateProfile, candidateEntry),
        }
      : {
          B: makeRoomProfile(candidateProfile, candidateEntry),
          W: makeRoomProfile(selfProfile, selfEntry),
        };

    const selfRole = selfIsBlack ? 'B' : 'W';
    const candidateRole = selfIsBlack ? 'W' : 'B';

    const room = {
      code,
      ranked: true,
      ratingApplied: false,
      moveCount: 0,
      timeControl: {
        enabled: true,
        turnMs: 120000,
        graceMs: 60000,
      },
      turnDeadlineAtMs: Date.now() + 120000,
      game: createInitialGame({ size, winLength }),
      players,
      playerProfiles,
      ratingsBefore: {
        B: playerProfiles.B.rating ?? DEFAULT_RATING,
        W: playerProfiles.W.rating ?? DEFAULT_RATING,
      },
      match: {
        type: 'ranked',
        range,
        matchedAtMs: Date.now(),
        matchedAt: serverTimestamp(),
      },
      status: 'playing',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(ref, room);
    transaction.update(selfQueueRef, {
      status: 'matched',
      roomCode: code,
      role: selfRole,
      range,
      matchedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(candidateQueueRef, {
      status: 'matched',
      roomCode: code,
      role: candidateRole,
      range,
      matchedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      matched: true,
      code,
      role: selfRole,
      range,
    };
  });
}

function makeRoomProfile(profile, queueEntry) {
  return {
    uid: profile.uid ?? queueEntry.uid,
    name: profile.displayName ?? queueEntry.displayName ?? 'Player',
    isGuest: profile.isGuest ?? queueEntry.isGuest ?? false,
    rating: profile.rating ?? queueEntry.rating ?? DEFAULT_RATING,
  };
}
