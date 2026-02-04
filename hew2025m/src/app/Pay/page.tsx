'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Loader2, Home, Fish } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { calculateShippingFee } from '@/lib/shipping';
import { doc, getDoc } from 'firebase/firestore';
import { decodeHtmlEntities } from '@/lib/sanitize';
import { useCartStore } from '@/stores/useCartStore';
import { Button, type CartProduct } from '@/components';

interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  address1: string;
  address2: string;
}

export default function PayPage() {
  const items = useCartStore((state) => state.items);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [address, setAddress] = useState<Address>({
    postalCode: '',
    prefecture: '',
    city: '',
    address1: '',
    address2: '',
  });
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // APIから取得する詳細な商品情報
  const [products, setProducts] = useState<(CartProduct & { cartItemId: string; shippingPayer?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // 認証チェック：未ログインならログインページへリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // カート内の商品の詳細情報をAPIから取得
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!isMounted || items.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const productDetails = await Promise.all(
          items.map(async (item) => {
            try {
              const response = await fetch(`/api/products/${item.id}`);
              if (!response.ok) {
                // 商品が削除されている場合はnullを返す
                console.warn(`商品ID ${item.id} は削除されています`);
                return null;
              }

              const data = await response.json();
              const product = data.product;

              // 商品が売り切れまたは予約済みの場合はnullを返してカートから削除
              if (product.status === 'sold' || product.status === 'reserved') {
                console.warn(`商品ID ${item.id} は${product.status === 'sold' ? 'SOLD' : 'SOLD'}です`);
                return null;
              }

              return {
                cartItemId: item.id,
                id: product._id,
                name: product.title,
                price: product.price, // APIから最新の価格を取得
                sellerName: product.sellerName || '出品者未設定',
                imageUrl: product.images?.[0],
                category: product.category,
                condition: product.condition,
                shippingDays: product.shippingDays,
                description: product.description,
                shippingPayer: product.shippingPayer, // 送料負担情報を追加
              };
            } catch (error) {
              console.error(`商品ID ${item.id} の取得エラー:`, error);
              return null;
            }
          })
        );

        // nullを除外して有効な商品のみを設定
        setProducts(productDetails.filter((product) => product !== null) as (CartProduct & { cartItemId: string; shippingPayer?: string })[]);
      } catch (error) {
        console.error('商品詳細取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [isMounted, items]);

  // 有効な商品のみで計算
  const validProducts = products.filter((product) => product !== null);

  // ユーザーの保存済み住所を取得
  useEffect(() => {
    const fetchAddress = async () => {
      if (!user) return;
      setIsLoadingAddress(true);
      try {
        const addressDocRef = doc(db, 'users', user.uid, 'private', 'address');
        const addressDoc = await getDoc(addressDocRef);
        if (addressDoc.exists()) {
          setAddress(addressDoc.data() as Address);
          // 住所が設定されている場合は編集モードをオフ
          setIsEditingAddress(false);
        } else {
          // 住所が設定されていない場合は編集モードをオン
          setIsEditingAddress(true);
        }
      } catch (error) {
        console.error("住所の取得に失敗しました:", error);
        setIsEditingAddress(true);
      } finally {
        setIsLoadingAddress(false);
      }
    };
    fetchAddress();
  }, [user]);

  const calculateSubtotal = useCallback(() => {
    return validProducts.reduce((acc, product) => {
      const cartItem = items.find(i => i.id === product.cartItemId);
      const quantity = cartItem ? cartItem.quantity : 1;
      return acc + (product.price * quantity);
    }, 0);
  }, [validProducts, items]);

  const subtotalWithQuantity = useMemo(() => calculateSubtotal(), [calculateSubtotal]);

  const shippingFeeWithQuantity = useMemo(() => {
    if (subtotalWithQuantity === 0) return 0;

    // 購入者負担の商品が含まれているかチェック
    const hasBuyerPaysItem = validProducts.some(product => product.shippingPayer === 'buyer');

    return calculateShippingFee(address.prefecture, hasBuyerPaysItem);
  }, [subtotalWithQuantity, address.prefecture, validProducts]);

  const totalWithQuantity = subtotalWithQuantity + shippingFeeWithQuantity;

  // 住所が設定されているかチェック
  const hasAddress = address.postalCode && address.prefecture && address.city && address.address1;

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("ログインしてください。");
      return;
    }
    setIsSaving(true);
    try {
      // sessionStorageに住所を保存
      sessionStorage.setItem('shippingAddress', JSON.stringify(address));
      router.push('/pay-check');
    } catch (error) {
      console.error("住所の確認中にエラーが発生しました:", error);
      toast.error("エラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted || authLoading || isLoadingAddress || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#2FA3E3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <CreditCard size={32} className="text-blue-500" />
          ご注文内容の確認
        </h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左側: 注文概要 */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">注文概要</h2>
            <div className="space-y-4 mb-6">
              {validProducts.map((product) => {
                const cartItem = items.find(i => i.id === product.cartItemId);
                const quantity = cartItem ? cartItem.quantity : 1;

                return (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md border flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={decodeHtmlEntities(product.imageUrl)}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Fish size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-600">数量: {quantity}</p>
                      <p className="text-xs text-gray-500">{product.shippingPayer === 'buyer' ? '送料別（購入者負担）' : '送料込み（出品者負担）'}</p>
                    </div>
                    <p className="font-bold">¥{(product.price * quantity).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-3 text-gray-700">
              <div className="flex justify-between"><span>小計</span><span>¥{subtotalWithQuantity.toLocaleString()}</span></div>
              <div className="flex justify-between">
                <span>送料</span>
                <span className={shippingFeeWithQuantity > 0 ? "font-semibold" : "text-gray-500"}>
                  {shippingFeeWithQuantity > 0 ? `¥${shippingFeeWithQuantity.toLocaleString()}` : address.prefecture && !isLoadingAddress && products.length > 0 ? "¥0 (出品者負担)" : "住所入力後に計算"}
                </span>
              </div>
              {shippingFeeWithQuantity > 0 && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  ※送料は都道府県により異なります（¥500〜¥1,500）
                </p>
              )}
              <div className="flex justify-between font-bold text-2xl border-t pt-4 mt-4">
                <span>合計</span>
                <span className="text-[#2FA3E3]">¥{totalWithQuantity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 右側: 住所入力フォーム */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleProceed} className="space-y-6">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Home size={24} className="text-[#2FA3E3]" />
                  お届け先住所
                </h2>
                {hasAddress && !isEditingAddress && (
                  <Button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    variant="outline"
                    size="sm"
                  >
                    住所を変更する
                  </Button>
                )}
              </div>

              {/* 住所が設定されていて、編集モードでない場合は表示のみ */}
              {hasAddress && !isEditingAddress ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2 text-gray-700">
                      <p><span className="font-semibold">郵便番号:</span> {address.postalCode}</p>
                      <p><span className="font-semibold">都道府県:</span> {address.prefecture}</p>
                      <p><span className="font-semibold">市区町村:</span> {address.city}</p>
                      <p><span className="font-semibold">番地:</span> {address.address1}</p>
                      {address.address2 && (
                        <p><span className="font-semibold">建物名・部屋番号:</span> {address.address2}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {!hasAddress && (
                    <div className="bg-blue-50 border-l-4 border-[#2FA3E3] p-4 rounded-r-lg">
                      <p className="text-sm text-gray-700">
                        <Link
                          href="/settings/address"
                          className="font-semibold text-[#2FA3E3] hover:text-[#1d7bb8] underline decoration-2 underline-offset-2 hover:decoration-[#1d7bb8] transition-colors"
                        >
                          設定ページ
                        </Link>で住所を事前に登録しておくことが可能です。
                      </p>
                    </div>
                  )}
                  {isEditingAddress && hasAddress && (
                    <div className="flex justify-end mb-2">
                      <Button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        variant="ghost"
                        size="sm"
                      >
                        キャンセル
                      </Button>
                    </div>
                  )}
                  <div className="space-y-4">
                <div>
                  <label className="block font-medium text-sm mb-1">郵便番号</label>
                  <input
                    name="postalCode"
                    value={address.postalCode}
                    onChange={handleAddressChange}
                    className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2FA3E3] focus:border-transparent"
                    placeholder="例: 1000001"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-sm mb-1">都道府県</label>
                  <input
                    name="prefecture"
                    value={address.prefecture}
                    onChange={handleAddressChange}
                    className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2FA3E3] focus:border-transparent"
                    placeholder="例: 東京都"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-sm mb-1">市区町村</label>
                  <input
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2FA3E3] focus:border-transparent"
                    placeholder="例: 千代田区"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-sm mb-1">番地</label>
                  <input
                    name="address1"
                    value={address.address1}
                    onChange={handleAddressChange}
                    className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2FA3E3] focus:border-transparent"
                    placeholder="例: 千代田1-1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-sm mb-1">建物名・部屋番号 (任意)</label>
                  <input
                    name="address2"
                    value={address.address2 || ''}
                    onChange={handleAddressChange}
                    className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2FA3E3] focus:border-transparent"
                    placeholder="例: まるまるビル 101号室"
                  />
                </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={isSaving || !hasAddress}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    処理中...
                  </>
                ) : (
                  '支払いへ進む'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
