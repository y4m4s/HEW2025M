interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({
  isOpen,
  onConfirm,
  onCancel,
}: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          ログアウトの確認
        </h2>
        <p className="text-gray-600 mb-6">本当にログアウトしますか？</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="py-2 px-4 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors duration-300"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-300"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
