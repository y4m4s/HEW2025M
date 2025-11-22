'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostCard, { Post } from '@/components/PostCard';
import Button from '@/components/Button';
import { Fish, MapPin, User } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CommunityPage() {
  const [popularPost, setPopularPost] = useState<Post | null>(null);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

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

  const fetchPosts = async () => {
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
            fishName: extractFishName(post.tags),
            fishSize: extractFishSize(post.tags),
            fishWeight: extractFishWeight(post.tags),
            fishCount: extractFishCount(post.tags),
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

      // 人気の投稿: いいね数が最も多い投稿
      if (formattedPosts.length > 0) {
        const sortedByLikes = [...formattedPosts].sort((a, b) => b.likes - a.likes);
        setPopularPost(sortedByLikes[0]);
      }

      // 最新の投稿: 最新2件
      setLatestPosts(formattedPosts.slice(0, 2));
    } catch (err) {
      console.error('投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // タグから魚の名前を抽出
  const extractFishName = (tags: string[] = []): string => {
    const fishTag = tags.find(tag => tag.startsWith('魚:'));
    return fishTag ? fishTag.replace('魚:', '') : '';
  };

  // タグからサイズを抽出
  const extractFishSize = (tags: string[] = []): string => {
    const sizeTag = tags.find(tag => tag.includes('cm'));
    return sizeTag || '';
  };

  // タグから重さを抽出
  const extractFishWeight = (tags: string[] = []): string => {
    const weightTag = tags.find(tag => tag.includes('kg') || tag.includes('g'));
    return weightTag || '';
  };

  // タグから匹数を抽出
  const extractFishCount = (tags: string[] = []): string => {
    const countTag = tags.find(tag => tag.includes('匹'));
    return countTag || '';
  };

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
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <main className="flex max-w-7xl mx-auto px-5 py-8 gap-8">
          <div className="flex-1 flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:flex lg:gap-8">
          {/* メインコンテンツ */}
          <div className="flex-1 lg:max-w-4xl">
            {/* ヘッダー */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                    コミュニティ
                  </h1>
                  <p className="text-gray-600">釣果を共有して、釣り仲間と繋がろう</p>
                </div>
                <Button href="/post" variant="primary" size="md" className="shadow-lg hover:shadow-xl transition-shadow">
                  投稿する
                </Button>
              </div>
            </div>

            {/* 人気の投稿セクション */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-2">
                  <Fish className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                  人気の投稿
                </h2>
              </div>
              {popularPost ? (
                <div className="transform hover:scale-[1.02] transition-transform duration-300">
                  <PostCard post={popularPost} variant="compact" />
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Fish className="mx-auto text-gray-300 mb-4" size={56} />
                  <p className="text-gray-500 text-lg">まだ投稿がありません</p>
                  <p className="text-gray-400 text-sm mt-2">最初の投稿をしてみませんか？</p>
                </div>
              )}
            </section>

            {/* 最新の投稿セクション */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg p-2">
                    <Fish className="text-white" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                    最新の投稿
                  </h2>
                </div>
                <Link
                  href="/postList"
                  className="text-[#2FA3E3] font-semibold hover:text-[#1d7bb8] transition-colors duration-300 flex items-center gap-1 group"
                >
                  もっと見る
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
              {latestPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {latestPosts.map((post) => (
                      <div
                        key={post.id}
                        className="transform hover:scale-[1.02] transition-transform duration-300"
                      >
                        <PostCard post={post} variant="simple" />
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <Link
                      href="/postList"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2FA3E3] font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-[#2FA3E3] hover:text-white transition-all duration-300 border-2 border-[#2FA3E3]"
                    >
                      すべての投稿を見る
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Fish className="mx-auto text-gray-300 mb-4" size={56} />
                  <p className="text-gray-500 text-lg">まだ投稿がありません</p>
                  <p className="text-gray-400 text-sm mt-2">最初の投稿をしてみませんか？</p>
                </div>
              )}
            </section>
          </div>

          {/* サイドバー */}
          <aside className="lg:w-80 space-y-6">
            {/* マップカード */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-gray-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-400 opacity-10"></div>
                <div className="relative text-center">
                  <MapPin className="mx-auto mb-2 text-blue-600" size={40} />
                  <p className="font-semibold text-gray-700">釣りスポットマップ</p>
                </div>
              </div>
              <div className="p-5">
                <Button href="/map" variant="primary" size="md" className="w-full shadow-md hover:shadow-lg transition-shadow">
                  マップを見る
                </Button>
              </div>
            </div>

            {/* 投稿一覧カード */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 rounded-lg p-2">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                  投稿一覧
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                すべての投稿を一覧で確認できます
              </p>
              <Button href="/postList" variant="primary" size="md" className="w-full shadow-md hover:shadow-lg transition-shadow">
                投稿一覧を見る
              </Button>
            </div>

            {/* おすすめユーザーカード */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 rounded-lg p-2">
                  <User className="text-purple-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                  おすすめ
                </h3>
              </div>
              <div className="h-32 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center text-gray-500 border border-gray-100">
                <p className="text-sm">準備中...</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}