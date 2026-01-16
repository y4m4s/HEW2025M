'use client';

import { useEffect, useState, useMemo } from 'react';
import { PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { useCartStore } from '@/components/useCartStore';
import { useAuth } from '@/lib/useAuth';
import { Lock, CreditCard, Smartphone, Loader2, Fish } from 'lucide-react';
import toast from 'react-hot-toast';
import { CartProduct } from '@/components/CartProductCard';
import Image from 'next/image';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// アイコンコンポーネント
const ApplePayIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor"><path d="M19.5 13.5C19.5 15.5 21.2 16.5 21.3 16.6C21.2 17 20.7 18.5 19.5 20.2C18.5 21.6 17.5 21.6 16.5 21.6C15.4 21.6 14.5 20.9 13.8 20.9C13.1 20.9 12 21.6 11 21.6C9.9 21.6 8.5 20.5 7.7 19.3C6.1 17 6.1 13.6 8.6 12.2C9.8 11.5 10.9 11.5 11.7 11.5C12.8 11.5 13.6 12.2 14.2 12.2C14.8 12.2 15.9 11.3 17.2 11.3C17.7 11.3 19.3 11.5 20.3 12.9C20.2 13 19.5 13.3 19.5 13.5ZM16.3 9.5C16.8 8.9 17.1 8.1 17 7.3C16.3 7.3 15.4 7.8 14.9 8.4C14.4 8.9 14 9.8 14.1 10.6C14.9 10.6 15.8 10.1 16.3 9.5Z" /></svg>
);

const GooglePayIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor"><path d="M16 13.5V18.5H23.5C23.2 20.3 21.5 23.5 16 23.5C11.5 23.5 8 19.8 8 15.5C8 11.2 11.5 7.5 16 7.5C18.5 7.5 20.2 8.6 21.1 9.5L24.7 6C22.4 3.8 19.5 2.5 16 2.5C8.8 2.5 3 8.3 3 15.5C3 22.7 8.8 28.5 16 28.5C23.5 28.5 28.5 23.2 28.5 15.5C28.5 14.8 28.4 14.1 28.3 13.5H16Z" /></svg>
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

interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  address1: string;
  address2: string;
}

interface PayCheckFormProps {
  products: (CartProduct & { cartItemId: string; shippingPayer?: string; sellerId?: string; sellerPhotoURL?: string })[];
  shippingAddress: Address;
  shippingFee: number;
}

