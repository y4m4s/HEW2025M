"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Fish } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import { useProfile } from "@/contexts/ProfileContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SetupUsernamePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // ProfileContextを使って既存ユーザーかチェック
  useEffect(() => {
    if (!user || profileLoading) return;

    // 既にusernameが設定されている場合はホームへ
    if (profile.username && profile.username !== user.email?.split("@")[0]) {
      router.push("/");
      return;
    }

    // デフォルト値を設定（user.displayNameはGoogleログイン時のみ）
    setDisplayName(user.displayName || "");
    setUsername("");
  }, [user, profile, profileLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) return;

    // バリデーション
    if (username.length < 3) {
      setError("ユーザーネームは3文字以上で入力してください");
      return;
    }

    if (username.length > 15) {
      setError("ユーザーネームは15文字以内で入力してください");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("ユーザーネームは英数字とアンダースコアのみ使用できます");
      return;
    }

    if (!displayName.trim()) {
      setError("表示名を入力してください");
      return;
    }

    if (displayName.length > 15) {
      setError("表示名は15文字以内で入力してください");
      return;
    }

    setSaving(true);

    try {
      // Firestoreにユーザープロフィールを保存
      await setDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        username: username,
        email: user.email || "",
        bio: "",
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
      });

      // ホームへリダイレクト
      router.push("/");
    } catch (error) {
      console.error("ユーザーネーム保存エラー:", error);
      setError("ユーザーネームの保存に失敗しました");
      setSaving(false);
    }
  };

  if (authLoading || profileLoading || !user) {
    return <LoadingSpinner message="読み込み中..." size="lg" fullScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans text-gray-800 bg-[#f0f4f8]">
      {/* メインカード */}
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">

        {/* 左側：ブランディングセクション */}
        <div className="lg:w-5/12 bg-gradient-to-br from-[#2FA3E3] to-[#1d7bb8] relative overflow-hidden flex flex-col justify-center items-center text-white p-10 lg:p-12">
          {/* 背景装飾 */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative z-10 text-center">
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-md mb-6" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              ツリマチ
            </h1>
            <div className="h-1 w-16 bg-white/50 mx-auto rounded-full mb-6"></div>
            <p className="text-lg lg:text-xl leading-relaxed font-light opacity-95 tracking-wide">
              はじめまして。<br />
              あなたのことを教えてください。
            </p>
          </div>
        </div>

        {/* 右側：フォームセクション */}
        <div className="w-full lg:w-7/12 p-8 lg:p-16 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2FA3E3]/10 rounded-full mb-4 text-[#2FA3E3]">
                <Fish size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>ユーザーネーム設定</h2>
              <p className="text-sm text-gray-500">
                ツリマチで使用する表示名とIDを設定してください
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 表示名 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  表示名 <span className="text-gray-400 text-xs font-normal ml-1">(15文字以内)</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-gray-900 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${displayName.length > 15
                      ? 'border-red-500 ring-red-500/10'
                      : 'border-gray-200 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/10'
                    }`}
                  placeholder="表示名を入力"
                  required
                />
                <div className={`text-right text-xs mt-1.5 ${displayName.length > 15 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {displayName.length}/15
                </div>
              </div>

              {/* ユーザーネーム */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  ユーザーID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className={`w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 border text-gray-900 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${username.length > 15
                        ? 'border-red-500 ring-red-500/10'
                        : 'border-gray-200 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/10'
                      }`}
                    placeholder="username"
                    required
                    minLength={3}
                    pattern="[a-zA-Z0-9_]+"
                  />
                </div>
                <div className="flex justify-between items-start mt-1.5">
                  <p className="text-xs text-gray-400">
                    半角英数字とアンダーバーのみ
                  </p>
                  <div className={`text-right text-xs ${username.length > 15 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    {username.length}/15
                  </div>
                </div>
                <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex gap-2">
                  <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-xs text-yellow-700">
                    一度設定したユーザーIDは変更することができません。慎重に決めてください。
                  </p>
                </div>
              </div>

              {/* エラーメッセージ */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 items-center animate-fadein">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] hover:from-[#2FA3E3] hover:to-[#2FA3E3] text-white rounded-xl text-base font-bold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      保存中...
                    </span>
                  ) : "始める"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
