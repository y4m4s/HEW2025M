'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/components/useCartStore';
import Button from '@/components/Button';
import Image from 'next/image';
import { CreditCard, Loader2, Home, Fish } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // カートが空ならリダイレクト
  useEffect(() => {
    if (isMounted && items.length === 0) {
      toast.error('カートに商品がありません。');
      router.replace('/');
    }
  }, [items, isMounted, router]);

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
        }
      } catch (error) {
        console.error("住所の取得に失敗しました:", error);
      } finally {
        setIsLoadingAddress(false);
      }
    };
    fetchAddress();
  }, [user]);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);

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
    if (prefectures[prefecture]) {
      return prefectures[prefecture];
    }
    return 800; // デフォルト
  };

  const shippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    return calculateShippingFee(address.prefecture);
  }, [subtotal, address.prefecture]);

  const total = subtotal + shippingFee;

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

  if (!isMounted || authLoading || isLoadingAddress) {
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
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md border flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Fish size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                  </div>
                  <p className="font-bold">¥{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3 text-gray-700">
              <div className="flex justify-between"><span>小計</span><span>¥{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between">
                <span>送料</span>
                <span className={shippingFee > 0 ? "font-semibold" : "text-gray-500"}>
                  {shippingFee > 0 ? `¥${shippingFee.toLocaleString()}` : "住所入力後に計算"}
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  ※送料は都道府県により異なります（¥500〜¥1,500）
                </p>
              )}
              <div className="flex justify-between font-bold text-2xl border-t pt-4 mt-4">
                <span>合計</span>
                <span className="text-[#2FA3E3]">¥{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 右側: 住所入力フォーム */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleProceed} className="space-y-6">
              <h2 className="text-xl font-bold mb-4 border-b pb-3 flex items-center gap-2">
                <Home size={24} className="text-[#2FA3E3]" />
                お届け先住所
              </h2>
              {!address.postalCode && (
                <div className="bg-blue-50 border-l-4 border-[#2FA3E3] p-4 rounded-r-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">プロフィールページ</span>で住所を事前に登録しておくと、次回からの入力が簡単になります。
                  </p>
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
              <Button
                type="submit"
                disabled={isSaving}
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
