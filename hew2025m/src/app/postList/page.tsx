'use client';

import { useState, useEffect } from 'react';
import PostCard, { Post } from '@/components/PostCard';
import Button from '@/components/Button';
import { Fish, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function PostList() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

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
        media?: Array<{ url: string; order: number }>;
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
        isLiked: false,
        imageUrl: post.media && post.media.length > 0
          ? post.media.sort((a, b) => a.order - b.order)[0].url
          : undefined
      }));

      setPosts(formattedPosts);
    } catch (err) {
      console.error('投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, keyword]);

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

  const filterTabs = [
    { key: 'all', label: 'すべて' },
    { key: 'sea', label: '海釣り' },
    { key: 'river', label: '川釣り' },
    { key: 'lure', label: 'ルアー' },
    { key: 'bait', label: 'エサ釣り' }
  ];


  return (
    <div className="min-h-screen flex flex-col">

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

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="latest">新着順</option>
              <option value="popular">人気順</option>
              <option value="size">魚のサイズ順</option>
              <option value="location">場所別</option>
            </select>
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
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <div className="flex justify-center items-center gap-4">
            <Button
              disabled
              variant="ghost"
              size="md"
              className="bg-gray-100 text-gray-400 cursor-not-allowed"
              icon={<ChevronLeft size={16} />}
            >
              前へ
            </Button>

            <div className="flex gap-2">
              <Button variant="primary" size="sm" className="w-8 h-8 p-0">1</Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 bg-gray-100 hover:bg-gray-200">2</Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 bg-gray-100 hover:bg-gray-200">3</Button>
              <span className="px-2">...</span>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 bg-gray-100 hover:bg-gray-200">10</Button>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<ChevronRight size={16} />}
            >
              次へ
            </Button>
          </div>
        </main>
      </div>

    </div>
  );
}