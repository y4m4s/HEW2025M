'use client'; // Next.jsのクライアントコンポーネントとしてマーク

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, MapPin, Calendar, User } from 'lucide-react';
import Button from '@/components/Button';

// 楽天APIから取得する商品の型定義
interface RakutenItem {
  itemCode: string;
  itemName: string;
  itemUrl: string;
  itemPrice: number;
  shopName: string;
  mediumImageUrls?: string[]; // 修正済み: formatVersion=2は文字列の配列を返す
}

// データベースから取得する商品詳細の型定義
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

// 商品詳細ページのメインコンポーネント
export default function SellDetailPage() {
  // --- フックとStateの定義 ---
  const params = useParams(); // URLからパラメータ（例: /sell/123 の "123"）を取得
  const router = useRouter(); // ページ遷移（戻るボタンなど）のためのルーター

  // 商品詳細データを保持するState
  const [product, setProduct] = useState<ProductDetail | null>(null);
  // メインのローディング状態を管理するState
  const [loading, setLoading] = useState(true);
  // エラーメッセージを保持するState
  const [error, setError] = useState<string | null>(null);
  // 画像カルーセルの現在スライドを管理
  const [currentSlide, setCurrentSlide] = useState(0);
  // 「コメント」か「出品者情報」のアクティブタブを管理
  const [activeTab, setActiveTab] = useState('comments');
  
  // 楽天APIから取得した関連商品を保持
  const [rakutenProducts, setRakutenProducts] = useState<RakutenItem[]>([]);
  // 楽天APIのローディング状態を管理
  const [rakutenLoading, setRakutenLoading] = useState(true);

  // --- データ取得のEffect ---

  // 1. URLのidが変わった時（=ページが読み込まれた時）に実行
  useEffect(() => {
    if (params.id) {
      fetchProduct(); // 商品詳細を取得する関数を呼び出す
    }
  }, [params.id]); // params.idに依存

  // 2. productデータが正常に取得できた後に実行
  useEffect(() => {
    if (product) {
      // 商品カテゴリ名を日本語のキーワードとして取得
      const keyword = getCategoryLabel(product.category);
      // そのキーワードで楽天APIを検索
      fetchRakutenProducts(keyword);
    }
  }, [product]); // productデータに依存

  // --- データ取得関数 ---

  // APIルート（/api/products/[id]）から商品詳細を取得する非同期関数
  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/products/${params.id}`);
      if (!response.ok) {
        throw new Error('商品の取得に失敗しました');
      }
      const data = await response.json();
      setProduct(data.product); // 取得したデータをStateにセット
    } catch (err) {
      console.error('商品取得エラー:', err);
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
    } finally {
      setLoading(false); // ローディング完了
    }
  };

  // 楽天APIにキーワード検索をかける非同期関数
  const fetchRakutenProducts = async (keyword: string) => {
    if (!keyword) {
      setRakutenLoading(false);
      return; // キーワードがなければ何もしない
    }
    setRakutenLoading(true);
    try {
      // APIを叩く。formatVersion=2を指定
      const response = await fetch(
        `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170T06?applicationId=${process.env.NEXT_PUBLIC_RAKUTEN_APP_ID}&keyword=${encodeURIComponent(keyword)}&hits=6&formatVersion=2`
      );
      if (!response.ok) {
        throw new Error('Rakuten API fetch failed');
      }
      const data = await response.json();
      setRakutenProducts(data.Items || []); // 取得した商品をStateにセット
    } catch (err) {
      console.error('Rakuten API error:', err);
      setRakutenProducts([]); // エラー時は空配列をセット
    } finally {
      setRakutenLoading(false); // 楽天APIのローディング完了
    }
  };
  
  // --- ヘルパー関数（フォーマット・変換） ---

  // 数値を「¥1,000」形式の文字列にフォーマットする関数
  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  // 日付文字列を「2025年11月15日」形式にフォーマットする関数
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 'new' を '新品・未使用' に変換する関数
  const getConditionLabel = (condition: string): string => {
    const conditionMap: Record<string, string> = {
      'new': '新品・未使用',
      'good': '目立った傷汚れなし',
      'fair': 'やや傷や汚れあり',
      'poor': '傷や汚れあり'
    };
    return conditionMap[condition] || condition;
  };

  // 'available' を '販売中' に変換する関数
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'available': '販売中',
      'sold': '売却済み',
      'reserved': '予約済み'
    };
    return statusMap[status] || status;
  };

  // 'rod' を 'ロッド/竿' に変換する関数（楽天検索のキーワードにも使用）
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

  // --- カルーセルの操作関数 ---

  // 画像カルーセルを「次へ」進める関数
  const nextSlide = () => {
    if (product && product.images.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % product.images.length);
    }
  };

  // 画像カルーセルを「前へ」戻す関数
  const prevSlide = () => {
    if (product && product.images.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  // 特定のインデックスの画像スライドに移動する関数（下の・ボタン用）
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // --- レンタリング ---

  // メインのローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div>
      </div>
    );
  }

  // エラー発生時または商品が見つからない場合の表示
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

  // 表示する画像配列を決定（商品画像がなければプレースホルダー画像）
  const images = product.images.length > 0
    ? product.images
    : ["https://via.placeholder.com/400x300/e9ecef/6c757d?text=画像なし"];

  // 正常時のJSX（画面描画）
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-6">
        
        {/* 「戻る」ボタン */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          className="mb-6"
        >
          戻る
        </Button>

        {/* メインの2カラムレイアウト（左：画像、右：詳細） */}
        <div className="grid lg:grid-cols-2 gap-8 bg-white rounded-lg shadow-md p-6">
          
            {/* 左カラム：商品タイトル、画像カルーセルなど */}
            <section className="space-y-6">
              {/* 商品タイトル・日付・出品者 */}
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

              {/* 画像カルーセル */}
              <div className="relative">
                <div className="relative overflow-hidden rounded-lg bg-gray-100">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {/* 画像カルーセルの各画像をマッピング */}
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

                  {/* 画像が複数ある場合のみ矢印ボタンを表示 */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>

                {/* 画像が複数ある場合のみインジケーター（・ボタン）を表示 */}
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

            {/* 右カラム：価格、商品説明、詳細情報 */}
            <section className="space-y-6">
              {/* 価格 */}
              <div className="border-b pb-4">
                <h2 className="text-3xl font-bold text-[#2FA3E3] mb-2">
                  {formatPrice(product.price)}
                </h2>
                <p className="text-sm text-gray-600">
                  {product.shippingPayer === 'seller' ? '送料込み' : '送料別'}
                </p>
              </div>

              {/* 商品説明 */}
              <div>
                <h3 className="text-xl font-semibold mb-3">商品詳細</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* 詳細情報テーブル */}
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

              {/* アクションボタン */}
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
        

        {/* タブセクション（コメント、出品者情報） */}
        <section className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="border-b border-gray-200">
            {/* タブ切り替えボタン */}
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

          {/* タブの中身 */}
          <div className="mt-6">
            {/* activeTabの値によって表示を切り替え */}
            {activeTab === 'comments' ? (
              // コメントタブ
              <div>
                <p className="text-gray-600 mb-4">この商品へのコメントはまだありません</p>
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <textarea
                    placeholder="コメントを入力..."
                    className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:border-[#2FA3E3]"
                    rows={4}
                  />
                </div>
                <Button variant="primary" size="md" className="mb-4">
                  コメントする
                </Button>

              </div>
            ) : (
              // 出品者情報タブ
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

        {/* 楽天API関連商品ランキングセクション */}
        <section className="mt-16 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-700 tracking-wide">
            Rakuten 関連商品ランキング 🛍️
          </h2>
          <div className="space-y-6">
            {/* 楽天APIローディング中はスケルトン表示 */}
            {rakutenLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-20 h-20 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : rakutenProducts.length > 0 ? (
              // 取得した楽天商品をリスト表示
              rakutenProducts.map((p, idx) => {
                
                // 楽天API(formatVersion=2)から画像URLを正しく取得
                // p.mediumImageUrls[0] が画像のURL文字列そのもの
                const imageUrl = (p.mediumImageUrls && p.mediumImageUrls.length > 0 && p.mediumImageUrls[0])
                  ? p.mediumImageUrls[0].split('?')[0] // パラメータを除外
                  : 'https://placehold.co/80x80/e9ecef/6c757d?text=画像なし'; // フォールバック画像

                return (
                  <div
                    key={p.itemCode}
                    className="flex items-start gap-4 border-b pb-4 last:border-none"
                  >
                    {/* ランキング番号 */}
                    <div className="text-2xl font-bold text-blue-600 w-8 text-center">
                      {idx + 1}.
                    </div>
                    {/* 商品画像 */}
                    <img
                      src={imageUrl}
                      alt={p.itemName}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    {/* 商品詳細 */}
                    <div className="flex-1">
                      <a
                        href={p.itemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:underline text-sm"
                      >
                        {p.itemName}
                      </a>
                      <div className="text-sm text-gray-500 mt-1">
                        ショップ: {p.shopName}
                      </div>
                      <div className="text-lg font-bold text-gray-800 mt-1">
                        ¥{p.itemPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // 関連商品がなかった場合の表示
              <p className="text-center text-gray-500">関連する商品が見つかりませんでした。</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}