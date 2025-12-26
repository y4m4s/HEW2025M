'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard, { Product } from '@/components/Productcard';
import Button from '@/components/Button';
import { Fish, Search, ChevronLeft, ChevronRight, Puzzle } from 'lucide-react';
import { GiFishingPole, GiFishingHook, GiFishingLure, GiEarthWorm, GiSpanner } from 'react-icons/gi';
import { FaTape, FaTshirt, FaBox } from 'react-icons/fa';
import { SiHelix } from 'react-icons/si';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルター状態（URLパラメータから初期値を取得）
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState('');
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [keyword, setKeyword] = useState('');

  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;

  // URLパラメータが変更された時にカテゴリを更新
  useEffect(() => {
    const categoryParam = searchParams.get('category') || '';
    setCategory(categoryParam);
  }, [searchParams]);

  // フィルター変更時にデータ取得
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, condition, priceRange, sortBy, keyword]);

  // Firestoreからユーザー情報を取得
  const fetchUserProfile = async (sellerId: string) => {
    try {
      const uid = sellerId.startsWith('user-') ? sellerId.replace('user-', '') : sellerId;
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return {
          displayName: userData.displayName || undefined,
          photoURL: userData.photoURL || undefined,
        };
      }
      return null;
    } catch (error) {
      // permission-deniedエラーの場合は静かに処理（ログアウト時など）
      if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
        return null;
      }
      console.error('ユーザー情報取得エラー:', error);
      return null;
    }
  };

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

      // データベースのデータをProduct型に変換 + Firestoreからユーザー情報取得
      const formattedProducts: Product[] = await Promise.all(
        data.products.map(async (product: {
          _id: string;
          title: string;
          price: number;
          condition: string;
          images?: string[];
          sellerId?: string;
          sellerName?: string;
          createdAt: string;
        }) => {
          // Firestoreから最新のユーザー情報を取得
          let sellerDisplayName: string = product.sellerName || '出品者未設定';
          let sellerPhotoURL: string | undefined;
          if (product.sellerId) {
            const userProfile = await fetchUserProfile(product.sellerId);
            sellerDisplayName = userProfile?.displayName || product.sellerName || '出品者未設定';
            sellerPhotoURL = userProfile?.photoURL;
          }

          return {
            id: product._id,
            name: product.title,
            price: product.price,
            location: sellerDisplayName,
            condition: formatCondition(product.condition),
            postedDate: formatDate(product.createdAt),
            imageUrl: product.images?.[0],
            sellerPhotoURL,
          };
        })
      );

      // フィルタリング（価格帯とキーワード）
      let filtered = formattedProducts;
      if (priceRange) {
        filtered = filterByPrice(filtered, priceRange);
      }
      if (keyword) {
        filtered = filterByKeyword(filtered, keyword);
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

  // Pagination calculations
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = products.slice(startIndex, endIndex);

  // Generate page numbers to display
  const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

const getPageNumbers = () => {
  if (totalPages <= 7) return range(1, totalPages);

  const firstPage = 1;
  const lastPage = totalPages;
  const start = Math.max(firstPage + 1, currentPage - 1);
  const end = Math.min(lastPage - 1, currentPage + 1);

  const pages: (number | string)[] = [
    firstPage,
    ...(start > firstPage + 1 ? ['...'] : []),
    ...range(start, end),
    ...(end < lastPage - 1 ? ['...'] : []),
    lastPage
  ];

  return pages;
};


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
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
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
                    value={category}
                    onChange={setCategory}
                    options={CATEGORY_OPTIONS}
                    placeholder="すべて"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">価格帯</label>
                  <CustomSelect
                    value={priceRange}
                    onChange={setPriceRange}
                    options={PRICE_RANGE_OPTIONS}
                    placeholder="指定なし"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状態</label>
                  <CustomSelect
                    value={condition}
                    onChange={setCondition}
                    options={CONDITION_OPTIONS}
                    placeholder="すべて"
                  />
                </div>
              </div>
            </div>

            {/* 並び替え */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">検索結果: {products.length}件</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">並び替え:</span>
                <CustomSelect
                  value={sortBy}
                  onChange={setSortBy}
                  options={SORT_OPTIONS}
                  className="min-w-[200px]"
                />
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
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {products.length > PRODUCTS_PER_PAGE && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      variant="ghost"
                      size="md"
                      className={currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}
                      icon={<ChevronLeft size={16} />}
                    >
                      前へ
                    </Button>

                    <div className="flex gap-2">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 flex items-center">...</span>
                        ) : (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            variant={currentPage === page ? "primary" : "ghost"}
                            size="sm"
                            className={currentPage === page ? "w-8 h-8 p-0" : "w-8 h-8 p-0 bg-gray-100 hover:bg-gray-200"}
                          >
                            {page}
                          </Button>
                        )
                      ))}
                    </div>

                    <Button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      variant={currentPage === totalPages ? "ghost" : "primary"}
                      size="md"
                      className={currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
                      icon={<ChevronRight size={16} />}
                    >
                      次へ
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}