'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Fish, X, WandSparkles, Puzzle } from 'lucide-react';
import { GiFishingPole, GiFishingHook, GiFishingLure, GiEarthWorm, GiSpanner } from 'react-icons/gi';
import { FaTape, FaTshirt, FaBox } from 'react-icons/fa';
import { SiHelix } from 'react-icons/si';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useProfile } from '@/contexts/ProfileContext';
import toast from 'react-hot-toast';
import PriceAdvisorModal from '@/components/PriceAdvisorModal';
import CustomSelect from '@/components/CustomSelect';
import LoadingSpinner from '@/components/LoadingSpinner';

// カテゴリの定義（表示名とDB保存用の値のマッピング）
const CATEGORIES = [
  { label: 'ロッド/竿', value: 'rod', icon: GiFishingPole },
  { label: 'リール', value: 'reel', icon: FaTape },
  { label: 'ルアー', value: 'lure', icon: GiFishingLure },
  { label: 'ライン/糸', value: 'line', icon: SiHelix },
  { label: 'ハリ/針', value: 'hook', icon: GiFishingHook },
  { label: '餌', value: 'bait', icon: GiEarthWorm },
  { label: 'ウェア', value: 'wear', icon: FaTshirt },
  { label: 'セット用品', value: 'set', icon: FaBox },
  { label: 'サービス', value: 'service', icon: GiSpanner },
  { label: 'その他', value: 'other', icon: Puzzle },
] as const;

const CONDITIONS = [
  { label: '新品・未使用', value: 'new' },
  { label: '目立った傷や汚れなし', value: 'good' },
  { label: 'やや傷や汚れあり', value: 'fair' },
  { label: '傷や汚れあり', value: 'poor' },
];

const SHIPPING_PAYERS = [
  { label: '送料込み（出品者負担）', value: 'seller' },
  { label: '着払い（購入者負担）', value: 'buyer' },
];

const SHIPPING_DAYS = [
  { label: '1〜2日で発送', value: '1-2' },
  { label: '2〜3日で発送', value: '2-3' },
  { label: '4〜7日で発送', value: '4-7' },
];

