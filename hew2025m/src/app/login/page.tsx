"use client";
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Button, LoadingScreen, FormField } from "@/components";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  AuthProvider
} from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

// 通知トーストコンポーネント
function NotificationToast({ message, isError }: { message: string, isError?: boolean }) {
  const bgColor = isError
    ? "bg-gradient-to-r from-red-500 to-red-700"
    : "bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]";

  return (
    <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fadein ${bgColor}`}>
      {isError ? (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeLinecap="round" strokeWidth="2" d="M12 7v6m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      ) : (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#14ba53" /><path d="M16 10l-4.5 4.5L8 11.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      <span className="text-lg font-bold drop-shadow-lg">{message}</span>
    </div>
  );
}

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [notification, setNotification] = useState<{ message: string, isError?: boolean } | null>(null);
  const router = useRouter();

  // ログイン済みユーザーのリダイレクトはmiddlewareに任せる
  // middlewareがusername未設定ならsetup-usernameへ、設定済みなら/へリダイレクト

  const showNotification = (message: string, isError: boolean = false, duration: number = 2200) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), duration);
  };

  // ログイン・メール・パスワード
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    let hasError = false;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'メールアドレスを入力してください';
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'メールアドレスの形式が正しくありません';
        hasError = true;
      }
    }

    if (!password) {
      newErrors.password = 'パスワードを入力してください';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // IDトークンを取得してセッションCookieを作成
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('セッションの作成に失敗しました');
      }

      showNotification("ログインに成功しました！");
      setTimeout(() => router.push("/"), 1800); // Redireciona para a página principal
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      let errorMessage = "ログインに失敗しました。もう一度お試しください。";

      // ユーザーフレンドリーなエラーメッセージに変換
      switch (firebaseError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-email':
          errorMessage = "メールアドレスまたはパスワードが正しくありません。";
          break;
        case 'auth/user-disabled':
          errorMessage = "このアカウントは無効化されています。管理者にお問い合わせください。";
          break;
        case 'auth/too-many-requests':
          errorMessage = "ログイン試行回数が多すぎます。しばらく時間をおいてから再度お試しください。";
          break;
        case 'auth/network-request-failed':
          errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください。";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "メール/パスワードでのログインが無効になっています。";
          break;
      }

      showNotification(errorMessage, true, 3500);
    } finally {
      setLoading(false);
    }
  };

  //ログイン関数　田中
  const handleSocialLogin = async (providerName: 'google' | 'twitter' | 'yahoo') => {
    setLoading(true);
    let provider: AuthProvider;
    let providerDisplayName = '';

    switch (providerName) {
      case 'google':
        provider = new GoogleAuthProvider();
        providerDisplayName = 'Google';
        break;
      case 'twitter':
        provider = new TwitterAuthProvider();
        providerDisplayName = 'X (Twitter)';
        break;
      case 'yahoo':
        provider = new OAuthProvider('yahoo.com');
        providerDisplayName = 'Yahoo!';
        break;
    }

    try {
      const userCredential = await signInWithPopup(auth, provider);

      // IDトークンを取得してセッションCookieを作成
      const idToken = await userCredential.user.getIdToken();
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('セッションの作成に失敗しました');
      }

      showNotification(`${providerDisplayName}でのログインに成功しました！`);
      setTimeout(() => router.push("/"), 1800);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      let errorMessage = `${providerDisplayName}でのログインに失敗しました。`;

      // ユーザーフレンドリーなエラーメッセージに変換
      switch (firebaseError.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = "ログインがキャンセルされました。";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "ログインがキャンセルされました。";
          break;
        case 'auth/popup-blocked':
          errorMessage = "ポップアップがブロックされました。ブラウザの設定を確認してください。";
          break;
        case 'auth/invalid-credential':
        case 'auth/account-exists-with-different-credential':
          errorMessage = `このメールアドレスは既に別の方法で登録されています。`;
          break;
        case 'auth/user-disabled':
          errorMessage = "このアカウントは無効化されています。管理者にお問い合わせください。";
          break;
        case 'auth/network-request-failed':
          errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください。";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = `${providerDisplayName}でのログインが無効になっています。`;
          break;
        case 'auth/unauthorized-domain':
          errorMessage = "このドメインからのログインは許可されていません。";
          break;
      }

      showNotification(errorMessage, true, 3500);
    } finally {
      setLoading(false);
    }
  };

  // 認証チェック中はローディング表示
  if (authLoading) {
    return <LoadingScreen message="読み込み中..." />;
  }

  // ログイン済みの場合もローディング表示（middlewareがリダイレクトするまで）
  if (user) {
    return <LoadingScreen message="画面を移動しています..." />;
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
            <Link href="/" className="inline-block mb-3 sm:mb-4 lg:mb-6 transition-transform hover:scale-105">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-md">
                ツリマチ
              </h1>
            </Link>
            <div className="h-1 w-12 sm:w-16 bg-white/50 mx-auto rounded-full mb-3 sm:mb-4 lg:mb-6"></div>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed font-light opacity-95 tracking-wide">
              おかえりなさい。<br />
              今日も素敵な釣り人ライフを。
            </p>
          </div>
        </div>

        {/* 右側：フォームセクション */}
        <div className="w-full lg:w-7/12 p-4 sm:p-6 lg:p-8 bg-white flex flex-col justify-center overflow-y-auto">
          <div className="max-w-md mx-auto w-full my-auto">
            <div className="text-center mb-3 sm:mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1.5">ログイン</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                アカウント情報を入力してログインしてください
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-2.5 sm:space-y-3">
              <div className="space-y-2.5">
                {/* メールアドレス */}
                <FormField
                  type="text"
                  autoComplete="email"
                  label="メールアドレス"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (touched.email && !e.target.value) {
                      setErrors(prev => ({ ...prev, email: 'メールアドレスを入力してください' }));
                    } else {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, email: true }));
                    if (!email) {
                      setErrors(prev => ({ ...prev, email: 'メールアドレスを入力してください' }));
                    }
                  }}
                  error={errors.email}
                  touched={touched.email}
                />

                {/* パスワード */}
                <div className="relative">
                  <FormField
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    label="パスワード"
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (touched.password && !e.target.value) {
                        setErrors(prev => ({ ...prev, password: 'パスワードを入力してください' }));
                      } else {
                        setErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, password: true }));
                      if (!password) {
                        setErrors(prev => ({ ...prev, password: 'パスワードを入力してください' }));
                      }
                    }}
                    error={errors.password}
                    touched={touched.password}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full py-2.5 sm:py-3 text-sm sm:text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      認証中...
                    </span>
                  ) : "ログイン"}
                </Button>
              </div>

              {/* SNS Divider */}
              <div className="relative flex py-1.5 sm:py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 sm:mx-4 text-gray-400 text-[10px] sm:text-xs font-medium">または外部アカウントでログイン</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* SNS Buttons */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  className="flex items-center justify-center w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 bg-white rounded-lg sm:rounded-xl hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 gap-2 sm:gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[5deg]" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32 30 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z" /><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.4 16.4 18.7 13 24 13c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z" /><path fill="#FBBC05" d="M24 44c5.6 0 10.4-1.8 13.8-4.8l-6.4-5.3c-1.9 1.3-4.3 2.1-7.4 2.1-5.8 0-10.7-3.9-12.5-9h-7v5.7C7 40.3 14.9 44 24 44z" /><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-4.9 5-11.3 5z" /></g></svg>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 transition-colors group-hover:text-gray-900">Googleでログイン</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="flex items-center justify-center w-full px-2 sm:px-4 py-2 sm:py-3 bg-black text-white border-2 border-black rounded-lg sm:rounded-xl hover:bg-gray-900 hover:shadow-lg hover:scale-105 transition-all duration-200 gap-1.5 sm:gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleSocialLogin('twitter')}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    <span className="text-xs sm:text-sm font-semibold">X (Twitter)</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center w-full px-2 sm:px-4 py-2 sm:py-3 bg-[#6001d2] text-white border-2 border-[#6001d2] rounded-lg sm:rounded-xl hover:bg-[#5001b0] hover:border-[#5001b0] hover:shadow-lg hover:scale-105 transition-all duration-200 gap-1.5 sm:gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleSocialLogin('yahoo')}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.52 18.217l-3.26-5.252-2.36 3.792H8.62l3.697-5.94-3.58-5.756h2.278l2.28 3.66 3.26-5.24h2.278l-4.52 7.26 4.637 7.453h-2.28z" /></svg>
                    <span className="text-xs sm:text-sm font-semibold">Yahoo!</span>
                  </button>
                </div>
              </div>

              {/* 新規登録リンク */}
              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-gray-100 flex flex-col items-center gap-1.5 sm:gap-2">
                <p className="text-xs sm:text-sm text-gray-500">アカウントをお持ちでないですか？</p>
                <Button
                  variant="ghost"
                  href="/register"
                  className="gap-2 text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  新規登録する
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {notification && <NotificationToast message={notification.message} isError={notification.isError} />}
    </div>
  );
}
