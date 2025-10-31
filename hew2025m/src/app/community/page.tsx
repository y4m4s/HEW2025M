'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostCard, { Post } from '@/components/PostCard';
import Button from '@/components/Button';
import { Fish } from 'lucide-react';

export default function CommunityPage() {
  const [popularPost, setPopularPost] = useState<Post | null>(null);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data = await response.json();

      // データベースのデータをPost型に変換
      const formattedPosts: Post[] = data.posts.map((post: {
        _id: string;
        title: string;
        content: string;
        tags?: string[];
        address?: string;
        authorName: string;
        createdAt: string;
        likes?: number;
        comments?: unknown[];
        category?: string;
      }) => ({
        id: post._id,
        title: post.title,
        excerpt: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        fishName: extractFishName(post.tags),
        fishSize: extractFishSize(post.tags),
        fishWeight: extractFishWeight(post.tags),
        fishCount: extractFishCount(post.tags),
        location: post.address || '場所未設定',
        author: post.authorName,
        date: formatDate(post.createdAt),
        likes: post.likes || 0,
        comments: post.comments?.length || 0,
        category: post.category || 'other',
        isLiked: false
      }));

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
    <div>

      <div className="bg-gray-50 min-h-screen">
        <main className="flex max-w-7xl mx-auto px-5 py-8 gap-8">
          <div className="flex-1">
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>人気の投稿</h2>
                <Button href="/post" variant="primary" size="md">
                  投稿する
                </Button>
              </div>
              {popularPost ? (
                <PostCard post={popularPost} variant="compact" />
              ) : (
                <div className="text-center py-10 bg-white rounded-lg">
                  <Fish className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">まだ投稿がありません</p>
                </div>
              )}
            </section>

            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>最新の投稿</h2>
                <Link href="/postList" className="text-[#2FA3E3] font-medium hover:text-[#1d7bb8] transition-colors duration-300">
                  もっと見る
                </Link>
              </div>
              {latestPosts.length > 0 ? (
                <>
                  <div className="space-y-6">
                    {latestPosts.map((post) => (
                      <PostCard key={post.id} post={post} variant="simple" />
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <Link href="/postList" className="text-[#2FA3E3] font-medium hover:text-[#1d7bb8] transition-colors duration-300">
                      もっと見る
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 bg-white rounded-lg">
                  <Fish className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">まだ投稿がありません</p>
                </div>
              )}
            </section>
          </div>

          <aside className="w-80">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mb-4">
                地図
              </div>
              <Button href="/map" variant="primary" size="md" className="w-full">
                マップページへ
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: "せのびゴシック, sans-serif" }}>投稿を見る</h3>
              <p className="text-gray-600 text-sm mb-4">すべての投稿を一覧で確認できます</p>
              <Button href="/postList" variant="primary" size="md" className="w-full" icon="📋">
                投稿一覧を見る
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: "せのびゴシック, sans-serif" }}>おすすめのユーザー</h3>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                おすすめユーザー一覧
              </div>
            </div>
          </aside>
        </main>
      </div>

    </div>
  );
}