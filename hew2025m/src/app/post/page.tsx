'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, MapPin, X } from 'lucide-react';
import Button from '@/components/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import MapModal, { LocationData } from '@/components/MapModal';
import { useAuth } from '@/lib/useAuth';
import { useProfile } from '@/contexts/ProfileContext';
import toast from 'react-hot-toast';


export default function Post() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // 認証チェック：未ログインならログインページへリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // URLクエリパラメータから位置情報を取得
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const addressParam = searchParams.get('address');

    if (lat && lng && addressParam) {
      setLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
      setAddress(addressParam);
    }
  }, [searchParams]);

  // ファイル選択処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 最大4つまでの制限をチェック
    const remainingSlots = 4 - selectedFiles.length;
    if (remainingSlots <= 0) {
      toast.error('メディアは最大4つまで添付できます');
      return;
    }

    // 5つ以上選択された場合の警告
    if (files.length > remainingSlots) {
      toast.error(`メディアは最大4つまでです。選択された${files.length}個のうち、${remainingSlots}個のみ追加されます。`);
    }

    // ファイルサイズとタイプのバリデーション
    const validFiles = files.slice(0, remainingSlots).filter((file) => {
      if (file.size > 10 * 1024 * 1024) { // 10MB制限
        toast.error(`${file.name} は10MBを超えています`);
        return false;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`${file.name} は画像または動画ファイルではありません`);
        return false;
      }
      return true;
    });

    setSelectedFiles([...selectedFiles, ...validFiles]);

    // プレビURLを生成
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

    // 最大4つまでの制限をチェック
    if (selectedFiles.length >= 4) {
      toast.error('メディアは最大4つまで添付できます');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      files.forEach((file) => dt.items.add(file));
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  // 位置情報選択の処理
  const handleSelectLocation = (data: LocationData) => {
    setAddress(data.address);
    setLocation({ lat: data.lat, lng: data.lng });
  };

  // 位置情報のクリア
  const handleClearLocation = () => {
    setAddress('');
    setLocation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // ログインチェック
    if (!user) {
      router.push('/login');
      return;
    }

    // バリデーションチェック - エラーメッセージを収集
    const errors: string[] = [];

    if (!title) {
      errors.push('件名を入力してください');
    } else if (title.length > 30) {
      errors.push('件名は30文字以内で入力してください');
    }

    if (!content) {
      errors.push('本文を入力してください');
    } else if (content.length > 140) {
      errors.push('本文は140文字以内で入力してください');
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

    setIsSubmitting(true);
    setUploadProgress('投稿を準備中...');

    try {
      // 投稿作成日時とユーザー情報を取得
      const timestamp = new Date().toISOString();
      const authorId = `user-${user.uid}`;
      const authorName = profile.displayName || user.displayName || '名無しユーザー';

      let uploadedMedia: Array<{
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
        uniqueId: string;
        order: number;
      }> = [];

      // ファイルがある場合はアップロード
      if (selectedFiles.length > 0) {
        setUploadProgress('画像をアップロード中...');
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('authorId', authorId);
        formData.append('timestamp', timestamp);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('ファイルのアップロードに失敗しました');
        }

        const uploadData = await uploadResponse.json();
        uploadedMedia = uploadData.files;
      }

      // 投稿を作成
      setUploadProgress('投稿を作成中...');
      const postResponse = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          category: '一般',
          media: uploadedMedia,
          authorId,
          authorName,
          tags: address ? [address] : [],
          address: address || undefined,
          location: location || undefined,
        }),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.error || '投稿の作成に失敗しました');
      }

      // プレビューURLを解放
      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      // トーストを表示してから画面遷移
      toast.success('投稿しました');

      // 少し待ってから遷移（トーストが表示されるように）
      setTimeout(() => {
        router.push('/postList');
      }, 500);
    } catch (error) {
      console.error('投稿エラー:', error);
      toast.error(error instanceof Error ? error.message : '投稿の作成に失敗しました');
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-5 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            投稿を作成する
          </h1>
          <p className="text-center text-gray-600 mb-12">
            釣果情報や釣り場の様子を共有しましょう
          </p>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="title" className="block text-lg font-semibold text-gray-700 mb-3">
                  件名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                    title.length > 30
                      ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                  }`}
                  placeholder="件名を入力してください"
                  required
                  disabled={isSubmitting}
                />
                <div className={`text-right text-sm mt-1 ${title.length > 30 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {title.length}/30文字
                  {title.length > 30 && (
                    <span className="ml-2">({title.length - 30}文字超過)</span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-lg font-semibold text-gray-700 mb-3">
                  本文 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                    content.length > 140
                      ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                  }`}
                  placeholder="本文を140字以内で入力してください"
                  required
                  disabled={isSubmitting}
                />
                <div className={`text-right text-sm mt-1 ${content.length > 140 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {content.length}/140文字
                  {content.length > 140 && (
                    <span className="ml-2">({content.length - 140}文字超過)</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  メディア ({selectedFiles.length}/4)
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#2FA3E3] transition-colors duration-300 cursor-pointer"
                  onClick={() => selectedFiles.length < 4 && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="flex justify-center text-gray-400 mb-4">
                    <Upload size={64} />
                  </div>
                  <p className="text-gray-500 mb-4">
                    画像や動画をドラッグ&ドロップまたはクリックして選択
                  </p>
                  <p className="text-sm text-gray-400 mb-4">最大4つまで、各ファイル10MB以下</p>
                  <Button type="button" variant="primary" size="md" disabled={selectedFiles.length >= 4 || isSubmitting}>
                    メディアを選択
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
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

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  <MapPin size={16} className="inline mr-1" />
                  位置情報
                </label>

                {!address ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setIsMapModalOpen(true)}
                    disabled={isSubmitting}
                    icon={<MapPin size={16} />}
                    className="w-full"
                  >
                    位置情報を追加する
                  </Button>
                ) : (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-5">
                    {/* ヘッダー */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={20} className="text-blue-600" />
                        <h4 className="font-semibold text-gray-800">選択中の位置情報</h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearLocation}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="位置情報をクリア"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* 住所 */}
                    <div className="bg-white rounded-lg p-4 mb-3">
                      <div className="text-xs text-gray-600 mb-1">住所</div>
                      <div className="font-medium text-gray-900">{address}</div>
                    </div>

                    {/* 変更ボタン */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMapModalOpen(true)}
                      disabled={isSubmitting}
                      className="w-full bg-white hover:bg-gray-50"
                    >
                      位置を変更する
                    </Button>
                  </div>
                )}
              </div>

              {/* 進行状況表示 */}
              {uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-blue-700">{uploadProgress}</p>
                </div>
              )}

              <div className="text-center pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="px-12 text-xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '投稿中...' : '投稿を作成する'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* マップモーダル */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSelectLocation={handleSelectLocation}
        initialLocation={location && address ? { ...location, address } : undefined}
      />
    </div>
  );
}