"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Star, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { LoginRequiredModal } from "@/components";

interface SellerInfoProps {
  sellerProfile: {
    uid: string;
    displayName: string;
    username: string;
    photoURL: string;
    bio: string;
  } | null;
  loading?: boolean;
  fallbackName?: string;
  isOwnProduct?: boolean;
}

export default function SellerInfo({
  sellerProfile,
  loading = false,
  fallbackName = "出品者",
}: SellerInfoProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

  // 出品者の評価情報を取得（UserRatingと同じロジック）
  useEffect(() => {
    const fetchSellerRating = async () => {
      if (!sellerProfile?.uid) return;

      try {
        // ratingsコレクションから評価データを取得
        const ratingsQuery = query(
          collection(db, "ratings"),
          where("ratedUserId", "==", sellerProfile.uid)
        );

        const snapshot = await getDocs(ratingsQuery);
        const ratingsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          rating: doc.data().rating,
        }));

        // 平均評価の計算
        if (ratingsData.length > 0) {
          const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
          setAverageRating(Math.round(avg * 10) / 10);
          setTotalRatings(ratingsData.length);
        } else {
          setAverageRating(0);
          setTotalRatings(0);
        }
      } catch (error) {
        console.error("評価情報の取得エラー:", error);
        setTotalRatings(0);
        setAverageRating(0);
      }
    };

    fetchSellerRating();
  }, [sellerProfile?.uid]);

  const handleMessageClick = () => {
    if (!user) {
      setLoginRequiredAction("メッセージを送る");
      setShowLoginModal(true);
      return;
    }

    if (!sellerProfile) return;

    // messageページに遷移し、userId パラメータで出品者を指定
    router.push(`/message?userId=${sellerProfile.uid}`);
  };

  const handleRatingClick = () => {
    if (!user) {
      setLoginRequiredAction("評価する");
      setShowLoginModal(true);
      return;
    }

    if (!sellerProfile) return;

    // プロフィールページに遷移
    router.push(`/profile/${sellerProfile.uid}`);
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">出品者情報</h3>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (!sellerProfile) {
    return (
      <section className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">出品者情報</h3>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={32} className="text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">{fallbackName}</p>
            <p className="text-sm text-gray-600">出品者</p>
          </div>
        </div>
      </section>
    );
  }

  const isOwnProfile = user?.uid === sellerProfile.uid;

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* ヘッダー部分 */}
      <div className="bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] px-6 py-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <User size={20} />
          出品者情報
        </h3>
      </div>

      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左側: 出品者プロフィールカード */}
          <Link
            href={`/profile/${sellerProfile.uid}`}
            className="flex-1 group"
          >
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-[#2FA3E3] hover:shadow-md transition-all duration-300 h-full">
              {/* アバター */}
              <div className="flex-shrink-0">
                {sellerProfile.photoURL ? (
                  <Image
                    src={sellerProfile.photoURL}
                    alt={sellerProfile.displayName}
                    width={64}
                    height={64}
                    quality={90}
                    className="w-16 h-16 rounded-full object-cover border-4 border-gray-100 group-hover:border-[#2FA3E3] transition-colors"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center border-4 border-gray-100 group-hover:border-[#2FA3E3] transition-colors">
                    <User size={32} className="text-gray-600" />
                  </div>
                )}
              </div>

              {/* 名前・ユーザー名 */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-gray-900 truncate group-hover:text-[#2FA3E3] transition-colors">
                  {sellerProfile.displayName}
                </p>
                <p className="text-sm text-gray-500 truncate">@{sellerProfile.username}</p>
                {sellerProfile.bio && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{sellerProfile.bio}</p>
                )}
              </div>
            </div>
          </Link>

          {/* 右側: 評価とアクション */}
          <div className="flex flex-col gap-4 lg:w-80">
            {/* 評価カード */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 shadow-sm flex-1 flex items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={`${i < Math.floor(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : averageRating > i && averageRating < i + 1
                              ? 'fill-yellow-400/50 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          } transition-colors`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {averageRating > 0 ? averageRating.toFixed(1) : "---"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {totalRatings}件の評価
                  </p>
                </div>
              </div>
            </div>

            {/* アクションボタン（自分の商品でない場合のみ表示） */}
            {!isOwnProfile && (
              <div className="flex gap-3">
                <button
                  onClick={handleRatingClick}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#2FA3E3] text-[#2FA3E3] rounded-xl hover:bg-[#2FA3E3] hover:text-white transition-all duration-300 hover:shadow-md font-medium"
                >
                  <Star size={18} />
                  <span className="text-sm">評価する</span>
                </button>
                <button
                  onClick={handleMessageClick}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium"
                >
                  <MessageCircle size={18} />
                  <span className="text-sm">メッセージ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </section>
  );
}
