import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { requireAuth } from '@/lib/simpleAuth';
import { extractUid } from '@/lib/utils';

const POST_COMMENT_FILTER = {
  $or: [{ itemType: 'post' }, { itemType: { $exists: false } }],
};

async function collectCommentTreeIds(rootId: string, itemId: string): Promise<string[]> {
  const visited = new Set<string>([rootId]);
  let frontier = [rootId];

  while (frontier.length > 0) {
    const children = await Comment.find({
      parentId: { $in: frontier },
      productId: itemId,
      ...POST_COMMENT_FILTER,
    })
      .select('_id')
      .lean();

    const nextFrontier: string[] = [];
    for (const child of children) {
      const childId = child._id.toString();
      if (visited.has(childId)) continue;
      visited.add(childId);
      nextFrontier.push(childId);
    }

    frontier = nextFrontier;
  }

  return Array.from(visited);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
    }
    const actorUserId = extractUid(userIdOrError as string);

    await dbConnect();
    const { id, commentId } = await params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'コメントが見つかりませんでした' }, { status: 404 });
    }

    const commentOwnerId = extractUid(comment.userId);
    const isPostComment = !comment.itemType || comment.itemType === 'post';
    if (!isPostComment || comment.productId !== id) {
      return NextResponse.json({ error: 'コメントが見つかりませんでした' }, { status: 404 });
    }

    if (commentOwnerId !== actorUserId) {
      return NextResponse.json({ error: 'コメントの削除権限がありません' }, { status: 403 });
    }

    const idsToDelete = await collectCommentTreeIds(commentId, id);
    await Comment.deleteMany({ _id: { $in: idsToDelete } });

    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      message: 'Comment deleted',
    });
  } catch (error) {
    console.error('Delete post comment error:', error);
    return NextResponse.json(
      { error: 'コメントの削除に失敗しました' },
      { status: 500 }
    );
  }
}
