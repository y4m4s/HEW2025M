import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { requireAuth } from '@/lib/simpleAuth';
import { getCachedUserInfoBatch, getCachedUserInfo } from '@/lib/userCache';
import { ensureUserIdPrefix } from '@/lib/utils';

// 正規表現の特殊文字をエスケープ（RegExpインジェクション対策）
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 投稿一覧を取得 (GET handler)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const authorId = searchParams.get('authorId');
    const keyword = searchParams.get('keyword');
    const tag = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50); // 最大50件に制限

    const query: Record<string, unknown> = {};

    if (category) {
      query.category = category;
    }
    if (authorId) {
      const normalizedAuthorId = ensureUserIdPrefix(authorId);
      query.authorId = { $in: [authorId, normalizedAuthorId] };
    }
    if (tag) {
      query.tags = tag;
    }

    // キーワード検索: title, content, tags, addressを対象に検索
    // RegExpインジェクション対策: 特殊文字をエスケープ
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

    // ページネーションを適用
    const skip = (page - 1) * limit;

    // タグごとの投稿数を集計（N+1問題解決: aggregationで一括取得）
    const allTags = ['釣行記', '情報共有', '質問', 'レビュー', '雑談', '初心者向け', 'トラブル相談', '釣果報告'];

    // Promise.allで並列実行（Waterfall解消）
    const [total, posts, tagCountsResult] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.aggregate([
        { $unwind: '$tags' },
        { $match: { tags: { $in: allTags } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
      ])
    ]);

    const authorIds = [...new Set(posts.map((p) => (p as any).authorId).filter(Boolean))] as string[];
    const authorInfoMap = await getCachedUserInfoBatch(authorIds);

    const postsWithAuthorInfo = posts.map((post: any) => {
      const postObj = typeof post.toObject === 'function' ? post.toObject() : post;
      const authorInfo = authorInfoMap.get(postObj.authorId) || {
        displayName: postObj.authorName || 'ユーザー',
        photoURL: '',
      };

      return {
        ...postObj,
        authorDisplayName: authorInfo.displayName,
        authorPhotoURL: authorInfo.photoURL,
      };
    });

    const tagCounts: Record<string, number> = {};
    allTags.forEach((tagName) => {
      const found = tagCountsResult.find((r) => r._id === tagName);
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

// 新規投稿を作成 (POST handler)
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError; // 401エラーを返す
    }
    const userId = userIdOrError as string;

    await dbConnect();
    const body = await request.json();
    const { title, content, category, media, authorId, authorName, tags, address, location } = body;

    // 認証されたユーザーIDとauthorIdが一致するか確認
    const normalizedAuthorId = ensureUserIdPrefix(userId);
    if (authorId && authorId !== normalizedAuthorId && authorId !== userId) {
      return NextResponse.json(
        { error: '不正なリクエストです' },
        { status: 403 }
      );
    }

    // バリデーション
    if (!title || !content) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }
    if (content.length > 140) {
      return NextResponse.json(
        { error: '本文は140文字以内で入力してください' },
        { status: 400 }
      );
    }

    // 投稿データを作成
    const cachedUser = await getCachedUserInfo(userId);
    const safeAuthorName = cachedUser?.displayName || authorName || 'ユーザー';

    const postData: {
      title: string;
      content: string;
      category: string;
      media: Array<{ url: string; order: number }>;
      authorId: string;
      authorName: string;
      tags: string[];
      likes: number;
      comments: unknown[];
      address?: string;
      location?: { lat: number; lng: number };
    } = {
      title,
      content,
      category: category || '一般',
      media: media || [],
      authorId: normalizedAuthorId,
      authorName: safeAuthorName,
      tags: tags || [],
      likes: 0,
      comments: [],
    };

    // locationとaddressが存在する場合のみ追加
    if (address) {
      postData.address = address;
    }
    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      postData.location = location;
    }

    // 投稿を作成
    const post = await Post.create(postData);

    return NextResponse.json(
      { success: true, post, message: '投稿が作成されました' },
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
