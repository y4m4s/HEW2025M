"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Star, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import UserRating from "./UserRating";

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
  isOwnProduct = false,
}: SellerInfoProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showRatingModal, setShowRatingModal] = useState(false);

  const handleMessageClick = () => {
    if (!user) {
      alert("メッセージを送るにはログインが必要です");
      router.push("/login");
      return;
    }

    if (!sellerProfile) return;

    // messageページに遷移し、userId パラメータで出品者を指定
    router.push(`/message?userId=${sellerProfile.uid}`);
  };

  const handleRatingClick = () => {
    if (!user) {
      alert("評価するにはログインが必要です");
      router.push("/login");
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

      <div className="flex flex-col md:flex-row gap-6">
        {/* 左側: 出品者情報 */}
        <Link
          href={`/profile/${sellerProfile.uid}`}
          className="flex-1 flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-[#2FA3E3]"
        >
          {sellerProfile.photoURL ? (
            <Image
              src={sellerProfile.photoURL}
              alt={sellerProfile.displayName}
              width={64}
              height={64}
              quality={90}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={32} className="text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate">{sellerProfile.displayName}</p>
            <p className="text-sm text-gray-500 truncate">@{sellerProfile.username}</p>
            {sellerProfile.bio && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2 line-clamp-2">
                {sellerProfile.bio}
              </p>
            )}
          </div>
        </Link>

        {/* 右側: ボタン（自分の商品でない場合のみ表示） */}
        {!isOwnProfile && (
          <div className="flex flex-col gap-3 md:w-40">
            <button
              onClick={handleRatingClick}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#2FA3E3] text-[#2FA3E3] rounded-lg hover:bg-[#2FA3E3] hover:text-white transition-colors"
            >
              <Star size={18} />
              <span className="text-sm font-medium">評価する</span>
            </button>
            <button
              onClick={handleMessageClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2FA3E3] text-white rounded-lg hover:bg-[#1d7bb8] transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-sm font-medium">メッセージ</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
