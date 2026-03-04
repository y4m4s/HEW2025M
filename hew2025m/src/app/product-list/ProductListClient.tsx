'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { Fish, Plus, X, Filter } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { SEARCH_DEBOUNCE_DELAY } from '@/lib/imageOptimization';

import ProductCard from '@/components/products/ProductCard';
import type { Product } from '@/components/products/ProductCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SkeletonCard from '@/components/ui/SkeletonCard';
import LoginRequiredModal from '@/components/user/LoginRequiredModal';
import FilterSidebar from './FilterSidebar';

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

// キーワードでフィルタリング
const filterByKeyword = (items: Product[], searchKeyword: string): Product[] => {
  if (!searchKeyword) return items;
  const lowerKeyword = searchKeyword.toLowerCase();
  return items.filter(p =>
    p.name.toLowerCase().includes(lowerKeyword) ||
    p.location.toLowerCase().includes(lowerKeyword) ||
    p.condition.toLowerCase().includes(lowerKeyword)
  );
};

interface ProductListClientProps {
  initialProducts: Product[];
  initialTotal: number;
  initialHasMore: boolean;
}

export default function ProductListClient({
  initialProducts,
  initialTotal,
  initialHasMore
}: ProductListClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FA3E3]"></div></div>}>
      <ProductListContent
        initialProducts={initialProducts}
        initialTotal={initialTotal}
        initialHasMore={initialHasMore}
      />
    </Suspense>
  );
}

function ProductListContent({
  initialProducts,
  initialTotal,
  initialHasMore
}: ProductListClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [totalCount, setTotalCount] = useState(initialTotal);

  // フィルター状態（URLパラメータから初期値を取得）
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [shippingPayer, setShippingPayer] = useState('');
  const [hideSold, setHideSold] = useState(false);
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, SEARCH_DEBOUNCE_DELAY);

  // モバイル用フィルター表示状態
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ログインモーダル用の状態
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

  // Intersection Observer用のref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // URLパラメータが変更されたときにstateを同期
  useEffect(() => {
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // フィルターが変更されたときにURLとstateを更新する関数
  const handleCategoryChange = (value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (!value) {
      current.delete('category');
    } else {
      current.set('category', value);
    }
    const query = current.toString();
    setCategory(value);
    router.replace(`${pathname}${query ? `?${query}` : ''}`);
  };

  const handleSell = () => {
    if (!user) {
      setLoginRequiredAction('出品');
      setShowLoginModal(true);
    } else {
      router.push('/sell');
    }
  };

  const handleReset = () => {
    setKeyword('');
    setMinPrice('');
    setMaxPrice('');
    setShippingPayer('');
    router.replace(pathname);
  };

  // fetchProductsをuseRefで保持（依存配列の循環参照を回避）
  const fetchProductsRef = useRef<(pageNum: number, resetProducts?: boolean) => Promise<void>>(() => Promise.resolve());

  fetchProductsRef.current = async (pageNum: number, resetProducts = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (shippingPayer) params.append('shippingPayer', shippingPayer);
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
          sellerId: product.sellerId,
        };
      });

      let filtered = newProducts;
      if (debouncedKeyword) {
        filtered = filterByKeyword(filtered, debouncedKeyword);
      }

      if (resetProducts) {
        setProducts(filtered);
      } else {
        setProducts((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewProducts = filtered.filter(p => !existingIds.has(p.id));
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
  };

  // フィルター変更時にリセット（初期ロード時は除く）
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setProducts([]);
    setHasMore(true);
    fetchProductsRef.current?.(1, true);
  }, [category, minPrice, maxPrice, shippingPayer, debouncedKeyword]);

  // Intersection Observerの設定
  useEffect(() => {
    if (loading || !hasMore) return;

    const currentPage = Math.floor(products.length / 12) + 1;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchProductsRef.current?.(currentPage, false);
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
  }, [loading, hasMore, products.length]);

  const displayProducts = products.filter((p) => !hideSold || p.status !== 'sold');
  const hasActiveFilters = !!(category || minPrice || maxPrice || shippingPayer || keyword);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <main>

          {/* モバイル用フィルター切り替えボタン */}
          <div className="lg:hidden mb-6">
            <Button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              variant="outline"
              className="w-full flex justify-center items-center gap-2 bg-white"
            >
              {isMobileFilterOpen ? (
                <span className="flex items-center gap-2">
                  <X size={18} />
                  検索・絞り込みを閉じる
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Filter size={18} />
                  検索・絞り込みを表示
                </span>
              )}
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* 左側: 商品一覧 (メインコンテンツ) */}
            <div className="flex-1 min-w-0">
              {/* ヘッダーエリア */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="flex items-center gap-3 text-2xl font-bold mb-2 text-gray-800">
                    <Fish className="text-[#2FA3E3]" />
                    商品一覧
                  </h2>
                  <p className="hidden sm:block text-gray-600">あなたが探している釣り用品を見つけましょう</p>
                </div>

                <div className="shrink-0">
                  <Button
                    onClick={handleSell}
                    variant="primary"
                    size="md"
                    className="whitespace-nowrap"
                    icon={<Plus size={16} />}
                  >
                    出品する
                  </Button>
                </div>
              </div>

              {/* 件数表示 */}
              <p className="text-sm text-gray-600 mb-4">
                {loading && products.length === 0 ? (
                  <span className="skeleton inline-block w-32 h-5" />
                ) : (
                  <>表示中: {displayProducts.length}件{totalCount > displayProducts.length ? ` (全${totalCount}件)` : ''}</>
                )}
              </p>

              {/* 商品一覧 */}
              {loading && products.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
                  <SkeletonCard variant="product" count={6} />
                </div>
              ) : error ? (
                <div className="text-center py-20 px-4">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => fetchProductsRef.current?.(1, true)} variant="primary" size="md">
                    再読み込み
                  </Button>
                </div>
              ) : displayProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Fish className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-600 text-lg mb-2">商品が見つかりませんでした</p>
                  <p className="text-gray-400 text-sm">条件を変えて検索してみてください</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    {displayProducts.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        priority={index < 4}
                      />
                    ))}
                  </div>

                  {/* 無限スクロール用のローディングインジケーター */}
                  <div ref={loadMoreRef} className="flex justify-center items-center py-8">
                    {loading && (
                      <LoadingSpinner size="sm" message="読み込み中..." />
                    )}
                    {!hasMore && products.length > 0 && (
                      <p className="text-sm text-gray-500">すべての商品を表示しました</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 右側: フィルターサイドバー */}
            <FilterSidebar
              category={category}
              minPrice={minPrice}
              maxPrice={maxPrice}
              shippingPayer={shippingPayer}
              keyword={keyword}
              hideSold={hideSold}
              hasActiveFilters={hasActiveFilters}
              isMobileFilterOpen={isMobileFilterOpen}
              onCategoryChange={handleCategoryChange}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onShippingPayerChange={setShippingPayer}
              onKeywordChange={setKeyword}
              onHideSoldToggle={() => setHideSold((prev) => !prev)}
              onReset={handleReset}
            />
          </div>
        </main>
      </div>

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}