export default function SellPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [shippingPayer, setShippingPayer] = useState('');
  const [shippingDays, setShippingDays] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);

  // 認証チェック：未ログインならログインページへリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handlePriceSelect = (suggestedPrice: number) => {
    setPrice(String(suggestedPrice));
    toast.success(`価格が ¥${suggestedPrice.toLocaleString()} に設定されました`);
  };

  const handlePriceSuggest = () => {
    if (!title) {
        toast.error('価格を提案するには、まず商品名を入力してください。');
        return;
    }
    setIsAdvisorOpen(true);
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 最大4つまでの制限をチェック
    const remainingSlots = 4 - selectedFiles.length;
    if (remainingSlots <= 0) {
      toast.error('画像は最大4つまで添付できます');
      return;
    }

    // 5つ以上選択された場合の警告
    if (files.length > remainingSlots) {
      toast.error(`画像は最大4つまでです。選択された${files.length}枚のうち、${remainingSlots}枚のみ追加されます。`);
    }

    const validFiles = files.slice(0, remainingSlots).filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} は10MBを超えています`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} は画像ファイルではありません`);
        return false;
      }
      return true;
    });

    setSelectedFiles([...selectedFiles, ...validFiles]);

    // URL作成view
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  // 削除
  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  // 送信フォーム
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitted(true);

    // バリデーションチェック - エラーメッセージを収集
    const errors: string[] = [];

    if (!title) {
      errors.push('商品名を入力してください');
    } else if (title.length > 30) {
      errors.push('商品名は30文字以内で入力してください');
    }

    if (!price) {
      errors.push('価格を入力してください');
    } else if (Number(price) <= 0) {
      errors.push('価格は1円以上で入力してください');
    } else if (Number(price) > 99999999) {
      errors.push('価格は99,999,999円以下で入力してください');
    }

    if (!category) {
      errors.push('カテゴリーを選択してください');
    }

    if (!condition) {
      errors.push('商品の状態を選択してください');
    }

    if (!description) {
      errors.push('商品の説明を入力してください');
    } else if (description.length > 300) {
      errors.push('商品の説明は300文字以内で入力してください');
    }

    if (!shippingPayer) {
      errors.push('配送料の負担を選択してください');
    }

    if (!shippingDays) {
      errors.push('発送までの日数を選択してください');
    }

    // エラーがある場合はtoastで表示
    if (errors.length > 0) {
      toast.error(
        <div className="flex flex-col">
          <div className="font-bold mb-2">入力内容に不備があります</div>
          <ul className="list-disc list-inside space-y-1 ml-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    if (isSubmitting) return;

    // 認証チェック
    if (!user) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('出品を準備中...');

    try {
      const timestamp = new Date().toISOString();
      const sellerId = `user-${user.uid}`;
      const sellerName = profile.displayName || user.displayName || '名無しユーザー';

      let uploadedImages: string[] = [];

      if (selectedFiles.length > 0) {
        setUploadProgress('画像をアップロード中...');
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('sellerId', sellerId);
        formData.append('timestamp', timestamp);

        const uploadResponse = await fetch('/api/upload-product', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('ファイルのアップロードに失敗しました');
        }

        const uploadData = await uploadResponse.json();
        uploadedImages = uploadData.imageUrls;
      }

      setUploadProgress('商品を出品中...');

      // Firebaseトークンを取得
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('認証トークンの取得に失敗しました');
      }

      const productResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category,
          condition,
          images: uploadedImages,
          sellerId,
          sellerName,
          shippingPayer,
          shippingDays,
        }),
      });

      if (!productResponse.ok) {
        try {
          const errorData = await productResponse.json();
          throw new Error(errorData.error || '商品の出品に失敗しました');
        } catch (jsonError) {
          throw new Error('商品の出品に失敗しました');
        }
      }

      // 成功時のレスポンスを取得（エラーが発生しても無視）
      try {
        await productResponse.json();
      } catch (jsonError) {
        // レスポンスが空でもエラーにしない
        console.log('Response body is empty or invalid JSON, but request was successful');
      }

      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      // トーストを表示してから画面遷移
      toast.success('商品を出品しました');

      // 少し待ってから遷移（トーストが表示されるように）
      setTimeout(() => {
        router.push('/product-list');
      }, 500);
    } catch (error) {
      console.error('出品エラー:', error);
      toast.error(error instanceof Error ? error.message : '商品の出品に失敗しました');
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  // ローディング中の表示
  if (authLoading || profileLoading) {
    return <LoadingSpinner message="出品ページを読み込み中……" size="lg" fullScreen />;
  }

  // 未認証の場合は何も表示しない（useEffectでリダイレクト済み）
  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-5 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            商品を出品する
          </h1>
          <p className="text-center text-gray-600 mb-12">
            釣り用品を出品して、他の釣り人とつながりましょう
          </p>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              {/* 商品の画像 */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  商品画像 ({selectedFiles.length}/4)
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#2FA3E3] transition-colors duration-300 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex justify-center text-gray-400 mb-4">
                    <Camera size={64} />
                  </div>
                  <p className="text-gray-500 mb-4">画像をドラッグ&ドロップまたはクリックして選択</p>
                  <p className="text-sm text-gray-400 mb-4">最大4枚まで</p>
                  <Button type="button" variant="primary" size="md" disabled={selectedFiles.length >= 4 || isSubmitting}>
                    画像を選択
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isSubmitting || selectedFiles.length >= 4}
                  />
                </div>

                {/* プレビュー表示 */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
                          alt={`プレビュー ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 商品名 */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                    submitted && title === "" ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                  }`}
                  placeholder="商品名を入力してください"
                  required
                  aria-required="true"
                  aria-invalid={submitted && title === "" ? "true" : "false"}
                  disabled={isSubmitting}
                />
                {submitted && title === "" && (
                  <p className="text-red-600 text-sm mt-2" role="alert">
                    商品名は必須です。
                  </p>
                )}
                <div className={`text-right text-sm mt-1 ${title.length > 30 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {title.length}/30文字
                  {title.length > 30 && (
                    <span className="ml-2">({title.length - 30}文字超過)</span>
                  )}
                </div>
              </div>

              {/* 価格・カテゴリー・商品の状態 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    価格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => {
                        // 数字のみを許可（e, +, -, . などを除外）
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setPrice(value);
                      }}
                      className={`w-full p-4 pl-8 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                        submitted && (price === "" || Number(price) <= 0 || Number(price) > 99999999)
                          ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                      }`}
                      placeholder="0"
                      required
                      aria-required="true"
                      aria-invalid={submitted && (price === "" || Number(price) <= 0 || Number(price) > 99999999) ? "true" : "false"}
                      disabled={isSubmitting}
                    />
                  </div>
                  {submitted && price === "" && (
                    <p className="text-red-600 text-sm mt-2" role="alert">
                      価格は必須です。
                    </p>
                  )}
                  {submitted && price !== "" && Number(price) <= 0 && (
                    <p className="text-red-600 text-sm mt-2" role="alert">
                      価格は1円以上で入力してください。
                    </p>
                  )}
                  {submitted && price !== "" && Number(price) > 99999999 && (
                    <p className="text-red-600 text-sm mt-2" role="alert">
                      価格は99,999,999円以下で入力してください。
                    </p>
                  )}
                  <div className="mt-3 text-right">
                    <button
                        type="button"
                        onClick={handlePriceSuggest}
                        disabled={!title || isSubmitting}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <WandSparkles size={16} />
                        AIで価格相場をチェック
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    カテゴリー <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={category}
                    onChange={setCategory}
                    options={CATEGORIES}
                    placeholder="選択してください"
                    disabled={isSubmitting}
                  />
                  {submitted && category === "" && (
                    <p className="text-red-600 text-sm mt-2" role="alert">
                      カテゴリーは必須です。
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    商品の状態 <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={condition}
                    onChange={setCondition}
                    options={CONDITIONS}
                    placeholder="選択してください"
                    disabled={isSubmitting}
                  />
                  {submitted && condition === "" && (
                    <p className="text-red-600 text-sm mt-2" role="alert">
                      商品の状態は必須です。
                    </p>
                  )}
                </div>
              </div>

              {/* 商品詳細 */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  商品の説明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                    description.length > 300
                      ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                  }`}
                  placeholder="商品の詳細、使用感、注意事項などを記載してください"
                  required
                  aria-required="true"
                  aria-invalid={submitted && description === "" ? "true" : "false"}
                  disabled={isSubmitting}
                ></textarea>
                {submitted && description === "" && (
                  <p className="text-red-600 text-sm mt-2" role="alert">
                    商品の説明は必須です。
                  </p>
                )}
                <div className={`text-right text-sm mt-1 ${description.length > 300 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {description.length}/300文字
                  {description.length > 300 && (
                    <span className="ml-2">({description.length - 300}文字超過)</span>
                  )}
                </div>
              </div>

              {/* 送信詳細*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    配送料の負担 <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={shippingPayer}
                    onChange={setShippingPayer}
                    options={SHIPPING_PAYERS}
                    placeholder="選択してください"
                    disabled={isSubmitting}
                  />
                  {submitted && shippingPayer === "" && (
                    <p className="text-red-600 text-sm mt-2" role="alert">
                      配送料の負担は必須です。
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    発送までの日数 <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={shippingDays}
                    onChange={setShippingDays}
                    options={SHIPPING_DAYS}
                    placeholder="選択してください"
                    disabled={isSubmitting}
                  />
                  {submitted && shippingDays === "" && (
                    <p className="text-red-600 text-sm mt-2" role="alert">
                      発送までの日数は必須です。
                    </p>
                  )}
                </div>
              </div>

              {/* アップロード*/}
              {uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-blue-700">{uploadProgress}</p>
                </div>
              )}

              {/*送信フォーム*/}
              <div className="text-center pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="px-12 text-xl"
                  icon={<Fish size={24} />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '出品中...' : '商品を出品する'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <PriceAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        productName={title}
        onPriceSelect={handlePriceSelect}
      />
    </div>
  );
}
