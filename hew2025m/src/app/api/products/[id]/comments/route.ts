import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Product from '@/models/Product';


// コメントの型定義
interface CommentDocument {
  _id: { toString(): string };
  parentId?: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: Date;
}

interface CommentWithReplies extends CommentDocument {
  replies: CommentWithReplies[];
}

// コメントを階層構造に変換するヘルパー関数
function organizeComments(comments: CommentDocument[]): CommentWithReplies[] {
  const commentMap = new Map<string, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  // まずすべてのコメントをマップに格納
  comments.forEach((comment) => {
    commentMap.set(comment._id.toString(), { ...comment, replies: [] });
  });

  // 親子関係を構築
  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment._id.toString());
    if (!commentWithReplies) return;

    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

// 商品のコメント一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    // 商品が存在するか確認
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: '商品が見つかりませんでした' },
        { status: 404 }
      );
    }

    // コメントを取得（新しい順）
    const allComments = await Comment.find({ productId: id })
      .sort({ createdAt: -1 })
      .lean();

    // コメントを階層構造に変換
    const comments = organizeComments(allComments);

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'コメントの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新しいコメントを投稿
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    // 商品が存在するか確認
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: '商品が見つかりませんでした' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { userId, userName, userPhotoURL, content, parentId } = body;

    // バリデーション
    if (!userId || !userName || !content) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'コメント内容を入力してください' },
        { status: 400 }
      );
    }

    if (content.length > 140) {
      return NextResponse.json(
        { error: 'コメントは140文字以内で入力してください' },
        { status: 400 }
      );
    }

    // 返信の場合、親コメントが存在するか確認
    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return NextResponse.json(
          { error: '返信先のコメントが見つかりませんでした' },
          { status: 404 }
        );
      }
    }

    // コメントを作成
    const comment = await Comment.create({
      productId: id,
      userId,
      userName,
      userPhotoURL: userPhotoURL || '',
      content: content.trim(),
      parentId: parentId || undefined,
    });



    return NextResponse.json(
      {
        success: true,
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post comment error:', error);
    return NextResponse.json(
      { error: 'コメントの投稿に失敗しました' },
      { status: 500 }
    );
  }
}
