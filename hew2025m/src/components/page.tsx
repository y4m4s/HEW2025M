"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/components/useCartStore';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { Loader2, CreditCard } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  address1: string;
  address2: string;
}

interface CartItemInfo {
    id: string;
    quantity: number;
}

const CheckoutForm = ({ total, items, onSuccessfulCheckout }: { total: number, items: CartItemInfo[], onSuccessfulCheckout: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();
  const clearCart = useCartStore((state) => state.clearCart);

  const [address, setAddress] = useState<Address>({
    postalCode: '',
    prefecture: '',
    city: '',
    address1: '',
    address2: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user's default address
  useEffect(() => {
    const fetchAddress = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const addressDocRef = doc(db, 'users', user.uid, 'private', 'address');
        const addressDoc = await getDoc(addressDocRef);
        if (addressDoc.exists()) {
          setAddress(addressDoc.data() as Address);
        }
      } catch (error) {
        console.error("Failed to fetch address:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    if (!stripe || !elements || !user) {
      toast.error('Payment system not ready.');
      setIsSaving(false);
      return;
    }
    
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
        toast.error('Card details not found.');
        setIsSaving(false);
        return;
    }

    try {
      // Crie o Payment Intent de forma SEGURA no backend
      // Enviando os IDs dos produtos, não o valor total.
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // O backend irá calcular o preço a partir dos IDs dos produtos.
        body: JSON.stringify({ items }),
      });
      const { clientSecret } = await res.json();
      
      if (!clientSecret) {
          throw new Error("Failed to create payment intent.");
      }

      // Confirm Payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.displayName || 'Guest',
            address: {
                line1: `${address.address1} ${address.address2}`,
                city: address.city,
                state: address.prefecture,
                postal_code: address.postalCode,
                country: 'JP',
            }
          },
        },
      });

      if (error) {
        toast.error(error.message || 'An unexpected error occurred.');
        setIsSaving(false);
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        // Here you would typically save the order to your database
        onSuccessfulCheckout();
        clearCart();
        router.push('/order-success');
      }
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Payment failed.');
      setIsSaving(false);
    }
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddress({...address, [e.target.name]: e.target.value});
  }

  if (loading) {
      return <Loader2 className="h-8 w-8 animate-spin text-[#2FA3E3]" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-3">お届け先住所</h2>
        <div className="space-y-3">
            <div>
                <label className="block font-medium">Postal Code</label>
                <input name="postalCode" value={address.postalCode} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg" required />
            </div>
            <div>
                <label className="block font-medium">Prefecture</label>
                <input name="prefecture" value={address.prefecture} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg" required />
            </div>
            <div>
                <label className="block font-medium">City</label>
                <input name="city" value={address.city} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg" required />
            </div>
            <div>
                <label className="block font-medium">Address 1</label>
                <input name="address1" value={address.address1} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg" required />
            </div>
            <div>
                <label className="block font-medium">Address 2</label>
                <input name="address2" value={address.address2} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg" />
            </div>
        </div>
      <button type="submit" disabled={!stripe || isSaving} className="w-full bg-[#2FA3E3] text-white py-3 rounded-lg hover:bg-[#1d7bb8] transition-colors disabled:bg-gray-400 flex items-center justify-center">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSaving ? 'Processing...' : `Pay ¥${total.toLocaleString()}`}
      </button>
    </form>
  );
};

const PayCheckPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const items = useCartStore((state) => state.items);
  
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!authLoading && !user) {
        router.push('/login');
    }
    if (isMounted && items.length === 0) {
        router.replace('/');
    }
  }, [user, authLoading, router, items.length, isMounted]);

  useEffect(() => {
      const fetchAddress = async () => {
          if(!user) return;
          const addressDocRef = doc(db, 'users', user.uid, 'private', 'address');
          const addressDoc = await getDoc(addressDocRef);
          if (addressDoc.exists()) {
              setDefaultAddress(addressDoc.data() as Address);
          }
      }
      fetchAddress();
  }, [user]);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);
  
  const shippingFee = useMemo(() => {
      if (subtotal === 0) return 0;
      if (defaultAddress?.prefecture === '愛知県') {
          return 300; // Cheaper shipping for Aichi
      }
      return 800; // Standard shipping for other prefectures
  }, [subtotal, defaultAddress]);

  const total = subtotal + shippingFee;
  
  const onSuccessfulCheckout = () => {
      // Could add more logic here, e.g. saving order to firestore
  }

  if (!isMounted || authLoading || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#2FA3E3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <CreditCard size={32} className="text-blue-500" />
          Checkout
        </h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="space-y-3 text-gray-700 mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-3">Order Summary</h2>
                <div className="flex justify-between"><span>Subtotal</span><span>¥{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>¥{shippingFee.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-2xl border-t pt-4 mt-4"><span>Total</span><span>¥{total.toLocaleString()}</span></div>
            </div>
            <Elements stripe={stripePromise}>
              <CheckoutForm total={total} items={items.map(i => ({id: i.id, quantity: i.quantity}))} onSuccessfulCheckout={onSuccessfulCheckout} />
            </Elements>
        </div>
      </div>
    </div>
  );
};

export default PayCheckPage;
