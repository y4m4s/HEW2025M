"use client";

import { useState, useEffect, useCallback } from "react";
import { Fish, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import ProfilePostCard, { ProfilePost } from "@/components/ProfilePostCard";
import Button from "@/components/Button";

interface ProfPostProps {
  onCountChange?: (count: number) => void;
  userId: string; // 表示対象のユーザーID
}

export default function ProfPost({ onCountChange, userId }: ProfPostProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // 日付のフォーマット
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今日';
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const authorId = `user-${userId}`;
        const response = await fetch(`/api/posts?authorId=${authorId}`);

        if (!response.ok) {
          throw new Error("投稿の取得に失敗しました");
        }

        const data = await response.json();

        // データベースのデータをProfilePost型に変換
        const formattedPosts: ProfilePost[] = data.posts.map((post: {
          _id: string;
          title: string;
          content: string;
          tags?: string[];
          address?: string;
          createdAt: string;
          likes?: number;
          comments?: unknown[];
          media?: Array<{ url: string; order: number }>;
        }) => {
          return {
            id: post._id,
            title: post.title,
            excerpt: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
            location: post.address || '場所未設定',
            date: formatDate(post.createdAt),
            likes: post.likes || 0,
            comments: post.comments?.length || 0,
            isLiked: false,
            imageUrl: post.media && post.media.length > 0
              ? post.media.sort((a, b) => a.order - b.order)[0].url
              : undefined,
            tags: post.tags || []
          };
        });

        setPosts(formattedPosts);

        // 親コンポーネントに投稿数を通知
        if (onCountChange) {
          onCountChange(formattedPosts.length);
        }
      } catch (error) {
        console.error("投稿の取得エラー:", error);
        setPosts([]);
        if (onCountChange) {
          onCountChange(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId, onCountChange, formatDate]);

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
        <p className="text-gray-500">投稿がありません</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {paginatedPosts.map((post) => (
          <ProfilePostCard key={post.id} post={post} />
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
