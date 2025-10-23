import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

// 投稿一覧を取得
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const authorId = searchParams.get('authorId');

    let query = {};
    if (category) {
      query = { category };
    }
    if (authorId) {
      query = { ...query, authorId };
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

// 新規投稿を作成
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { title, content, category, images, authorId, authorName, tags, location } = body;

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

    // 投稿を作成
    const post = await Post.create({
      title,
      content,
      category: category || '一般',
      images: images || [],
      authorId,
      authorName,
      tags: tags || [],
      location: location || '',
      likes: 0,
      comments: [],
    });

    return NextResponse.json(
      {
        success: true,
        post,
        message: '投稿が作成されました',
      },
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
