'use client';

import { X } from 'lucide-react';
import Button from './Button';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting?: boolean;
  children?: React.ReactNode;
}

export default function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
  children,
}: CancelModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isDeleting}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* 警告メッセージ */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{message}</p>
          </div>

          {/* 子要素（ProductCardなど） */}
          {children && (
            <div className="mb-6 flex justify-center">
              {children}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-4 justify-end border-t border-gray-200 rounded-b-lg">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isDeleting}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? '削除中...' : '削除する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
