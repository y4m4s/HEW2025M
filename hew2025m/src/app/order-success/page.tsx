'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '@/components/Button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = searchParams.get('orderId');
  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  const [isMounted, setIsMounted] = useState(false);

  // Client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if orderId is missing after a delay
  useEffect(() => {
    if (!isMounted) return;
    
    if (!orderId) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderId, router, isMounted]);

  // Prevents flicker
  if (!isMounted) {
    return null;
  }
  
  const isTestPayment = paymentIntentId?.startsWith('pi_');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center relative overflow-hidden">
        
        {isTestPayment && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-bold">テスト環境</p>
              <p className="text-sm">これはテスト用のシミュレーション決済です。実際の請求は発生しません。</p>
            </div>
          </div>
        )}
        
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ご注文ありがとうございます！</h1>
        <p className="text-gray-600 mb-6">
          {redirectStatus === 'succeeded' ? 'ご注文が正常に完了しました。' : '決済の確認が取れました。'}
        </p>

        <div className="space-y-4 bg-gray-50 rounded-lg p-4 mb-6 text-left">
          {orderId && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Order ID</p>
              <p className="font-mono text-base font-semibold text-gray-800 break-all">{orderId}</p>
            </div>
          )}
          {paymentIntentId && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Payment Intent ID</p>
              <p className="font-mono text-sm text-gray-600 break-all">{paymentIntentId}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            確認メールをお送りしました。プロフィールの購入履歴からご注文状況をご確認いただけます。
          </p>

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
              onClick={() => router.push('/')}
              variant="secondary"
              size="lg"
              className={user ? "flex-1" : "w-full"}
            >
              ショッピングを続ける
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}