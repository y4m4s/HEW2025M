"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  address1: string;
  address2: string;
}

const AddressPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [address, setAddress] = useState<Address>({
    postalCode: '',
    prefecture: '',
    city: '',
    address1: '',
    address2: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.uid !== userId) {
      toast.error('権限がありません');
      router.push(`/profile/${user.uid}`);
      return;
    }

    const fetchAddress = async () => {
      setLoading(true);
      try {
        const addressDocRef = doc(db, 'users', userId, 'private', 'address');
        const addressDoc = await getDoc(addressDocRef);
        if (addressDoc.exists()) {
          setAddress(addressDoc.data() as Address);
        }
      } catch (error) {
        console.error("住所の取得に失敗しました:", error);
        toast.error('住所の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [user, authLoading, userId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const addressDocRef = doc(db, 'users', userId, 'private', 'address');
      await setDoc(addressDocRef, address, { merge: true });
      toast.success('住所を保存しました');
      router.push(`/profile/${userId}`);
    } catch (error) {
      console.error("住所の保存に失敗しました:", error);
      toast.error('住所の保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };
  
    const handleFindAddress = async () => {
    if (!address.postalCode) {
      toast.error('郵便番号を入力してください');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${address.postalCode}`);
      const data = await response.json();
      
      if (data.status === 200 && data.results) {
        const result = data.results[0];
        setAddress(prev => ({
          ...prev,
          prefecture: result.address1,
          city: result.address2,
          address1: result.address3,
        }));
      } else {
        toast.error('住所が見つかりませんでした');
      }
    } catch (error) {
      console.error("住所の検索に失敗しました:", error);
      toast.error('住所の検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };


  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#2FA3E3]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "せのびゴシック" }}>お届け先住所の登録・変更</h1>
      
      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
        
        <div className="space-y-2">
          <label htmlFor="postalCode" className="block font-medium">郵便番号 (ハイフンなし)</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              name="postalCode"
              id="postalCode"
              value={address.postalCode}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-[#2FA3E3] focus:ring-[#2FA3E3]"
              placeholder="例: 1000001"
            />
            <button type="button" onClick={handleFindAddress} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">住所検索</button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="prefecture" className="block font-medium">都道府県</label>
          <input
            type="text"
            name="prefecture"
            id="prefecture"
            value={address.prefecture}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-[#2FA3E3] focus:ring-[#2FA3E3]"
            placeholder="例: 東京都"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="city" className="block font-medium">市区町村</label>
          <input
            type="text"
            name="city"
            id="city"
            value={address.city}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-[#2FA3E3] focus:ring-[#2FA3E3]"
            placeholder="例: 千代田区"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address1" className="block font-medium">番地</label>
          <input
            type="text"
            name="address1"
            id="address1"
            value={address.address1}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-[#2FA3E3] focus:ring-[#2FA3E3]"
            placeholder="例: 千代田1-1"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address2" className="block font-medium">建物名・部屋番号 (任意)</label>
          <input
            type="text"
            name="address2"
            id="address2"
            value={address.address2}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-[#2FA3E3] focus:ring-[#2FA3E3]"
            placeholder="例: まるまるビル 101号室"
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
            <button
                type="button"
                onClick={() => router.back()}
                className="py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >
                キャンセル
            </button>
            <button
                type="submit"
                disabled={saving}
                className="bg-[#2FA3E3] text-white py-2 px-6 rounded-lg hover:bg-[#1d7bb8] transition-colors disabled:bg-gray-400 flex items-center"
            >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存する
            </button>
        </div>

      </form>
    </div>
  );
};

export default AddressPage;
