'use client';

import { useState, useEffect } from 'react';
import PostCard, { Post } from '@/components/PostCard';
import Button from '@/components/Button';
import CustomSelect from '@/components/CustomSelect';
import { Fish, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function PostList() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 12;

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
      if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
        return null;
      }
      console.error('ユーザー情報取得エラー:', error);
      return null;
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (activeFilter !== 'all') {
        params.append('category', activeFilter);
      }
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data = await response.json();

      // データベースのデータをPost型に変換 + Firestoreからユーザー情報取得
      const formattedPosts: Post[] = await Promise.all(
        data.posts.map(async (post: {
          _id: string;
          title: string;
          content: string;
          tags?: string[];
          address?: string;
          authorId: string;
          authorName: string;
          createdAt: string;
          likes?: number;
          comments?: unknown[];
          category?: string;
          media?: Array<{ url: string; order: number }>;
        }) => {
          // Firestoreから最新のユーザー情報を取得
          let authorPhotoURL: string | undefined;
          let authorDisplayName: string = post.authorName; // フォールバック
          if (post.authorId) {
            const userProfile = await fetchUserProfile(post.authorId);
            authorPhotoURL = userProfile?.photoURL;
            authorDisplayName = userProfile?.displayName || post.authorName;
          }

          return {
            id: post._id,
            title: post.title,
            excerpt: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
            location: post.address || '場所未設定',
            author: authorDisplayName,
            authorId: post.authorId,
            authorPhotoURL,
            date: formatDate(post.createdAt),
            likes: post.likes || 0,
            comments: post.comments?.length || 0,
            category: post.category || 'other',
            isLiked: false,
            imageUrl: post.media && post.media.length > 0
              ? post.media.sort((a, b) => a.order - b.order)[0].url
              : undefined
          };
        })
      );

      setPosts(formattedPosts);
    } catch (err) {
      console.error('投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, keyword]);

  // 日付をフォーマット
  const formatDate = (dateString: string): string => {
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
  };

  const filterTabs = [
    { key: 'all', label: 'すべて' },
    { key: 'sea', label: '海釣り' },
    { key: 'river', label: '川釣り' },
    { key: 'lure', label: 'ルアー' },
    { key: 'bait', label: 'エサ釣り' }
  ];

  const SORT_OPTIONS = [
    { label: '新着順', value: 'latest' },
    { label: 'おすすめ順', value: 'popular' },
  ];

  // Pagination calculations
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedPosts = posts.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">

      <div className="flex-1 container mx-auto px-4 py-6">
        <main>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-bold mb-2">
                <Fish className="text-blue-600" />
                釣果投稿一覧
              </h2>
              <p className="text-gray-600">みんなの釣果や釣り場情報をチェック</p>
            </div>

            <Button
              href="/post"
              variant="primary"
              size="md"
              icon={<Plus size={18} />}
            >
              新規投稿
            </Button>
          </div>

          {/* 検索バー */}
          <div className="mb-8">
            <form className="relative max-w-2xl" onSubmit={(e) => e.preventDefault()}>
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-600">
                <Search size={16} />
              </div>
              <input
                type="search"
                placeholder="投稿を検索（タイトル、本文、タグ、場所）"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full py-4 px-5 pl-12 border-2 border-gray-200 rounded-full text-base outline-none transition-colors duration-300 focus:border-[#2FA3E3] placeholder:text-gray-400"
              />
            </form>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              {filterTabs.map((tab) => (
                <Button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  variant={activeFilter === tab.key ? 'primary' : 'ghost'}
                  size="sm"
                  className={activeFilter === tab.key ? '' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">並び替え:</span>
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                options={SORT_OPTIONS}
                className="min-w-[200px]"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchPosts} variant="primary" size="md">
                再読み込み
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <Fish className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600 text-lg mb-2">投稿が見つかりませんでした</p>
              <p className="text-gray-500 text-sm">最初の投稿をしてみましょう！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {paginatedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {posts.length > POSTS_PER_PAGE && (
            <div className="flex justify-center items-center gap-4">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                variant="ghost"
                size="md"
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
                variant={currentPage === totalPages ? "ghost" : "primary"}
                size="md"
                className={currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
                icon={<ChevronRight size={16} />}
              >
                次へ
              </Button>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}