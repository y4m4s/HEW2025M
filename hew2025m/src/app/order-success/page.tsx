'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function OrderSuccessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // Client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevents flicker
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center relative overflow-hidden">

        <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />

        <h1 className="text-3xl font-bold text-gray-800 mb-3">ご注文ありがとうございます！</h1>
        <p className="text-gray-600 mb-8 text-lg">
          ご注文が正常に完了しました。
        </p>

        <div className="space-y-3 mb-8">
          <p className="text-sm text-gray-600">
            プロフィールの購入履歴からご注文状況をご確認いただけます。
          </p>
          <p className="text-sm text-gray-600">
            商品の発送までしばらくお待ちください。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {user && (
            <Button
              onClick={() => router.push(`/profile/${user.uid}`)}
              variant="primary"
              size="lg"
              className="flex-1"
            >
              購入履歴を確認
            </Button>
          )}
          <Button
            onClick={() => router.push('/product-list')}
            variant="secondary"
            size="lg"
            className={user ? "flex-1" : "w-full"}
          >
            ショッピングを続ける
          </Button>
        </div>
      </div>
    </div>
  );
}