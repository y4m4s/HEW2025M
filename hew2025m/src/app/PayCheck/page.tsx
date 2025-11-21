'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '@/components/useCartStore'; // Caminho corrigido
import PayCheck from '@/components/PayCheck'; // Seu componente de formulário
import Button from '@/components/Button';

// Carrega a chave pública do Stripe (do arquivo .env)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function PayPage() {
  const [clientSecret, setClientSecret] = useState('');
  const items = useCartStore((state) => state.items);
  const router = useRouter();

  useEffect(() => {
    // Se o carrinho estiver vazio, volta para a home
    if (items.length === 0) {
       return;
    }

    // Chama a API que criamos para gerar o "Segredo" do pagamento
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => console.error("Erro ao iniciar pagamento:", error));
  }, [items]);

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
        <h1 className="text-2xl font-bold mb-6 text-center">お支払い</h1>
        
        {items.length === 0 ? (
           <div className="text-center">
             <p className="text-gray-500 mb-4">カートは空です</p>
             <Button onClick={() => router.push('/')} variant="primary" size="md">
                トップページへ戻る
             </Button>
           </div>
        ) : clientSecret ? (
          // Aqui a mágica acontece: O Elements "conecta" o Stripe ao componente PayCheckout
          <Elements options={options} stripe={stripePromise}>
            <PayCheck />
          </Elements>
        ) : (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}