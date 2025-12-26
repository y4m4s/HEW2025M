'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Button from '@/components/Button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = searchParams.get('orderId');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    if (!orderId) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderId, router, isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ご注文ありがとうございます！</h1>
        <p className="text-gray-600 mb-6">
          ご注文が正常に完了しました。
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order ID</p>
            <p className="font-mono text-lg font-semibold text-gray-800">{orderId}</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            確認メールをお送りしました。プロフィールの購入履歴からご注文状況をご確認いただけます。
          </p>

          <div className="flex gap-3 pt-4">
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
              onClick={() => router.push('/')}
              variant="secondary"
              size="lg"
              className={user ? "flex-1" : "w-full"}
            >
              続ける
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}