import { adminDb } from '@/lib/firebase-admin';
import { extractUid } from '@/lib/utils';

type ItemType = 'product' | 'post';

interface OwnerCommentNotificationParams {
  ownerUserId: string;
  actorUserId: string;
  actorDisplayName: string;
  itemType: ItemType;
  itemId: string;
  itemTitle: string;
  commentId: string;
  commentContent: string;
}

interface ReplyNotificationParams {
  parentCommentUserId: string;
  actorUserId: string;
  actorDisplayName: string;
  itemType: ItemType;
  itemId: string;
  itemTitle: string;
  commentId: string;
  replyContent: string;
}

function shorten(text: string, length = 50): string {
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

function normalizeUid(userId: string): string {
  return extractUid(userId);
}

async function addNotification(targetUserId: string, payload: Record<string, unknown>): Promise<void> {
  const uid = normalizeUid(targetUserId);
  if (!uid) return;

  await adminDb
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .add({
      ...payload,
      timestamp: new Date(),
      isUnread: true,
    });
}

export async function createOwnerCommentNotificationServer(
  params: OwnerCommentNotificationParams
): Promise<void> {
  try {
    const ownerUid = normalizeUid(params.ownerUserId);
    const actorUid = normalizeUid(params.actorUserId);
    if (!ownerUid || !actorUid || ownerUid === actorUid) return;

    const linkPath = params.itemType === 'product' ? 'product-detail' : 'post-detail';
    const itemLabel = params.itemType === 'product' ? '商品' : '投稿';

    await addNotification(ownerUid, {
      iconType: 'comment',
      iconBgColor: 'bg-purple-500',
      title: `${params.actorDisplayName}さんがあなたの${itemLabel}にコメントしました`,
      description: `${params.itemTitle} - ${shorten(params.commentContent)}`,
      tag: 'コメント',
      link: `/${linkPath}/${params.itemId}#comment-${params.commentId}`,
      actorUserId: actorUid,
      actorDisplayName: params.actorDisplayName,
    });
  } catch (error) {
    console.error('Failed to create owner comment notification:', error);
  }
}

export async function createReplyNotificationServer(
  params: ReplyNotificationParams
): Promise<void> {
  try {
    const parentUid = normalizeUid(params.parentCommentUserId);
    const actorUid = normalizeUid(params.actorUserId);
    if (!parentUid || !actorUid || parentUid === actorUid) return;

    const linkPath = params.itemType === 'product' ? 'product-detail' : 'post-detail';

    await addNotification(parentUid, {
      iconType: 'comment',
      iconBgColor: 'bg-indigo-500',
      title: `${params.actorDisplayName}さんが返信しました`,
      description: `${params.itemTitle} - ${shorten(params.replyContent)}`,
      tag: '返信',
      link: `/${linkPath}/${params.itemId}#comment-${params.commentId}`,
      actorUserId: actorUid,
      actorDisplayName: params.actorDisplayName,
    });
  } catch (error) {
    console.error('Failed to create reply notification:', error);
  }
}
