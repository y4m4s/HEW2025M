'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar, Bookmark, Fish } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { decodeHtmlEntities } from '@/lib/sanitize';

import { Button, ProductCard, UserInfoCard } from '@/components';
import { useCartStore } from '@/stores/useCartStore';

// 動的import - モーダルとコメントは必要時のみロード
const Comment = dynamic(() => import('@/components').then(mod => mod.Comment), {
  loading: () => <div className="h-40 animate-pulse bg-gray-100 rounded-lg" />
});

const ImageModal = dynamic(() => import('@/components').then(mod => mod.ImageModal), {
  ssr: false
});

const CancelModal = dynamic(() => import('@/components').then(mod => mod.CancelModal), {
  ssr: false
});

const LoginRequiredModal = dynamic(() => import('@/components').then(mod => mod.LoginRequiredModal), {
  ssr: false
});

const SmartRakuten = dynamic(() => import('@/components').then(mod => mod.SmartRakuten), {
  ssr: false,
  loading: () => <div className="h-20 animate-pulse bg-gray-100 rounded-lg mt-6" />
});

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
  const addItemToCart = useCartStore((state) => state.addItem);
  const removeItemFromCart = useCartStore((state) => state.removeItem);
  const cartItems = useCartStore((state) => state.items);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  // 出品者のプロフィール情報
  const [sellerProfile, setSellerProfile] = useState<{
    uid: string;
    displayName: string;
    username: string;
    photoURL: string;
    bio: string;
  } | null>(null);
  const [sellerProfileLoading, setSellerProfileLoading] = useState(false);

  // 画像モーダル
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // ログイン必須モーダル
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // URLハッシュからコメントへスクロール
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      const targetId = hash.substring(1); // #を除去

      // ページの読み込みを待ってからスクロール
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // ハイライト効果を追加
          element.classList.add('bg-yellow-100');
          setTimeout(() => {
            element.classList.remove('bg-yellow-100');
          }, 2000);
        }
      }, 500);
    }
  }, [product]); // productが読み込まれた後に実行

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

  // カートに入っているかチェック
  useEffect(() => {
    if (params.id) {
      const inCart = cartItems.some(item => item.id === params.id);
      setIsInCart(inCart);
    }
  }, [params.id, cartItems]);

  const checkBookmarkStatus = async () => {
    if (!user || !params.id) return;
    try {
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', params.id as string);
      const bookmarkSnap = await getDoc(bookmarkRef);
      setIsBookmarked(bookmarkSnap.exists());
    } catch (error) {
      console.error('ブックマーク状態の確認エラー:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/products/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          // 404は正常な運用で起こり得るため、エラーログを出さない
          setError('この商品は削除されています。');
          return;
        }
        throw new Error('商品の取得に失敗しました');
      }
      const data = await response.json();
      setProduct(data.product);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 出品者のプロフィール情報を取得
  const fetchSellerProfile = async (sellerId: string) => {
    try {
      setSellerProfileLoading(true);

      // sellerIdから "user-" プレフィックスを削除して実際のuidを取得
      const actualUid = sellerId.startsWith('user-') ? sellerId.replace('user-', '') : sellerId;

      const docRef = doc(db, 'users', actualUid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSellerProfile({
          uid: actualUid,
          displayName: data.displayName || data.email?.split('@')[0] || product?.sellerName || '名無しユーザー',
          username: data.username || 'user',
          photoURL: data.photoURL || '',
          bio: data.bio || '',
        });
      } else {
        // プロフィールが見つからない場合は商品データのsellerNameを使用
        setSellerProfile({
          uid: actualUid,
          displayName: product?.sellerName || '名無しユーザー',
          username: 'user',
          photoURL: '',
          bio: '',
        });
      }
    } catch (err) {
      // permission-deniedエラーの場合は静かに処理（ログアウト時など）
      if (err && typeof err === 'object' && 'code' in err && err.code === 'permission-denied') {
        // エラーを静かに処理
      } else {
        console.error('出品者プロフィール取得エラー:', err);
      }
      // エラーの場合もデフォルト値を設定
      setSellerProfile({
        uid: sellerId.startsWith('user-') ? sellerId.replace('user-', '') : sellerId,
        displayName: product?.sellerName || '名無しユーザー',
        username: 'user',
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
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getConditionLabel = (condition: string): string => {
    const map: Record<string, string> = {
      'new': '新品・未使用',
      'like-new': '未使用に近い',
      'good': '目立った傷汚れなし',
      'fair': 'やや傷や汚れあり',
      'poor': '傷や汚れあり'
    };
    return map[condition] || condition;
  };

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      'available': '販売中', 'sold': 'SOLD', 'reserved': 'SOLD'
    };
    return map[status] || status;
  };

  const getCategoryLabel = (category: string): string => {
    const map: Record<string, string> = {
      'rod': 'ロッド/竿', 'reel': 'リール', 'lure': 'ルアー', 'line': 'ライン/糸',
      'hook': 'ハリ/針', 'bait': '餌', 'wear': 'ウェア', 'set': 'セット用品',
      'service': 'サービス', 'other': 'その他'
    };
    return map[category] || category;
  };

  const nextSlide = () => {
    if (product && product.images.length > 0) setCurrentSlide((prev) => (prev + 1) % product.images.length);
  };

  const prevSlide = () => {
    if (product && product.images.length > 0) setCurrentSlide((prev) => (prev - 1 + product.images.length) % product.images.length);
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
      setLoginRequiredAction('ブックマーク');
      setShowLoginModal(true);
      return;
    }
    if (!product) return;

    setBookmarkLoading(true);
    try {
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', product._id);
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
        toast.success('ブックマークを解除しました');
      } else {
        await setDoc(bookmarkRef, {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.images[0] || '',
          createdAt: new Date().toISOString(),
        });
        setIsBookmarked(true);
        toast.success('ブックマークに追加しました');
      }
    } catch (error) {
      console.error(error);
      toast.error('操作に失敗しました');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // 「カートに追加/削除」ボタンの処理
  const handleCartToggle = () => {
    if (!product) return;

    if (isInCart) {
      // カートから削除
      removeItemFromCart(product._id);
      toast.success('商品をカートから削除しました。');
    } else {
      // カートに追加 - ログインチェック
      if (!user) {
        setLoginRequiredAction('カートに追加');
        setShowLoginModal(true);
        return;
      }

      if (product.status !== 'available') {
        toast.error('この商品は現在購入できません。');
        return;
      }

      addItemToCart({
        id: product._id,
        title: product.title,
        price: product.price,
        image: product.images[0] || '',
      });

      toast.success('商品をカートに追加しました。');
    }
  };

  // 出品取り消しボタンの処理（モーダル表示）
  const handleDeleteProduct = () => {
    if (!product || !user) return;

    // 自分の商品かどうか確認
    const actualUserId = `user-${user.uid}`;
    if (product.sellerId !== actualUserId && product.sellerId !== user.uid) {
      toast.error('自分の商品のみ削除できます');
      return;
    }

    setShowDeleteModal(true);
  };

  // 実際の削除処理
  const confirmDeleteProduct = async () => {
    if (!product || !user) return;

    try {
      setDeleting(true);

      // Firebaseトークンを取得
      const token = await user.getIdToken();

      const response = await fetch(`/api/products/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('商品の削除に失敗しました');
      }

      toast.success('商品を削除しました');
      setShowDeleteModal(false);
      router.push('/product-list');
    } catch (err) {
      console.error('商品削除エラー:', err);
      toast.error(err instanceof Error ? err.message : '商品の削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div></div>;
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <Fish size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">商品が見つかりません</h2>
          <p className="text-gray-600 mb-6">{error || '商品が見つかりませんでした'}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.back()} variant="ghost" size="md" className="flex-1">
              戻る
            </Button>
            <Button onClick={() => router.push('/')} variant="primary" size="md" className="flex-1">
              トップページへ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasImages = product.images && product.images.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-4 md:py-6">

        {/* 戻るボタン */}
        <Button onClick={() => router.back()} variant="ghost" size="sm" icon={<ArrowLeft size={16} />} className="mb-4 md:mb-6">
          戻る
        </Button>

        {/* メイングリッド (商品情報) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 bg-white rounded-lg shadow-md p-4 md:p-6">

          {/* 左側: 商品画像 */}
          <section className="space-y-4 md:space-y-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">{product.title}</h1>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-gray-600 p-2">
                <div className="flex items-center gap-1">
                  <Calendar size={14} /><span>{formatDate(product.createdAt)}</span>
                </div>
                {/* SOLDの場合のみ表示 */}
                {(product.status === 'sold' || product.status === 'reserved') && (
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white shadow-lg self-start">
                    {getStatusLabel(product.status)}
                  </span>
                )}
              </div>
              <div className="mt-2">
              </div>
              <div className="border-b flex justify-between flex-wrap gap-2">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2FA3E3] mb-2">{formatPrice(product.price)}</h2>
                <p className="my-auto pr-3 text-sm text-gray-600">{product.shippingPayer === 'seller' ? '送料込み' : '送料別'}</p>
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
                        <div key={index} className="w-full flex-shrink-0 relative" style={{ aspectRatio: '4/3' }}>
                          <Image
                            src={decodeHtmlEntities(src)}
                            alt={`商品画像${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                            className="object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(index)}
                          />
                        </div>
                      ))}
                    </div>

                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={prevSlide}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-1.5 md:p-2 shadow-lg transition-all"
                        >
                          <ChevronLeft size={18} className="md:w-5 md:h-5" />
                        </button>
                        <button
                          onClick={nextSlide}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-1.5 md:p-2 shadow-lg transition-all"
                        >
                          <ChevronRight size={18} className="md:w-5 md:h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {product.images.length > 1 && (
                    <div className="flex justify-center mt-4 gap-2">
                      {product.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-colors ${currentSlide === index ? 'bg-[#2FA3E3]' : 'bg-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="relative overflow-hidden rounded-lg bg-gray-200">
                  <div className="w-full h-60 sm:h-72 md:h-80 flex items-center justify-center">
                    <Fish size={80} className="text-gray-400 md:w-[120px] md:h-[120px]" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 右側: 商品詳細 */}
          <section className="space-y-4 md:space-y-6">
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">商品詳細</h3>
              <div className="min-h-[120px] max-h-60 overflow-y-auto rounded-lg border border-gray-200 p-3 md:p-4 bg-gray-50/50">
                <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-center py-2 border-b text-sm md:text-base">
                <span className="text-gray-600">カテゴリ</span>
                <span className="font-medium">{getCategoryLabel(product.category)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b text-sm md:text-base">
                <span className="text-gray-600">商品の状態</span>
                <span className="font-medium">{getConditionLabel(product.condition)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b text-sm md:text-base">
                <span className="text-gray-600">配送料の負担</span>
                <span className="font-medium">
                  {product.shippingPayer === 'seller' ? '出品者負担' : '購入者負担'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b text-sm md:text-base">
                <span className="text-gray-600">発送までの日数</span>
                <span className="font-medium">
                  {product.shippingDays === '1-2' ? '1-2日' :
                    product.shippingDays === '2-3' ? '2-3日' : '4-7日'}で発送
                </span>
              </div>
            </div>

            {/* 自分の商品の場合は削除ボタン、他人の商品の場合はブックマーク・カートボタン */}
            {/* SOLD状態の場合はボタンを表示しない */}
            {product.status === 'available' && (
              <>
                {user && (product.sellerId === user.uid || product.sellerId === `user-${user.uid}`) ? (
                  <div className="pt-4">
                    <Button
                      variant="ghost"
                      size="md"
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={handleDeleteProduct}
                      disabled={deleting}
                    >
                      {deleting ? '削除中...' : '出品を取り消す'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                    <Button
                      variant="ghost"
                      size="md"
                      className={`flex-1 transition-all ${isBookmarked
                        ? 'bg-[#2FA3E3] text-white hover:bg-[#1d7bb8] animate-heartbeat'
                        : 'bg-white text-[#2FA3E3] hover:bg-blue-50'
                        }`}
                      onClick={handleBookmark}
                      disabled={bookmarkLoading}
                      icon={<Bookmark size={18} fill={isBookmarked ? 'white' : 'none'} className="transition-all" />}
                    >
                      {bookmarkLoading ? '処理中...' : isBookmarked ? 'ブックマーク済み' : 'ブックマーク'}
                    </Button>
                    <Button
                      onClick={handleCartToggle}
                      variant={isInCart ? "ghost" : "primary"}
                      size="md"
                      className={`flex-1 transition-all ${isInCart ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'animate-scale-in'}`}
                      disabled={!isInCart && product.status !== 'available'}
                    >
                      {isInCart ? 'カートから削除する' : product.status === 'available' ? 'カートに追加' : '購入できません'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* 出品者情報 */}
        <UserInfoCard
          title="出品者情報"
          userProfile={sellerProfile}
          loading={sellerProfileLoading}
          fallbackName={product.sellerName}
          showRating={true}
          showActions={true}
          isOwnProfile={!!(user && (product.sellerId === user.uid || product.sellerId === `user-${user.uid}`))}
        />

        {/* コメントセクション */}
        <section className="mt-6 md:mt-8 bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold mb-4">コメント</h3>
          <Comment
            productId={params.id as string}
            itemOwnerId={product.sellerId.startsWith('user-') ? product.sellerId.replace('user-', '') : product.sellerId}
            itemTitle={product.title}
          />
        </section>

        {/* ✅ AI検索用コンポーネント (カテゴリも渡す) */}
        {product && (
          <SmartRakuten
            productName={product.title}
            description={product.description}
            category={getCategoryLabel(product.category)}
          />
        )}

      </main>

      {/* 画像モーダル */}
      {hasImages && (
        <ImageModal
          images={product.images.map(decodeHtmlEntities)}
          initialIndex={modalImageIndex}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* 削除確認モーダル */}
      <CancelModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteProduct}
        title="出品の取り消し"
        message="この出品情報を本当に削除しますか？この操作は取り消せません。"
        isDeleting={deleting}
      >
        {/* ProductCardを表示 */}
        <div className="max-w-xs">
          <ProductCard
            product={{
              id: product._id,
              name: product.title,
              price: product.price,
              location: sellerProfile?.displayName || product.sellerName,
              condition: getConditionLabel(product.condition),
              postedDate: formatDate(product.createdAt),
              imageUrl: product.images[0] || undefined,
              status: product.status,
              sellerPhotoURL: sellerProfile?.photoURL,
            }}
          />
        </div>
      </CancelModal>

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}
