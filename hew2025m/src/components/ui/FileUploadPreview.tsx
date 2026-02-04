'use client';

import Image from 'next/image';
import { Camera, X, ImagePlus } from 'lucide-react';
import ImageModal from './ImageModal';
import { useState } from 'react';

interface FileUploadPreviewProps {
  /** プレビュー用URL配列 */
  previewUrls: string[];
  /** ファイル削除ハンドラ */
  onRemove: (index: number) => void;
  /** ファイル選択ハンドラ */
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** ドラッグオーバーハンドラ */
  onDragOver?: (e: React.DragEvent) => void;
  /** ドロップハンドラ */
  onDrop?: (e: React.DragEvent) => void;
  /** 残りの追加可能ファイル数 */
  remainingSlots: number;
  /** アップロード進捗メッセージ */
  uploadProgress?: string;
  /** 最大ファイル数 */
  maxFiles?: number;
  /** inputのaccept属性 */
  accept?: string;
  /** ラベルテキスト */
  label?: string;
  /** ドロップエリアの説明テキスト */
  dropzoneText?: string;
  /** アイコン */
  icon?: React.ReactNode;
}

/**
 * ファイルアップロードとプレビュー表示の共通コンポーネント
 */
export default function FileUploadPreview({
  previewUrls,
  onRemove,
  onFileSelect,
  onDragOver,
  onDrop,
  remainingSlots,
  uploadProgress,
  maxFiles = 4,
  accept = 'image/*',
  label = '商品画像',
  dropzoneText = 'ドラッグ&ドロップまたはクリックで画像を追加',
  icon,
}: FileUploadPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* ラベル */}
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon || <Camera size={18} />}
        {label}
        <span className="text-gray-400 font-normal">（最大{maxFiles}枚）</span>
      </label>

      {/* プレビューグリッド */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <Image
                src={url}
                alt={`プレビュー ${index + 1}`}
                fill
                className="object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(index)}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label={`画像${index + 1}を削除`}
              >
                <X size={14} />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-[#2FA3E3] text-white text-xs px-2 py-0.5 rounded">
                  メイン
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* アップロードエリア */}
      {remainingSlots > 0 && (
        <label
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ImagePlus className="w-8 h-8 mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">{dropzoneText}</p>
            <p className="text-xs text-gray-400 mt-1">
              残り{remainingSlots}枚追加可能
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            multiple
            onChange={onFileSelect}
          />
        </label>
      )}

      {/* アップロード進捗 */}
      {uploadProgress && (
        <p className="text-sm text-blue-600 animate-pulse">{uploadProgress}</p>
      )}

      {/* 画像モーダル */}
      <ImageModal
        isOpen={isModalOpen}
        images={previewUrls}
        initialIndex={selectedImageIndex}
        onClose={handleCloseModal}
      />
    </div>
  );
}
