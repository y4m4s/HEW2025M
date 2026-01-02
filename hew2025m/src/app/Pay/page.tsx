'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/components/useCartStore';
import Button from '@/components/Button';
import Image from 'next/image';
import { CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export default function PayPage() {
  const items = useCartStore((state) => state.items);
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAddress, setIsCheckingAddress] = useState(true);
  const [singleAddressId, setSingleAddressId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ユーザーの住所を確認し、1つだけならそれを自動選択する
  useEffect(() => {
    if (authLoading || !user) {
      setIsCheckingAddress(false);
      return;
    }

    const findUserAddress = async () => {
      setIsCheckingAddress(true);
      try {
        const addressesRef = collection(db, 'users', user.uid, 'addresses');
        const q = query(addressesRef, limit(2)); // 0, 1, or 2+ addresses?
        const querySnapshot = await getDocs(q);

        if (querySnapshot.size === 1) {
          // 住所が1つだけの場合、そのIDを保存
          setSingleAddressId(querySnapshot.docs[0].id);
        }
      } catch (error) {
        console.error("ユーザーの住所検索中にエラー発生:", error);
      } finally {
        setIsCheckingAddress(false);
      }
    };

    findUserAddress();
  }, [user, authLoading]);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);

  if (!isMounted || authLoading || isCheckingAddress) {
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

  const handleProceed = () => {
    if (singleAddressId) {
      // 住所が1つだけなら、それを使いチェックアウトへ直接進む
      router.push(`/PayCheck?addressId=${singleAddressId}`);
    } else {
      // 住所がない、または複数ある場合は、選択ページへ進む
      router.push('/Pay-address');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <CreditCard size={32} className="text-blue-500" />
          ご注文内容の確認
        </h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-3">注文概要</h2>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <Image
                  src={item.image || "https://via.placeholder.com/100"}
                  alt={item.title}
                  width={64}
                  height={64}
                  className="object-cover rounded-md border"
                />
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
            <div className="flex justify-between text-gray-500"><span>送料</span><span>次のステップで計算されます</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-4 mt-4">
              <span>合計 (税抜)</span>
              <span>¥{subtotal.toLocaleString()}</span>
            </div>
          </div>

          <Button onClick={handleProceed} variant="primary" size="lg" className="w-full">
            お届け先住所の入力へ進む
          </Button>
        </div>
      </div>
    </div>
  );
}