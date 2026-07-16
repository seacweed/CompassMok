import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { createInitialGame } from '../game/engine';
import { getCurrentUserOrThrow, getFirebase, userDisplayName } from './firebase';
import { forfeitGameServer, submitMoveServer } from './serverActions';

function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function roomRef(db, roomCode) {
  return doc(db, 'rooms', roomCode.toUpperCase());
}

export function getMyRole(room, uid) {
  if (!room?.players || !uid) return 'spectator';
  if (room.players.B === uid) return 'B';
  if (room.players.W === uid) return 'W';
  return 'spectator';
}

export async function createRoom({ size = 13, winLength = 7 } = {}) {
  const user = getCurrentUserOrThrow();
  const { db } = getFirebase();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateRoomCode();
    const ref = roomRef(db, code);
    const existing = await getDoc(ref);

    if (!existing.exists()) {
      const game = createInitialGame({ size, winLength });
      const room = {
        code,
        game,
        ranked: false,
        moveCount: 0,
        timeControl: {
          enabled: false,
          turnMs: null,
          graceMs: 60000,
        },
        turnDeadlineAtMs: null,
          players: {
          B: user.uid,
          W: null,
        },
        playerProfiles: {
          B: {
            uid: user.uid,
            name: userDisplayName(user),
            isGuest: user.isAnonymous,
          },
          W: null,
        },
        status: 'waiting',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(ref, room);
      return { code, role: 'B', uid: user.uid };
    }
  }

  throw new Error('방 코드를 생성하지 못했습니다. 다시 시도하세요.');
}

export async function joinRoom(code) {
  const user = getCurrentUserOrThrow();
  const { db } = getFirebase();
  const normalized = code.trim().toUpperCase();

  if (!normalized) throw new Error('방 코드를 입력하세요.');

  const ref = roomRef(db, normalized);
  let role = 'spectator';

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error('존재하지 않는 방입니다.');

    const room = snap.data();
    const players = room.players ?? { B: null, W: null };
    const playerProfiles = room.playerProfiles ?? { B: null, W: null };

    if (players.B === user.uid) role = 'B';
    else if (players.W === user.uid) role = 'W';
    else if (!players.B) {
      role = 'B';
      players.B = user.uid;
      playerProfiles.B = {
        uid: user.uid,
        name: userDisplayName(user),
        isGuest: user.isAnonymous,
      };
    } else if (!players.W) {
      role = 'W';
      players.W = user.uid;
      playerProfiles.W = {
        uid: user.uid,
        name: userDisplayName(user),
        isGuest: user.isAnonymous,
      };
    } else {
      role = 'spectator';
    }

    transaction.update(ref, {
      players,
      playerProfiles,
      status: players.B && players.W ? 'playing' : 'waiting',
      updatedAt: serverTimestamp(),
    });
  });

  return { code: normalized, role, uid: user.uid };
}

export function subscribeRoom(code, onRoom, onError) {
  const { db } = getFirebase();
  return onSnapshot(roomRef(db, code), (snap) => {
    if (!snap.exists()) {
      onRoom(null);
      return;
    }

    onRoom(snap.data());
  }, onError);
}

export async function submitRoomAction(code, action) {
  return submitMoveServer({ roomCode: code, action });
}

export async function forfeitRoom(code) {
  return forfeitGameServer({ roomCode: code });
}

export function subscribeMoves(code, onMoves, onError) {
  const { db } = getFirebase();
  const movesQuery = query(collection(db, 'rooms', code.toUpperCase(), 'moves'), orderBy('moveNo', 'asc'));
  return onSnapshot(movesQuery, (snap) => {
    onMoves(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
  }, onError);
}


export async function resetOnlineRoom(code, { size = 13, winLength = 7 } = {}) {
  const user = getCurrentUserOrThrow();
  const { db } = getFirebase();
  const ref = roomRef(db, code);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error('존재하지 않는 방입니다.');

    const room = snap.data();
    if (room.ranked) throw new Error('랭크 매치는 재시작할 수 없습니다. 새 매칭을 시작하세요.');

    const role = getMyRole(room, user.uid);
    if (role !== 'B' && role !== 'W') throw new Error('관전자는 새 게임을 시작할 수 없습니다.');

    transaction.update(ref, {
      game: createInitialGame({ size, winLength }),
      status: room.players?.B && room.players?.W ? 'playing' : 'waiting',
      updatedAt: serverTimestamp(),
    });
  });
}
