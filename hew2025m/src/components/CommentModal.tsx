'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Comment } from '@/types/comment';
import CommentItem from './CommentItem';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  currentUserId?: string;
  onDeleteComment: (commentId: string) => void;
  onReply?: (parentId: string, content: string) => Promise<void>;
}

export default function CommentModal({
  isOpen,
  onClose,
  comments,
  currentUserId,
  onDeleteComment,
  onReply,
}: CommentModalProps) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* モーダルコンテンツ */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-lg">
          <h3 className="text-lg font-bold">すべてのコメント ({comments.length}件)</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* コメント一覧 */}
        <div className="flex-1 overflow-y-auto p-4">
          {comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              コメントはまだありません
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onDelete={onDeleteComment}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>

        {/* フッター（閉じるボタン） */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
