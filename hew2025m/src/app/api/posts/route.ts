import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

// 投稿一覧を取得 (GET handler)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const authorId = searchParams.get('authorId');
    const keyword = searchParams.get('keyword');
    const tag = searchParams.get('tag');

    let query: any = {};

    if (category) {
      query.category = category;
    }
    if (authorId) {
      query.authorId = authorId;
    }
    if (tag) {
      query.tags = tag;
    }

    // キーワード検索: title, content, tags, addressを対象に検索
    if (keyword) {
      const keywordRegex = new RegExp(keyword, 'i'); // 大文字小文字を区別しない
      query.$or = [
        { title: keywordRegex },
        { content: keywordRegex },
        { tags: keywordRegex },
        { address: keywordRegex },
      ];
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    return NextResponse.json({
      success: true,
      posts,
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
    await dbConnect();
    const body = await request.json();
    const { title, content, category, media, authorId, authorName, tags, address, location } = body;

    // バリデーション
    if (!title || !content || !authorId || !authorName) {
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
    const postData: any = {
      title,
      content,
      category: category || '一般',
      media: media || [],
      authorId,
      authorName,
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