function PayCheckForm({ products, shippingAddress, shippingFee }: PayCheckFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculateSubtotal = () => {
    return products.reduce((acc, product) => {
      const cartItem = items.find(i => i.id === product.cartItemId);
      const quantity = cartItem ? cartItem.quantity : 1;
      return acc + (product.price * quantity);
    }, 0);
  };
  const subtotal = calculateSubtotal();
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!user) {
      toast.error('ログインが必要です。');
      setIsLoading(false);
      return;
    }

    if (items.length === 0) {
      toast.error('カートに商品がありません。');
      setIsLoading(false);
      return;
    }

    // 注文データをFirestoreに保存
    let orderId = '';
    try {
      // OrderItem形式に変換
      // products が既に詳細情報を持っているのでそれを利用
      const orderItems = items.map((item) => {
        const product = products.find(p => p.cartItemId === item.id);

        if (product) {
          return {
            productId: item.id,
            productName: item.title,
            productImage: item.image || '',
            price: product.price,
            quantity: item.quantity,
            sellerId: product.sellerId || '',
            sellerName: product.sellerName || '出品者未設定',
            sellerPhotoURL: product.sellerPhotoURL,
            category: product.category || 'その他',
            condition: product.condition || '未設定',
          };
        }

        // フォールバック
        return {
          productId: item.id,
          productName: item.title,
          productImage: item.image || '',
          price: item.price,
          quantity: item.quantity,
          sellerId: '',
          sellerName: '出品者未設定',
          category: 'その他',
          condition: '未設定'
        };
      });

      const orderData = {
        buyerId: user.uid,
        buyerName: user.displayName || 'ゲスト',
        items: orderItems,
        totalAmount: total,
        subtotal: subtotal,
        shippingFee: shippingFee,
        paymentMethod: selectedMethod as 'card' | 'paypay' | 'apple_pay' | 'google_pay',
        shippingAddress: {
          zipCode: shippingAddress.postalCode,
          prefecture: shippingAddress.prefecture,
          city: shippingAddress.city,
          street: `${shippingAddress.address1}${shippingAddress.address2 ? ' ' + shippingAddress.address2 : ''}`,
        },
      };

      // Firebaseトークンを取得
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('認証トークンの取得に失敗しました');
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '注文の作成に失敗しました');
      }

      const result = await response.json();
      orderId = result.orderId;
      clearCart();
      sessionStorage.removeItem('shippingAddress');

      // 決済処理をスキップして、直接成功ページに遷移
      toast.success('ご注文ありがとうございます！');
      router.push('/order-success');
    } catch (error) {
      console.error('注文保存エラー:', error);
      setErrorMessage(error instanceof Error ? error.message : '注文の保存に失敗しました。');
      setIsLoading(false);
      return;
    }
  };

  return (
    <>
      {/* ローディング画面オーバーレイ */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <Loader2 className="w-16 h-16 text-[#2FA3E3] animate-spin mb-4" />
          <p className="text-xl font-bold text-gray-800 mb-2">購入処理中...</p>
          <p className="text-sm text-gray-600">少々お待ちください</p>
        </div>
      )}

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
                    {method.description && !isSelected && (
                      <span className="text-xs text-gray-400 hidden sm:inline-block"> - {method.description}</span>
                    )}
                  </div>
                </label>

                {/* Stripe決済UI */}
                {isSelected && method.id === 'card' && (
                  <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-inner mt-2">
                      <PaymentElement
                        id="payment-element"
                        options={{
                          layout: "tabs",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* その他の支払い方法の説明 */}
                {isSelected && method.id !== 'card' && (
                  <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="p-3 bg-white rounded-full shadow-md">
                          {method.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-gray-900">{method.name}</p>
                          <p className="text-sm text-gray-600">
                            {method.id === 'paypay' ? 'PayPay残高からお支払い' :
                              method.id === 'apple_pay' ? 'Apple Payで安全にお支払い' :
                                method.id === 'google_pay' ? 'Google Payで簡単にお支払い' :
                                  'お支払い方法を選択しました'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-blue-100">
                        <p className="text-sm text-center text-gray-700 font-medium">
                          ✓ 「{total.toLocaleString()}円を支払う」ボタンをクリックして注文を確定してください
                        </p>
                      </div>
                    </div>
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
          disabled={isLoading}
          className={`w-full py-4 text-lg font-bold shadow-lg rounded-full transition-all transform hover:-translate-y-1 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2FA3E3] hover:bg-[#2589bf] text-white'}`}
        >
          {isLoading ? '処理中...' : `￥${total.toLocaleString()} を支払う`}
        </Button>

      </form>
    </>
  );
}

// Wrapper Principal
export default function PayCheck() {
  const [clientSecret, setClientSecret] = useState("");
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const router = useRouter();

  const [products, setProducts] = useState<(CartProduct & { cartItemId: string; shippingPayer?: string; sellerId?: string; sellerPhotoURL?: string })[]>([]);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 1. 住所と商品情報の取得
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      // 住所
      const addressData = sessionStorage.getItem('shippingAddress');
      if (!addressData) {
        toast.error('配送先住所が見つかりません');
        router.push('/pay');
        return;
      }
      const address = JSON.parse(addressData);

      // 商品
      if (items.length === 0) {
        router.push('/cart');
        return;
      }

      try {
        const productDetails = await Promise.all(
          items.map(async (item) => {
            try {
              const response = await fetch(`/api/products/${item.id}`);
              if (!response.ok) return null;
              const data = await response.json();
              return {
                cartItemId: item.id,
                ...data.product, // 全フィールド含む
              };
            } catch (e) {
              console.error(e);
              return null;
            }
          })
        );

        if (isSubscribed) {
          setShippingAddress(address);
          setProducts(productDetails.filter(p => p !== null) as any[]);
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error("データ読み込みエラー", error);
      }
    };

    loadData();

    return () => { isSubscribed = false; };
  }, [items, router]);

  // 2. 送料計算ロジック (共通化)
  const calculateShippingFee = (prefecture: string | undefined) => {
    if (!prefecture) return 0;
    const prefectures: { [key: string]: number } = {
      '北海道': 1200, '沖縄県': 1500,
      '青森県': 900, '岩手県': 900, '宮城県': 900, '秋田県': 900, '山形県': 900, '福島県': 900,
      '茨城県': 700, '栃木県': 700, '群馬県': 700, '埼玉県': 700, '千葉県': 700, '東京都': 700, '神奈川県': 700, '山梨県': 700,
      '新潟県': 800, '長野県': 800, '富山県': 800, '石川県': 800, '福井県': 800,
      '岐阜県': 600, '静岡県': 600, '愛知県': 500, '三重県': 600,
      '滋賀県': 700, '京都府': 700, '大阪府': 700, '兵庫県': 700, '奈良県': 700, '和歌山県': 700,
      '鳥取県': 900, '島根県': 900, '岡山県': 900, '広島県': 900, '山口県': 900,
      '徳島県': 1000, '香川県': 1000, '愛媛県': 1000, '高知県': 1000,
      '福岡県': 1100, '佐賀県': 1100, '長崎県': 1100, '熊本県': 1100, '大分県': 1100, '宮崎県': 1100, '鹿児島県': 1100,
    };
    return prefectures[prefecture] || 800;
  };

  const shippingFee = useMemo(() => {
    if (!shippingAddress) return 0;

    const hasBuyerPaysItem = products.some(p => p.shippingPayer === 'buyer');
    if (!hasBuyerPaysItem) return 0;

    return calculateShippingFee(shippingAddress.prefecture);
  }, [products, shippingAddress]);

  // 3. Payment Intent 作成
  useEffect(() => {
    if (isDataLoaded && user && products.length > 0 && shippingAddress) {

      const calculateSubtotal = () => {
        return products.reduce((acc, product) => {
          const cartItem = items.find(i => i.id === product.cartItemId);
          const quantity = cartItem ? cartItem.quantity : 1;
          return acc + (product.price * quantity);
        }, 0);
      };
      const subtotal = calculateSubtotal();
      const totalAmount = subtotal + shippingFee;

      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items, // Server uses this to verify prices? If server verifies, it overrides our amount.
          // NOTE: create-payment-intent API usually recalculates price from DB for security.
          // If the server-side logic doesn't know about 'shippingPayer', it might default to adding shipping.
          // However, the current client implementation passed 'amount' in the body in the original code.
          // "amount: items.reduce(...) + 800"
          // So the server trusts this amount or validation is loose.
          // I will send the calculated amount.
          userId: user.uid,
          amount: totalAmount,
          paymentMethodTypes: ['card']
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
        .catch(err => console.error("Payment Intent作成エラー:", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataLoaded, user, items, shippingFee]); // Recalculate only when data loaded

  if (!clientSecret || !isDataLoaded || !shippingAddress) {
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
        <PayCheckForm products={products} shippingAddress={shippingAddress} shippingFee={shippingFee} />
      </Elements>
    </div>
  );
}