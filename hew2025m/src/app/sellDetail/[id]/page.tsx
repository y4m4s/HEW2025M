'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, MapPin, Calendar, User } from 'lucide-react';
import Button from '@/components/Button';

interface ProductDetail {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
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
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('comments');

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

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
      'like-new': '未使用に近い',
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
      'rod': '釣り竿',
      'reel': 'リール',
      'lure': 'ルアー',
      'line': 'ライン'
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

  const images = product.images.length > 0
    ? product.images
    : ["https://via.placeholder.com/400x300/e9ecef/6c757d?text=画像なし"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-6">
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
              <div className="relative overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {images.map((src, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <img
                        src={src}
                        alt={`商品画像${index + 1}`}
                        className="w-full h-80 object-cover"
                      />
                    </div>
                  ))}
                </div>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <button
                      onClick={nextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  {images.map((_, index) => (
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
            </div>
          </section>

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
                className="flex-1 border border-gray-300"
                disabled={product.status !== 'available'}
              >
                ブックマーク
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

        <section className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-[#2FA3E3] text-[#2FA3E3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                コメント
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-[#2FA3E3] text-[#2FA3E3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                出品者情報
              </button>
            </div>
          </div>

          <div className="mt-6">
            {activeTab === 'comments' ? (
              <div>
                <p className="text-gray-600 mb-4">この商品へのコメントはまだありません</p>
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <textarea
                    placeholder="コメントを入力..."
                    className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:border-[#2FA3E3]"
                    rows={4}
                  />
                </div>
                <Button variant="primary" size="md">
                  コメントする
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={32} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{product.sellerName}</p>
                    <p className="text-sm text-gray-600">出品者</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
