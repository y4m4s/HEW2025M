"use client";
import Link from 'next/link';
import Button from '@/components/Button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, provider, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

function SuccessToast({ message }: { message: string }) {
  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fadein">
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#14ba53"/><path d="M16 10l-4.5 4.5L8 11.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span className="text-lg font-bold drop-shadow-lg" style={{fontFamily: 'せのびゴシック, sans-serif'}}>{message}</span>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const router = useRouter();

  const showSuccessAndRedirect = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast('');
      router.push('/');
    }, 1800);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showSuccessAndRedirect('ログインに成功しました！ホームへ移動します');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setToast('ログインエラー: ' + message);
      setTimeout(() => setToast(''), 2200);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);

      // setup-username側で既存ユーザーかどうかを判定する
      setToast('ログイン成功！');
      setTimeout(() => {
        setToast('');
        router.push('/setup-username');
      }, 1000);
    } catch (error: unknown) {
      console.error("Googleログインエラー:", error);
      const message = error instanceof Error ? error.message : String(error);
      setToast('Googleログインエラー: ' + message);
      setTimeout(() => setToast(''), 2200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] flex items-center justify-center p-5">
      {toast && <SuccessToast message={toast} />}
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-4xl font-bold text-[#2FA3E3]" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            ツリマチ
          </Link>
        </div>
        <div className="bg-white rounded-2xl p-10 mb-8 shadow-xl relative overflow-hidden">
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
                placeholder="メールアドレス"
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
                placeholder="パスワード"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2.5"
              disabled={loading}
            >
              {loading ? "処理中..." : "ログイン"}
            </Button>
            <button
              type="button"
              className="w-full mt-3 p-4 flex justify-center items-center border border-[#2FA3E3] text-[#2FA3E3] bg-white rounded-lg text-base font-bold cursor-pointer transition-all duration-300 hover:bg-[#f0faff]"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ fontFamily: 'せのびゴシック, sans-serif' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32 30 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.4 16.4 18.7 13 24 13c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z"/><path fill="#FBBC05" d="M24 44c5.6 0 10.4-1.8 13.8-4.8l-6.4-5.3c-1.9 1.3-4.3 2.1-7.4 2.1-5.8 0-10.7-3.9-12.5-9h-7v5.7C7 40.3 14.9 44 24 44z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-4.9 5-11.3 5z"/></g></svg>
              Googleでログイン
            </button>
          </form>
          <div className="text-center mt-5">
            <a href="#" className="text-[#2FA3E3] no-underline text-sm transition-colors duration-300 hover:text-[#1d7bb8] hover:underline">
              パスワードをお忘れですか？
            </a>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-8 py-6 flex items-center justify-between gap-5 shadow-md relative">
          <span className="text-sm text-gray-600 flex-1 leading-6">
            ユーザー登録がお済みでない方は<br />
            コチラから登録をお願いします
          </span>
          <span className="mx-4 text-xl text-[#2FA3E3] font-bold transition-transform duration-300">→</span>
          <Button
            href="/register"
            variant="primary"
            size="sm"
            className="whitespace-nowrap rounded-full"
          >
            新規登録
          </Button>
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#2c3e50] to-[#34495e] text-white py-5">
        <div className="container mx-auto px-5 text-center">
          <p className="text-sm text-gray-400 m-0">&copy; 2024 ツリマチ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}