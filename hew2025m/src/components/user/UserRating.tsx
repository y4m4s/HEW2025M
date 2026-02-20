"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";
import toast from "react-hot-toast";
import RatingListModal from "./RatingListModal";
import LoginRequiredModal from "./LoginRequiredModal";
import { createRatingNotification } from "@/lib/notifications";

interface Rating {
  id: string;
  ratedUserId: string;
  raterUserId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface RatingWithUser extends Rating {
  raterName: string;
  raterPhotoURL: string;
}

interface UserRatingProps {
  targetUserId: string;
  isOwnProfile: boolean;
}

export default function UserRating({ targetUserId, isOwnProfile }: UserRatingProps) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<RatingWithUser[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

  const MAX_COMMENT_LENGTH = 140;
  const isOverLimit = comment.length > MAX_COMMENT_LENGTH;

  // 評価データの取得
  const fetchRatings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${targetUserId}/ratings`);
      if (!response.ok) {
        const responseText = await response.text();
        let errorDetails = `評価の取得に失敗しました (Status: ${response.status})`;
        try {
            const errorData = JSON.parse(responseText);
            errorDetails = `${errorDetails}: ${errorData.error || response.statusText}`;
        } catch {
            errorDetails = `${errorDetails}. Response: ${responseText.substring(0, 300)}`;
        }
        throw new Error(errorDetails);
      }
      const data = await response.json();
      interface RatingResponse {
        id: string;
        ratedUserId: string;
        raterUserId: string;
        rating: number;
        comment: string;
        createdAt: string;
        raterName: string;
        raterPhotoURL: string;
      }
      const fetchedRatings = data.ratings.map((r: RatingResponse) => ({...r, createdAt: new Date(r.createdAt)}));
      setRatings(fetchedRatings);

      // 平均評価の計算
      if (fetchedRatings.length > 0) {
        const avg = fetchedRatings.reduce((sum: number, r: Rating) => sum + r.rating, 0) / fetchedRatings.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setTotalRatings(fetchedRatings.length);
      } else {
        setAverageRating(0);
        setTotalRatings(0);
      }

      // 自分が既に評価しているかチェック
      if (user && !isOwnProfile) {
        const userRating = fetchedRatings.find((r: Rating) => r.raterUserId === user.uid);
        setHasRated(!!userRating);
        if (userRating) {
          setExistingRatingId(userRating.id);
          setSelectedRating(userRating.rating);
          setComment(userRating.comment);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, user]);

  // 評価の送信（新規または更新）
  const handleSubmitRating = async () => {
    if (!user) {
      setLoginRequiredAction("評価を送信");
      setShowLoginModal(true);
      return;
    }

    if (selectedRating === 0) {
      toast.error("評価を選択してください");
      return;
    }

    if (!comment.trim()) {
      toast.error("コメントを入力してください");
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      toast.error(`コメントは${MAX_COMMENT_LENGTH}文字以内で入力してください`);
      return;
    }

    setLoading(true);
    try {
      const ratingData = {
        ratedUserId: targetUserId,
        raterUserId: user.uid,
        rating: selectedRating,
        comment: comment.trim(),
        createdAt: Timestamp.now(),
      };

      if (existingRatingId) {
        // 既存の評価を更新
        const ratingRef = doc(db, "ratings", existingRatingId);
        const oldRatingDoc = await getDoc(ratingRef);
        const oldRating = oldRatingDoc.data()?.rating || 0;

        await updateDoc(ratingRef, {
          rating: selectedRating,
          comment: comment.trim(),
          createdAt: Timestamp.now(), // 更新日時も更新
        });

        // ユーザーの評価カウントを調整（差分のみ更新）
        const userRef = doc(db, "users", targetUserId);
        const ratingDiff = selectedRating - oldRating;
        if (ratingDiff !== 0) {
          await updateDoc(userRef, {
            ratingSum: increment(ratingDiff),
          });
        }

        toast.success("評価を更新しました");
      } else {
        // 新規評価を保存
        await addDoc(collection(db, "ratings"), ratingData);

        // ユーザーの評価カウントを更新
        const userRef = doc(db, "users", targetUserId);
        await updateDoc(userRef, {
          totalRatings: increment(1),
          ratingSum: increment(selectedRating),
        });

        // 評価通知を作成
        await createRatingNotification(
          targetUserId,
          user.uid,
          selectedRating,
          comment.trim()
        );

        toast.success("評価を投稿しました");
      }

      setShowForm(false);
      setSelectedRating(0);
      setComment("");
      fetchRatings();
    } catch (error) {
      console.error("評価の投稿エラー:", error);
      toast.error("評価の投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">
          評価
        </h2>
        {!isOwnProfile && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-[#2FA3E3] hover:underline"
          >
            {showForm ? "キャンセル" : hasRated ? "評価を編集" : "評価する"}
          </button>
        )}
      </div>

      {/* 平均評価 */}
      <div className="flex items-center mb-6">
        <div className="text-3xl font-bold mr-3">{averageRating.toFixed(1)}</div>
        <div>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={
                  star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-1">{totalRatings}件の評価</div>
        </div>
      </div>

      {/* 評価フォーム */}
      {showForm && !isOwnProfile && (
        <div className="border-t pt-4 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">評価を選択</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      star <= selectedRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">コメント</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]"
              rows={4}
              placeholder="取引の感想や評価を入力してください"
            />
            <div className={`text-xs text-right mt-1 ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
              {comment.length}/{MAX_COMMENT_LENGTH}文字
            </div>
          </div>

          <button
            onClick={handleSubmitRating}
            disabled={loading || selectedRating === 0 || !comment.trim() || isOverLimit}
            className="w-full bg-[#2FA3E3] text-white py-2 rounded-lg hover:bg-[#1d7bb8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (existingRatingId ? "更新中..." : "投稿中...") : (existingRatingId ? "評価を更新" : "評価を投稿")}
          </button>
        </div>
      )}

      {/* 評価を見るボタン */}
      {totalRatings > 0 && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3 text-[#2FA3E3] hover:bg-blue-50 rounded-lg transition-colors font-medium"
        >
          評価を見る
        </button>
      )}

      {/* 評価一覧モーダル */}
      <RatingListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ratings={ratings}
        averageRating={averageRating}
      />

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}
