import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/simpleAuth';
import { getCachedUserInfo } from '@/lib/userCache';
import {
  createOwnerCommentNotificationServer,
  createReplyNotificationServer,
} from '@/lib/serverNotifications';
import { extractUid } from '@/lib/utils';

interface CommentDocument {
  _id: { toString(): string };
  productId: string;
  itemType?: 'post' | 'product';
  itemOwnerId?: string;
  parentId?: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: Date;
}

interface CommentWithReplies extends CommentDocument {
  replies: CommentWithReplies[];
}

const PRODUCT_COMMENT_FILTER = {
  $or: [{ itemType: 'product' }, { itemType: { $exists: false } }],
};

function organizeComments(comments: CommentDocument[]): CommentWithReplies[] {
  const commentMap = new Map<string, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  comments.forEach((comment) => {
    commentMap.set(comment._id.toString(), { ...comment, replies: [] });
  });

  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment._id.toString());
    if (!commentWithReplies) return;

    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
      return;
    }

    rootComments.push(commentWithReplies);
  });

  return rootComments;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const allComments = await Comment.find({
      productId: id,
      ...PRODUCT_COMMENT_FILTER,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      comments: organizeComments(allComments),
    });
  } catch (error) {
    console.error('Get product comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
    }

    const actorUserId = extractUid(userIdOrError as string);
    await dbConnect();

    const { id } = await params;
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const { userName, userPhotoURL, content, parentId } = body as {
      userName?: string;
      userPhotoURL?: string;
      content?: string;
      parentId?: string;
    };

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return NextResponse.json({ error: 'Content is empty' }, { status: 400 });
    }

    if (trimmedContent.length > 140) {
      return NextResponse.json(
        { error: 'Content must be 140 characters or less' },
        { status: 400 }
      );
    }

    let parentComment: CommentDocument | null = null;
    if (parentId) {
      parentComment = await Comment.findById(parentId).lean();
      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }

      const parentMatchesItem = parentComment.productId === id;
      const parentIsProductComment = !parentComment.itemType || parentComment.itemType === 'product';
      if (!parentMatchesItem || !parentIsProductComment) {
        return NextResponse.json(
          { error: 'Invalid parent comment' },
          { status: 400 }
        );
      }
    }

    const cachedUser = await getCachedUserInfo(actorUserId);
    const safeUserName = cachedUser?.displayName || userName || 'ユーザー';
    const safeUserPhotoURL = cachedUser?.photoURL || userPhotoURL || '';
    const ownerUserId = extractUid(product.sellerId || '');

    const comment = await Comment.create({
      productId: id,
      itemType: 'product',
      itemOwnerId: ownerUserId || undefined,
      userId: actorUserId,
      userName: safeUserName,
      userPhotoURL: safeUserPhotoURL,
      content: trimmedContent,
      parentId: parentId || undefined,
    });

    if (parentComment) {
      const parentUserId = extractUid(parentComment.userId);
      if (parentUserId && parentUserId !== actorUserId) {
        await createReplyNotificationServer({
          parentCommentUserId: parentUserId,
          actorUserId,
          actorDisplayName: safeUserName,
          itemType: 'product',
          itemId: id,
          itemTitle: product.title || '商品',
          commentId: comment._id.toString(),
          replyContent: trimmedContent,
        });
      }
    } else if (ownerUserId && ownerUserId !== actorUserId) {
      await createOwnerCommentNotificationServer({
        ownerUserId,
        actorUserId,
        actorDisplayName: safeUserName,
        itemType: 'product',
        itemId: id,
        itemTitle: product.title || '商品',
        commentId: comment._id.toString(),
        commentContent: trimmedContent,
      });
    }

    return NextResponse.json(
      {
        success: true,
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post comment error:', error);
    return NextResponse.json(
      { error: 'Failed to post comment' },
      { status: 500 }
    );
  }
}
