"use client";
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { useRouter } from "next/navigation";
import ProfileEdit from "@/components/ProfileEdit";
import ProfSelling from "@/components/ProfSelling";
import ProfHistory from "@/components/ProfHistory";
import ProfBookmark from "@/components/ProfBookmark";

type TabType = "selling" | "history" | "bookmarks";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("selling");
  const [sellingCount, setSellingCount] = useState(0);

  // ユーザー認証チェック
  useEffect(() => {
    if (!authLoading && user === null) {
      // 認証されていない場合はログインページへ
      router.push("/login");
    }
  }, [user, authLoading, router]);


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      {/* Profile Edit Modal */}
      <ProfileEdit
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        currentProfile={profile}
      />

      {/* Página */}
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Profile Left */}
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="プロフィール画像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} />
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "せのびゴシック" }}>
                  {profile.displayName || "名無しユーザー"}
                </h1>
                <p className="text-gray-600 mb-4">@{profile.username || "user"}</p>

                <button
                  className="w-full bg-[#2FA3E3] text-white py-3 rounded-lg mb-3 hover:bg-[#1d7bb8] transition-colors"
                  onClick={() => setEditOpen(true)}
                >
                  プロフィール編集
                </button>
                <button className="w-full border border-[#2FA3E3] text-[#2FA3E3] py-3 rounded-lg hover:bg-[#2FA3E3] hover:text-white transition-colors">
                  メッセージ
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="font-bold mb-2" style={{ fontFamily: "せのびゴシック" }}>
                  自己紹介
                </h2>
                <p className="text-sm text-gray-600">
                  {profile.bio || "自己紹介が設定されていません"}
                </p>
              </div>
            </div>

            {/* Produtos */}
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
                  出品履歴 (0)
                </button>
                <button
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === "bookmarks"
                      ? "text-[#2FA3E3] border-b-2 border-[#2FA3E3]"
                      : "text-gray-600 hover:text-[#2FA3E3]"
                  }`}
                  onClick={() => setActiveTab("bookmarks")}
                >
                  ブックマーク (0)
                </button>
              </div>

              {activeTab === "selling" && <ProfSelling onCountChange={setSellingCount} />}
              {activeTab === "history" && <ProfHistory />}
              {activeTab === "bookmarks" && <ProfBookmark />}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
