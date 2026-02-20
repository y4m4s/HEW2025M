import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import Product from '@/models/Product';
import { IPost } from '@/models/Post';
import { IProduct } from '@/models/Product';
import { IComment } from '@/models/Comment';
import { ensureUserIdPrefix } from '@/lib/utils';

type ActivityItem = {
  type: 'post' | 'comment';
  date: Date;
  data: IPost | (IComment & { parent?: IPost | IProduct });
};

type CommentWithType = IComment & {
  productId: string;
  itemType?: 'post' | 'product';
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const normalizedAuthorId = ensureUserIdPrefix(userId);
    const userPosts: IPost[] = await Post.find({
      authorId: { $in: [userId, normalizedAuthorId] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const postActivities: ActivityItem[] = userPosts.map((post) => ({
      type: 'post',
      date: post.createdAt,
      data: post,
    }));

    const userComments: CommentWithType[] = await Comment.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const postParentIds = new Set<string>();
    const productParentIds = new Set<string>();
    const unknownParentIds = new Set<string>();

    userComments.forEach((comment) => {
      const parentId = comment.productId?.toString();
      if (!parentId) return;

      if (comment.itemType === 'post') {
        postParentIds.add(parentId);
      } else if (comment.itemType === 'product') {
        productParentIds.add(parentId);
      } else {
        unknownParentIds.add(parentId);
      }
    });

    const [parentPosts, parentProducts] = await Promise.all([
      Post.find({ _id: { $in: [...postParentIds, ...unknownParentIds] } }).lean(),
      Product.find({ _id: { $in: [...productParentIds, ...unknownParentIds] } }).lean(),
    ]);

    const postParentMap = new Map<string, IPost>();
    const productParentMap = new Map<string, IProduct>();
    parentPosts.forEach((post) => postParentMap.set(post._id.toString(), post));
    parentProducts.forEach((product) => productParentMap.set(product._id.toString(), product));

    const commentActivities: ActivityItem[] = userComments.map((comment) => {
      const parentId = comment.productId?.toString();
      let parent: IPost | IProduct | undefined;

      if (comment.itemType === 'post') {
        parent = postParentMap.get(parentId);
      } else if (comment.itemType === 'product') {
        parent = productParentMap.get(parentId);
      } else {
        parent = postParentMap.get(parentId) || productParentMap.get(parentId);
      }

      return {
        type: 'comment',
        date: comment.createdAt,
        data: {
          ...comment,
          parent,
        },
      };
    });

    const allActivities = [...postActivities, ...commentActivities];
    allActivities.sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ success: true, activities: allActivities });
  } catch (error) {
    console.error('Get user activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
