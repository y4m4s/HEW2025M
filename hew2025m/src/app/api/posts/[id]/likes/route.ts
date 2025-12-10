import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PostLike from '@/models/PostLike';
import Post from '@/models/Post';
import { createPostLikeNotificationServer } from '@/lib/notifications';

// 投稿のいいね一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    // 投稿が存在するか確認
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりませんでした' },
        { status: 404 }
      );
    }

    // いいねを取得（新しい順）
    const likes = await PostLike.find({ postId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      likes,
      count: likes.length,
    });
  } catch (error) {
    console.error('Get likes error:', error);
    return NextResponse.json(
      { error: 'いいねの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// いいねを追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    // 投稿が存在するか確認
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりませんでした' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { userId, userName, userPhotoURL } = body;

    // バリデーション
    if (!userId || !userName) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // 既にいいねしているかチェック
    const existingLike = await PostLike.findOne({ postId: id, userId });
    if (existingLike) {
      return NextResponse.json(
        { error: '既にいいねしています' },
        { status: 400 }
      );
    }

    // いいねを作成
    const like = await PostLike.create({
      postId: id,
      userId,
      userName,
      userPhotoURL: userPhotoURL || '',
    });

    // 投稿のlikesカウントを更新
    await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } });

    // 通知を作成（自分の投稿でない場合のみ）
    const postAuthorId = post.authorId.startsWith('user-')
      ? post.authorId.replace('user-', '')
      : post.authorId;

    if (postAuthorId && postAuthorId !== userId) {
      await createPostLikeNotificationServer(
        postAuthorId,
        userId,
        id,
        post.title || '投稿'
      );
    }

    return NextResponse.json(
      {
        success: true,
        like,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post like error:', error);
    return NextResponse.json(
      { error: 'いいねの追加に失敗しました' },
      { status: 500 }
    );
  }
}

// いいねを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // 投稿が存在するか確認
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりませんでした' },
        { status: 404 }
      );
    }

    // いいねを削除
    const deletedLike = await PostLike.findOneAndDelete({ postId: id, userId });

    if (!deletedLike) {
      return NextResponse.json(
        { error: 'いいねが見つかりませんでした' },
        { status: 404 }
      );
    }

    // 投稿のlikesカウントを更新（0未満にならないように）
    const updatedPost = await Post.findById(id);
    if (updatedPost && updatedPost.likes > 0) {
      updatedPost.likes -= 1;
      await updatedPost.save();
    }

    return NextResponse.json({
      success: true,
      message: 'いいねを削除しました',
    });
  } catch (error) {
    console.error('Delete like error:', error);
    return NextResponse.json(
      { error: 'いいねの削除に失敗しました' },
      { status: 500 }
    );
  }
}
