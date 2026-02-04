/**
 * ユーザー情報のキャッシュ付きバッチ取得
 * Firestoreへのアクセスを削減するためのキャッシュ機能
 */

import { adminDb } from './firebase-admin';

interface UserInfo {
  displayName: string;
  photoURL: string | null;
}

// メモリキャッシュ（サーバーサイドで有効）
const userCache = new Map<string, { data: UserInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分

/**
 * 単一ユーザー情報を取得（キャッシュ付き）
 */
export async function getCachedUserInfo(userId: string): Promise<UserInfo | null> {
  // user-プレフィックスを削除
  const actualUid = userId.startsWith('user-') ? userId.replace('user-', '') : userId;

  // キャッシュチェック
  const cached = userCache.get(actualUid);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const userDoc = await adminDb.collection('users').doc(actualUid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      const userInfo: UserInfo = {
        displayName: data?.displayName || data?.username || '出品者',
        photoURL: data?.photoURL || null,
      };

      // キャッシュに保存
      userCache.set(actualUid, { data: userInfo, timestamp: Date.now() });
      return userInfo;
    }
    return null;
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return null;
  }
}

/**
 * 複数ユーザー情報をバッチ取得（キャッシュ付き）
 */
export async function getCachedUserInfoBatch(
  userIds: string[]
): Promise<Map<string, UserInfo>> {
  const result = new Map<string, UserInfo>();
  const uncachedIds: string[] = [];

  // キャッシュから取得できるものを先に取得
  for (const userId of userIds) {
    const actualUid = userId.startsWith('user-') ? userId.replace('user-', '') : userId;
    const cached = userCache.get(actualUid);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      result.set(userId, cached.data);
    } else {
      uncachedIds.push(userId);
    }
  }

  // キャッシュにないものをFirestoreから取得
  if (uncachedIds.length > 0) {
    await Promise.all(
      uncachedIds.map(async (userId) => {
        const userInfo = await getCachedUserInfo(userId);
        if (userInfo) {
          result.set(userId, userInfo);
        }
      })
    );
  }

  return result;
}
