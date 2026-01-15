'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ProductCard, { Product } from '@/components/ProductCard';
import Button from '@/components/Button';
import { Fish, Search, Puzzle } from 'lucide-react';
import { GiFishingPole, GiFishingHook, GiFishingLure, GiEarthWorm, GiSpanner } from 'react-icons/gi';
import { FaTape, FaTshirt, FaBox } from 'react-icons/fa';
import { SiHelix } from 'react-icons/si';
import CustomSelect from '@/components/CustomSelect';

const CATEGORY_OPTIONS = [
  { label: 'すべて', value: '' },
  { label: 'ロッド/竿', value: 'rod', icon: GiFishingPole },
  { label: 'リール', value: 'reel', icon: FaTape },
  { label: 'ルアー', value: 'lure', icon: GiFishingLure },
  { label: 'ライン/糸', value: 'line', icon: SiHelix },
  { label: 'ハリ/針', value: 'hook', icon: GiFishingHook },
  { label: '餌', value: 'bait', icon: GiEarthWorm },
  { label: 'ウェア', value: 'wear', icon: FaTshirt },
  { label: 'セット用品', value: 'set', icon: FaBox },
  { label: 'サービス', value: 'service', icon: GiSpanner },
  { label: 'その他', value: 'other', icon: Puzzle },
];

const PRICE_RANGE_OPTIONS = [
  { label: '指定なし', value: '' },
  { label: '〜1,000円', value: '0-1000' },
  { label: '1,000〜5,000円', value: '1000-5000' },
  { label: '5,000〜10,000円', value: '5000-10000' },
  { label: '10,000円〜', value: '10000-' },
];

const CONDITION_OPTIONS = [
  { label: 'すべて', value: '' },
  { label: '新品・未使用', value: 'new' },
  { label: '未使用に近い', value: 'like-new' },
  { label: '目立った傷汚れなし', value: 'good' },
  { label: 'やや傷や汚れあり', value: 'fair' },
  { label: '傷や汚れあり', value: 'poor' },
];

const SORT_OPTIONS = [
  { label: '新着順', value: 'newest' },
  { label: '価格の安い順', value: 'price-low' },
  { label: '価格の高い順', value: 'price-high' },
  { label: '人気順', value: 'popular' },
];

// Helper functions can be defined outside the component scope
// as they don't depend on component state or props.
// This prevents them from being recreated on every render.

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
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // フィルター状態（URLパラメータから初期値を取得）
  const category = searchParams.get('category') || '';
  const priceRange = searchParams.get('priceRange') || '';
  const condition = searchParams.get('condition') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const keyword = searchParams.get('keyword') || '';

  // Intersection Observer用のref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // フィルターが変更されたときにURLを更新する関数
  const handleFilterChange = useCallback((filterName: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (!value) {
      current.delete(filterName);
    } else {
      current.set(filterName, value);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    // `replace`を使い、ブラウザの履歴スタックに新しいエントリを追加しない
    router.replace(`${pathname}${query}`);
  }, [searchParams, pathname, router]);

  const fetchProducts = useCallback(async (pageNum: number, resetProducts = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(searchParams.toString());
      params.append('page', pageNum.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        throw new Error('商品の取得に失敗しました');
      }

      const data = await response.json();

      const newProducts: Product[] = data.products.map((product: {
        _id: string;
        title: string;
        price: number;
        condition: string;
        status?: 'available' | 'sold' | 'reserved';
        images?: string[];
        sellerId?: string;
        sellerName?: string;
        sellerPhotoURL?: string;
        createdAt: string;
      }) => {
        const sellerDisplayName = product.sellerName || '出品者未設定';
        return {
          id: product._id,
          name: product.title,
          price: product.price,
          location: sellerDisplayName,
          condition: formatCondition(product.condition),
          postedDate: formatDate(product.createdAt),
          imageUrl: product.images?.[0],
          status: product.status,
          sellerPhotoURL: product.sellerPhotoURL,
        };
      });

      if (resetProducts) {
        setProducts(newProducts);
      } else {
        // 重複を防ぐため、既存のIDセットを作成
        setProducts((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewProducts];
        });
      }

      setHasMore(data.pagination.hasMore);
      setTotalCount(data.pagination.total);
    } catch (err) {
      console.error('商品取得エラー:', err);
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // フィルター変更時にリセット
  useEffect(() => {
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, true);
  }, [searchParams, fetchProducts]); // fetchProductsも依存配列に追加

  // Intersection Observerの設定
  useEffect(() => {
    if (loading || !hasMore) return;

    const currentPage = Math.floor(products.length / 12) + 1;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchProducts(currentPage, false);
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
  }, [loading, hasMore, fetchProducts, products.length]);

  return (
    <div>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              商品を探す
            </h1>
            <p className="text-center text-gray-600 mb-8">
              あなたが探している釣り用品を見つけましょう
            </p>

            {/* 検索バー */}
            <div className="flex justify-center mb-8">
              <form className="relative max-w-2xl w-full" onSubmit={(e) => e.preventDefault()}>
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-600">
                  <Search size={16} />
                </div>
                <input
                  type="search"
                  placeholder="キーワードで検索"
                  defaultValue={keyword} // defaultValueを使い、制御されていないコンポーネントにする
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFilterChange('keyword', e.currentTarget.value); } }}
                  className="w-full py-4 px-5 pl-12 border-2 border-gray-200 rounded-full text-base outline-none transition-colors duration-300 focus:border-[#2FA3E3] placeholder:text-gray-400"
                />
              </form>
            </div>

            {/* 検索フィルター */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                  <CustomSelect
                    value={category} // URLから直接値を取得
                    onChange={(value) => handleFilterChange('category', value)}
                    options={CATEGORY_OPTIONS}
                    placeholder="すべて"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">価格帯</label>
                  <CustomSelect
                    value={priceRange}
                    onChange={(value) => handleFilterChange('priceRange', value)}
                    options={PRICE_RANGE_OPTIONS}
                    placeholder="指定なし"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状態</label>
                  <CustomSelect
                    value={condition}
                    onChange={(value) => handleFilterChange('condition', value)}
                    options={CONDITION_OPTIONS}
                    placeholder="すべて"
                  />
                </div>
              </div>
            </div>

            {/* 並び替え */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">検索結果: {products.length}件{totalCount > products.length ? ` (全${totalCount}件)` : ''}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">並び替え:</span>
                <CustomSelect
                  value={sortBy}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                  options={SORT_OPTIONS}
                  className="min-w-[200px]"
                />
              </div>
            </div>

            {/* 商品一覧 */}
            {loading && products.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => fetchProducts(1, true)} variant="primary" size="md">
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
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* 無限スクロール用のローディングインジケーター */}
                <div ref={loadMoreRef} className="flex justify-center items-center py-8">
                  {loading && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2FA3E3]"></div>
                      <p className="text-sm text-gray-500">読み込み中...</p>
                    </div>
                  )}
                  {!hasMore && products.length > 0 && (
                    <p className="text-sm text-gray-500">すべての商品を表示しました</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
