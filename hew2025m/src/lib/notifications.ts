import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, getDoc, doc } from 'firebase/firestore';

/**
 * フォロー通知を作成する関数
 * @param followedUserId - フォローされたユーザーのID
 * @param followingUserId - フォローしたユーザーのID
 */
export async function createFollowNotification(
  followedUserId: string,
  followingUserId: string
): Promise<void> {
  try {
    // フォローしたユーザーの情報を取得
    const userDoc = await getDoc(doc(db, 'users', followingUserId));

    if (!userDoc.exists()) {
      console.error('フォローしたユーザーが見つかりません');
      return;
    }

    const userData = userDoc.data();
    const displayName = userData.displayName || '不明なユーザー';

    // 被フォローユーザーに通知を作成
    const notificationData = {
      iconType: 'follow',
      iconBgColor: 'bg-blue-500',
      title: `${displayName}さんにフォローされました`,
      description: `${displayName}さんがあなたをフォローしました。`,
      timestamp: Timestamp.now(),
      tag: 'フォロー',
      isUnread: true,
      link: `/profile/${followingUserId}`, // フォローしたユーザーのプロフィールへのリンク
    };

    // 通知をFirestoreに保存
    await addDoc(
      collection(db, 'users', followedUserId, 'notifications'),
      notificationData
    );

    console.log('フォロー通知を作成しました');
  } catch (error) {
    console.error('フォロー通知の作成に失敗しました:', error);
  }
}

/**
 * 評価通知を作成する関数
 * @param ratedUserId - 評価されたユーザーのID
 * @param raterUserId - 評価したユーザーのID
 * @param rating - 評価値（1-5）
 * @param comment - 評価コメント
 */
export async function createRatingNotification(
  ratedUserId: string,
  raterUserId: string,
  rating: number,
  comment: string
): Promise<void> {
  try {
    // 評価したユーザーの情報を取得
    const userDoc = await getDoc(doc(db, 'users', raterUserId));

    if (!userDoc.exists()) {
      console.error('評価したユーザーが見つかりません');
      return;
    }

    const userData = userDoc.data();
    const displayName = userData.displayName || '不明なユーザー';

    // 評価されたユーザーに通知を作成
    const notificationData = {
      iconType: 'rating',
      iconBgColor: 'bg-green-500',
      title: `${displayName}さんに評価されました`,
      description: `★${rating} - ${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}`,
      timestamp: Timestamp.now(),
      tag: '評価',
      isUnread: true,
      link: `/profile/${ratedUserId}`, // 評価されたユーザー（自分）のプロフィールへのリンク
    };

    // 通知をFirestoreに保存
    await addDoc(
      collection(db, 'users', ratedUserId, 'notifications'),
      notificationData
    );

    console.log('評価通知を作成しました');
  } catch (error) {
    console.error('評価通知の作成に失敗しました:', error);
  }
}

/**
 * コメント通知を作成する関数（サーバーサイド用）
 * @param productOwnerId - 商品の出品者ID
 * @param commenterUserId - コメントしたユーザーのID
 * @param commenterName - コメントしたユーザーの表示名
 * @param productId - 商品ID
 * @param productTitle - 商品タイトル
 * @param commentId - コメントID
 * @param commentContent - コメント内容
 */
export async function createCommentNotificationServer(
  productOwnerId: string,
  commenterUserId: string,
  commenterName: string,
  productId: string,
  productTitle: string,
  commentId: string,
  commentContent: string
): Promise<void> {
  try {
    const notificationData = {
      iconType: 'comment',
      iconBgColor: 'bg-purple-500',
      title: `${commenterName}さんがコメントしました`,
      description: `${productTitle} - ${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}`,
      timestamp: Timestamp.now(),
      tag: 'コメント',
      isUnread: true,
      link: `/productDetail/${productId}#comment-${commentId}`, // コメント位置へのリンク
    };

    // 通知をFirestoreに保存
    await addDoc(
      collection(db, 'users', productOwnerId, 'notifications'),
      notificationData
    );

    console.log('商品コメント通知を作成しました');
  } catch (error) {
    console.error('商品コメント通知の作成に失敗しました:', error);
  }
}

