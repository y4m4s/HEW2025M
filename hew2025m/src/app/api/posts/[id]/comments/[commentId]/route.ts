import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';

// コメントを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // コメントを取得
    const comment = await Comment.findById(params.commentId);

    if (!comment) {
      return NextResponse.json(
        { error: 'コメントが見つかりませんでした' },
        { status: 404 }
      );
    }

    // 自分のコメントかチェック
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: '他人のコメントは削除できません' },
        { status: 403 }
      );
    }

    // コメントを削除
    await Comment.findByIdAndDelete(params.commentId);

    return NextResponse.json({
      success: true,
      message: 'コメントを削除しました',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'コメントの削除に失敗しました' },
      { status: 500 }
    );
  }
}
