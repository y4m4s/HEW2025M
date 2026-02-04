'use client';

import { useEffect, useState, useMemo } from 'react';
import { Lock, CreditCard, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/useAuth';

import { Button, type CartProduct, LoadingSpinner } from '@/components';
import { useCartStore } from '@/stores/useCartStore';
import { calculateShippingFee } from '@/lib/shipping';

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
  onLoadingChange?: (isLoading: boolean) => void;
}

function PayCheckForm({ products, shippingAddress, shippingFee, onLoadingChange }: PayCheckFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('購入処理中...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ローディング状態を親に通知
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

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

        // 409 Conflictの場合は、売り切れ商品がある
        if (response.status === 409) {
          // エラーメッセージを表示
          const errorMsg = errorData.message || errorData.error || '一部の商品が既に売り切れています';
          toast.error(errorMsg);
          setErrorMessage(errorMsg);
          setIsLoading(false);

          // 3秒後にカートページにリダイレクト（カートが更新されるように）
          setTimeout(() => {
            router.push('/cart');
          }, 3000);
          return;
        }

        throw new Error(errorData.error || '注文の作成に失敗しました');
      }

      await response.json();

      // 決済処理をスキップして、直接成功ページに遷移
      toast.success('ご注文ありがとうございます！');

      // カートをクリア
      clearCart();

      // ローディングメッセージを表示してからリダイレクト
      setLoadingMessage('注文完了ページに移動中...');

      // 1秒後にリダイレクト（ローディングメッセージを十分に表示するため）
      setTimeout(() => {
        sessionStorage.removeItem('shippingAddress');
        window.location.replace('/order-success');
      }, 1000);
    } catch (error) {
      console.error('注文保存エラー:', error);
      const errorMsg = error instanceof Error ? error.message : '注文の保存に失敗しました。';
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
      setIsLoading(false);
      return;
    }
  };

  return (
    <>
      {/* ローディング画面オーバーレイ */}
      {isLoading && (
        <LoadingSpinner
          message={loadingMessage}
          size="lg"
          overlay
        />
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

                {/* 支払い方法の説明 */}
                {isSelected && (
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
  const items = useCartStore((state) => state.items);
  const router = useRouter();

  const [products, setProducts] = useState<(CartProduct & { cartItemId: string; shippingPayer?: string; sellerId?: string; sellerPhotoURL?: string })[]>([]);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

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

      // 商品（購入処理中はスキップ）
      if (items.length === 0 && !isPurchasing) {
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
          setProducts(productDetails.filter((p): p is CartProduct & { cartItemId: string; shippingPayer?: string; sellerId?: string; sellerPhotoURL?: string } => p !== null));
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error("データ読み込みエラー", error);
      }
    };

    loadData();

    return () => { isSubscribed = false; };
  }, [items, router, isPurchasing]);

  // 2. 送料計算ロジック (共通化)

  const shippingFee = useMemo(() => {
    if (!shippingAddress) return 0;

    const hasBuyerPaysItem = products.some(p => p.shippingPayer === 'buyer');
    return calculateShippingFee(shippingAddress.prefecture, hasBuyerPaysItem);
  }, [products, shippingAddress]);

  if (!isDataLoaded || !shippingAddress) {
    return <LoadingSpinner message="商品情報を読み込み中..." size="lg" fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col">
      <PayCheckForm
        products={products}
        shippingAddress={shippingAddress}
        shippingFee={shippingFee}
        onLoadingChange={setIsPurchasing}
      />
    </div>
  );
}
