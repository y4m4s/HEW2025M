'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/components/useCartStore';
import Button from '@/components/Button';
import { Trash2, ShoppingCart } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';


export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);

  // ハイドレーションエラーを防ぐための対策です
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    console.log("Public Stripe Key:", process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
  }, []);

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
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* カート商品リスト */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                  <img src={item.image || "https://via.placeholder.com/150"} alt={item.title} className="w-24 h-24 object-cover rounded-md border" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-lg font-bold text-[#2FA3E3]">¥{item.price.toLocaleString()}</p>
                  </div>
                  {/* ここが削除ボタンです */}
                  <Button onClick={() => removeItem(item.id)} variant="ghost" size="icon">
                    <Trash2 size={20} className="text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 合計金額 */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
                <h2 className="text-xl font-bold border-b pb-4 mb-4">ご注文内容</h2>
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
                    <span>¥{total.toLocaleString()}</span>
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
