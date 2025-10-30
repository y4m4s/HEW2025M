'use client';

import { useState, useRef } from 'react';
import { Camera, Fish, X } from 'lucide-react';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

// カテゴリの定義
const CATEGORIES = [
  'ロッド/竿',
  'リール',
  'ルアー',
  'ライン/糸',
  'ハリ/針',
  '餌',
  'ウェア',
  'セット用品',
  'サービス',
  'その他',
] as const;

export default function SellPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ファイル選択処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // ファイルサイズとタイプのバリデーション
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB制限
        alert(`${file.name} は10MBを超えています`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} は画像ファイルではありません`);
        return false;
      }
      return true;
    });

    setSelectedFiles([...selectedFiles, ...validFiles]);

    // プレビューURLを生成
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  // ファイル削除処理
  const handleRemoveFile = (index: number) => {
    // プレビューURLを解放
    URL.revokeObjectURL(previewUrls[index]);

    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  // ドラッグ&ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      files.forEach((file) => dt.items.add(file));
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // 文字数チェック
    if (title.length > 50) {
      alert('商品名は50文字以内で入力してください');
      return;
    }
    if (description.length > 300) {
      alert('商品説明は300文字以内で入力してください');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('出品を準備中...');

    try {
      // 出品作成日時とユーザーIDを生成
      const timestamp = new Date().toISOString();
      const sellerId = 'user-' + Date.now(); // TODO: 実際のユーザーIDに置き換え

      let uploadedImages: string[] = [];

      // ファイルがある場合はアップロード
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

      // 商品を作成
      setUploadProgress('商品を出品中...');
      const productResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category,
          condition,
          images: uploadedImages,
          sellerId,
          sellerName: 'テストユーザー', // TODO: 実際のユーザー名に置き換え
          shippingPayer,
          shippingDays,
        }),
      });

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.error || '商品の出品に失敗しました');
      }

      // 成功したらリダイレクト
      alert('商品が出品されました！');

      // プレビューURLを解放
      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      // マーケットプレイスページにリダイレクト
      router.push('/search');
    } catch (error) {
      console.error('出品エラー:', error);
      alert(error instanceof Error ? error.message : '出品に失敗しました');
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div>

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
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 商品画像 */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">商品画像</label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#2FA3E3] transition-colors duration-300 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="flex justify-center text-gray-400 mb-4">
                      <Camera size={64} />
                    </div>
                    <p className="text-gray-500 mb-4">画像をドラッグ&ドロップまたはクリックして選択</p>
                    <Button type="button" variant="primary" size="md">
                      画像を選択
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* プレビュー表示 */}
                  {previewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`プレビュー ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isSubmitting}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 基本情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">商品名</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                        title.length > 50
                          ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                      }`}
                      placeholder="商品名を入力してください"
                      required
                      disabled={isSubmitting}
                    />
                    <div className={`text-right text-sm mt-1 ${title.length > 50 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {title.length}/50文字
                      {title.length > 50 && (
                        <span className="ml-2">({title.length - 50}文字超過)</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">価格</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-4 pl-8 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                        placeholder="0"
                        min="0"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* カテゴリーと状態 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">カテゴリー</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">選択してください</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">商品の状態</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">選択してください</option>
                      <option value="new">新品・未使用</option>
                      <option value="like-new">未使用に近い</option>
                      <option value="good">目立った傷や汚れなし</option>
                      <option value="fair">やや傷や汚れあり</option>
                      <option value="poor">傷や汚れあり</option>
                    </select>
                  </div>
                </div>

                {/* 商品説明 */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">商品の説明</label>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                      description.length > 300
                        ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                    }`}
                    placeholder="商品の詳細、使用感、注意事項などを記載してください"
                    required
                    disabled={isSubmitting}
                  ></textarea>
                  <div className={`text-right text-sm mt-1 ${description.length > 300 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {description.length}/300文字
                    {description.length > 300 && (
                      <span className="ml-2">({description.length - 300}文字超過)</span>
                    )}
                  </div>
                </div>

                {/* 配送情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">配送料の負担</label>
                    <select
                      value={shippingPayer}
                      onChange={(e) => setShippingPayer(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">選択してください</option>
                      <option value="seller">送料込み（出品者負担）</option>
                      <option value="buyer">着払い（購入者負担）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">発送までの日数</label>
                    <select
                      value={shippingDays}
                      onChange={(e) => setShippingDays(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">選択してください</option>
                      <option value="1-2">1〜2日で発送</option>
                      <option value="2-3">2〜3日で発送</option>
                      <option value="4-7">4〜7日で発送</option>
                    </select>
                  </div>
                </div>

                {/* 進行状況表示 */}
                {uploadProgress && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-blue-700">{uploadProgress}</p>
                  </div>
                )}

                {/* 出品ボタン */}
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
      </div>

    </div>
  );
}