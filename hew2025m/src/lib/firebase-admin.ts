import * as admin from "firebase-admin";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
    // サーバー起動時にエラーを明確にするために、より詳細なメッセージをスローする
    throw new Error(
      "Firebase Admin SDKの初期化に失敗しました。環境変数（.env.local）が正しく設定されているか確認してください。"
    );
  }
}

const adminAuth: Auth = getAuth();
const adminDb: Firestore = getFirestore();

export { adminAuth, adminDb };
