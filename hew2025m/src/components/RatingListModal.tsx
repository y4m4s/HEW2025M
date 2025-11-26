"use client";

import { useEffect } from "react";
import { X, Star } from "lucide-react";
import Image from "next/image";

interface RatingWithUser {
  id: string;
  ratedUserId: string;
  raterUserId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  raterName: string;
  raterPhotoURL: string;
}

interface RatingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratings: RatingWithUser[];
  averageRating: number;
}

export default function RatingListModal({
  isOpen,
  onClose,
  ratings,
  averageRating,
}: RatingListModalProps) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // スクロールを無効化
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
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
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold">すべての評価 ({ratings.length}件)</h3>
            <div className="flex items-center gap-2">
              <Star size={18} className="fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{averageRating.toFixed(1)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* 評価一覧 */}
        <div className="flex-1 overflow-y-auto p-4">
          {ratings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">評価はまだありません</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                      {rating.raterPhotoURL ? (
                        <Image
                          src={rating.raterPhotoURL}
                          alt={rating.raterName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-medium">
                          {rating.raterName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{rating.raterName}</span>
                        <span className="text-xs text-gray-500">
                          {rating.createdAt.toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= rating.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                        {rating.comment}
                      </p>
                    </div>
                  </div>
                </div>
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
