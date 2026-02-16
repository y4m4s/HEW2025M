import { Trash2, X } from 'lucide-react';

interface DeleteCommentModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  commentPreview?: string;
}

export default function DeleteCommentModal({
  isOpen,
  onConfirm,
  onCancel,
  commentPreview,
}: DeleteCommentModalProps) {
  if (!isOpen) return null;

  // コメントのプレビューを50文字に制限
  const truncatedPreview = commentPreview
    ? commentPreview.length > 50
      ? commentPreview.substring(0, 50) + '...'
      : commentPreview
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadein">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-scalein">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              コメントを削除
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4 text-lg leading-relaxed">
            このコメントを削除してもよろしいですか？
          </p>
          {truncatedPreview && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 italic">
                &quot;{truncatedPreview}&quot;
              </p>
            </div>
          )}
          <p className="text-sm text-red-600 mt-3">
            ※ この操作は取り消せません。
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 hover:shadow-md hover:scale-[1.02] transition-all duration-200 transform active:scale-95"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] transition-all duration-200 transform active:scale-95"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
