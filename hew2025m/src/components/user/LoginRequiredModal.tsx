'use client';

import { useRouter } from 'next/navigation';
import { X, LogIn } from 'lucide-react';
import Button from '@/components/ui/Button';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: string; // 実行しようとしたアクション（例：「カートに追加」「いいね」など）
}

export default function LoginRequiredModal({ isOpen, onClose, action }: LoginRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLoginRedirect = () => {
    router.push('/login');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">ログインが必要です</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* メッセージ */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <LogIn size={32} className="text-blue-600" />
            </div>
          </div>
          <p className="text-gray-700 text-center text-lg mb-2">
            <span className="font-semibold text-blue-600">{action}</span>は
          </p>
          <p className="text-gray-700 text-center text-lg">
            ログインしていないとできません
          </p>
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleLoginRedirect}
            variant="primary"
            size="lg"
            className="flex-1"
            icon={<LogIn size={18} />}
          >
            ログイン
          </Button>
        </div>
      </div>
    </div>
  );
}
