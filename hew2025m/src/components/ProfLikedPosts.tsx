"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Fish } from "lucide-react";
import PostCard, { Post } from "./PostCard";
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface LikedPost {
  _id: string;
  title: string;
  content: string;
  fishName?: string;
  fishSize?: string;
  fishWeight?: string;
  fishCount?: string;
  address?: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  imageUrl?: string;
  category: 'sea' | 'river';
  likes: number;
  comments?: any[];
  createdAt: string;
  likedAt: string;
}

interface ProfLikedPostsProps {
  onCountChange?: (count: number) => void;
  userId: string;
}

export default function ProfLikedPosts({ onCountChange, userId }: ProfLikedPostsProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Firestoreからユーザー情報を取得
  const fetchUserProfile = async (authorId: string) => {
    try {
      const uid = authorId.startsWith('user-') ? authorId.replace('user-', '') : authorId;
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return {
          photoURL: userData.photoURL || undefined,
          displayName: userData.displayName || undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchLikedPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/liked-posts`);
        if (!response.ok) throw new Error('いいねした投稿の取得に失敗しました');

        const data = await response.json();
        const likedPosts: LikedPost[] = data.posts || [];

        // PostCard用のフォーマットに変換 + Firestoreから最新のユーザー情報を取得
        const formattedPosts: Post[] = await Promise.all(
          likedPosts.map(async (post) => {
            // Firestoreから最新のユーザー情報を取得
            let authorPhotoURL: string | undefined = post.authorPhotoURL || '';
            let authorDisplayName: string = post.authorName || '名無しユーザー';

            if (post.authorId) {
              const userProfile = await fetchUserProfile(post.authorId);
              if (userProfile) {
                authorPhotoURL = userProfile.photoURL;
                authorDisplayName = userProfile.displayName || post.authorName;
              }
            }

            return {
              id: post._id,
              title: post.title,
              excerpt: post.content?.substring(0, 100) || '',
              fishName: post.fishName || '',
              fishSize: post.fishSize || '',
              fishWeight: post.fishWeight || '',
              fishCount: post.fishCount || '',
              location: post.address || '場所未設定',
              author: authorDisplayName,
              authorId: post.authorId,
              authorPhotoURL,
              date: new Date(post.createdAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }),
              likes: post.likes || 0,
              comments: post.comments?.length || 0,
              category: post.category,
              isLiked: true, // いいねした投稿なので常にtrue
              imageUrl: post.imageUrl || '',
            };
          })
        );

        setPosts(formattedPosts);

        // 親コンポーネントに投稿数を通知
        if (onCountChange) {
          onCountChange(formattedPosts.length);
        }
      } catch (error) {
        console.error("いいねした投稿取得エラー:", error);
        setPosts([]);
        if (onCountChange) {
          onCountChange(0);
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchLikedPosts();
    }
  }, [userId, onCountChange]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-6 text-center">
        <Fish size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">いいねした投稿がありません</p>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} variant="default" />
      ))}
    </div>
  );
}
