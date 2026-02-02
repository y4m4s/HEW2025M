"use client";

import { useState, useEffect } from "react";
import { Fish, ChevronLeft, ChevronRight } from "lucide-react";
import { PostCard, type Post, Button, LoadingSpinner } from "@/components";
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
  comments?: { _id: string }[];
  createdAt: string;
  likedAt: string;
}

interface ProfLikedPostsProps {
  onCountChange?: (count: number) => void;
  userId: string;
}

export default function ProfLikedPosts({ onCountChange, userId }: ProfLikedPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

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
      // permission-deniedエラーの場合は静かに処理（ログアウト時など）
      const firebaseError = error as { code?: string };
      if (firebaseError?.code === 'permission-denied') {
        return null;
      }
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
        <LoadingSpinner message="読み込み中..." size="sm" />
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

  // ページネーション計算
  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPosts = posts.slice(startIndex, endIndex);

  // ページ番号配列を生成
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {paginatedPosts.map((post) => (
          <PostCard key={post.id} post={post} variant="grid" />
        ))}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            variant="ghost"
            size="sm"
            className={currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}
            icon={<ChevronLeft size={16} />}
          >
            前へ
          </Button>

          <div className="flex gap-2">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 flex items-center">...</span>
              ) : (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  variant={currentPage === page ? "primary" : "ghost"}
                  size="sm"
                  className={currentPage === page ? "w-8 h-8 p-0" : "w-8 h-8 p-0 bg-gray-100 hover:bg-gray-200"}
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            variant="ghost"
            size="sm"
            className={currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}
            icon={<ChevronRight size={16} />}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
