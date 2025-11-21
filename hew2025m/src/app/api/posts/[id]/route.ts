import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

// 個別投稿を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりませんでした' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりませんでした' },
        { status: 404 }
      );
    }

    await Post.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: '投稿を削除しました',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: '投稿の削除に失敗しました' },
      { status: 500 }
    );
  }
}
