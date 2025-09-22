'use client';

import { useState } from 'react';
import PostCard, { Post } from '@/components/PostCard';
import { Fish, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PostList() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const posts: Post[] = [
    {
      id: 1,
      title: '東京湾で大型スズキゲット！',
      excerpt: '朝マズメの時間帯に70cmのスズキを釣り上げました。ルアーはメガバス製のミノーを使用。潮の流れが良くて...',
      fishName: 'スズキ',
      fishSize: '70cm',
      fishWeight: '3.2kg',
      location: '東京湾・豊洲',
      author: '海釣り太郎',
      date: '2024年12月15日',
      likes: 24,
      comments: 8,
      category: 'sea'
    },
    {
      id: 2,
      title: '多摩川でバスの数釣り成功',
      excerpt: 'ワームを使って数釣りを楽しんできました。30cmクラスのバスを5匹キャッチ。今日のポイントは浅場の...',
      fishName: 'ブラックバス',
      fishSize: '30cm',
      fishCount: '5匹',
      location: '多摩川・調布',
      author: 'バス釣り花子',
      date: '2024年12月14日',
      likes: 18,
      comments: 12,
      category: 'river'
    },
    {
      id: 3,
      title: '湘南でマダイの良型！',
      excerpt: '船釣りで念願のマダイをゲット。50cmオーバーの良型で引きが強くて楽しかったです。エサはアミエビを...',
      fishName: 'マダイ',
      fishSize: '52cm',
      fishWeight: '2.8kg',
      location: '湘南・江ノ島沖',
      author: '船釣り次郎',
      date: '2024年12月13日',
      likes: 35,
      comments: 15,
      category: 'sea',
      isLiked: true
    },
    {
      id: 4,
      title: '荒川でナマズ初ゲット',
      excerpt: '夜釣りでついに念願のナマズを釣ることができました！40cmほどのサイズでしたが、引きが想像以上に...',
      fishName: 'ナマズ',
      fishSize: '40cm',
      fishWeight: '1.2kg',
      location: '荒川・戸田',
      author: '夜釣り愛好家',
      date: '2024年12月12日',
      likes: 22,
      comments: 9,
      category: 'river'
    },
    {
      id: 5,
      title: '堤防釣りでアジの群れに遭遇',
      excerpt: 'サビキ釣りで小アジが入れ食い状態！20匹以上釣れて大満足です。家族みんなで楽しめました...',
      fishName: 'アジ',
      fishSize: '15-20cm',
      fishCount: '20匹+',
      location: '横浜・本牧埠頭',
      author: 'ファミリー釣り',
      date: '2024年12月11日',
      likes: 28,
      comments: 6,
      category: 'sea'
    },
    {
      id: 6,
      title: '渓流でニジマスの美魚',
      excerpt: '山梨の渓流でニジマスを狙ってきました。35cmの美しいニジマスがヒット。自然の中での釣りは最高です...',
      fishName: 'ニジマス',
      fishSize: '35cm',
      fishWeight: '800g',
      location: '山梨・桂川',
      author: '渓流マニア',
      date: '2024年12月10日',
      likes: 31,
      comments: 14,
      category: 'river'
    }
  ];

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

            <a
              href="/post"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              <Plus size={18} />
              新規投稿
            </a>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-4 py-2 rounded transition-colors ${
                    activeFilter === tab.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="flex justify-center items-center gap-4">
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              前へ
            </button>

            <div className="flex gap-2">
              <button className="w-8 h-8 bg-blue-500 text-white rounded">1</button>
              <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded">2</button>
              <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded">3</button>
              <span className="px-2">...</span>
              <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded">10</button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
              次へ
              <ChevronRight size={16} />
            </button>
          </div>
        </main>
      </div>

    </div>
  );
}