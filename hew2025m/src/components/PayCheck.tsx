'use client';

import React, { useEffect, useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import Button from '@/components/Button';
import { useCartStore } from '@/components/useCartStore';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function PayCheck() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState<'error' | 'success' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

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
          setMessageType('success');
          break;
        case 'processing':
          setMessage('支払いを処理中です。');
          setMessageType('error');
          break;
        case 'requires_payment_method':
          setMessage('支払い情報を入力してください。');
          setMessageType('error');
          break;
        default:
          setMessage('エラーが発生しました。');
          setMessageType('error');
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !user) {
      toast.error('決済準備中です。もう一度お試しください。');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message || '決済に失敗しました。');
        setMessageType('error');
        toast.error('決済に失敗しました');
        setIsLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Fetch user profile for buyer name
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const buyerName = userDoc.exists() ? userDoc.data().displayName : user.email || 'User';

        // Prepare order items from cart
        const orderItems = await Promise.all(
          items.map(async (cartItem) => {
            try {
              const response = await fetch(`/api/products/${cartItem.id}`);
              if (!response.ok) throw new Error('Product not found');
              const productData = await response.json();
              const product = productData.product;

              return {
                productId: product._id,
                productName: product.title,
                productImage: product.images?.[0] || '',
                price: product.price,
                quantity: 1,
                sellerId: product.sellerId,
                sellerName: product.sellerName,
                sellerPhotoURL: undefined,
                category: product.category,
                condition: product.condition,
              };
            } catch (err) {
              console.error(`Error fetching product ${cartItem.id}:`, err);
              return null;
            }
          })
        );

        const validItems = orderItems.filter(item => item !== null);
        const subtotal = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingFee = subtotal > 0 ? 500 : 0;
        const totalAmount = subtotal + shippingFee;

        // Detect payment method
        let detectedPaymentMethod: 'card' | 'paypay' | 'applepay' | 'rakuten' | 'au' = 'card';
        if (paymentIntent.payment_method) {
          const pmType = (paymentIntent as any).payment_method_types?.[0];
          if (pmType === 'paypay') detectedPaymentMethod = 'paypay';
          else if (pmType === 'apple_pay') detectedPaymentMethod = 'applepay';
          else if (pmType === 'rakuten_pay') detectedPaymentMethod = 'rakuten';
          else if (pmType === 'au_pay') detectedPaymentMethod = 'au';
        }

        // Create order
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerId: user.uid,
            buyerName,
            items: validItems,
            totalAmount,
            subtotal,
            shippingFee,
            paymentMethod: detectedPaymentMethod,
            paymentIntentId: paymentIntent.id,
          }),
        });

        if (!orderResponse.ok) {
          throw new Error('Failed to save order');
        }

        const orderData = await orderResponse.json();
        
        // Clear cart and redirect
        clearCart();
        toast.success('注文が完了しました！');
        
        // Redirect to success page
        setTimeout(() => {
          router.push(`/order-success?orderId=${orderData.orderId}`);
        }, 1000);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage('決済処理中にエラーが発生しました。');
      setMessageType('error');
      toast.error('エラーが発生しました');
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          複数の支払い方法に対応しています。クレジットカード、PayPay、Apple Pay、楽天ペイなど。
        </p>
      </div>

      <PaymentElement
        id="payment-element"
        options={{ layout: 'tabs' }}
      />

      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="text-green-600" size={20} />
          ) : (
            <AlertCircle className="text-red-600" size={20} />
          )}
          <p className={messageType === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message}
          </p>
        </div>
      )}

      <Button
        disabled={isLoading || !stripe || !elements}
        variant="primary"
        size="lg"
        className="w-full"
      >
        {isLoading ? '処理中...' : 'お支払いを確定する'}
      </Button>
    </form>
  );
}