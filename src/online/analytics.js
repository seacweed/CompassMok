import { getAnalytics, isSupported, logEvent as firebaseLogEvent } from 'firebase/analytics';
import { getFirebase, hasFirebaseConfig } from './firebase';

let analyticsPromise = null;

export function logEvent(name, params = {}) {
  if (!hasFirebaseConfig()) return;

  try {
    if (!analyticsPromise) {
      analyticsPromise = isSupported().then((supported) => {
        if (!supported) return null;
        const { app } = getFirebase();
        return getAnalytics(app);
      });
    }

    analyticsPromise.then((analytics) => {
      if (analytics) firebaseLogEvent(analytics, name, params);
    }).catch(() => {});
  } catch {
    // Analytics should never break gameplay.
  }
}
