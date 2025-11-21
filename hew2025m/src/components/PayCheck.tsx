'use client';

import React, { useEffect, useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import Button from '@/components/Button'; // あなたのボタンコンポーネント

export default function PayCheckout() {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('支払いが完了しました！');
          break;
        case 'processing':
          setMessage('支払いを処理しています。');
          break;
        case 'requires_payment_method':
          setMessage('支払い情報が正しくありません。もう一度お試しください。');
          break;
        default:
          setMessage('予期せぬエラーが発生しました。');
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // 支払い完了後のリダイレクト先（成功ページなど）
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message || 'エラーが発生しました');
    } else {
      setMessage('予期せぬエラーが発生しました。');
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
      
      {/* エラーメッセージ表示 */}
      {message && <div id="payment-message" className="text-red-500 mt-4 text-sm">{message}</div>}

      <Button 
        disabled={isLoading || !stripe || !elements} 
        variant="primary" 
        size="lg" 
        className="w-full mt-6"
      >
        {isLoading ? '処理中...' : '今すぐ支払う'}
      </Button>
    </form>
  );
}