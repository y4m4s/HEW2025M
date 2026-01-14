import { adminAuth } from '@/lib/firebase-admin';

/**
 * 学生プロジェクト用の簡易認証チェック
 * Firebaseトークンを検証してユーザーIDを返す
 */
export async function verifyUserToken(request: Request): Promise<string | null> {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');

    // Firebase Admin SDKでトークンを検証（重要！）
    const decodedToken = await adminAuth.verifyIdToken(token);

    return decodedToken.uid; // 検証済みのユーザーID
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * 認証が必要なAPIルート用のヘルパー
 * 認証失敗時は401レスポンスを返す
 */
export async function requireAuth(request: Request): Promise<string | Response> {
  const userId = await verifyUserToken(request);

  if (!userId) {
    return Response.json(
      { error: 'ログインが必要です' },
      { status: 401 }
    );
  }

  return userId;
}
