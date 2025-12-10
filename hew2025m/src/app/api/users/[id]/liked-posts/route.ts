import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PostLike from '@/models/PostLike';
import Post from '@/models/Post';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ユーザーがいいねした投稿一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id: userId } = await params;

    // ユーザーのいいねを取得（新しい順）
    const likes = await PostLike.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // いいねした投稿のIDリストを取得
    const postIds = likes.map((like) => like.postId);

    // 投稿の詳細情報を取得
    const posts = await Post.find({ _id: { $in: postIds } }).lean();

    // 投稿IDをキーにしたマップを作成
    const postMap = new Map(posts.map((post) => [post._id.toString(), post]));

    // 投稿者のユーザー情報をFirestoreから取得
    const authorIds = [...new Set(posts.map((post) => post.authorId))];
    const authorProfiles = new Map();

    await Promise.all(
      authorIds.map(async (authorId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', authorId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            authorProfiles.set(authorId, {
              displayName: userData?.displayName || '名無しユーザー',
              photoURL: userData?.photoURL || '',
            });
          }
        } catch (error) {
          console.error(`Failed to fetch user ${authorId}:`, error);
        }
      })
    );

    // いいねの順序を保持しながら投稿データを結合
    const likedPosts = likes
      .map((like) => {
        const post = postMap.get(like.postId);
        if (!post) return null; // 投稿が削除されている場合

        const authorProfile = authorProfiles.get(post.authorId) || {
          displayName: post.authorName || '名無しユーザー',
          photoURL: '',
        };

        // tagsから魚の情報を抽出
        const fishInfo = {
          fishName: '',
          fishSize: '',
          fishWeight: '',
          fishCount: '',
        };

        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            if (tag.includes('魚種:')) fishInfo.fishName = tag.replace('魚種:', '');
            if (tag.includes('サイズ:')) fishInfo.fishSize = tag.replace('サイズ:', '');
            if (tag.includes('重量:')) fishInfo.fishWeight = tag.replace('重量:', '');
            if (tag.includes('数:')) fishInfo.fishCount = tag.replace('数:', '');
          });
        }

        return {
          _id: post._id.toString(),
          title: post.title,
          content: post.content,
          category: post.category,
          address: post.address,
          authorId: post.authorId,
          authorName: authorProfile.displayName,
          authorPhotoURL: authorProfile.photoURL,
          imageUrl: post.media?.[0]?.url || '',
          likes: post.likes,
          comments: post.comments,
          createdAt: post.createdAt,
          likedAt: like.createdAt,
          ...fishInfo,
        };
      })
      .filter((post) => post !== null); // 削除された投稿を除外

    return NextResponse.json({
      success: true,
      posts: likedPosts,
      count: likedPosts.length,
    });
  } catch (error) {
    console.error('Get liked posts error:', error);
    return NextResponse.json(
      { error: 'いいねした投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}
