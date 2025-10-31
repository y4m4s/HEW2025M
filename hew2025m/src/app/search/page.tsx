'use client';

import { useState, useEffect } from 'react';
import ProductCard, { Product } from '@/components/ProductCard';
import Button from '@/components/Button';
import { Fish, MapPin } from 'lucide-react';

export default function SearchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルター状態
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, condition]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (condition) params.append('condition', condition);
      params.append('status', 'available'); // 販売中のみ表示

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        throw new Error('商品の取得に失敗しました');
      }

      const data = await response.json();

      // データベースのデータをProduct型に変換
      const formattedProducts: Product[] = data.products.map((product: {
        _id: string;
        title: string;
        price: number;
        condition: string;
        images?: string[];
        sellerName?: string;
        createdAt: string;
      }) => ({
        id: parseInt(product._id.slice(-6), 16), // IDを数値に変換
        name: product.title,
        price: product.price,
        location: product.sellerName || '出品者未設定',
        condition: formatCondition(product.condition),
        postedDate: formatDate(product.createdAt),
        imageUrl: product.images?.[0]
      }));

      // フィルタリング（価格帯）
      let filtered = formattedProducts;
      if (priceRange) {
        filtered = filterByPrice(filtered, priceRange);
      }

      // ソート
      filtered = sortProducts(filtered, sortBy);

      setProducts(filtered);
    } catch (err) {
      console.error('商品取得エラー:', err);
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 状態を日本語に変換
  const formatCondition = (cond: string): string => {
    const conditionMap: Record<string, string> = {
      'new': '新品・未使用',
      'like-new': '未使用に近い',
      'good': '目立った傷汚れなし',
      'fair': 'やや傷や汚れあり',
      'poor': '傷や汚れあり'
    };
    return conditionMap[cond] || cond;
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

  // 価格帯でフィルタリング
  const filterByPrice = (items: Product[], range: string): Product[] => {
    if (!range) return items;

    if (range === '0-1000') {
      return items.filter(p => p.price <= 1000);
    } else if (range === '1000-5000') {
      return items.filter(p => p.price > 1000 && p.price <= 5000);
    } else if (range === '5000-10000') {
      return items.filter(p => p.price > 5000 && p.price <= 10000);
    } else if (range === '10000-') {
      return items.filter(p => p.price > 10000);
    }
    return items;
  };

  // ソート
  const sortProducts = (items: Product[], sort: string): Product[] => {
    const sorted = [...items];

    if (sort === 'price-low') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      sorted.sort((a, b) => b.price - a.price);
    }
    // 'newest' と 'popular' はAPIでソート済み

    return sorted;
  };

  const handleSearch = () => {
    fetchProducts();
  };
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
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none"
                  >
                    <option value="">すべて</option>
                    <option value="rod">釣り竿</option>
                    <option value="reel">リール</option>
                    <option value="lure">ルアー</option>
                    <option value="line">ライン</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">価格帯</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none"
                  >
                    <option value="">指定なし</option>
                    <option value="0-1000">〜1,000円</option>
                    <option value="1000-5000">1,000〜5,000円</option>
                    <option value="5000-10000">5,000〜10,000円</option>
                    <option value="10000-">10,000円〜</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状態</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none"
                  >
                    <option value="">すべて</option>
                    <option value="new">新品・未使用</option>
                    <option value="like-new">未使用に近い</option>
                    <option value="good">目立った傷汚れなし</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={handleSearch}
                  >
                    検索
                  </Button>
                </div>
              </div>
            </div>

            {/* 並び替え */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">検索結果: {products.length}件</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">並び替え:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setProducts(sortProducts(products, e.target.value));
                  }}
                  className="p-2 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none"
                >
                  <option value="newest">新着順</option>
                  <option value="price-low">価格の安い順</option>
                  <option value="price-high">価格の高い順</option>
                  <option value="popular">人気順</option>
                </select>
              </div>
            </div>

            {/* 商品一覧 */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchProducts} variant="primary" size="md">
                  再読み込み
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Fish className="mx-auto text-gray-400 mb-4" size={64} />
                <p className="text-gray-600 text-lg mb-2">商品が見つかりませんでした</p>
                <p className="text-gray-500 text-sm">条件を変えて検索してみてください</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

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