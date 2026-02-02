'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseFileUploadOptions {
  /** 最大ファイル数（デフォルト: 4） */
  maxFiles?: number;
  /** 最大ファイルサイズ（バイト、デフォルト: 10MB） */
  maxSize?: number;
  /** 許可するMIMEタイプのプレフィックス（デフォルト: ['image/']） */
  acceptedTypes?: string[];
  /** ファイルの呼称（エラーメッセージ用、デフォルト: '画像'） */
  fileLabel?: string;
}

interface UseFileUploadReturn {
  /** 選択されたファイル */
  files: File[];
  /** プレビュー用URL */
  previewUrls: string[];
  /** アップロード進捗メッセージ */
  uploadProgress: string;
  /** 進捗メッセージを設定 */
  setUploadProgress: (progress: string) => void;
  /** ファイル選択ハンドラ */
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** ドラッグオーバーハンドラ */
  handleDragOver: (e: React.DragEvent) => void;
  /** ドロップハンドラ */
  handleDrop: (e: React.DragEvent) => void;
  /** ファイル削除ハンドラ */
  handleRemoveFile: (index: number) => void;
  /** 全ファイルをクリア（プレビューURLも解放） */
  clearFiles: () => void;
  /** 残りの追加可能ファイル数 */
  remainingSlots: number;
}

/**
 * ファイルアップロード用のカスタムフック
 * - 複数ファイル選択
 * - ドラッグ&ドロップ対応
 * - ファイルサイズ・タイプのバリデーション
 * - プレビューURL管理
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxFiles = 4,
    maxSize = 10 * 1024 * 1024, // 10MB
    acceptedTypes = ['image/'],
    fileLabel = '画像',
  } = options;

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');

  const remainingSlots = maxFiles - files.length;

  const validateAndAddFiles = useCallback((newFiles: File[]) => {
    if (newFiles.length === 0) return;

    if (remainingSlots <= 0) {
      toast.error(`${fileLabel}は最大${maxFiles}つまで添付できます`);
      return;
    }

    if (newFiles.length > remainingSlots) {
      toast.error(
        `${fileLabel}は最大${maxFiles}つまでです。選択された${newFiles.length}個のうち、${remainingSlots}個のみ追加されます。`
      );
    }

    const validFiles = newFiles.slice(0, remainingSlots).filter((file) => {
      if (file.size > maxSize) {
        const sizeMB = Math.round(maxSize / (1024 * 1024));
        toast.error(`${file.name} は${sizeMB}MBを超えています`);
        return false;
      }
      const isAccepted = acceptedTypes.some(type => file.type.startsWith(type));
      if (!isAccepted) {
        toast.error(`${file.name} は対応していないファイル形式です`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  }, [remainingSlots, maxFiles, maxSize, acceptedTypes, fileLabel]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    validateAndAddFiles(newFiles);
    // inputをリセットして同じファイルを再選択可能にする
    e.target.value = '';
  }, [validateAndAddFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(newFiles);
  }, [validateAndAddFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviewUrls([]);
    setUploadProgress('');
  }, [previewUrls]);

  return {
    files,
    previewUrls,
    uploadProgress,
    setUploadProgress,
    handleFileSelect,
    handleDragOver,
    handleDrop,
    handleRemoveFile,
    clearFiles,
    remainingSlots,
  };
}
