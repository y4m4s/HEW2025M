'use client';

import React, { useEffect, useState } from 'react';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Button from '@/components/Button';
import { useCartStore } from '@/components/useCartStore';
import { useAuth } from '@/lib/useAuth';
import { Lock, CreditCard, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

//keyの取得
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; 
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// アイコンコンポーネント
const ApplePayIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor"><path d="M19.5 13.5C19.5 15.5 21.2 16.5 21.3 16.6C21.2 17 20.7 18.5 19.5 20.2C18.5 21.6 17.5 21.6 16.5 21.6C15.4 21.6 14.5 20.9 13.8 20.9C13.1 20.9 12 21.6 11 21.6C9.9 21.6 8.5 20.5 7.7 19.3C6.1 17 6.1 13.6 8.6 12.2C9.8 11.5 10.9 11.5 11.7 11.5C12.8 11.5 13.6 12.2 14.2 12.2C14.8 12.2 15.9 11.3 17.2 11.3C17.7 11.3 19.3 11.5 20.3 12.9C20.2 13 19.5 13.3 19.5 13.5ZM16.3 9.5C16.8 8.9 17.1 8.1 17 7.3C16.3 7.3 15.4 7.8 14.9 8.4C14.4 8.9 14 9.8 14.1 10.6C14.9 10.6 15.8 10.1 16.3 9.5Z"/></svg>
);

const GooglePayIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor"><path d="M16 13.5V18.5H23.5C23.2 20.3 21.5 23.5 16 23.5C11.5 23.5 8 19.8 8 15.5C8 11.2 11.5 7.5 16 7.5C18.5 7.5 20.2 8.6 21.1 9.5L24.7 6C22.4 3.8 19.5 2.5 16 2.5C8.8 2.5 3 8.3 3 15.5C3 22.7 8.8 28.5 16 28.5C23.5 28.5 28.5 23.2 28.5 15.5C28.5 14.8 28.4 14.1 28.3 13.5H16Z"/></svg>
);

const PAYMENT_METHODS = [
  {
    id: 'card',
    name: 'クレジットカード', 
    icon: <CreditCard className="w-6 h-6 text-blue-600" />,
    description: 'Visa, Mastercard, JCB, Amex'
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    icon: <ApplePayIcon />,
    description: 'Apple Payで支払う'
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    icon: <GooglePayIcon />,
    description: 'Google Payで支払う'
  },
  {
    id: 'paypay',
    name: 'PayPay', 
    icon: <Smartphone className="w-6 h-6 text-red-500" />,
    description: 'PayPay残高払い'
  }
];

function PayCheckForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal + 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!user) {
      toast.error('ログインが必要です。');
      setIsLoading(false);
      return;
    }

    // 注文データをFirestoreに保存
    let orderId = '';
    try {
      const orderData = {
        buyerId: user.uid,
        items: items,
        totalAmount: total,
        paymentMethod: selectedMethod,
        status: 'completed', // 簡易的に完了とする
        createdAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      orderId = docRef.id;
      clearCart();
    } catch (error) {
      console.error('注文保存エラー:', error);
      setErrorMessage('注文の保存に失敗しました。');
      setIsLoading(false);
      return;
    }

    if (!stripe) {
        toast.error('システムエラー: Stripeが読み込まれていません。');
        setIsLoading(false);
        return;
    }

    // PayPayの場合
    if (selectedMethod === 'paypay') {
        const { error } = await stripe.confirmPaypayPayment(clientSecret, {
            return_url: `${window.location.origin}/order-success?orderId=${orderId}`,
        });
        if (error) {
            setErrorMessage(error.message || 'PayPayでの決済に失敗しました。');
            toast.error(error.message || 'PayPayでの決済に失敗しました。');
            setIsLoading(false); // エラー時はローディング解除
        }
        // 成功時はPayPayにリダイレクトされるので、これ以上は実行されない
        return;
    }
    
    // その他の決済方法 (カードなど)
    if (!elements) {
        toast.error('システムエラー: Stripe Elementsが読み込まれていません。');
        setIsLoading(false);
        return;
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // orderIdをURLパラメータとして渡す
          return_url: `${window.location.origin}/order-success?orderId=${orderId}`,
          payment_method_data: {
            billing_details: {
              name: user?.displayName || 'Guest',
              email: user?.email || undefined,
            }
          }
        },
      });

      if (error) {
        setErrorMessage(error.message || '決済に失敗しました。');
        toast.error('入力内容を確認してください。');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('システムエラーが発生しました。');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto animate-in fade-in duration-500">
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">支払い方法</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100 w-fit">
          <Lock size={14} className="text-green-600" /> 
          <span>すべての取引は暗号化され保護されています</span>
        </div>
      </div>

      <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm mb-8">
        
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isStripeMethod = ['card', 'apple_pay', 'google_pay', 'paypay'].includes(method.id);

          return (
            <div key={method.id} className={`border-b border-gray-200 last:border-0 transition-colors ${isSelected ? 'bg-blue-50/30' : 'bg-white'}`}>
              
              <label className="cursor-pointer flex items-center p-5 w-full hover:bg-gray-50 relative">
                <input
                  type="radio"
                  name="payment_method"
                  value={method.id}
                  checked={isSelected}
                  onChange={() => setSelectedMethod(method.id)}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-4"
                />
                
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-gray-600">{method.icon}</span>
                  <span className={`font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                    {method.name}
                  </span>
                  {method.description && !isSelected && (
                    <span className="text-xs text-gray-400 hidden sm:inline-block"> - {method.description}</span>
                  )}
                </div>
              </label>

              {/* stripe forms*/}
              {isSelected && isStripeMethod && (
                <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                  {method.id === 'paypay' ? (
                    <div className="p-5 text-center text-gray-600 bg-gray-50 rounded-lg">
                      <p>「支払う」ボタンをクリックすると、PayPayのページに移動して決済を完了します。</p>
                    </div>
                  ) : (
                    <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-inner mt-2 min-h-[150px]">
                      <PaymentElement 
                        id="payment-element"
                        options={{ 
                          layout: "tabs",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded flex items-center gap-2">
           <span>⚠️</span> {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || (['card', 'apple_pay', 'google_pay', 'paypay'].includes(selectedMethod) && !stripe)}
        className={`w-full py-4 text-lg font-bold shadow-lg rounded-full transition-all transform hover:-translate-y-1 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2FA3E3] hover:bg-[#2589bf] text-white'}`}
      >
        {isLoading ? '処理中...' : `￥${total.toLocaleString()} を支払う`}
      </Button>

    </form>
  );
}

// Wrapper Principal
export default function PayCheck() {
  const [clientSecret, setClientSecret] = useState("");
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    // Verifica API Key
    if (!stripePublicKey) {
      setDebugError("エラー: Stripe公開鍵が見つかりません。.env.localを確認してください。");
      return;
    }

    if (items.length && user) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           items, 
           userId: user.uid, 
           amount: items.reduce((a, b) => a + b.price * b.quantity, 0) + 500,
           paymentMethodTypes: ['card', 'paypay']
        }),
      })
      .then(async (res) => {
         if (!res.ok) {
             const txt = await res.text();
             throw new Error(txt);
         }
         return res.json();
      })
      .then((data) => {
          if (data.error) throw new Error(data.error);
          setClientSecret(data.clientSecret);
      })
      .catch(err => setDebugError("バックエンドエラー: " + err.message));
    }
  }, [items, user]);

  if (debugError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
            <h1 className="text-xl font-bold text-red-600">設定エラー</h1>
            <p className="bg-red-50 p-4 border border-red-200 mt-2 text-red-800">{debugError}</p>
        </div>
      );
  }

  if (!clientSecret) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">決済システムを読み込み中...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col">
      <Elements stripe={stripePromise} options={{ clientSecret, locale: 'ja' }}>
        <PayCheckForm clientSecret={clientSecret} />
      </Elements>
    </div>
  );
}