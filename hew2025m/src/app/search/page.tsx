import ProductCard, { Product } from '@/components/ProductCard';
import Button from '@/components/Button';
import { Fish, MapPin } from 'lucide-react';

export default function SearchPage() {
  const searchResults: Product[] = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: '釣り竿セット - 初心者向け',
    price: 3500,
    location: '東京都',
    condition: '良好',
    postedDate: '2日前'
  }));
  return (
    <div>
      
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              商品を探す
            </h1>
            <p className="text-center text-gray-600 mb-12">
              あなたが探している釣り用品を見つけましょう
            </p>

            {/* 検索フィルター */}
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
                  <Button variant="primary" size="md" className="w-full">
                    検索
                  </Button>
                </div>
              </div>
            </div>

            {/* 並び替え */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">検索結果: 24件</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">並び替え:</span>
                <select className="p-2 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none">
                  <option value="newest">新着順</option>
                  <option value="price-low">価格の安い順</option>
                  <option value="price-high">価格の高い順</option>
                  <option value="popular">人気順</option>
                </select>
              </div>
            </div>

            {/* 商品一覧 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* ページネーション */}
            <div className="flex justify-center mt-12">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="md" className="text-gray-500 hover:text-[#2FA3E3]">
                  ← 前へ
                </Button>
                <Button variant="primary" size="md">1</Button>
                <Button variant="ghost" size="md" className="text-gray-600 hover:text-[#2FA3E3]">2</Button>
                <Button variant="ghost" size="md" className="text-gray-600 hover:text-[#2FA3E3]">3</Button>
                <span className="px-2 text-gray-500">...</span>
                <Button variant="ghost" size="md" className="text-gray-600 hover:text-[#2FA3E3]">10</Button>
                <Button variant="ghost" size="md" className="text-gray-500 hover:text-[#2FA3E3]">
                  次へ →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}