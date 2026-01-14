import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { requireAuth } from '@/lib/simpleAuth';

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
    // 認証チェック
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError; // 401エラーを返す
    }
    const userId = userIdOrError as string;

    await dbConnect();

    const { id } = await params;
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりませんでした' },
        { status: 404 }
      );
    }

    // 投稿者本人かチェック
    const actualUserId = userId.startsWith('user-') ? userId : `user-${userId}`;
    if (post.authorId !== actualUserId && post.authorId !== userId) {
      return NextResponse.json(
        { error: '自分の投稿のみ削除できます' },
        { status: 403 }
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
