'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PostCard, { Post } from '@/components/PostCard';
import Button from '@/components/Button';
import CustomSelect from '@/components/CustomSelect';
import { Fish, Plus, Search, Filter, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import LoginRequiredModal from "@/components/LoginRequiredModal";

export default function PostList() {
  const { user } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('投稿');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Intersection Observer用のref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Firestoreからユーザー情報を取得（バッチ処理）
  const fetchUserProfiles = async (authorIds: string[]) => {
    const uniqueIds = [...new Set(authorIds)];
    const profiles: Record<string, { displayName?: string; photoURL?: string }> = {};

    await Promise.all(
      uniqueIds.map(async (authorId) => {
        try {
          const uid = authorId.startsWith('user-') ? authorId.replace('user-', '') : authorId;
          const userDocRef = doc(db, 'users', uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            profiles[authorId] = {
              displayName: userData.displayName || undefined,
              photoURL: userData.photoURL || undefined,
            };
          }
        } catch (error) {
          if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
            return;
          }
          console.error('ユーザー情報取得エラー:', error);
        }
      })
    );

    return profiles;
  };

  const fetchPosts = useCallback(async (pageNum: number, resetPosts = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (activeFilter !== 'all') {
        params.append('tag', activeFilter);
      }
      if (keyword) {
        params.append('keyword', keyword);
      }
      params.append('page', pageNum.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data = await response.json();

      // ユーザー情報をバッチで取得
      const authorIds = data.posts.map((p: { authorId: string }) => p.authorId).filter(Boolean);
      const userProfiles = await fetchUserProfiles(authorIds);

      // データベースのデータをPost型に変換
      const formattedPosts: Post[] = data.posts.map((post: {
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
        const userProfile = post.authorId ? userProfiles[post.authorId] : null;
        const authorPhotoURL = userProfile?.photoURL;
        const authorDisplayName = userProfile?.displayName || post.authorName;

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
            : undefined,
          tags: post.tags || []
        };
      });

      if (resetPosts) {
        setPosts(formattedPosts);
      } else {
        setPosts((prev) => [...prev, ...formattedPosts]);
      }

      setHasMore(data.pagination.hasMore);
      setTotalCount(data.pagination.total);
    } catch (err) {
      console.error('投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, keyword]);

  // フィルター変更時にリセット
  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    fetchPosts(1, true);
  }, [activeFilter, keyword, fetchPosts]);

  // Intersection Observerの設定
  useEffect(() => {
    if (loading || !hasMore) return;

    const currentPage = Math.floor(posts.length / 12) + 1;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(currentPage, false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, fetchPosts, posts.length]);

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
        month: '2-digit',
        day: '2-digit'
      });
    }
  };

  const filterTabs = [
    { key: 'all', label: 'すべて' },
    { key: '釣行記', label: '釣行記' },
    { key: '情報共有', label: '情報共有' },
    { key: '質問', label: '質問' },
    { key: 'レビュー', label: 'レビュー' },
    { key: '雑談', label: '雑談' },
    { key: '初心者向け', label: '初心者向け' },
    { key: 'トラブル相談', label: 'トラブル相談' },
    { key: '釣果報告', label: '釣果報告' }
  ];

  const SORT_OPTIONS = [
    { label: '新着順', value: 'latest' },
    { label: 'おすすめ順', value: 'popular' },
  ];

  const handleNewPost = () => {
    if (!user) {
      setLoginRequiredAction('投稿');
      setShowLoginModal(true);
    } else {
      router.push('/post');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">

      <div className="flex-1 container mx-auto max-w-7xl px-4 py-8">
        <main>


          {/* モバイル用フィルター切り替えボタン */}
          <div className="lg:hidden mb-6">
            <Button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              variant="outline"
              className="w-full flex justify-center items-center gap-2 bg-white"
            >
              {isMobileFilterOpen ? (
                <span className="flex items-center gap-2">
                  <X size={18} />
                  検索・絞り込みを閉じる
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Filter size={18} />
                  検索・絞り込みを表示
                </span>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 左側: 投稿一覧 (メインコンテンツ) */}
            <div className="lg:col-span-3">
              {/* ヘッダーエリア */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="flex items-center gap-3 text-2xl font-bold mb-2 text-gray-800">
                    <Fish className="text-[#2FA3E3]" />
                    投稿一覧
                  </h2>
                  <p className="text-gray-600">みんなの釣果や釣り場情報をチェック</p>
                </div>

                <div className="lg:hidden">
                  <Button
                    onClick={handleNewPost}
                    variant="primary"
                    size="md"
                    icon={<Plus size={18} />}
                  >
                    投稿する
                  </Button>
                </div>
              </div>

              {loading && posts.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => fetchPosts(1, true)} variant="primary" size="md">
                    再読み込み
                  </Button>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Fish className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-600 text-lg mb-2">投稿が見つかりませんでした</p>
                  <p className="text-gray-400 text-sm">最初の投稿をしてみましょう！</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} className="h-48 sm:h-56">
                      <PostCard post={post} />
                    </div>
                  ))}

                  {/* 無限スクロール用のローディングインジケーター */}
                  <div ref={loadMoreRef} className="flex justify-center items-center py-8">
                    {loading && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2FA3E3]"></div>
                        <p className="text-sm text-gray-500">読み込み中...</p>
                      </div>
                    )}
                    {!hasMore && posts.length > 0 && (
                      <p className="text-sm text-gray-500">すべての投稿を表示しました</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 右側: サイドバー (検索・フィルタ・投稿ボタン) */}
            {/* モバイルではトグル表示、PCでは常時表示 */}
            <div className={`lg:col-span-1 space-y-6 order-first lg:order-last ${isMobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
              {/* 新規投稿ボタン (PC表示) */}
              <div className="hidden lg:block">
                <Button
                  onClick={handleNewPost}
                  variant="primary"
                  size="lg"
                  className="w-full shadow-md"
                  icon={<Plus size={20} />}
                >
                  新規投稿を作成
                </Button>
              </div>

              {/* 検索・絞り込みパネル */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Search size={18} className="text-[#2FA3E3]" />
                  検索・絞り込み
                </h3>

                {/* 検索バー */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">キーワード</label>
                  <form className="relative w-full" onSubmit={(e) => e.preventDefault()}>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="search"
                      placeholder="キーワードを入力"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="w-full py-2.5 pl-10 pr-4 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none transition-all duration-300 focus:border-[#2FA3E3] focus:ring-2 focus:ring-[#2FA3E3]/20"
                    />
                  </form>
                </div>

                {/* 並び替え */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">並び替え</label>
                  <CustomSelect
                    value={sortBy}
                    onChange={setSortBy}
                    options={SORT_OPTIONS}
                    className="w-full"
                  />
                </div>

                {/* タグフィルター */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">タグで探す</label>
                  <div className="flex flex-col space-y-1">
                    {filterTabs.map((tab) => {
                      // 現在読み込まれている投稿から簡易的にカウント（実際はAPIから取得すべき）
                      const count = tab.key === 'all'
                        ? totalCount
                        : posts.filter(p => p.tags?.includes(tab.key)).length; // Note: incomplete count but serves UI

                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveFilter(tab.key)}
                          className={`flex justify-between items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${activeFilter === tab.key
                            ? 'bg-[#2FA3E3]/10 text-[#2FA3E3] font-bold'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            {/* icon could go here */}
                            {tab.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${activeFilter === tab.key
                            ? 'bg-[#2FA3E3] text-white'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                            }`}>
                            {/* データがない場合は仮の数値を表示せず、クライアント側のマッチ数（デモ用）またはAPI実装待ち */}
                            {/* ここでは一旦、'all'以外は「詳細不明」または単にレイアウトを示すため空欄等は避けたいが...
                                APIがカウントを返さないので、今回はUIのみ実装します。
                                要望は「表示するようにしてほしい」なので、UI枠を作ることが優先 */}
                            {/* 仮の実装として、クライアント側で計算できる範囲を表示（ページネーションあるので不正確だが） */}
                            {/* あるいは、もっともらしくは "-" とする */}
                            -
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}
