"use client";
import Link from 'next/link';
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
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#14ba53"/><path d="M16 10l-4.5 4.5L8 11.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )}
      <span className="text-lg font-bold drop-shadow-lg" style={{fontFamily: 'せのびゴシック, sans-serif'}}>{message}</span>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, isError?: boolean } | null>(null);
  const router = useRouter();

  const showNotification = (message: string, isError: boolean = false, duration: number = 2200) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), duration);
  };

  // ログイン・メール・パスワード
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showNotification("ログインに成功しました！");
      setTimeout(() => router.push("/"), 1800); // Redireciona para a página principal
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      let errorMessage = "ログインエラーが発生しました。";
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        errorMessage = "メールアドレスまたはパスワードが間違っています。";
      }
      showNotification(errorMessage, true, 3000);
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
      await signInWithPopup(auth, provider);
      showNotification(`${providerDisplayName}でのログインに成功しました！`);
      setTimeout(() => router.push("/"), 1800);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      let errorMessage = `${providerDisplayName}でのログイン中にエラーが発生しました。`;
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMessage = "ログインがキャンセルされました。";
      } else if (firebaseError.code === 'auth/invalid-credential') {
        errorMessage = `${providerDisplayName}との連携設定に問題があります。`;
      }
      showNotification(errorMessage, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-6xl font-bold text-[#2FA3E3] tracking-wider" style={{ fontFamily: "せのびゴシック, sans-serif", textShadow: "0 2px 4px rgba(47, 163, 227, 0.1)" }}>
            ツリマチ
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl p-10 shadow-xl relative overflow-hidden mb-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>
          
          <h2 className="text-3xl font-bold text-center mb-9 text-gray-800 relative" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            ログイン
            <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>
          </h2>
          
          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <input
                type="email"
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20"
                placeholder="example@email.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
              <input
                type="password"
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20"
                placeholder="パスワードを入力"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="w-full p-4 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 mt-5 hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#2FA3E3]/30"
              disabled={loading}
            >
              {loading ? "処理中..." : "ログイン"}
            </button>

            {/* --- BOTÕES DE LOGIN SOCIAL --- */}
            <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">または</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full p-4 flex justify-center items-center border border-[#2FA3E3] text-[#2FA3E3] bg-white rounded-lg text-base font-bold cursor-pointer transition-all duration-300 hover:bg-[#f0faff]"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32 30 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.4 16.4 18.7 13 24 13c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z"/><path fill="#FBBC05" d="M24 44c5.6 0 10.4-1.8 13.8-4.8l-6.4-5.3c-1.9 1.3-4.3 2.1-7.4 2.1-5.8 0-10.7-3.9-12.5-9h-7v5.7C7 40.3 14.9 44 24 44z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-4.9 5-11.3 5z"/></g></svg>
              Googleでログイン
            </button>

            {/* X (Twitter) Button */}
            <button
              type="button"
              className="w-full mt-3 p-4 flex justify-center items-center bg-black text-white border border-black rounded-lg text-base font-bold cursor-pointer transition-all duration-300 hover:bg-gray-800"
              onClick={() => handleSocialLogin('twitter')}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X (Twitter)でログイン
            </button>

            {/* Yahoo Button */}
            <button
              type="button"
              className="w-full mt-3 p-4 flex justify-center items-center bg-[#6001d2] text-white border border-[#6001d2] rounded-lg text-base font-bold cursor-pointer transition-all duration-300 hover:bg-[#5001b0]"
              onClick={() => handleSocialLogin('yahoo')}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.52 18.217l-3.26-5.252-2.36 3.792H8.62l3.697-5.94-3.58-5.756h2.278l2.28 3.66 3.26-5.24h2.278l-4.52 7.26 4.637 7.453h-2.28z"/></svg>
              Yahoo!でログイン
            </button>

          </form>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-2">アカウントをお持ちでないですか？</p>
          <Link 
            href="/register" 
            className="text-[#2FA3E3] no-underline font-medium transition-colors duration-300 hover:text-[#1d7bb8] hover:underline"
          >
            新規登録
          </Link>
        </div>
      </div>

      {notification && <NotificationToast message={notification.message} isError={notification.isError} />}

    </div>
  );
}
