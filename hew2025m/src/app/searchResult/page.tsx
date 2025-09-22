'use client';

import { useState } from 'react';
import { Target, Link } from 'lucide-react';

export default function SearchResult() {
  const [sortBy, setSortBy] = useState('relevance');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [condition, setCondition] = useState('');

  const clearFilters = () => {
    setCategory('');
    setPriceRange('');
    setCondition('');
  };

  const ProductCard = () => (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
      <div className="bg-gray-200 h-48 rounded-t-lg"></div>
      <div className="p-4 space-y-2">
        <div className="bg-gray-200 h-4 rounded"></div>
        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
        <div className="bg-gray-200 h-3 rounded w-1/2"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            「<span className="text-blue-600">釣り竿</span>」の検索結果
          </h2>
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600">128件の商品が見つかりました</span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">並び順:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="relevance">関連度順</option>
                <option value="price-low">価格の安い順</option>
                <option value="price-high">価格の高い順</option>
                <option value="date-new">新着順</option>
                <option value="date-old">古い順</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-32"
              >
                <option value="">すべて</option>
                <option value="rods">釣り竿</option>
                <option value="reels">リール</option>
                <option value="lures">ルアー</option>
                <option value="accessories">アクセサリ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                価格帯
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-40"
              >
                <option value="">指定なし</option>
                <option value="0-5000">5,000円以下</option>
                <option value="5000-10000">5,000円 - 10,000円</option>
                <option value="10000-20000">10,000円 - 20,000円</option>
                <option value="20000-">20,000円以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状態
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-40"
              >
                <option value="">すべて</option>
                <option value="new">新品</option>
                <option value="like-new">未使用に近い</option>
                <option value="good">目立った傷や汚れなし</option>
                <option value="fair">やや傷や汚れあり</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              フィルターをクリア
            </button>
          </div>
        </div>

        <section className="mb-12">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
            <Target size={20} className="text-blue-600" />
            キーワードに該当する商品
            <span className="text-gray-500 font-normal">(86件)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCard key={index} />
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded transition-colors">
              さらに表示 (80件残り)
            </button>
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
            <Link size={20} className="text-blue-600" />
            キーワードに関連する商品
            <span className="text-gray-500 font-normal">(42件)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCard key={index} />
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded transition-colors">
              さらに表示 (38件残り)
            </button>
          </div>
        </section>

        <div className="hidden text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">検索結果が見つかりませんでした</h3>
          <p className="text-gray-600 mb-6">
            「<span className="font-medium">検索キーワード</span>」に一致する商品は見つかりませんでした。<br />
            別のキーワードで検索してみてください。
          </p>
          <div className="bg-gray-50 p-6 rounded-lg max-w-md mx-auto">
            <h4 className="font-semibold mb-3">検索のヒント</h4>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• キーワードを短くして検索してみてください</li>
              <li>• 別の言葉で検索してみてください</li>
              <li>• カテゴリを変更して検索してみてください</li>
            </ul>
          </div>
        </div>
      </main>

    </div>
  );
}