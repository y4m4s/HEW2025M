"use client";
import Link from 'next/link';
import { Button, LoadingScreen } from "@/components";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, TwitterAuthProvider, OAuthProvider, GoogleAuthProvider, fetchSignInMethodsForEmail, AuthProvider } from "firebase/auth";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

function SuccessToast({ message }: { message: string }) {
  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fadein">
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#14ba53" /><path d="M16 10l-4.5 4.5L8 11.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span className="text-lg font-bold drop-shadow-lg">{message}</span>
    </div>
  );
}

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isNavigating, startTransition] = useTransition();
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/setup-username");
  }, [router]);

  const showSuccessAndRedirect = (msg: string, to: string) => {
    setSuccessMessage(msg);
    window.setTimeout(() => {
      setSuccessMessage("");
      startTransition(() => {
        router.push(to);
      });
    }, 1500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーションエラーをリセット
    setValidationErrors({ email: "", password: "", confirmPassword: "" });

    // メールアドレスのバリデーション
    if (!email) {
      setValidationErrors(prev => ({ ...prev, email: "メールアドレスを入力してください" }));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationErrors(prev => ({ ...prev, email: "メールアドレスの形式が正しくありません" }));
      return;
    }

    // パスワードの長さチェック
    if (password.length < 8) {
      setValidationErrors(prev => ({ ...prev, password: "パスワードは8文字以上で設定してください" }));
      return;
    }

    // パスワード確認チェック
    if (password !== confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: "パスワードが一致しません" }));
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

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

      showSuccessAndRedirect("アカウント作成に成功しました！ユーザーIDを設定してください", "/setup-username");
    } catch (error: unknown) {
      let errorMessage = "登録エラーが発生しました";
      const firebaseError = error as { code?: string };

      if (firebaseError.code === "auth/email-already-in-use") {
        errorMessage = "このメールアドレスは既に登録されています";
      } else if (firebaseError.code === "auth/invalid-email") {
        errorMessage = "メールアドレスの形式が正しくありません";
      } else if (firebaseError.code === "auth/weak-password") {
        errorMessage = "パスワードは8文字以上で設定してください";
      }

      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // SNSプロバイダー（Google, X, Yahoo!）でのログインを処理する統一関数
  const handleSocialRegister = async (providerName: 'google' | 'twitter' | 'yahoo') => {
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
      default:
        setLoading(false);
        return;
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

      showSuccessAndRedirect(`${providerDisplayName}でのログインに成功しました！`, "/setup-username");
    } catch (error: unknown) {
      let errorMessage = `${providerDisplayName}でのログイン中にエラーが発生しました。`;
      const firebaseError = error as { code?: string, customData?: { email?: string } };

      if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMessage = "ログインがキャンセルされました。";
      } else if (firebaseError.code === 'auth/account-exists-with-different-credential') {
        const email = firebaseError.customData?.email; // エラーからメールアドレスを取得
        if (email) {
          const methods = await fetchSignInMethodsForEmail(auth, email); // 登録済みのログイン方法を問い合わせる
          if (methods.includes('google.com')) {
            errorMessage = "このメールはGoogleで登録済です。Googleからログインしてください。";
          } else if (methods.includes('yahoo.com')) {
            errorMessage = "このメールはYahoo!で登録済です。Yahoo!でログインしてください。";
          } else if (methods.includes('twitter.com')) {
            errorMessage = "このメールはXで登録済です。Xでログインしてください。";
          } else if (methods.includes('password')) {
            errorMessage = "このメールはパスワードで登録済です。メールとパスワードでログインしてください。";
          }
        }
      } else if (firebaseError.code === 'auth/invalid-credential') {
        errorMessage = `${providerDisplayName}との連携設定に問題があります。管理者にお問い合わせください。`;
      }

      console.error(`${providerDisplayName} login error:`, firebaseError.code || error);
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(""), 2200);
    } finally {
      setLoading(false);
    }
  };

  // 認証チェック中はローディング表示
  if (authLoading) {
    return <LoadingScreen message="読み込み中..." />;
  }

  if (isNavigating) {
    return <LoadingScreen message="画面を移動しています..." />;
  }

  // ログイン済みの場合もローディング表示（middlewareがリダイレクトするまで）
  if (user) {
    return <LoadingScreen message="画面を移動しています..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans text-gray-800 bg-[#f0f4f8]">
      {/* メインカード */}
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">

        {/* 左側：ブランディングセクション（デスクトップでは左側、モバイルでは上部） */}
        <div className="lg:w-5/12 bg-gradient-to-br from-[#2FA3E3] to-[#1d7bb8] relative overflow-hidden flex flex-col justify-center items-center text-white p-5 lg:p-12">
          {/* 背景装飾 */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative z-10 text-center">
            <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-md">
                ツリマチ
              </h1>
            </Link>
            <div className="h-1 w-16 bg-white/50 mx-auto rounded-full mb-6"></div>
            <p className="text-lg lg:text-xl leading-relaxed font-light opacity-95 tracking-wide">
              新たなマッチングを求めて、<br />
              釣り人の集まる街へ<br />ようこそ。
            </p>
          </div>
        </div>

        {/* 右側：フォームセクション */}
        <div className="w-full lg:w-7/12 p-8 lg:p-16 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">アカウント作成</h2>
              <p className="text-sm text-gray-500">
                必要な情報を入力して、コミュニティに参加しましょう
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-4">
                {/* メールアドレス */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">メールアドレス</label>
                  <input
                    type="text"
                    autoComplete="email"
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border ${validationErrors.email ? 'border-red-500' : 'border-gray-200'} text-gray-900 focus:bg-white focus:border-[#2FA3E3] focus:ring-4 focus:ring-[#2FA3E3]/10 transition-all duration-200 outline-none`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (validationErrors.email) {
                        setValidationErrors(prev => ({ ...prev, email: "" }));
                      }
                    }}
                  />
                  {validationErrors.email && (
                    <p className="text-red-600 text-sm mt-1.5 ml-1">{validationErrors.email}</p>
                  )}
                </div>

                {/* パスワード */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">パスワード</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border ${validationErrors.password ? 'border-red-500' : 'border-gray-200'} text-gray-900 focus:bg-white focus:border-[#2FA3E3] focus:ring-4 focus:ring-[#2FA3E3]/10 transition-all duration-200 outline-none`}
                    placeholder="8文字以上で入力"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        setValidationErrors(prev => ({ ...prev, password: "" }));
                      }
                    }}
                  />
                  {validationErrors.password && (
                    <p className="text-red-600 text-sm mt-1.5 ml-1">{validationErrors.password}</p>
                  )}
                </div>

                {/* パスワード確認 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">パスワード（確認）</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 border ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-200'} text-gray-900 focus:bg-white focus:border-[#2FA3E3] focus:ring-4 focus:ring-[#2FA3E3]/10 transition-all duration-200 outline-none`}
                    placeholder="パスワードを再入力"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (validationErrors.confirmPassword) {
                        setValidationErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1.5 ml-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      作成中...
                    </span>
                  ) : "アカウント作成"}
                </Button>
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">または外部アカウントで登録</span>
                </div>
              </div>

              {/* SNSボタン */}
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-gray-200 bg-white rounded-xl hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleSocialRegister('google')}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[5deg]" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32 30 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z" /><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.4 16.4 18.7 13 24 13c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z" /><path fill="#FBBC05" d="M24 44c5.6 0 10.4-1.8 13.8-4.8l-6.4-5.3c-1.9 1.3-4.3 2.1-7.4 2.1-5.8 0-10.7-3.9-12.5-9h-7v5.7C7 40.3 14.9 44 24 44z" /><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-4.9 5-11.3 5z" /></g></svg>
                  <span className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-gray-900">Googleで登録</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center w-full px-4 py-3 bg-black text-white border-2 border-black rounded-xl hover:bg-gray-900 hover:shadow-lg hover:scale-105 transition-all duration-200 gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleSocialRegister('twitter')}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    <span className="text-sm font-semibold">X (Twitter)</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center w-full px-4 py-3 bg-[#6001d2] text-white border-2 border-[#6001d2] rounded-xl hover:bg-[#5001b0] hover:border-[#5001b0] hover:shadow-lg hover:scale-105 transition-all duration-200 gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleSocialRegister('yahoo')}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.52 18.217l-3.26-5.252-2.36 3.792H8.62l3.697-5.94-3.58-5.756h2.278l2.28 3.66 3.26-5.24h2.278l-4.52 7.26 4.637 7.453h-2.28z" /></svg>
                    <span className="text-sm font-semibold">Yahoo!</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
                <p className="text-sm text-gray-500">既にアカウントをお持ちですか？</p>

                <Button
                  variant="ghost"
                  href="/login"
                  className="gap-2"
                >
                  ログインする
                </Button>
              </div>
            </form>
          </div>
        </div>

        {successMessage && <SuccessToast message={successMessage} />}
      </div>
    </div>
  );
}
