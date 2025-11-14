import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Firestoreの初期化（クライアントサイドでは高速な接続を使用）
const db = initializeFirestore(app, {
  // SSR環境でのみLong Pollingを使用、ブラウザでは通常の高速接続
  experimentalForceLongPolling: typeof window === "undefined",
  ignoreUndefinedProperties: true,
});

// オフライン永続化を有効にする（ブラウザのみ）
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // 複数のタブが開いている場合
      console.warn("Firestore永続化: 複数のタブが開いています");
    } else if (err.code === "unimplemented") {
      // ブラウザがサポートしていない場合
      console.warn("Firestore永続化: ブラウザがサポートしていません");
    }
  });
}

const storage = getStorage(app);

export { auth, provider, analytics, db, storage };
