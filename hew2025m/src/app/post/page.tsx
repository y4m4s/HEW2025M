'use client';

import { useState, useRef } from 'react';
import { Upload, MapPin, X } from 'lucide-react';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import MapModal, { LocationData } from '@/components/MapModal';


export default function Post() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
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
      if (file.size > 10 * 1024 * 1024) { // 10MB制限
        alert(`${file.name} は10MBを超えています`);
        return false;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`${file.name} は画像または動画ファイルではありません`);
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

  // 位置情報選択の処理
  const handleSelectLocation = (data: LocationData) => {
    setLocationData(data);
    setLocation(data.address);
  };

  // 位置情報のクリア
  const handleClearLocation = () => {
    setLocationData(null);
    setLocation('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // 文字数チェック
    if (title.length > 50) {
      alert('件名は50文字以内で入力してください');
      return;
    }
    if (content.length > 140) {
      alert('本文は140文字以内で入力してください');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('投稿を準備中...');

    try {
      // 投稿作成日時とユーザーIDを生成
      const timestamp = new Date().toISOString();
      const authorId = 'user-' + Date.now(); // TODO: 実際のユーザーIDに置き換え

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
          authorName: 'テストユーザー', // TODO: 実際のユーザー名に置き換え
          tags: location ? [location] : [],
          location,
          locationData: locationData || undefined,
        }),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.error || '投稿の作成に失敗しました');
      }

      // 成功したらリダイレクト
      alert('投稿が作成されました！');

      // プレビューURLを解放
      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      // コミュニティページにリダイレクト
      router.push('/community');
    } catch (error) {
      console.error('投稿エラー:', error);
      alert(error instanceof Error ? error.message : '投稿に失敗しました');
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold mb-2">投稿する</h2>
          <p className="text-gray-600 mb-8">投稿の情報を入力してください。</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                件名
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 outline-none transition-colors ${
                  title.length > 50
                    ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="件名を入力してください。"
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
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                本文
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 outline-none transition-colors resize-none ${
                  content.length > 140
                    ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="本文を140字以内で入力してください。"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メディアをアップロード（任意）
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload size={32} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  画像や動画をアップロードしてください
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ファイルをドラッグ&ドロップするか、クリックして選択
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  (最大10MB、複数選択可)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
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
                        className="w-full h-24 object-cover rounded-lg border"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                位置情報（任意）
              </label>

              {!locationData ? (
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
                    <div className="font-medium text-gray-900">{locationData.address}</div>
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

            <div className="pt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? '投稿中...' : '投稿する'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* マップモーダル */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSelectLocation={handleSelectLocation}
        initialLocation={locationData || undefined}
      />
    </div>
  );
}