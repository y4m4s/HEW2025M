'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Fish, MapPin, User, List } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

import { PostCard, Button, RecommendedUsers, LoadingSpinner, LoginRequiredModal, type Post } from '@/components';



export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [popularPost, setPopularPost] = useState<Post | null>(null);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

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
        month: '2-digit',
        day: '2-digit'
      });
    }
  }, []);

  // Firestoreからユーザー情報を取得
  const fetchUserProfile = useCallback(async (authorId: string) => {
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
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data = await response.json();

      // データベースのデータをPost型に変換（まずauthorPhotoURLなしで）
      const formattedPosts: Post[] = await Promise.all(
        data.posts.map(async (post: {
          _id: string;
          title: string;
          content: string;
          tags?: string[];
          address?: string;
          authorId?: string;
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
            tags: post.tags,
            imageUrl: post.media && post.media.length > 0
              ? post.media.sort((a, b) => a.order - b.order)[0].url
              : undefined
          };
        })
      );

      // 人気の投稿: いいね数が最も多い投稿
      if (formattedPosts.length > 0) {
        const sortedByLikes = [...formattedPosts].sort((a, b) => b.likes - a.likes);
        setPopularPost(sortedByLikes[0]);
      }

      // 最新の投稿: 最新4件
      setLatestPosts(formattedPosts.slice(0, 4));
    } catch (err) {
      console.error('投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, formatDate]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return <LoadingSpinner message="コミュニティを読み込み中……" size="lg" fullScreen />;
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <main className="flex max-w-7xl mx-auto px-5 py-8 gap-8">
          <div className="flex-1 text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchPosts} variant="primary" size="md">
              再読み込み
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="lg:flex lg:gap-6 xl:gap-8">
          {/* メインコンテンツ */}
          <div className="flex-1 lg:max-w-4xl">
            {/* ヘッダー */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1.5 sm:mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                    コミュニティ
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">釣果を共有して、釣り仲間と繋がろう</p>
                </div>
                <Button
                  onClick={() => {
                    if (!user) {
                      setLoginRequiredAction('投稿する');
                      setShowLoginModal(true);
                    } else {
                      router.push('/post');
                    }
                  }}
                  variant="primary"
                  size="md"
                  className="shadow-lg hover:shadow-xl transition-shadow text-xs sm:text-sm w-full sm:w-auto"
                >
                  投稿する
                </Button>
              </div>
            </div>

            {/* 人気の投稿セクション */}
            <section className="mb-8 sm:mb-10 md:mb-12">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-1.5 sm:p-2">
                  <Fish className="text-white" size={20} />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                  人気の投稿
                </h2>
              </div>
              {popularPost ? (
                <div className="transform hover:scale-[1.02] transition-transform duration-300">
                  <PostCard post={popularPost} variant="compact" />
                </div>
              ) : (
                <div className="text-center py-12 sm:py-14 md:py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Fish className="mx-auto text-gray-300 mb-3 sm:mb-4" size={48} />
                  <p className="text-gray-500 text-base sm:text-lg">まだ投稿がありません</p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1.5 sm:mt-2">最初の投稿をしてみませんか？</p>
                </div>
              )}
            </section>

            {/* 最新の投稿セクション */}
            <section className="mb-8 sm:mb-10 md:mb-12">
              <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg p-1.5 sm:p-2">
                    <Fish className="text-white" size={20} />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                    最新の投稿
                  </h2>
                </div>
                <Link
                  href="/postList"
                  className="text-[#2FA3E3] text-xs sm:text-sm font-semibold hover:text-[#1d7bb8] transition-colors duration-300 flex items-center gap-0.5 sm:gap-1 group"
                >
                  もっと見る
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
              {latestPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    {latestPosts.map((post) => (
                      <div
                        key={post.id}
                        className="transform hover:scale-[1.02] transition-transform duration-300"
                      >
                        <PostCard post={post} variant="simple" />
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-6 sm:mt-7 md:mt-8">
                    <Link
                      href="/postList"
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-white text-[#2FA3E3] text-xs sm:text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-[#2FA3E3] hover:text-white transition-all duration-300 border-2 border-[#2FA3E3]"
                    >
                      すべての投稿を見る
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 sm:py-14 md:py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Fish className="mx-auto text-gray-300 mb-3 sm:mb-4" size={48} />
                  <p className="text-gray-500 text-base sm:text-lg">まだ投稿がありません</p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1.5 sm:mt-2">最初の投稿をしてみませんか？</p>
                </div>
              )}
            </section>
          </div>

          {/* サイドバー */}
          <aside className="lg:w-80 space-y-4 sm:space-y-5 md:space-y-6 mt-6 lg:mt-0">
            {/* マップカード */}
            <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group">
              <Link href="/map" className="block">
                <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden">
                  {/* 背景のアニメーション効果 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>

                  {/* マップのイメージ的な装飾 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* 背景の円 */}
                      <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl scale-150 group-hover:scale-175 transition-transform duration-500"></div>

                      {/* メインアイコン */}
                      <div className="relative bg-white/90 backdrop-blur-sm rounded-full p-4 sm:p-5 md:p-6 shadow-2xl group-hover:bg-white transition-colors duration-300">
                        <MapPin className="text-blue-600" size={44} strokeWidth={2.5} />
                      </div>

                      {/* 周りの小さなピン */}
                      <div className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 bg-white/80 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg animate-bounce">
                        <MapPin className="text-cyan-500" size={16} />
                      </div>
                      <div className="absolute -bottom-1.5 sm:-bottom-2 -left-5 sm:-left-6 bg-white/80 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg animate-pulse">
                        <MapPin className="text-teal-500" size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="bg-white p-4 sm:p-5 md:p-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-2 group-hover:text-blue-600 transition-colors duration-300" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                  釣りスポットマップ
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                  みんなの釣果情報から、人気の釣りスポットを地図で確認できます
                </p>
                <Button href="/map" variant="primary" size="md" className="w-full shadow-md hover:shadow-lg transition-shadow text-xs sm:text-sm">
                  マップを見る
                </Button>
              </div>
            </div>

            {/* 投稿一覧カード */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-blue-100 rounded-lg p-1.5 sm:p-2">
                  <List className="text-blue-600" size={20} />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                  投稿一覧
                </h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                すべての投稿を一覧で確認できます
              </p>
              <Button href="/postList" variant="primary" size="md" className="w-full shadow-md hover:shadow-lg transition-shadow text-xs sm:text-sm">
                投稿一覧を見る
              </Button>
            </div>

            {/* おすすめユーザーカード */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-purple-100 rounded-lg p-1.5 sm:p-2">
                  <User className="text-purple-600" size={20} />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                  おすすめユーザー
                </h3>
              </div>
              <RecommendedUsers />
            </div>
          </aside>
        </div>
      </main>

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}