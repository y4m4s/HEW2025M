'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar, User, Bookmark, Fish } from 'lucide-react';
import Button from '@/components/Button';
import Comment from '@/components/Comment';
import ImageModal from '@/components/ImageModal';
import RakutenProducts from '@/components/rakuten';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

interface ProductDetail {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'good' | 'fair' | 'poor';
  images: string[];
  sellerId: string;
  sellerName: string;
  status: 'available' | 'sold' | 'reserved';
  shippingPayer: 'seller' | 'buyer';
  shippingDays: '1-2' | '2-3' | '4-7';
  createdAt: string;
  updatedAt: string;
}

export default function SellDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // 出品者のプロフィール情報
  const [sellerProfile, setSellerProfile] = useState<{
    displayName: string;
    photoURL: string;
    bio: string;
  } | null>(null);
  const [sellerProfileLoading, setSellerProfileLoading] = useState(false);

  // 画像モーダル
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // 商品データが取得できたら出品者のプロフィールを取得
  useEffect(() => {
    if (product && product.sellerId) {
      fetchSellerProfile(product.sellerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // ブックマーク状態をチェック
  useEffect(() => {
    if (user && params.id) {
      checkBookmarkStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id]);

  const checkBookmarkStatus = async () => {
    if (!user || !params.id) return;

    try {
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', params.id as string);
      const bookmarkSnap = await getDoc(bookmarkRef);
      setIsBookmarked(bookmarkSnap.exists());
    } catch (error) {
      console.error('ブックマーク状態の取得エラー:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/products/${params.id}`);
      if (!response.ok) {
        throw new Error('商品の取得に失敗しました');
      }
      const data = await response.json();
      setProduct(data.product);
    } catch (err) {
      console.error('商品取得エラー:', err);
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 出品者のプロフィール情報を取得
  const fetchSellerProfile = async (sellerId: string) => {
    try {
      setSellerProfileLoading(true);
      const docRef = doc(db, 'users', sellerId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSellerProfile({
          displayName: data.displayName || '名無しユーザー',
          photoURL: data.photoURL || '',
          bio: data.bio || '',
        });
      } else {
        // プロフィールが見つからない場合はデフォルト値
        setSellerProfile({
          displayName: '名無しユーザー',
          photoURL: '',
          bio: '',
        });
      }
    } catch (err) {
      console.error('出品者プロフィール取得エラー:', err);
      // エラーの場合もデフォルト値を設定
      setSellerProfile({
        displayName: '名無しユーザー',
        photoURL: '',
        bio: '',
      });
    } finally {
      setSellerProfileLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getConditionLabel = (condition: string): string => {
    const conditionMap: Record<string, string> = {
      'new': '新品・未使用',
      'good': '目立った傷汚れなし',
      'fair': 'やや傷や汚れあり',
      'poor': '傷や汚れあり'
    };
    return conditionMap[condition] || condition;
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'available': '販売中',
      'sold': '売却済み',
      'reserved': '予約済み'
    };
    return statusMap[status] || status;
  };

  const getCategoryLabel = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'rod': 'ロッド/竿',
      'reel': 'リール',
      'lure': 'ルアー',
      'line': 'ライン/糸',
      'hook': 'ハリ/針',
      'bait': '餌',
      'wear': 'ウェア',
      'set': 'セット用品',
      'service': 'サービス',
      'other': 'その他'
    };
    return categoryMap[category] || category;
  };

  const nextSlide = () => {
    if (product && product.images.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevSlide = () => {
    if (product && product.images.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // 画像クリック時の処理
  const handleImageClick = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  };

  // モーダルを閉じるときの処理
  const handleCloseModal = (finalIndex?: number) => {
    setIsModalOpen(false);
    // モーダルで表示していた画像インデックスをメインカルーセルに同期
    if (finalIndex !== undefined) {
      setCurrentSlide(finalIndex);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      alert('ブックマークするにはログインが必要です');
      router.push('/login');
      return;
    }

    if (!product) return;

    setBookmarkLoading(true);
    try {
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', product._id);

      if (isBookmarked) {
        // ブックマーク解除
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
      } else {
        // ブックマーク追加
        await setDoc(bookmarkRef, {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.images[0] || '',
          createdAt: new Date().toISOString(),
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('ブックマークエラー:', error);
      alert('ブックマークの操作に失敗しました');
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <p className="text-red-600 mb-4">{error || '商品が見つかりませんでした'}</p>
        <Button onClick={() => router.back()} variant="primary" size="md">
          戻る
        </Button>
      </div>
    );
  }


  const hasImages = product.images && product.images.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* ... (商品ボタンここから戻る) ... */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          className="mb-6"
        >
          戻る
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 bg-white rounded-lg shadow-md p-6">
          {/* 商品情報 */}
          {/* 左側 */}
          <section className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
                <div className="flex gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{formatDate(product.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{product.sellerName}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    product.status === 'available' ? 'bg-green-100 text-green-800' :
                    product.status === 'sold' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatusLabel(product.status)}
                  </span>
                </div>
              </div>

              <div className="relative">
                {hasImages ? (
                  <>
                    <div className="relative overflow-hidden rounded-lg bg-gray-100">
                      <div
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {product.images.map((src, index) => (
                          <div key={index} className="w-full flex-shrink-0">
                            <Image
                              src={src}
                              alt={`商品画像${index + 1}`}
                              width={800}
                              height={600}
                              className="w-full h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleImageClick(index)}
                            />
                          </div>
                        ))}
                      </div>

                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={prevSlide}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-2 shadow-lg transition-all"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={nextSlide}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-2 shadow-lg transition-all"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>

                    {product.images.length > 1 && (
                      <div className="flex justify-center mt-4 gap-2">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              currentSlide === index ? 'bg-[#2FA3E3]' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative overflow-hidden rounded-lg bg-gray-200">
                    <div className="w-full h-80 flex items-center justify-center">
                      <Fish size={120} className="text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 右側 */}
            <section className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-3xl font-bold text-[#2FA3E3] mb-2">
                  {formatPrice(product.price)}
                </h2>
                <p className="text-sm text-gray-600">
                  {product.shippingPayer === 'seller' ? '送料込み' : '送料別'}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">商品詳細</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">カテゴリ</span>
                  <span className="font-medium">{getCategoryLabel(product.category)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">商品の状態</span>
                  <span className="font-medium">{getConditionLabel(product.condition)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">配送料の負担</span>
                  <span className="font-medium">
                    {product.shippingPayer === 'seller' ? '出品者負担' : '購入者負担'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">発送までの日数</span>
                  <span className="font-medium">
                    {product.shippingDays === '1-2' ? '1-2日' :
                      product.shippingDays === '2-3' ? '2-3日' : '4-7日'}で発送
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
              <Button
                variant="ghost"
                size="md"
                className={`flex-1 ${
                  isBookmarked
                    ? 'bg-[#2FA3E3] text-white hover:bg-[#1d7bb8]'
                    : 'bg-white text-[#2FA3E3] hover:bg-blue-50'
                }`}
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                icon={<Bookmark size={18} fill={isBookmarked ? 'white' : 'none'} />}
              >
                {bookmarkLoading ? '処理中...' : isBookmarked ? 'ブックマーク済み' : 'ブックマーク'}
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={product.status !== 'available'}
              >
                {product.status === 'available' ? '購入する' : '購入できません'}
              </Button>
            </div>
          </section>
        </div>
        

        {/* 出品者情報 */}
        <section className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">出品者情報</h3>
          {sellerProfileLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              </div>
            </div>
          ) : sellerProfile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {sellerProfile.photoURL ? (
                  <Image
                    src={sellerProfile.photoURL}
                    alt={sellerProfile.displayName}
                    width={64}
                    height={64}
                    quality={90}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={32} className="text-gray-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg">{sellerProfile.displayName}</p>
                  <p className="text-sm text-gray-600">出品者</p>
                </div>
              </div>
              {sellerProfile.bio && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{sellerProfile.bio}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={32} className="text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">{product.sellerName}</p>
                <p className="text-sm text-gray-600">出品者</p>
              </div>
            </div>
          )}
        </section>

        {/* コメントセクション */}
        <section className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">コメント</h3>
          <Comment productId={params.id as string} />
        </section>

        {/* 楽天関連商品セクション */}
        <RakutenProducts keyword={product ? getCategoryLabel(product.category) : ''} />

      </main>

      {/* 画像モーダル */}
      {hasImages && (
        <ImageModal
          images={product.images}
          initialIndex={modalImageIndex}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}