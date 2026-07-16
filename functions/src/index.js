import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { applyAction, forceFinish, verifiedResult } from './engine.js';
import { DEFAULT_RATING, calculateRatingChange, resultForPlayer } from './ratings.js';

initializeApp();

const db = getFirestore();

export const submitMove = onCall(async (request) => {
  const uid = assertAuth(request);
  const { roomCode, action } = request.data ?? {};
  const normalized = normalizeRoomCode(roomCode);
  if (!normalized) throw new HttpsError('invalid-argument', 'roomCode가 필요합니다.');
  if (!action?.type) throw new HttpsError('invalid-argument', 'action이 필요합니다.');

  const roomRef = db.doc(`rooms/${normalized}`);

  return db.runTransaction(async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists) throw new HttpsError('not-found', '방을 찾을 수 없습니다.');

    const room = roomSnap.data();
    if (room.status === 'finished' || room.game?.phase === 'gameOver') {
      throw new HttpsError('failed-precondition', '이미 종료된 대국입니다.');
    }

    const role = getRole(room, uid);
    if (role !== room.game.currentPlayer) {
      throw new HttpsError('permission-denied', '현재 차례가 아닙니다.');
    }

    if (room.timeControl?.enabled && room.turnDeadlineAtMs && Date.now() > room.turnDeadlineAtMs + (room.timeControl.graceMs ?? 0)) {
      throw new HttpsError('deadline-exceeded', '제한 시간이 지났습니다.');
    }

    let nextGame;
    try {
      nextGame = applyAction(room.game, { ...action, player: role });
    } catch (error) {
      throw new HttpsError('invalid-argument', error.message);
    }

    const moveNo = (room.moveCount ?? 0) + 1;
    const moveRef = roomRef.collection('moves').doc(String(moveNo).padStart(6, '0'));
    const isFinished = nextGame.phase === 'gameOver';
    const patch = {
      game: nextGame,
      moveCount: moveNo,
      status: isFinished ? 'finished' : room.status,
      turnDeadlineAtMs: !isFinished && room.timeControl?.enabled ? Date.now() + (room.timeControl.turnMs ?? 120000) : null,
      updatedAt: FieldValue.serverTimestamp(),
      lastMoveAt: FieldValue.serverTimestamp(),
    };

    if (isFinished && room.ranked && !room.ratingApplied) {
      patch.pendingSettlement = true;
      patch.finishedAt = FieldValue.serverTimestamp();
    }

    transaction.set(moveRef, {
      moveNo,
      uid,
      player: role,
      action: sanitizeAction(action),
      phaseBefore: room.game.phase,
      directionBefore: room.game.directionIndex,
      directionAfter: nextGame.directionIndex,
      turnBefore: room.game.turn,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });
    transaction.update(roomRef, patch);

    return { ok: true, moveNo, finished: isFinished };
  });
});

export const forfeitGame = onCall(async (request) => {
  const uid = assertAuth(request);
  const { roomCode } = request.data ?? {};
  const normalized = normalizeRoomCode(roomCode);
  if (!normalized) throw new HttpsError('invalid-argument', 'roomCode가 필요합니다.');

  const roomRef = db.doc(`rooms/${normalized}`);

  return db.runTransaction(async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists) throw new HttpsError('not-found', '방을 찾을 수 없습니다.');

    const room = roomSnap.data();
    if (room.status === 'finished' || room.game?.phase === 'gameOver') {
      throw new HttpsError('failed-precondition', '이미 종료된 대국입니다.');
    }

    const role = getRole(room, uid);
    if (role !== 'B' && role !== 'W') {
      throw new HttpsError('permission-denied', '참가자만 기권할 수 있습니다.');
    }

    const winner = role === 'B' ? 'W' : 'B';
    const nextGame = forceFinish(room.game, {
      winner,
      reason: `${role === 'B' ? '흑' : '백'} 기권. ${winner === 'B' ? '흑' : '백'} 승리.`,
    });

    const moveNo = (room.moveCount ?? 0) + 1;
    transaction.set(roomRef.collection('moves').doc(String(moveNo).padStart(6, '0')), {
      moveNo,
      uid,
      player: role,
      action: { type: 'FORFEIT' },
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });

    transaction.update(roomRef, {
      game: nextGame,
      moveCount: moveNo,
      status: 'finished',
      pendingSettlement: room.ranked && !room.ratingApplied,
      finishedAt: FieldValue.serverTimestamp(),
      finishReason: 'forfeit',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { ok: true, winner };
  });
});

