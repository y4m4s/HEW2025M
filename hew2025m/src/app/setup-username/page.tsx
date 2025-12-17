"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Fish } from "lucide-react";

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3] mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-10 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2FA3E3] rounded-full mb-4">
              <Fish size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              ユーザーネーム設定
            </h1>
            <p className="text-gray-600 text-sm">
              ツリマチへようこそ！<br />
              あなたのユーザーネームを設定してください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 表示名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                表示名
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  displayName.length > 15
                    ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                }`}
                placeholder="表示名を入力"
                required
              />
              <div className={`text-right text-sm mt-1 ${displayName.length > 15 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {displayName.length}/15文字
                {displayName.length > 15 && (
                  <span className="ml-2">({displayName.length - 15}文字超過)</span>
                )}
              </div>
            </div>

            {/* ユーザーネーム */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザーID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className={`w-full p-4 pl-8 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    username.length > 15
                      ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/20'
                  }`}
                  placeholder="username"
                  required
                  minLength={3}
                  pattern="[a-zA-Z0-9_]+"
                />
              </div>
              <div className={`text-right text-sm mt-1 ${username.length > 15 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {username.length}/15文字
                {username.length > 15 && (
                  <span className="ml-2">({username.length - 15}文字超過)</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                3〜15文字、英数字とアンダースコアのみ使用可能
              </p>
              <p className="text-xs text-red-600 font-semibold mt-1">
                ⚠ 一度設定したユーザーIDは変更することができません。
              </p>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "せのびゴシック, sans-serif" }}
            >
              {saving ? "保存中..." : "始める"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
