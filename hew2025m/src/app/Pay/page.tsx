'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/components/useCartStore';
import Button from '@/components/Button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Address {
  prefecture: string;
}

export default function PayPage() {
  const items = useCartStore((state) => state.items);
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    const fetchAddress = async () => {
      if (!user) {
        setAddressLoading(false);
        return;
      };
      setAddressLoading(true);
      try {
        const addressDocRef = doc(db, 'users', user.uid, 'private', 'address');
        const addressDoc = await getDoc(addressDocRef);
        if (addressDoc.exists()) {
          setDefaultAddress(addressDoc.data() as Address);
        }
      } catch (error) {
        console.error("Failed to fetch address on pay page:", error);
      } finally {
        setAddressLoading(false);
      }
    }
    if (user) {
      fetchAddress();
    } else if (!authLoading) {
      setAddressLoading(false);
    }
  }, [user, authLoading]);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);

  const shippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    if (defaultAddress?.prefecture === '愛知県') {
      return 300; // Cheaper shipping for Aichi
    }
    // For prefectures other than Aichi, or if address is not set
    return 800;
  }, [subtotal, defaultAddress]);


  const total = subtotal + shippingFee;

  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#2FA3E3]" />
      </div>
    );
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
          {addressLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3 text-gray-700 mb-8">
              <div className="flex justify-between"><span>小計</span><span>¥{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>送料</span><span>¥{shippingFee.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-2xl border-t pt-4 mt-4"><span>合計</span><span>¥{total.toLocaleString()}</span></div>
            </div>
          )}

          <Button onClick={() => router.push('/pay-address')} variant="primary" size="lg" className="w-full" disabled={addressLoading}>
            {addressLoading ? '送料を計算中...' : 'お支払い方法の選択へ進む'}
          </Button>
        </div>
      </div>
    </div>
  );
}