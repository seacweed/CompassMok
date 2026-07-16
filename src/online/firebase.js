import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { initializeOptionalAppCheck } from './appCheck';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let app = null;
let auth = null;
let db = null;
let functions = null;

export function getFirebase() {
  if (!hasFirebaseConfig()) {
    throw new Error('Firebase 설정값이 없습니다. .env.local을 설정하세요.');
  }

  if (!app) {
    app = initializeApp(firebaseConfig);
    initializeOptionalAppCheck(app);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
  }

  return { app, auth, db, functions };
}

export function subscribeAuthUser(onUser, onError) {
  const { auth: firebaseAuth } = getFirebase();
  return onAuthStateChanged(firebaseAuth, onUser, onError);
}

export function getCurrentUserOrThrow() {
  const { auth: firebaseAuth } = getFirebase();
  if (!firebaseAuth.currentUser) {
    throw new Error('먼저 Google 로그인 또는 게스트 입장을 선택하세요.');
  }
  return firebaseAuth.currentUser;
}

export async function signInAsGuest() {
  const { auth: firebaseAuth } = getFirebase();
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;

  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}

export async function signInWithGoogle() {
  const { auth: firebaseAuth } = getFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const currentUser = firebaseAuth.currentUser;

  // 게스트로 시작한 사람이 Google 계정으로 전환할 때는 가능하면 같은 uid에 연결합니다.
  if (currentUser?.isAnonymous) {
    try {
      const linked = await linkWithPopup(currentUser, provider);
      return linked.user;
    } catch (error) {
      // 이미 다른 Firebase 사용자에 연결된 Google 계정이면 일반 Google 로그인으로 전환합니다.
      if (
        error.code === 'auth/credential-already-in-use' ||
        error.code === 'auth/email-already-in-use' ||
        error.code === 'auth/provider-already-linked'
      ) {
        const credential = await signInWithPopup(firebaseAuth, provider);
        return credential.user;
      }
      throw error;
    }
  }

  const credential = await signInWithPopup(firebaseAuth, provider);
  return credential.user;
}

export async function signOutUser() {
  const { auth: firebaseAuth } = getFirebase();
  await signOut(firebaseAuth);
}

export function userDisplayName(user) {
  if (!user) return '로그인 안 됨';
  if (user.isAnonymous) return '게스트';
  return user.displayName || user.email || 'Google 사용자';
}
