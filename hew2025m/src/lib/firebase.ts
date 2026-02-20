import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

import { env } from "./env";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebaseアプリの初期化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase Authenticationの設定
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

// Analytics (ブラウザ環境でのみ初期化)
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Firestoreの初期化（シンプル化・高速化）
let db: Firestore;
try {
  // 既に初期化されているか確認
  db = getFirestore(app);
} catch {
  // 新規初期化（最もシンプルな設定）
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: false, // 高速接続のため無効化
  });
}

// Firebase Storage
const storage = getStorage(app);

export { auth, provider, db, storage, analytics };
