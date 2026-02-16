"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Fish } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import { useProfileStore } from "@/stores/useProfileStore";
import { LoadingScreen } from "@/components";

export default function SetupUsernamePage() {
  const { user, loading: authLoading } = useAuth();
  const profile = useProfileStore((state) => state.profile);
  const profileLoading = useProfileStore((state) => state.loading);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // ProfileStoreを使って既存ユーザーかチェック
  useEffect(() => {
    if (!user || profileLoading) return;

    // Firestoreからデータが取得できた場合
    if (profile.username) {
      const emailPrefix = user.email?.split("@")[0] || 'user';

      // usernameがメールプレフィックスと異なる = 既に設定済み
      if (profile.username !== emailPrefix) {
        router.push("/");
        return;
      }
    }

    // デフォルト値を設定（user.displayNameはGoogleログイン時のみ）
    setDisplayName(user.displayName || "");
    setUsername("");
  }, [user, profile, profileLoading, router]);

  // ユーザーネームの重複チェック
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');

    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (data.available) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
      }
    } catch (error) {
      console.error('Username check failed:', error);
      setUsernameStatus('idle');
    }
  };

  // ユーザーネーム入力時のデバウンス処理
  const handleUsernameChange = (value: string) => {
    const lowercaseValue = value.toLowerCase();
    setUsername(lowercaseValue);
    setError("");

    // 前のタイムアウトをクリア
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    // 新しいタイムアウトを設定（500ms後にチェック）
    if (lowercaseValue.length >= 3) {
      const timeout = setTimeout(() => {
        checkUsernameAvailability(lowercaseValue);
      }, 500);
      setCheckTimeout(timeout);
    } else {
      setUsernameStatus('idle');
    }
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
    };
  }, [checkTimeout]);

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

    // ユーザーネームが既に使用されているかチェック
    if (usernameStatus === 'taken') {
      setError("このユーザーネームは既に使用されています");
      return;
    }

    setSaving(true);

    try {
      // タイムアウト付きで保存処理を実行（10秒）
      const savePromise = setDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        username: username,
        email: user.email || "",
        bio: "",
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('タイムアウト')), 10000)
      );

      await Promise.race([savePromise, timeoutPromise]);

      // ホームへリダイレクト
      router.push("/");
    } catch (error) {
      console.error("ユーザーネーム保存エラー:", error);

      if (error instanceof Error && error.message === 'タイムアウト') {
        setError("保存処理がタイムアウトしました。ネットワーク接続を確認して、もう一度お試しください。");
      } else {
        setError("ユーザーネームの保存に失敗しました。もう一度お試しください。");
      }
      setSaving(false);
    }
  };

  if (authLoading || profileLoading || !user) {
    return <LoadingScreen message="読み込み中..." />;
  }

  return (
    <div className="h-[calc(100vh-80px)] flex items-center justify-center p-2 sm:p-4 font-sans text-gray-800 bg-[#f0f4f8]">
      {/* メインカード */}
      <div className="w-full max-w-5xl h-fit max-h-[calc(100vh-96px)] bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* 左側：ブランディングセクション */}
        <div className="lg:w-5/12 bg-gradient-to-br from-[#2FA3E3] to-[#1d7bb8] relative overflow-hidden flex flex-col justify-center items-center text-white p-4 sm:p-6 lg:p-10">
          {/* 背景装飾 */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative z-10 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-md mb-3 sm:mb-4 lg:mb-6">
              ツリマチ
            </h1>
            <div className="h-1 w-12 sm:w-16 bg-white/50 mx-auto rounded-full mb-3 sm:mb-4 lg:mb-6"></div>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed font-light opacity-95 tracking-wide">
              はじめまして。<br />
              あなたのことを教えてください。
            </p>
          </div>
        </div>

        {/* 右側：フォームセクション */}
        <div className="w-full lg:w-7/12 p-4 sm:p-6 lg:p-8 bg-white flex flex-col justify-center overflow-y-auto">
          <div className="max-w-md mx-auto w-full my-auto">
            <div className="text-center mb-3 sm:mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-[#2FA3E3]/10 rounded-full mb-2 sm:mb-2.5 lg:mb-3 text-[#2FA3E3]">
                <Fish size={24} className="sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1 sm:mb-1.5">ユーザーネーム設定</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                ツリマチで使用する表示名とIDを設定してください
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* 表示名 */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 ml-1">
                  表示名 <span className="text-gray-400 text-[10px] sm:text-xs font-normal ml-1">(15文字以内)</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onInvalid={(e) => e.preventDefault()}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl bg-gray-50 border text-gray-900 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${displayName.length > 15
                    ? 'border-red-500 ring-red-500/10'
                    : 'border-gray-200 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/10'
                    }`}
                  placeholder="表示名を入力"
                />
                <div className={`text-right text-[10px] sm:text-xs mt-1 ${displayName.length > 15 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                  {displayName.length}/15
                </div>
              </div>

              {/* ユーザーネーム */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 ml-1">
                  ユーザーID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium text-sm sm:text-base">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    onInvalid={(e) => e.preventDefault()}
                    className={`w-full pl-7 sm:pl-8 pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl bg-gray-50 border text-gray-900 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                      username.length > 15
                        ? 'border-red-500 ring-red-500/10'
                        : usernameStatus === 'taken'
                        ? 'border-red-500 ring-red-500/10'
                        : usernameStatus === 'available'
                        ? 'border-green-500 ring-green-500/10'
                        : 'border-gray-200 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]/10'
                    }`}
                    placeholder="username"
                  />
                  {/* ステータスアイコン */}
                  <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {usernameStatus === 'available' && (
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {usernameStatus === 'taken' && (
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-start mt-1">
                  <div className="flex-1">
                    {usernameStatus === 'checking' && username.length >= 3 && (
                      <p className="text-[10px] sm:text-xs text-blue-600">確認中...</p>
                    )}
                    {usernameStatus === 'available' && (
                      <p className="text-[10px] sm:text-xs text-green-600 font-medium">✓ 利用可能です</p>
                    )}
                    {usernameStatus === 'taken' && (
                      <p className="text-[10px] sm:text-xs text-red-600 font-medium">このユーザーネームは既に使用されています</p>
                    )}
                    {usernameStatus === 'idle' && (
                      <p className="text-[10px] sm:text-xs text-gray-400">半角英数字とアンダーバーのみ</p>
                    )}
                  </div>
                  <div className={`text-right text-[10px] sm:text-xs ${username.length > 15 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                    {username.length}/15
                  </div>
                </div>
                <div className="mt-1.5 sm:mt-2 bg-yellow-50 border border-yellow-100 rounded-lg p-2 sm:p-3 flex gap-1.5 sm:gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-[10px] sm:text-xs text-yellow-700">
                    一度設定したユーザーIDは変更することができません。慎重に決めてください。
                  </p>
                </div>
              </div>

              {/* エラーメッセージ */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex gap-1.5 sm:gap-2 items-center animate-fadein">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-red-600 text-xs sm:text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="pt-1 sm:pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] hover:from-[#2FA3E3] hover:to-[#2FA3E3] text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-bold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
