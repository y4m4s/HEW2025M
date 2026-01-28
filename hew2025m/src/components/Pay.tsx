'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/components/useCartStore';
import Button from '@/components/Button';
import PayCheckout from './PayCheck';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Pay() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);

  // ハイドレーション（サーバーとクライアントの不一致）を防ぐ
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 500 : 0;
  const total = subtotal + shippingFee;

  // isMountedがfalseの間は何も描画しないか、ローディング表示を出す
  if (!isMounted) {
    return <LoadingSpinner message="読み込み中..." size="md" />;
  }

  // カートが空ならホームページにリダイレクト
  if (items.length === 0) {
    router.replace('/');
    return null;
  }

  return (
    <div className="grid lg:grid-cols-2 gap-12">
      {/* 注文概要 */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 border-b pb-4">ご注文内容の確認</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <img src={item.image || "https://via.placeholder.com/100"} alt={item.title} className="w-20 h-20 object-cover rounded-md border" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-gray-600">数量: {item.quantity}</p>
              </div>
              <p className="font-bold text-lg">¥{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 金額と決済ボタン */}
      <div className="lg:sticky top-24 h-fit">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 border-b pb-4">お支払い</h2>
          <div className="space-y-3 text-gray-700 mb-6">
            <div className="flex justify-between">
              <span>小計</span>
              <span>¥{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>送料</span>
              <span>¥{shippingFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-2xl border-t pt-4 mt-4 text-gray-800">
              <span>ご請求額</span>
              <span>¥{total.toLocaleString()}</span>
            </div>
          </div>
          <PayCheckout />
        </div>
      </div>
    </div>
  );
}