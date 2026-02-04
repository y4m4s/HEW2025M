// src/app/api/users/[id]/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import Product from '@/models/Product';
import { IPost } from '@/models/Post';
import { IProduct } from '@/models/Product';
import { IComment } from '@/models/Comment';
import { ensureUserIdPrefix } from '@/lib/utils';

// Tipo unificado para atividade
export type ActivityItem = {
  type: 'post' | 'comment';
  date: Date;
  data: IPost | (IComment & { parent?: IPost | IProduct }); // Comentário com seu pai (post/produto)
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const userId = id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Buscar todos os posts do usuário
    const normalizedAuthorId = ensureUserIdPrefix(userId);
    const userPosts: IPost[] = await Post.find({
      authorId: { $in: [userId, normalizedAuthorId] }
    }).sort({ createdAt: -1 }).lean();
    const postActivities: ActivityItem[] = userPosts.map(post => ({
      type: 'post',
      date: post.createdAt,
      data: post,
    }));

    // 2. Buscar todos os comentários do usuário
    const userComments: IComment[] = await Comment.find({ userId }).sort({ createdAt: -1 }).lean();
    
    // 3. Para cada comentário, buscar o item pai (post ou produto)
    const parentIds = [...new Set(userComments.map(c => c.productId))];
    const parentPosts = await Post.find({ _id: { $in: parentIds } }).lean();
    const parentProducts = await Product.find({ _id: { $in: parentIds } }).lean();

    const parentsMap = new Map<string, IPost | IProduct>();
    parentPosts.forEach(p => parentsMap.set(p._id.toString(), p));
    parentProducts.forEach(p => parentsMap.set(p._id.toString(), p));
    
    const commentActivities: ActivityItem[] = userComments.map(comment => {
      const parent = parentsMap.get(comment.productId.toString());
      return {
        type: 'comment',
        date: comment.createdAt,
        data: {
          ...comment,
          parent: parent || undefined
        },
      };
    });

    // 4. Combinar e ordenar todas as atividades
    const allActivities = [...postActivities, ...commentActivities];
    allActivities.sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ success: true, activities: allActivities });

  } catch (error) {
    console.error('Get user activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 });
  }
}
