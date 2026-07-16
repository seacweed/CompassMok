import { httpsCallable } from 'firebase/functions';
import { getFirebase } from './firebase';

export async function submitMoveServer({ roomCode, action }) {
  const { functions } = getFirebase();
  const submitMove = httpsCallable(functions, 'submitMove');
  const result = await submitMove({ roomCode, action });
  return result.data;
}

export async function forfeitGameServer({ roomCode }) {
  const { functions } = getFirebase();
  const forfeitGame = httpsCallable(functions, 'forfeitGame');
  const result = await forfeitGame({ roomCode });
  return result.data;
}

export async function reportRoomServer({ roomCode, reason, detail }) {
  const { functions } = getFirebase();
  const reportRoom = httpsCallable(functions, 'reportRoom');
  const result = await reportRoom({ roomCode, reason, detail });
  return result.data;
}
