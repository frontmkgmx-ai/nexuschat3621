import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

let isMockAnalytics = false;
export const analytics = (() => {
  try {
     return getAnalytics(app);
  } catch (e) {
     isMockAnalytics = true;
     return null as any;
  }
})();

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

// Use a promise to handle getting the messaging instance safely since FCM is not always supported (e.g. some browsers/incognito)
export const messagingPromise = isSupported().then(supported => supported ? getMessaging(app) : null);

