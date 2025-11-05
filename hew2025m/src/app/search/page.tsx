'use client';

import { useState, useEffect } from "react";
import ProductCard, { Product } from '@/components/ProductCard';
import Button from '@/components/Button';
import { Fish, MapPin } from 'lucide-react';

export default function SearchPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ✅ ダミーデータ（商品一覧）
  const products: Product[] = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: `釣り竿セット - アイテム ${i + 1}`,
    price: 3500 + i * 150,
    location: '東京都',
    condition: '良好',
    postedDate: `${(i % 5) + 1}日前`,
  }));

  // ✅ 全ページ数を計算
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // ✅ 現在のページに表示する商品を抽出
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = products.slice(indexOfFirst, indexOfLast);

  // ✅ キーボード操作（1〜4 ページ移動 + ←→）
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const page = Number(e.key);

      // 数字キーでページ移動
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }

      // ← キー：前のページ
      if (e.key === "ArrowLeft" && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }

      // → キー：次のページ
      if (e.key === "ArrowRight" && currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, totalPages]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-5 py-8">
        <div className="max-w-6xl mx-auto">

          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            商品を探す
          </h1>
          <p className="text-center text-gray-600 mb-12">
            あなたが探している釣り用品を見つけましょう
          </p>

          {/* ✅ フィルターエリア */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none">
                  <option value="">すべて</option>
                  <option value="rod">釣り竿</option>
                  <option value="reel">リール</option>
                  <option value="lure">ルアー</option>
                  <option value="line">ライン</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">価格帯</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none">
                  <option value="">指定なし</option>
                  <option value="0-1000">〜1,000円</option>
                  <option value="1000-5000">1,000〜5,000円</option>
                  <option value="5000-10000">5,000〜10,000円</option>
                  <option value="10000-">10,000円〜</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状態</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none">
                  <option value="">すべて</option>
                  <option value="new">新品・未使用</option>
                  <option value="like-new">未使用に近い</option>
                  <option value="good">目立った傷汚れなし</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button variant="primary" size="md" className="w-full">検索</Button>
              </div>
            </div>
          </div>

          {/* ✅ 商品一覧 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentItems.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* ✅ ページネーション */}
          <div className="flex justify-center mt-12 gap-2">

            <Button
              variant="ghost"
              size="md"
              className="text-gray-500 hover:text-[#2FA3E3]"
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            >
              ← 前へ
            </Button>

            {/* ページ番号 */}
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "primary" : "ghost"}
                size="md"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="md"
              className="text-gray-500 hover:text-[#2FA3E3]"
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            >
              次へ →
            </Button>

          </div>

        </div>
      </div>
    </div>
  );
}
