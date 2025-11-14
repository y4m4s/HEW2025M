"use client";
import Link from 'next/link';
import { auth, provider, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { useRouter } from "next/navigation";

function SuccessToast({ message }: { message: string }) {
  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fadein">
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#14ba53"/><path d="M16 10l-4.5 4.5L8 11.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span className="text-lg font-bold drop-shadow-lg" style={{fontFamily: 'せのびゴシック, sans-serif'}}>{message}</span>
    </div>
  );
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const showSuccessAndRedirect = (msg: string, to: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage("");
      router.push(to);
    }, 1800);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setSuccessMessage("パスワードが一致しません");
      setTimeout(() => setSuccessMessage(""), 1400);
      return;
    }

    // ユーザーネームのバリデーション
    if (username.length < 3) {
      setSuccessMessage("ユーザーネームは3文字以上で入力してください");
      setTimeout(() => setSuccessMessage(""), 2200);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setSuccessMessage("ユーザーネームは英数字とアンダースコアのみ使用できます");
      setTimeout(() => setSuccessMessage(""), 2200);
      return;
    }

    setLoading(true);
    try {
      // Firebase Authenticationでアカウント作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestoreにユーザープロフィールを保存
      await setDoc(doc(db, "users", user.uid), {
        displayName: username,
        username: username,
        bio: "",
        photoURL: "",
        createdAt: new Date().toISOString(),
      });

      showSuccessAndRedirect("アカウント作成に成功しました！ログインへ移動します", "/login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setSuccessMessage("登録エラー: " + message);
      setTimeout(() => setSuccessMessage(""), 2200);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      // ユーザーネーム設定画面へリダイレクト
      showSuccessAndRedirect("Googleでログインに成功しました！ユーザーネームを設定してください", "/setup-username");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setSuccessMessage("Googleでのログインエラー: " + message);
      setTimeout(() => setSuccessMessage(""), 2200);
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
        
        <div className="text-center text-base text-gray-600 mb-9 leading-6 p-5 bg-white rounded-xl shadow-sm">
          新たなマッチングを求めて<br />
          釣り人の集まる街「ツリマチ」に参加しよう。
        </div>
        
        <div className="bg-white rounded-2xl p-10 shadow-xl relative overflow-hidden mb-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>
          
          <h2 className="text-3xl font-bold text-center mb-9 text-gray-800 relative" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            新規登録
            <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>
          </h2>
          
          <form onSubmit={handleRegister}>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">ユーザーネーム</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                <input
                  type="text"
                  className="w-full p-4 pl-8 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20"
                  placeholder="username"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase())}
                  required
                  minLength={3}
                  pattern="[a-zA-Z0-9_]+"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">3文字以上、英数字とアンダースコアのみ</p>
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
              <input
                type="password"
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20"
                placeholder="8文字以上で入力"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード確認</label>
              <input
                type="password"
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20"
                placeholder="パスワードを再入力"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="w-full p-4 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 mt-5 relative overflow-hidden hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#2FA3E3]/30 active:transform active:translate-y-0"
              disabled={loading}
            >
              {loading ? "処理中..." : "アカウント作成"}
            </button>
            <button
              type="button"
              className="w-full mt-3 p-4 flex justify-center items-center border border-[#2FA3E3] text-[#2FA3E3] bg-white rounded-lg text-base font-bold cursor-pointer transition-all duration-300 hover:bg-[#f0faff]"
              onClick={handleGoogleRegister}
              disabled={loading}
              style={{ fontFamily: 'せのびゴシック, sans-serif' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32 30 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.4 16.4 18.7 13 24 13c2.5 0 4.8.8 6.7 2.3l6.2-6.2C33.3 6.6 28.9 5 24 5c-7.3 0-13.7 4.5-16.6 11.1l6.9 5.1z"/><path fill="#FBBC05" d="M24 44c5.6 0 10.4-1.8 13.8-4.8l-6.4-5.3c-1.9 1.3-4.3 2.1-7.4 2.1-5.8 0-10.7-3.9-12.5-9h-7v5.7C7 40.3 14.9 44 24 44z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-4.9 5-11.3 5z"/></g></svg>
              Googleで登録／ログイン
            </button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-2">既にアカウントをお持ちですか？</p>
          <Link 
            href="/login" 
            className="text-[#2FA3E3] no-underline font-medium transition-colors duration-300 hover:text-[#1d7bb8] hover:underline"
          >
            ログイン
          </Link>
        </div>
      </div>

      {successMessage && <SuccessToast message={successMessage} />}

      <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#2c3e50] to-[#34495e] text-white py-5">
        <div className="container mx-auto px-5 text-center">
          <p className="text-sm text-gray-400 m-0">&copy; 2024 ツリマチ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}