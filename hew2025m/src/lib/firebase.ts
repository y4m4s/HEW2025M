import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if API key exists
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
console.log('[DEBUG] NEXT_PUBLIC_FIREBASE_API_KEY present?', !!firebaseApiKey);

if (!firebaseApiKey) {
  throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY. Add the variable in .env and restart the dev server.');
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (err) {
  console.error('[DEBUG] initializeApp error:', err);
  throw err;
}

let auth;
try {
  auth = getAuth(app);
} catch (err) {
  console.error('[DEBUG] getAuth error (likely invalid API key):', err);
  throw new Error('Firebase auth failed: auth/invalid-api-key. Check the API key in the Google Console and .env file.');
}

// Initialize services
const provider = new GoogleAuthProvider();
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Firestore initialization (use long polling only in SSR environment, otherwise use fast connection)
const db = initializeFirestore(app, {
  experimentalForceLongPolling: typeof window === "undefined", 
  ignoreUndefinedProperties: true,
});

// Firebase Storage
const storage = getStorage(app);

export { auth, provider, analytics, db, storage };
