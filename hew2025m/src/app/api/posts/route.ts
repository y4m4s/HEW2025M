import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post, { IPost } from '@/models/Post';
import Comment from '@/models/Comment';
import { requireAuth } from '@/lib/simpleAuth';
import { getCachedUserInfo, getCachedUserInfoBatch } from '@/lib/userCache';
import { ensureUserIdPrefix } from '@/lib/utils';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const authorId = searchParams.get('authorId');
    const keyword = searchParams.get('keyword');
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (authorId) {
      const normalizedAuthorId = ensureUserIdPrefix(authorId);
      query.authorId = { $in: [authorId, normalizedAuthorId] };
    }

    if (keyword) {
      const escapedKeyword = escapeRegExp(keyword);
      const keywordRegex = new RegExp(escapedKeyword, 'i');
      query.$or = [
        { title: keywordRegex },
        { content: keywordRegex },
        { tags: keywordRegex },
        { address: keywordRegex },
      ];
    }

    const allTags = [
      '釣り情報',
      '釣果共有',
      '初心者',
      'レビュー',
      '質問',
      'おすすめ',
      'トラブル注意',
      '釣魚料理',
    ];

    const [total, posts, totalPostCount, tagCountsResult] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments({}),
      Post.aggregate([
        { $unwind: '$tags' },
        { $match: { tags: { $in: allTags } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
      ]),
    ]);

    const authorIds = [
      ...new Set(posts.map((post) => (post as unknown as IPost).authorId).filter(Boolean)),
    ] as string[];
    const authorInfoMap = await getCachedUserInfoBatch(authorIds);

    const postIds = posts.map((post) => (post as { _id: { toString(): string } })._id.toString());
    const commentCountsRaw = postIds.length
      ? await Comment.aggregate([
          {
            $match: {
              productId: { $in: postIds },
              $or: [{ itemType: 'post' }, { itemType: { $exists: false } }],
            },
          },
          { $group: { _id: '$productId', count: { $sum: 1 } } },
        ])
      : [];

    const commentCountMap = new Map<string, number>(
      commentCountsRaw.map((row) => [row._id as string, row.count as number])
    );

    const postsWithAuthorInfo = posts.map((post) => {
      const postObj =
        typeof (post as { toObject?: () => IPost }).toObject === 'function'
          ? (post as { toObject: () => IPost }).toObject()
          : (post as unknown as IPost);
      const postId = (post as { _id: { toString(): string } })._id.toString();

      const authorInfo = authorInfoMap.get(postObj.authorId) || {
        displayName: postObj.authorName || 'ユーザー',
        photoURL: '',
      };

      return {
        ...postObj,
        _id: postId,
        authorDisplayName: authorInfo.displayName,
        authorPhotoURL: authorInfo.photoURL,
        commentsCount: commentCountMap.get(postId) || 0,
      };
    });

    const tagCounts: Record<string, number> = {};
    allTags.forEach((tagName) => {
      const found = tagCountsResult.find((row) => row._id === tagName);
      tagCounts[tagName] = found ? found.count : 0;
    });

    return NextResponse.json({
      success: true,
      posts: postsWithAuthorInfo,
      pagination: {
        total,
        page,
        limit,
        hasMore: skip + posts.length < total,
        totalPostCount,
      },
      tagCounts,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
    }
    const userId = userIdOrError as string;

    await dbConnect();
    const body = await request.json();
    const { title, content, category, media, authorId, authorName, tags, address, location } = body;

    const normalizedAuthorId = ensureUserIdPrefix(userId);
    if (authorId && authorId !== normalizedAuthorId && authorId !== userId) {
      return NextResponse.json(
        { error: '投稿権限がありません' },
        { status: 403 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { error: '件名と本文を入力してください' },
        { status: 400 }
      );
    }
    if (content.length > 1000) {
      return NextResponse.json(
        { error: '本文は1000文字以内で入力してください' },
        { status: 400 }
      );
    }

    const cachedUser = await getCachedUserInfo(userId);
    const safeAuthorName = cachedUser?.displayName || authorName || 'ユーザー';

    const post = await Post.create({
      title,
      content,
      category: category || '一般',
      media: media || [],
      authorId: normalizedAuthorId,
      authorName: safeAuthorName,
      tags: tags || [],
      likes: 0,
      address: address || undefined,
      location:
        location && typeof location.lat === 'number' && typeof location.lng === 'number'
          ? location
          : undefined,
    });

    return NextResponse.json(
      { success: true, post, message: 'Post created' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}
