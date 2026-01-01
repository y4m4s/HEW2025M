"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/components/useCartStore';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Loader2, CreditCard, Home, Truck } from 'lucide-react';

interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  address1: string;
  address2: string;
}

const AddressReviewForm = ({ onAddressConfirm }: { onAddressConfirm: (address: Address) => void }) => {
  const { user } = useAuth();
  const [address, setAddress] = useState<Address>({
    postalCode: '',
    prefecture: '',
    city: '',
    address1: '',
    address2: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

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
        console.error("住所の取得に失敗しました:", error);
        toast.error("住所の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [user]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };
  
  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
        toast.error("ログインしてください。");
        return;
    }
    setIsSaving(true);
    try {
        // ここで住所情報を確認・保存する
        onAddressConfirm(address);
        // sessionStorageに一時的に保存することも可能
        sessionStorage.setItem('shippingAddress', JSON.stringify(address));
        toast.success("お届け先住所を確認しました。");
        router.push('/PayCheck');
    } catch(error) {
        console.error("住所の確認中にエラーが発生しました:", error);
        toast.error("エラーが発生しました。");
    } finally {
        setIsSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-[#2FA3E3]" /></div>;
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-6">
      <h2 className="text-xl font-bold mb-4 border-b pb-3 flex items-center gap-2"><Home size={24}/>お届け先住所</h2>
      <div className="space-y-4">
        <div>
          <label className="block font-medium text-sm mb-1">郵便番号</label>
          <input name="postalCode" value={address.postalCode} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg shadow-sm" required />
        </div>
        <div>
          <label className="block font-medium text-sm mb-1">都道府県</label>
          <input name="prefecture" value={address.prefecture} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg shadow-sm" required />
        </div>
        <div>
          <label className="block font-medium text-sm mb-1">市区町村</label>
          <input name="city" value={address.city} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg shadow-sm" required />
        </div>
        <div>
          <label className="block font-medium text-sm mb-1">番地</label>
          <input name="address1" value={address.address1} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg shadow-sm" required />
        </div>
        <div>
          <label className="block font-medium text-sm mb-1">建物名・部屋番号 (任意)</label>
          <input name="address2" value={address.address2 || ''} onChange={handleAddressChange} className="w-full border-gray-300 rounded-lg shadow-sm" />
        </div>
      </div>
      <button type="submit" disabled={isSaving} className="w-full bg-[#2FA3E3] text-white py-3 mt-6 rounded-lg hover:bg-[#1d7bb8] transition-colors disabled:bg-gray-400 flex items-center justify-center">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSaving ? '処理中...' : '支払いへ進む'}
      </button>
    </form>
  );
};

const PayCheckPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const items = useCartStore((state) => state.items);
  const { clearCart } = useCartStore();
  
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // コンポーネントがマウントされた後、かつカートが空の場合にリダイレクト
    if (isMounted && items.length === 0) {
      toast.error('カートに商品がありません。');
      router.replace('/');
    }
  }, [items, isMounted, router]);
  
  useEffect(() => {
    const fetchAddress = async () => {
        if(!user) return;
        try {
            const addressDocRef = doc(db, 'users', user.uid, 'private', 'address');
            const addressDoc = await getDoc(addressDocRef);
            if (addressDoc.exists()) {
                setShippingAddress(addressDoc.data() as Address);
            }
        } catch (e) {
            console.error(e);
        }
    }
    fetchAddress();
  }, [user]);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);
  
  const shippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    const prefecture = shippingAddress?.prefecture;
    const prefectures: { [key: string]: number } = {
        '北海道': 1200, '沖縄': 1500,
        '青森': 900, '岩手': 900, '宮城': 900, '秋田': 900, '山形': 900, '福島': 900,
        '茨城': 700, '栃木': 700, '群馬': 700, '埼玉': 700, '千葉': 700, '東京': 700, '神奈川': 700, '山梨': 700,
        '新潟': 800, '長野': 800, '富山': 800, '石川': 800, '福井': 800,
        '岐阜': 600, '静岡': 600, '愛知': 500, '三重': 600,
        '滋賀': 700, '京都': 700, '大阪': 700, '兵庫': 700, '奈良': 700, '和歌山': 700,
        '鳥取': 900, '島根': 900, '岡山': 900, '広島': 900, '山口': 900,
        '徳島': 1000, '香川': 1000, '愛媛': 1000, '高知': 1000,
        '福岡': 1100, '佐賀': 1100, '長崎': 1100, '熊本': 1100, '大分': 1100, '宮崎': 1100, '鹿児島': 1100,
    };
    if (prefecture && prefectures[prefecture]) {
        return prefectures[prefecture];
    }
    return 800; // デフォルト
  }, [subtotal, shippingAddress]);

  const total = subtotal + shippingFee;

  const handleAddressConfirm = (address: Address) => {
    setShippingAddress(address);
  };
  
  if (!isMounted || authLoading) {
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
          ご注文内容の確認
        </h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-3 text-gray-700 mb-8">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">ご注文概要</h2>
            <div className="flex justify-between"><span>小計</span><span>¥{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between">
                <span>送料</span>
                <span>¥{shippingFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-2xl border-t pt-4 mt-4">
                <span>合計</span>
                <span>¥{total.toLocaleString()}</span>
            </div>
          </div>
          <AddressReviewForm onAddressConfirm={handleAddressConfirm} />
        </div>
      </div>
    </div>
  );
};

export default PayCheckPage;