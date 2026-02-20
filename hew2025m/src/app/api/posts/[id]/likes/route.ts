import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PostLike from '@/models/PostLike';
import Post from '@/models/Post';
import { requireAuth } from '@/lib/simpleAuth';
import { getCachedUserInfo } from '@/lib/userCache';

// いいね一覧取得
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

// いいね追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
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

    const body = await request.json();
    const { userName, userPhotoURL } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    const existingLike = await PostLike.findOne({ postId: id, userId });
    if (existingLike) {
      return NextResponse.json(
        { error: '既にいいねしています' },
        { status: 400 }
      );
    }

    const cachedUser = await getCachedUserInfo(userId);
    const safeUserName = cachedUser?.displayName || userName || 'ユーザー';
    const safeUserPhotoURL = cachedUser?.photoURL || userPhotoURL || '';

    const like = await PostLike.create({
      postId: id,
      userId,
      userName: safeUserName,
      userPhotoURL: safeUserPhotoURL,
    });

    await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } });

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

// いいね削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
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

    const deletedLike = await PostLike.findOneAndDelete({ postId: id, userId });
    if (!deletedLike) {
      return NextResponse.json(
        { error: 'いいねが見つかりませんでした' },
        { status: 404 }
      );
    }

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
