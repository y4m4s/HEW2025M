"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { User } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import ProfileEdit from "@/components/ProfileEdit";
import ProfSelling from "@/components/ProfSelling";
import ProfHistory from "@/components/ProfHistory";
import ProfBookmark from "@/components/ProfBookmark";

type TabType = "selling" | "history" | "bookmarks";

interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string;
  bio: string;
  email: string;
}

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("selling");
  const [sellingCount, setSellingCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  // 対象ユーザーのプロフィールを取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setTargetProfile({
            uid: userDoc.id,
            ...userDoc.data(),
          } as UserProfile);
        } else {
          // ユーザーが存在しない場合
          router.push("/");
        }
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, router]);

  // ログインしていない場合の処理
  useEffect(() => {
    if (!authLoading && user === null) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // 自分のプロフィールかどうかを判定
  const isOwnProfile = user?.uid === userId;

  // メッセージページへ遷移
  const handleSendMessage = () => {
    if (!targetProfile) return;
    router.push(`/message?userId=${targetProfile.uid}`);
  };

  if (loading || authLoading || !user || !targetProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      {/* Profile Edit Modal (自分のプロフィールの場合のみ) */}
      {isOwnProfile && (
        <ProfileEdit
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          currentProfile={targetProfile}
        />
      )}

      {/* ページ */}
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Profile Left */}
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center">
                  {targetProfile.photoURL ? (
                    <Image
                      src={targetProfile.photoURL}
                      alt="プロフィール画像"
                      width={96}
                      height={96}
                      quality={90}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} />
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "せのびゴシック" }}>
                  {targetProfile.displayName || "名無しユーザー"}
                </h1>
                <p className="text-gray-600 mb-4">@{targetProfile.username || "user"}</p>

                {/* 自分のプロフィールの場合: プロフィール編集ボタンのみ */}
                {isOwnProfile ? (
                  <button
                    className="w-full bg-[#2FA3E3] text-white py-3 rounded-lg hover:bg-[#1d7bb8] transition-colors"
                    onClick={() => setEditOpen(true)}
                  >
                    プロフィール編集
                  </button>
                ) : (
                  // 他人のプロフィールの場合: メッセージボタンのみ
                  <button
                    className="w-full border border-[#2FA3E3] text-[#2FA3E3] py-3 rounded-lg hover:bg-[#2FA3E3] hover:text-white transition-colors"
                    onClick={handleSendMessage}
                  >
                    メッセージ
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="font-bold mb-2" style={{ fontFamily: "せのびゴシック" }}>
                  自己紹介
                </h2>
                <p className="text-sm text-gray-600">
                  {targetProfile.bio || "自己紹介が設定されていません"}
                </p>
              </div>
            </div>

            {/* 商品タブ */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg">
              <div className="flex border-b text-sm">
                <button
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === "selling"
                      ? "text-[#2FA3E3] border-b-2 border-[#2FA3E3]"
                      : "text-gray-600 hover:text-[#2FA3E3]"
                  }`}
                  onClick={() => setActiveTab("selling")}
                >
                  出品中 ({sellingCount})
                </button>
                <button
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === "history"
                      ? "text-[#2FA3E3] border-b-2 border-[#2FA3E3]"
                      : "text-gray-600 hover:text-[#2FA3E3]"
                  }`}
                  onClick={() => setActiveTab("history")}
                >
                  出品履歴 ({historyCount})
                </button>
                {/* ブックマークは自分のプロフィールの場合のみ表示 */}
                {isOwnProfile && (
                  <button
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === "bookmarks"
                        ? "text-[#2FA3E3] border-b-2 border-[#2FA3E3]"
                        : "text-gray-600 hover:text-[#2FA3E3]"
                    }`}
                    onClick={() => setActiveTab("bookmarks")}
                  >
                    ブックマーク ({bookmarkCount})
                  </button>
                )}
              </div>

              <div style={{ display: activeTab === "selling" ? "block" : "none" }}>
                <ProfSelling onCountChange={setSellingCount} userId={userId} />
              </div>
              <div style={{ display: activeTab === "history" ? "block" : "none" }}>
                <ProfHistory onCountChange={setHistoryCount} userId={userId} />
              </div>
              {isOwnProfile && (
                <div style={{ display: activeTab === "bookmarks" ? "block" : "none" }}>
                  <ProfBookmark onCountChange={setBookmarkCount} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
