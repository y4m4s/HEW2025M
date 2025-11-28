'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/components/useCartStore';
import Button from '@/components/Button';
import CartProductCard, { CartProduct } from '@/components/CartProductCard';
import { Trash2, ShoppingCart } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';


export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);

  // ハイドレーションエラーを防ぐための対策です
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<(CartProduct & { cartItemId: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // カート内の商品の詳細情報をAPIから取得
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!isMounted || items.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const productDetails = await Promise.all(
          items.map(async (item) => {
            try {
              const response = await fetch(`/api/products/${item.id}`);
              if (!response.ok) {
                throw new Error('商品情報の取得に失敗しました');
              }

              const data = await response.json();
              const product = data.product;

              // Firestoreから出品者の最新情報を取得
              let sellerDisplayName = product.sellerName || '出品者未設定';
              let sellerPhotoURL: string | undefined;

              if (product.sellerId) {
                try {
                  const uid = product.sellerId.startsWith('user-')
                    ? product.sellerId.replace('user-', '')
                    : product.sellerId;
                  const userDocRef = doc(db, 'users', uid);
                  const userDocSnap = await getDoc(userDocRef);

                  if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    sellerDisplayName = userData.displayName || product.sellerName || '出品者未設定';
                    sellerPhotoURL = userData.photoURL || undefined;
                  }
                } catch (error) {
                  console.error('ユーザー情報取得エラー:', error);
                }
              }

              return {
                cartItemId: item.id,
                id: product._id,
                name: product.title,
                price: product.price,
                sellerName: sellerDisplayName,
                imageUrl: product.images?.[0],
                sellerPhotoURL,
                category: product.category,
                condition: product.condition,
                shippingDays: product.shippingDays,
                description: product.description,
              };
            } catch (error) {
              console.error(`商品ID ${item.id} の取得エラー:`, error);
              // エラー時はカートの基本情報を使用
              return {
                cartItemId: item.id,
                id: item.id,
                name: item.title,
                price: item.price,
                sellerName: '出品者未設定',
                imageUrl: item.image,
              };
            }
          })
        );

        setProducts(productDetails);
      } catch (error) {
        console.error('商品詳細取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, items]);

  // サーバーサイドレンダリングとクライアントの表示の差異によるエラーを防ぎます
  if (!isMounted) {
    return <div className="min-h-screen flex justify-center items-center bg-gray-100">読み込み中...</div>;
  }

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 500 : 0; // カートが空の場合は送料0
  const total = subtotal + shippingFee;

  // 決済ページへ進むための関数
  const proceedToPayment = () => {
    router.push('/Pay');
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <ShoppingCart size={32} />
          ショッピングカート
        </h1>

        {items.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-lg shadow-md">
            <p className="text-gray-600 text-lg">カートは空です。</p>
            <Button onClick={() => router.push('/')} variant="primary" size="lg" className="mt-6">
              お買い物を続ける
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* カート商品リスト */}
            <div className="lg:col-span-2 space-y-4">
              {/* 配列を逆順にして、新しいものが上に来るようにする */}
              {[...products].reverse().map((product) => (
                <div key={product.cartItemId} className="relative">
                  <CartProductCard product={product} />
                  {/* 削除ボタンオーバーレイ */}
                  <button
                    onClick={() => removeItem(product.cartItemId)}
                    className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 rounded-full transition-colors shadow-md z-10"
                    aria-label="カートから削除"
                  >
                    <Trash2 size={20} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* 合計金額 */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md lg:sticky lg:top-24">
                <h2 className="text-xl font-bold border-b pb-4 mb-4">ご注文内容</h2>

                {/* 商品点数 */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">商品点数</span>
                    <span className="font-semibold text-lg text-gray-900">{items.length}点</span>
                  </div>
                </div>

                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between">
                    <span>小計</span>
                    <span>¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>送料</span>
                    <span>¥{shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl border-t pt-4 mt-4 text-gray-800">
                    <span>合計</span>
                    <span className="text-[#2FA3E3]">¥{total.toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  onClick={proceedToPayment}
                  variant="primary"
                  size="lg"
                  className="w-full mt-6">
                  レジに進む
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
