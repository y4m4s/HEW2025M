'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/components/useCartStore';
import Button from '@/components/Button';
import { CreditCard } from 'lucide-react';

export default function PayPage() {
  const items = useCartStore((state) => state.items);
  const router = useRouter();

  // ハイドレーションエラーを防ぐ
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 500 : 0;
  const total = subtotal + shippingFee;

  if (!isMounted) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>;
  }

  // カートが空ならホームページにリダイレクト
  if (items.length === 0 && isMounted) {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <CreditCard size={32} className="text-blue-500" />
          お支払い方法の選択
        </h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-3">注文概要</h2>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <img src={item.image || "https://via.placeholder.com/100"} alt={item.title} className="w-16 h-16 object-cover rounded-md border" />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-gray-600">数量: {item.quantity}</p>
                </div>
                <p className="font-bold">¥{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold mb-4 border-b pb-3">ご請求額</h2>
          <div className="space-y-3 text-gray-700 mb-8">
            <div className="flex justify-between"><span>小計</span><span>¥{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>送料</span><span>¥{shippingFee.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-2xl border-t pt-4 mt-4"><span>合計</span><span>¥{total.toLocaleString()}</span></div>
          </div>

          <Button onClick={() => router.push('/PayCheck')} variant="primary" size="lg" className="w-full">
            お支払い方法の選択へ進む
          </Button>
        </div>
      </div>
    </div>
  );
}