export const reportRoom = onCall(async (request) => {
  const uid = assertAuth(request);
  const { roomCode, reason, detail } = request.data ?? {};
  const normalized = normalizeRoomCode(roomCode);
  if (!normalized) throw new HttpsError('invalid-argument', 'roomCode가 필요합니다.');

  const reportRef = db.collection('reports').doc();
  await reportRef.set({
    uid,
    roomCode: normalized,
    reason: String(reason || 'unspecified').slice(0, 80),
    detail: String(detail || '').slice(0, 2000),
    status: 'open',
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, reportId: reportRef.id };
});

export const settleRankedGame = onDocumentUpdated('rooms/{roomCode}', async (event) => {
  const after = event.data?.after?.data();
  if (!after) return;

  if (!after.ranked) return;
  if (after.ratingApplied) return;
  if (after.status !== 'finished') return;
  if (after.game?.phase !== 'gameOver') return;

  const verifiedWinner = verifiedResult(after.game);
  if (!verifiedWinner) {
    await event.data.after.ref.update({
      settlementError: '게임 종료 상태를 서버에서 검증하지 못했습니다.',
      pendingSettlement: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  await db.runTransaction(async (transaction) => {
    const roomRef = event.data.after.ref;
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists) return;

    const room = roomSnap.data();
    if (!room.ranked || room.ratingApplied) return;

    const currentVerifiedWinner = verifiedResult(room.game);
    if (!currentVerifiedWinner) {
      transaction.update(roomRef, {
        settlementError: '트랜잭션 중 게임 종료 상태를 검증하지 못했습니다.',
        pendingSettlement: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const blackUid = room.players?.B;
    const whiteUid = room.players?.W;
    if (!blackUid || !whiteUid) {
      transaction.update(roomRef, {
        settlementError: '플레이어 정보가 부족합니다.',
        pendingSettlement: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const blackRef = db.doc(`users/${blackUid}`);
    const whiteRef = db.doc(`users/${whiteUid}`);
    const blackSnap = await transaction.get(blackRef);
    const whiteSnap = await transaction.get(whiteRef);

    const blackProfile = blackSnap.exists ? blackSnap.data() : {};
    const whiteProfile = whiteSnap.exists ? whiteSnap.data() : {};
    const blackRating = blackProfile.rating ?? room.ratingsBefore?.B ?? DEFAULT_RATING;
    const whiteRating = whiteProfile.rating ?? room.ratingsBefore?.W ?? DEFAULT_RATING;

    const ratingChange = calculateRatingChange({
      blackRating,
      whiteRating,
      result: currentVerifiedWinner,
    });

    transaction.set(blackRef, buildResultPatch({
      uid: blackUid,
      existing: blackProfile,
      ratingAfter: ratingChange.B.after,
      delta: ratingChange.B.delta,
      result: resultForPlayer(currentVerifiedWinner, 'B'),
    }), { merge: true });

    transaction.set(whiteRef, buildResultPatch({
      uid: whiteUid,
      existing: whiteProfile,
      ratingAfter: ratingChange.W.after,
      delta: ratingChange.W.delta,
      result: resultForPlayer(currentVerifiedWinner, 'W'),
    }), { merge: true });

    const resultRef = db.collection('gameResults').doc(roomRef.id);
    transaction.set(resultRef, {
      roomCode: roomRef.id,
      ranked: true,
      winner: currentVerifiedWinner,
      players: room.players,
      playerProfiles: room.playerProfiles ?? null,
      playerUids: [blackUid, whiteUid],
      ratingChange,
      moveCount: room.moveCount ?? 0,
      size: room.game?.size,
      winLength: room.game?.winLength,
      finishedAt: FieldValue.serverTimestamp(),
      createdAt: room.createdAt ?? null,
    }, { merge: true });

    transaction.update(roomRef, {
      verifiedWinner: currentVerifiedWinner,
      ratingApplied: true,
      pendingSettlement: false,
      settlementError: null,
      ratingChange,
      settledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
});

export const cleanupStaleMatchQueue = onSchedule('every 15 minutes', async () => {
  const cutoff = Date.now() - 20 * 60 * 1000;
  const snap = await db
    .collection('matchQueue')
    .where('joinedAtMs', '<', cutoff)
    .limit(100)
    .get();

  const batch = db.batch();
  snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  if (!snap.empty) await batch.commit();
});

export const closeTimedOutRooms = onSchedule('every 1 minutes', async () => {
  const now = Date.now();
  const snap = await db
    .collection('rooms')
    .where('status', '==', 'playing')
    .where('turnDeadlineAtMs', '<', now)
    .limit(50)
    .get();

  const batch = db.batch();
  snap.docs.forEach((docSnap) => {
    const room = docSnap.data();
    if (!room.timeControl?.enabled || room.game?.phase === 'gameOver') return;
    const loser = room.game?.currentPlayer;
    const winner = loser === 'B' ? 'W' : 'B';
    const nextGame = forceFinish(room.game, {
      winner,
      reason: `${loser === 'B' ? '흑' : '백'} 시간초과. ${winner === 'B' ? '흑' : '백'} 승리.`,
    });
    batch.update(docSnap.ref, {
      game: nextGame,
      status: 'finished',
      pendingSettlement: room.ranked && !room.ratingApplied,
      finishReason: 'timeout',
      finishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  if (!snap.empty) await batch.commit();
});

function buildResultPatch({ uid, existing, ratingAfter, delta, result }) {
  return {
    uid,
    displayName: existing.displayName ?? 'Player',
    rating: ratingAfter,
    games: FieldValue.increment(1),
    rankedGames: FieldValue.increment(1),
    wins: result === 'win' ? FieldValue.increment(1) : FieldValue.increment(0),
    losses: result === 'loss' ? FieldValue.increment(1) : FieldValue.increment(0),
    draws: result === 'draw' ? FieldValue.increment(1) : FieldValue.increment(0),
    rankedWins: result === 'win' ? FieldValue.increment(1) : FieldValue.increment(0),
    rankedLosses: result === 'loss' ? FieldValue.increment(1) : FieldValue.increment(0),
    rankedDraws: result === 'draw' ? FieldValue.increment(1) : FieldValue.increment(0),
    lastRatingDelta: delta,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function assertAuth(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  return request.auth.uid;
}

function normalizeRoomCode(roomCode) {
  return String(roomCode || '').trim().toUpperCase();
}

function getRole(room, uid) {
  if (room.players?.B === uid) return 'B';
  if (room.players?.W === uid) return 'W';
  return 'spectator';
}

function sanitizeAction(action) {
  if (action.type === 'PLACE_STONE') {
    return { type: action.type, row: Number(action.row), col: Number(action.col) };
  }
  if (action.type === 'ROTATE_DIRECTION') {
    return { type: action.type, steps: Number(action.steps) };
  }
  return { type: String(action.type || 'UNKNOWN') };
}
