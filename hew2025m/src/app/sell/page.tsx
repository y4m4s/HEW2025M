'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Image from 'next/image';
import { Camera, Fish, X, WandSparkles, Puzzle } from 'lucide-react';
import { GiFishingPole, GiFishingHook, GiFishingLure, GiEarthWorm, GiSpanner } from 'react-icons/gi';
import { FaTape, FaTshirt, FaBox } from 'react-icons/fa';
import { SiHelix } from 'react-icons/si';
import { Button, PriceAdvisorModal, CustomSelect, LoadingSpinner, ImageModal } from '@/components';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useProfileStore } from '@/stores/useProfileStore';
import toast from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductFormSchema } from '@/lib/schemas';
import { z } from 'zod';
import { uploadFileToFirebase } from '@/lib/firebaseUtils';

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
];

const CONDITIONS = [
  { label: '新品・未使用', value: 'new' },
  { label: '未使用に近い', value: 'like-new' },
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

// ZodスキーマからTypeScriptの型を推論
type ProductFormData = z.infer<typeof ProductFormSchema>;

export default function SellPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  const profile = useProfileStore((state) => state.profile);
  const profileLoading = useProfileStore((state) => state.loading);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // 認証チェック：未ログインならログインページへリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      title: '',
      price: undefined as number | undefined,
      category: '',
      condition: undefined as 'new' | 'like-new' | 'good' | 'fair' | 'poor' | undefined,
      description: '',
      shippingPayer: undefined as 'seller' | 'buyer' | undefined,
      shippingDays: undefined as '1-2' | '2-3' | '4-7' | undefined
    },
  });

  const titleValue = watch('title');
  const descriptionValue = watch('description');

  const handlePriceSelect = (suggestedPrice: number) => {
    setValue('price', suggestedPrice, { shouldValidate: true });
    toast.success(`価格が ¥${suggestedPrice.toLocaleString()} に設定されました`);
  };

  const handlePriceSuggest = () => {
    if (!titleValue) {
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
  const onSubmit = async (data: ProductFormData) => {
    if (isSubmitting) return;

    if (!user) {
      router.push('/login');
      return;
    }
    setUploadProgress('出品を準備中...');

    try {
      const sellerId = `user-${user.uid}`;
      const sellerName = profile.displayName || user.displayName || '名無しユーザー';

      let uploadedImages: string[] = [];

      if (selectedFiles.length > 0) {
        setUploadProgress('画像をアップロード中...');

        try {
          const uploadPromises = selectedFiles.map(async (file, index) => {
            // プログレス表示の更新
            setUploadProgress(`画像をアップロード中 (${index + 1}/${selectedFiles.length})...`);
            return uploadFileToFirebase(file, 'products');
          });

          uploadedImages = await Promise.all(uploadPromises);
        } catch (error) {
          console.error("Upload failed", error);
          throw new Error("画像のアップロードに失敗しました");
        }
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
          ...data,
          images: uploadedImages,
          sellerId, // sellerIdとsellerNameは別途追加
          sellerName,
        }),
      });

      if (!productResponse.ok) {
        let errorMessage = '商品の出品に失敗しました';
        try {
          const errorData = await productResponse.json();
          errorMessage = errorData.error || errorMessage;
          // サーバーからの詳細なバリデーションエラーをコンソールに出力してデバッグしやすくする
          if (errorData.details) {
            console.error("Server validation failed:", errorData.details);
          }
        } catch {
          // レスポンスがJSONでない場合、より具体的なエラーを提供
          console.error("Could not parse error response as JSON:", productResponse.statusText);
          errorMessage = `サーバーで問題が発生しました (Status: ${productResponse.status})。設定を確認してください。`;
        }
        throw new Error(errorMessage);
      }

      // 成功時のレスポンスを取得（エラーが発生しても無視）
      try {
        await productResponse.json();
      } catch {
        // レスポンスが空でもエラーにしない（成功時は無視）
      }

      setUploadProgress('');
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
      <div className="container mx-auto px-4 sm:px-5 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            商品を出品する
          </h1>
          <p className="text-center text-sm sm:text-base text-gray-600 mb-6 sm:mb-12">
            釣り用品を出品して、他の釣り人とつながりましょう
          </p>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 sm:space-y-8">
              {/* 商品の画像 */}
              <div>
                <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                  商品画像 ({selectedFiles.length}/4)
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 md:p-12 text-center hover:border-[#2FA3E3] transition-colors duration-300 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex justify-center text-gray-400 mb-3 sm:mb-4">
                    <Camera size={48} className="sm:w-16 sm:h-16" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">画像をドラッグ&ドロップまたはクリックして選択</p>
                  <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">最大4枚まで</p>
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
                        <div
                          className="relative w-full h-32 cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 hover:border-[#2FA3E3] transition-all hover:shadow-lg"
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setIsImageModalOpen(true);
                          }}
                        >
                          <Image
                            src={url}
                            alt={`プレビュー ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
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
                <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className={`w-full p-3 sm:p-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 text-sm sm:text-base ${errors.title ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                    }`}
                  placeholder="商品名を入力してください"
                  aria-invalid={errors.title ? "true" : "false"}
                  disabled={isSubmitting}
                />
                {errors.title && <p className="text-red-600 text-sm mt-2" role="alert">{errors.title.message}</p>}
                <div className={`text-right text-sm mt-1 ${titleValue.length > 30 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {titleValue.length}/30文字
                  {titleValue.length > 30 && (
                    <span className="ml-2">({titleValue.length - 30}文字超過)</span>
                  )}
                </div>
              </div>

              {/* 価格・カテゴリー・商品の状態 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                    価格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm sm:text-base">¥</span>
                    <input
                      {...register('price')}
                      type="text"
                      inputMode="numeric"
                      onChange={(e) => {
                        // 数字のみを許可（e, +, -, . などを除外）
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setValue('price', value === '' ? undefined : Number(value), { shouldValidate: true });
                      }}
                      className={`w-full p-3 sm:p-4 pl-7 sm:pl-8 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 text-sm sm:text-base ${errors.price
                        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                        }`}
                      placeholder="0"
                      aria-invalid={errors.price ? "true" : "false"}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.price && <p className="text-red-600 text-sm mt-2" role="alert">{errors.price.message}</p>}
                  <div className="mt-3 text-right">
                    <button
                      type="button"
                      onClick={handlePriceSuggest}
                      disabled={!titleValue || isSubmitting}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <WandSparkles size={16} />
                      AIで価格相場をチェック
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                    カテゴリー <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        {...field}
                        value={field.value as string}
                        options={CATEGORIES}
                        placeholder="選択してください"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.category && <p className="text-red-600 text-sm mt-2" role="alert">{errors.category.message}</p>}
                </div>
                <div>
                  <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                    商品の状態 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="condition"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        {...field}
                        value={field.value as string}
                        options={CONDITIONS}
                        placeholder="選択してください"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.condition && <p className="text-red-600 text-sm mt-2" role="alert">{errors.condition.message}</p>}
                </div>
              </div>

              {/* 商品詳細 */}
              <div>
                <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                  商品の説明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={6}
                  className={`w-full p-3 sm:p-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 resize-none text-sm sm:text-base ${(descriptionValue?.length || 0) > 300
                    ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                    }`}
                  placeholder="商品の詳細、使用感、注意事項などを記載してください"
                  aria-invalid={errors.description ? "true" : "false"}
                  disabled={isSubmitting}
                ></textarea>
                {errors.description && <p className="text-red-600 text-sm mt-2" role="alert">{errors.description.message}</p>}
                <div className={`text-right text-sm mt-1 ${(descriptionValue?.length || 0) > 300 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {descriptionValue?.length || 0}/300文字
                  {(descriptionValue?.length || 0) > 300 && (
                    <span className="ml-2">({(descriptionValue?.length || 0) - 300}文字超過)</span>
                  )}
                </div>
              </div>

              {/* 送信詳細*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                    配送料の負担 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="shippingPayer"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        {...field}
                        value={field.value as string}
                        options={SHIPPING_PAYERS}
                        placeholder="選択してください"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.shippingPayer && <p className="text-red-600 text-sm mt-2" role="alert">{errors.shippingPayer.message}</p>}
                </div>
                <div>
                  <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                    発送までの日数 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="shippingDays"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        {...field}
                        value={field.value as string}
                        options={SHIPPING_DAYS}
                        placeholder="選択してください"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.shippingDays && <p className="text-red-600 text-sm mt-2" role="alert">{errors.shippingDays.message}</p>}
                </div>
              </div>

              {/* アップロード*/}
              {uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-blue-700 text-sm sm:text-base">{uploadProgress}</p>
                </div>
              )}

              {/*送信フォーム*/}
              <div className="text-center pt-4 sm:pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="px-8 sm:px-12 text-lg sm:text-xl"
                  icon={<Fish size={20} className="sm:w-6 sm:h-6" />}
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
        productName={titleValue}
        onPriceSelect={handlePriceSelect}
      />

      {/* 画像拡大モーダル */}
      <ImageModal
        images={previewUrls}
        initialIndex={selectedImageIndex}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </div>
  );
}
