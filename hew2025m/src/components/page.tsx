'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '@/components/useCartStore';
import PayCheckout from '@/components/PayCheck';
import Button from '@/components/Button';
import { CreditCard } from 'lucide-react';

// Carrega a chave pública do Stripe (do arquivo .env)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const items = useCartStore((state) => state.items);
  const router = useRouter();

  useEffect(() => {
    // Se o carrinho estiver vazio, não permite acesso a esta página
    if (items.length === 0) {
       router.replace('/');
       return;
    }

    // API para gerar o "Segredo" do pagamento
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error(data.error || 'Client Secretの取得に失敗しました。');
        }
      })
      .catch((error) => {
        console.error("決済の初期化に失敗:", error);
        alert('決済を準備できませんでした。カートページに戻ります。');
        router.push('/cart');
      });
  }, [items, router]);

  // Configurações visuais do Stripe
  const appearance = {
    theme: 'stripe' as const,
  };
  
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-3">
          <CreditCard />
          お支払い方法の選択
        </h1>
        
        {clientSecret ? (
          <Elements options={options} stripe={stripePromise}>
            <PayCheckout />
          </Elements>
        ) : (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>
        )}
      </div>
    </div>
  );
}