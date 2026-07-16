import {
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebase, userDisplayName } from './firebase';
import { DEFAULT_RATING, calculateRatingChange, resultForPlayer } from './ratings';

export function profileRef(db, uid) {
  return doc(db, 'users', uid);
}

export async function ensureUserProfile(user) {
  if (!user) return null;

  const { db } = getFirebase();
  const ref = profileRef(db, user.uid);
  const snap = await getDoc(ref);
  const baseProfile = {
    uid: user.uid,
    displayName: userDisplayName(user),
    photoURL: user.photoURL ?? null,
    isGuest: user.isAnonymous,
    provider: user.isAnonymous ? 'guest' : 'google',
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    const profile = {
      ...baseProfile,
      rating: DEFAULT_RATING,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      rankedGames: 0,
      rankedWins: 0,
      rankedLosses: 0,
      rankedDraws: 0,
      lastRatingDelta: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return { ...profile, createdAt: null, updatedAt: null };
  }

  await updateDoc(ref, baseProfile);
  return { ...snap.data(), ...baseProfile };
}

export function subscribeUserProfile(uid, onProfile, onError) {
  const { db } = getFirebase();
  return onSnapshot(profileRef(db, uid), (snap) => {
    onProfile(snap.exists() ? snap.data() : null);
  }, onError);
}

export function subscribeLeaderboard({ count = 20 } = {}, onRows, onError) {
  const { db } = getFirebase();
  const usersQuery = query(collection(db, 'users'), orderBy('rating', 'desc'), limit(count));
  return onSnapshot(usersQuery, (snap) => {
    onRows(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
  }, onError);
}

export async function applyRankedResultTransaction(transaction, db, room, result) {
  if (!room?.ranked) return null;
  if (room.ratingApplied) return null;

  const blackUid = room.players?.B;
  const whiteUid = room.players?.W;
  if (!blackUid || !whiteUid) return null;

  const blackRef = profileRef(db, blackUid);
  const whiteRef = profileRef(db, whiteUid);
  const blackSnap = await transaction.get(blackRef);
  const whiteSnap = await transaction.get(whiteRef);

  const blackProfile = blackSnap.exists() ? blackSnap.data() : { rating: DEFAULT_RATING };
  const whiteProfile = whiteSnap.exists() ? whiteSnap.data() : { rating: DEFAULT_RATING };
  const blackRating = blackProfile.rating ?? DEFAULT_RATING;
  const whiteRating = whiteProfile.rating ?? DEFAULT_RATING;
  const ratingChange = calculateRatingChange({ blackRating, whiteRating, result });

  const blackResult = resultForPlayer(result, 'B');
  const whiteResult = resultForPlayer(result, 'W');

  transaction.set(blackRef, buildProfileResultPatch({
    uid: blackUid,
    ratingAfter: ratingChange.B.after,
    delta: ratingChange.B.delta,
    result: blackResult,
  }), { merge: true });

  transaction.set(whiteRef, buildProfileResultPatch({
    uid: whiteUid,
    ratingAfter: ratingChange.W.after,
    delta: ratingChange.W.delta,
    result: whiteResult,
  }), { merge: true });

  return ratingChange;
}

function buildProfileResultPatch({ uid, ratingAfter, delta, result }) {
  return {
    uid,
    rating: ratingAfter,
    games: increment(1),
    rankedGames: increment(1),
    wins: result === 'win' ? increment(1) : increment(0),
    losses: result === 'loss' ? increment(1) : increment(0),
    draws: result === 'draw' ? increment(1) : increment(0),
    rankedWins: result === 'win' ? increment(1) : increment(0),
    rankedLosses: result === 'loss' ? increment(1) : increment(0),
    rankedDraws: result === 'draw' ? increment(1) : increment(0),
    lastRatingDelta: delta,
    updatedAt: serverTimestamp(),
  };
}

export function subscribeRecentGames(uid, { count = 10 } = {}, onRows, onError) {
  const { db } = getFirebase();
  const resultsQuery = query(
    collection(db, 'gameResults'),
    where('playerUids', 'array-contains', uid),
    orderBy('finishedAt', 'desc'),
    limit(count),
  );
  return onSnapshot(resultsQuery, (snap) => {
    onRows(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
  }, onError);
}

export function subscribeGlobalRecentGames({ count = 20 } = {}, onRows, onError) {
  const { db } = getFirebase();
  const resultsQuery = query(collection(db, 'gameResults'), orderBy('finishedAt', 'desc'), limit(count));
  return onSnapshot(resultsQuery, (snap) => {
    onRows(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
  }, onError);
}
