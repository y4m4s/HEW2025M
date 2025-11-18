import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
let db;
try {
  // 既に初期化されているか確認
  db = getFirestore(app);
  console.log("既存のFirestoreインスタンスを使用");
} catch (e) {
  // 新規初期化（最もシンプルな設定）
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: false, // 高速接続のため無効化
  });
  console.log("新規Firestoreインスタンス作成（高速モード）");
}

console.log("Firestore初期化完了 - プロジェクト:", app.options.projectId);

// Firebase Storage
const storage = getStorage(app);

export { auth, provider, db, storage, analytics };
