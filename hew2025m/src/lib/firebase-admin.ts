import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
let adminDb: Firestore;
let adminAuth: Auth;

// Firebase Admin SDKの初期化
if (!getApps().length) {
  // 環境変数から個別に取得する場合
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // プライベートキーの処理: 外側のクォートを削除し、エスケープされた改行を実際の改行に変換
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    // 先頭と末尾のクォートを削除
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    // エスケープされた改行を実際の改行に変換
    privateKey = privateKey.replace(/\\n/g, '\n');

    app = initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  }
  // サービスアカウントキーJSON文字列を使用する場合
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
    }
  } else {
    throw new Error(
      'Firebase Admin credentials not found. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_KEY environment variables.'
    );
  }
} else {
  app = getApps()[0];
}

adminDb = getFirestore(app);
adminAuth = getAuth(app);

export { adminDb, adminAuth };
