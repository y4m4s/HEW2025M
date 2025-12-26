"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Star, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import LoginRequiredModal from "./LoginRequiredModal";
import toast from "react-hot-toast";

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
    <section className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">出品者情報</h3>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* 左側: 出品者情報 */}
        <Link
          href={`/profile/${sellerProfile.uid}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-[#2FA3E3] flex-shrink-0"
        >
          {sellerProfile.photoURL ? (
            <Image
              src={sellerProfile.photoURL}
              alt={sellerProfile.displayName}
              width={48}
              height={48}
              quality={90}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={24} className="text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{sellerProfile.displayName}</p>
            <p className="text-xs text-gray-500 truncate">@{sellerProfile.username}</p>
          </div>
        </Link>

        {/* 中央: 評価表示 */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg flex-shrink-0">
          <div className="flex items-center gap-1">
            <Star size={18} className="fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-base">
              {averageRating > 0 ? averageRating.toFixed(1) : "---"}
            </span>
          </div>
          <span className="text-sm text-gray-600">
            ({totalRatings}件)
          </span>
        </div>

        {/* 右側: ボタン（自分の商品でない場合のみ表示） */}
        {!isOwnProfile && (
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <button
              onClick={handleRatingClick}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#2FA3E3] text-[#2FA3E3] rounded-lg hover:bg-[#2FA3E3] hover:text-white transition-colors flex-1 sm:flex-initial"
            >
              <Star size={16} />
              <span className="text-sm font-medium">評価する</span>
            </button>
            <button
              onClick={handleMessageClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2FA3E3] text-white rounded-lg hover:bg-[#1d7bb8] transition-colors flex-1 sm:flex-initial"
            >
              <MessageCircle size={16} />
              <span className="text-sm font-medium">メッセージ</span>
            </button>
          </div>
        )}
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
