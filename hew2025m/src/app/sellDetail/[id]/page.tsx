'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar, User, Bookmark } from 'lucide-react';
import Button from '@/components/Button';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast'; // toastをインポート
import { useCartStore } from '@/components/useCartStore';

// インターフェース定義
interface RakutenItem {
  itemCode: string;
  itemName: string;
  itemUrl: string;
  itemPrice: number;
  shopName: string;
  mediumImageUrls?: string[];
}

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
  
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('comments');
  
  // 楽天APIとブックマークの状態管理
  const [rakutenProducts, setRakutenProducts] = useState<RakutenItem[]>([]);
  const [rakutenLoading, setRakutenLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // 商品ID取得時の処理
  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  // 楽天API検索 (「釣り」キーワードを強制付与)
  useEffect(() => {
    if (product) {
      const categoryTerm = getCategoryLabel(product.category);
      // ここ重要: カテゴリ名の前に「釣り」を追加して、釣り具のみを検索するようにする
      const keyword = `釣り ${categoryTerm}`; 
      fetchRakutenProducts(keyword);
    }
  }, [product]);

  // ログインユーザーのブックマーク状態確認
  useEffect(() => {
    if (user && params.id) {
      checkBookmarkStatus();
    }
  }, [user, params.id]);

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
      if (!response.ok) throw new Error('商品の取得に失敗しました');
      const data = await response.json();
      setProduct(data.product);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchRakutenProducts = async (keyword: string) => {
    if (!keyword) {
      setRakutenLoading(false);
      return;
    }
    setRakutenLoading(true);
    try {
      const response = await fetch(
        `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?applicationId=${process.env.NEXT_PUBLIC_RAKUTEN_APP_ID}&keyword=${encodeURIComponent(keyword)}&hits=8&formatVersion=2`
      );
      if (!response.ok) throw new Error('Rakuten APIエラー');
      const data = await response.json();
      setRakutenProducts(data.Items || []);
    } catch (err) {
      console.error(err);
      setRakutenProducts([]);
    } finally {
      setRakutenLoading(false);
    }
  };
  
  // ヘルパー関数
  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getConditionLabel = (condition: string): string => {
    const map: Record<string, string> = {
      'new': '新品・未使用', 'good': '目立った傷汚れなし', 'fair': 'やや傷や汚れあり', 'poor': '傷や汚れあり'
    };
    return map[condition] || condition;
  };

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      'available': '販売中', 'sold': '売却済み', 'reserved': '予約済み'
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
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
      } else {
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
      console.error(error);
      alert('操作に失敗しました');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // 「カートに追加」ボタンの処理
  const handleAddToCart = async () => { // asyncを追加
    if (!product) return;
    if (product.status !== 'available') {
      alert('この商品は現在購入できません。');
      return;
    }
    addItemToCart({
      id: product._id,
      title: product.title,
      price: product.price,
      image: product.images[0] || '',
    });

    // --- 新規: 自分自身に通知を送信 ---
    if (user) {
      try {
        const notificationRef = collection(db, 'users', user.uid, 'notifications');
        await addDoc(notificationRef, {
          iconType: 'system', // システム通知のアイコン
          iconBgColor: 'bg-blue-500',
          title: '商品をカートに追加しました',
          description: product.title,
          timestamp: new Date(),
          tag: 'カート',
          isUnread: true,
        });
      } catch (error) {
        console.error("カート通知の作成エラー:", error);
      }
    }

    toast.success('商品をカートに追加しました！'); // 通知を表示
    router.push('/cart'); // カートページへ移動
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div></div>;
  if (error || !product) return <div className="min-h-screen flex flex-col justify-center items-center"><p className="text-red-600 mb-4">{error || '商品が見つかりませんでした'}</p><Button onClick={() => router.back()} variant="primary" size="md">戻る</Button></div>;

  const images = product.images.length > 0 ? product.images : ["https://via.placeholder.com/400x300?text=No+Image"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-6">
        
        {/* 戻るボタン */}
        <Button onClick={() => router.back()} variant="ghost" size="sm" icon={<ArrowLeft size={16} />} className="mb-6">
          戻る
        </Button>

        {/* メイングリッド (商品情報) */}
        <div className="grid lg:grid-cols-2 gap-8 bg-white rounded-lg shadow-md p-6">
          
          {/* 左側: 商品画像 */}
          <section className="space-y-6">
             <div>
                <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
                <div className="flex gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1"><Calendar size={14} /><span>{formatDate(product.createdAt)}</span></div>
                  <div className="flex items-center gap-1"><User size={14} /><span>{product.sellerName}</span></div>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${product.status === 'available' ? 'bg-green-100 text-green-800' : product.status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {getStatusLabel(product.status)}
                  </span>
                </div>
             </div>

             <div className="relative">
                <div className="relative overflow-hidden rounded-lg bg-gray-100">
                  <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {images.map((src, index) => (
                      <div key={index} className="w-full flex-shrink-0">
                        <img src={src} alt={`product-${index}`} className="w-full h-80 object-cover" />
                      </div>
                    ))}
                  </div>
                  {images.length > 1 && (
                    <>
                      <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white"><ChevronLeft size={20} /></button>
                      <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white"><ChevronRight size={20} /></button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex justify-center mt-4 gap-2">
                    {images.map((_, index) => (
                      <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-[#2FA3E3]' : 'bg-gray-300'}`} />
                    ))}
                  </div>
                )}
             </div>
          </section>

          {/* 右側: 商品詳細 */}
          <section className="space-y-6">
             <div className="border-b pb-4">
                <h2 className="text-3xl font-bold text-[#2FA3E3] mb-2">{formatPrice(product.price)}</h2>
                <p className="text-sm text-gray-600">{product.shippingPayer === 'seller' ? '送料込み' : '送料別'}</p>
             </div>
             <div>
                <h3 className="text-xl font-semibold mb-3">商品詳細</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{product.description}</p>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between py-2 border-b"><span className="text-gray-600">カテゴリ</span><span className="font-medium">{getCategoryLabel(product.category)}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-gray-600">商品の状態</span><span className="font-medium">{getConditionLabel(product.condition)}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-gray-600">配送料の負担</span><span className="font-medium">{product.shippingPayer === 'seller' ? '出品者負担' : '購入者負担'}</span></div>
             </div>
             <div className="flex gap-4 pt-4">
                <Button variant="ghost" size="md" className={`flex-1 border ${isBookmarked ? 'border-[#2FA3E3] bg-[#2FA3E3] text-white' : 'border-gray-300'}`} onClick={handleBookmark} disabled={bookmarkLoading} icon={<Bookmark size={18} fill={isBookmarked ? 'white' : 'none'} />}>
                  {bookmarkLoading ? '処理中...' : isBookmarked ? 'ブックマーク済み' : 'ブックマーク'}
                </Button>
                <Button onClick={handleAddToCart} variant="primary" size="md" className="flex-1" disabled={product.status !== 'available'}>
                  {product.status === 'available' ? 'カートに追加' : '購入できません'}
                </Button>
             </div>
          </section>
        </div>

        {/* コメント・出品者情報のタブ */}
        <section className="mt-8 bg-white rounded-lg shadow-md p-6">
           <div className="border-b border-gray-200 flex gap-8">
              <button onClick={() => setActiveTab('comments')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'comments' ? 'border-[#2FA3E3] text-[#2FA3E3]' : 'border-transparent text-gray-500'}`}>コメント</button>
              <button onClick={() => setActiveTab('reviews')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-[#2FA3E3] text-[#2FA3E3]' : 'border-transparent text-gray-500'}`}>出品者情報</button>
           </div>
           <div className="mt-6">
             {activeTab === 'comments' ? (
               <div>
                 <p className="text-gray-600 mb-4">この商品へのコメントはまだありません</p>
                 <div className="bg-gray-50 p-4 rounded mb-4"><textarea placeholder="コメントを入力..." className="w-full p-2 border border-gray-300 rounded resize-none" rows={4} /></div>
                 <Button variant="primary" size="md">コメントする</Button>
               </div>
             ) : (
               <div className="flex items-center gap-3">
                 <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center"><User size={32} className="text-gray-600" /></div>
                 <div><p className="font-semibold text-lg">{product.sellerName}</p><p className="text-sm text-gray-600">出品者</p></div>
               </div>
             )}
           </div>
        </section>

        {/* 楽天セクション (グリッドデザイン + 釣り具検索) */}
        <section className="mt-16 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6 px-2">
             <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
               <span className="text-[#BF0000]">Rakuten</span> で新品を探す
             </h2>
             <span className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded">Sponsored</span>
          </div>

          {rakutenLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse border border-gray-100">
                  <div className="aspect-square bg-gray-100 rounded mb-3"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : rakutenProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rakutenProducts.map((p, idx) => {
                const imageUrl = (p.mediumImageUrls && p.mediumImageUrls.length > 0)
                  ? p.mediumImageUrls[0].split('?')[0]
                  : 'https://placehold.co/150x150/e9ecef/6c757d?text=No+Image';

                return (
                  <a key={p.itemCode} href={p.itemUrl} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
                    {idx < 3 && (
                      <div className={`absolute top-0 left-0 z-10 px-3 py-1 text-xs font-bold text-white rounded-br-lg shadow-sm ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                        #{idx + 1}
                      </div>
                    )}
                    <div className="aspect-square w-full p-4 bg-white flex items-center justify-center overflow-hidden">
                      <img src={imageUrl} alt={p.itemName} className="max-w-full max-h-full object-contain transform group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4 flex flex-col flex-1 bg-gray-50">
                      <h3 className="text-xs md:text-sm font-medium text-gray-700 line-clamp-2 mb-2 h-10 leading-5 group-hover:text-[#BF0000] transition-colors">{p.itemName}</h3>
                      <div className="mt-auto">
                        <p className="text-lg font-bold text-[#BF0000]">¥{p.itemPrice.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 mt-1 truncate">{p.shopName}</p>
                      </div>
                      <div className="mt-3 w-full py-2 bg-white border border-red-200 text-red-600 text-xs font-bold text-center rounded group-hover:bg-[#BF0000] group-hover:text-white transition-colors">見る</div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center border border-dashed border-gray-300">
               <p className="text-gray-500">関連商品が見つかりませんでした。</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}