/**
 * 投稿コメント通知を作成する関数（サーバーサイド用）
 * @param postOwnerId - 投稿の作成者ID
 * @param commenterUserId - コメントしたユーザーのID
 * @param commenterName - コメントしたユーザーの表示名
 * @param postId - 投稿ID
 * @param postTitle - 投稿タイトル
 * @param commentId - コメントID
 * @param commentContent - コメント内容
 */
export async function createPostCommentNotificationServer(
  postOwnerId: string,
  commenterUserId: string,
  commenterName: string,
  postId: string,
  postTitle: string,
  commentId: string,
  commentContent: string
): Promise<void> {
  try {
    const notificationData = {
      iconType: 'comment',
      iconBgColor: 'bg-purple-500',
      title: `${commenterName}さんがコメントしました`,
      description: `${postTitle} - ${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}`,
      timestamp: Timestamp.now(),
      tag: 'コメント',
      isUnread: true,
      link: `/postDetail/${postId}#comment-${commentId}`, // コメント位置へのリンク
    };

    // 通知をFirestoreに保存
    await addDoc(
      collection(db, 'users', postOwnerId, 'notifications'),
      notificationData
    );

    console.log('投稿コメント通知を作成しました');
  } catch (error) {
    console.error('投稿コメント通知の作成に失敗しました:', error);
  }
}

/**
 * 返信通知を作成する関数（サーバーサイド用）
 * @param parentCommentUserId - 親コメントの投稿者ID
 * @param replierUserId - 返信したユーザーのID
 * @param replierName - 返信したユーザーの表示名
 * @param itemId - 商品or投稿ID
 * @param itemTitle - 商品or投稿タイトル
 * @param commentId - コメントID
 * @param replyContent - 返信内容
 * @param itemType - 'product' or 'post'
 */
export async function createReplyNotificationServer(
  parentCommentUserId: string,
  replierUserId: string,
  replierName: string,
  itemId: string,
  itemTitle: string,
  commentId: string,
  replyContent: string,
  itemType: 'product' | 'post'
): Promise<void> {
  try {
    const linkPath = itemType === 'product' ? 'productDetail' : 'postDetail';

    const notificationData = {
      iconType: 'comment',
      iconBgColor: 'bg-indigo-500',
      title: `${replierName}さんが返信しました`,
      description: `${itemTitle} - ${replyContent.substring(0, 50)}${replyContent.length > 50 ? '...' : ''}`,
      timestamp: Timestamp.now(),
      tag: '返信',
      isUnread: true,
      link: `/${linkPath}/${itemId}#comment-${commentId}`, // コメント位置へのリンク
    };

    // 通知をFirestoreに保存
    await addDoc(
      collection(db, 'users', parentCommentUserId, 'notifications'),
      notificationData
    );

    console.log('返信通知を作成しました');
  } catch (error) {
    console.error('返信通知の作成に失敗しました:', error);
  }
}

/**
 * 投稿へのいいね通知を作成する関数（サーバーサイド用）
 * @param postAuthorId - 投稿の作成者ID
 * @param likerUserId - いいねしたユーザーのID
 * @param postId - 投稿ID
 * @param postTitle - 投稿タイトル
 */
export async function createPostLikeNotificationServer(
  postAuthorId: string,
  likerUserId: string,
  postId: string,
  postTitle: string
): Promise<void> {
  try {
    // いいねしたユーザーの情報をFirestoreから取得
    const userDoc = await getDoc(doc(db, 'users', likerUserId));

    if (!userDoc.exists()) {
      console.error('いいねしたユーザーが見つかりません');
      return;
    }

    const userData = userDoc.data();
    const displayName = userData.displayName || '不明なユーザー';

    const notificationData = {
      iconType: 'like',
      iconBgColor: 'bg-pink-500',
      title: `${displayName}さんがいいねしました`,
      description: `${displayName}さんがあなたの投稿「${postTitle}」にいいねしました。`,
      timestamp: Timestamp.now(),
      tag: 'いいね',
      isUnread: true,
      link: `/postDetail/${postId}`,
    };

    // 通知をFirestoreに保存
    await addDoc(
      collection(db, 'users', postAuthorId, 'notifications'),
      notificationData
    );

    console.log('いいね通知を作成しました');
  } catch (error) {
    console.error('いいね通知の作成に失敗しました:', error);
  }
}
