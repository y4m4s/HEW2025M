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

// Carrega a chave pública
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; 
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const PAYMENT_METHODS = [
  {
    id: 'card',
    // Apple Pay e Google Pay aparecem automaticamente dentro do Elemento do Cartão
    name: 'クレジットカード / Apple Pay / Google Pay', 
    icon: <CreditCard className="w-6 h-6 text-blue-600" />,
    brands: ['visa', 'master', 'jcb', 'amex']
  },
  {
    id: 'paypay',
    name: 'PayPay', 
    icon: <Smartphone className="w-6 h-6 text-red-500" />,
    brands: []
  }
];

function PayCheckForm() {
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

    // Lógica 1: Cartão, Apple Pay e Google Pay (Processados pelo Stripe)
    if (selectedMethod === 'card') {
      if (!stripe || !elements) {
        toast.error('システムエラー: Stripeが読み込まれていません。');
        setIsLoading(false);
        return;
      }

      try {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/order-success`,
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
    } 
    
    // Lógica 2: PayPay (Simulação para escola)
    else if (selectedMethod === 'paypay') {
        toast.success('PayPay: 決済画面へリダイレクト中...');
        
        setTimeout(() => {
            // Simula sucesso e redireciona
            window.location.href = `/order-success?payment=paypay`;
            clearCart();
        }, 2000);
        return;
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
                </div>
              </label>

              {/* Formulário do Stripe (Só aparece se for Card) */}
              {isSelected && method.id === 'card' && (
                <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                  <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-inner mt-2 min-h-[150px]">
                    <PaymentElement 
                      id="payment-element"
                      options={{ layout: "tabs" }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    ※ Apple Pay / Google Pay は対応デバイスでのみ表示されます
                  </p>
                </div>
              )}

              {/* Mensagem do PayPay */}
              {isSelected && method.id === 'paypay' && (
                <div className="px-12 pb-6 pt-0 text-sm text-gray-600 animate-in slide-in-from-top-1">
                  <p className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                    「支払う」ボタンを押すと、PayPayアプリまたはウェブサイトで決済を完了します。
                  </p>
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
        disabled={isLoading || (selectedMethod === 'card' && !stripe)}
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
           amount: items.reduce((a, b) => a + b.price * b.quantity, 0) + 500 
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
        <PayCheckForm />
      </Elements>
    </div>
  );
}