"use client";
import Link from "next/link";
import { Bell, Mail, User as UserIcon } from "lucide-react";
import Button from "@/components/Button";
import { useAuth } from "@/lib/useAuth"; // import correto
import { auth } from "@/lib/firebase";

export default function Header() {
  const user = useAuth(); // pega usuário logado

  const handleLogout = async () => {
    try {
      await auth.signOut(); // desloga do Firebase
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <header className="bg-white py-4 px-10 border-b border-gray-200">
      <div className="flex justify-around items-center mb-5">
        <h1
          className="text-7xl font-bold text-[#2FA3E3]"
          style={{ fontFamily: "せのびゴシック, sans-serif" }}
        >
          <Link href="/">ツリマチ</Link>
        </h1>

        <nav className="mx-11 flex justify-around gap-12">
          <Link
            href="/sell"
            className="no-underline text-gray-800 text-base hover:text-blue-600 hover:border-b-2 hover:border-blue-600 transition-all duration-300"
          >
            出品する
          </Link>
          <Link
            href="/search"
            className="no-underline text-gray-800 text-base hover:text-blue-600 hover:border-b-2 hover:border-blue-600 transition-all duration-300"
          >
            商品を探す
          </Link>
          <Link
            href="/community"
            className="no-underline text-gray-800 text-base hover:text-blue-600 hover:border-b-2 hover:border-blue-600 transition-all duration-300"
          >
            コミュニティ
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/notification"
                className="flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3]"
                aria-label="通知"
              >
                <Bell size={18} />
              </Link>

              <Link
                href="/message"
                className="flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3]"
                aria-label="メッセージ"
              >
                <Mail size={18} />
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2 text-gray-800 hover:text-blue-600"
              >
                <UserIcon size={18} />
                <span>{user.displayName || "ユーザー"}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="py-2 px-4 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors duration-300"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Button href="/login" variant="outline" size="sm" className="rounded-full">
                ログイン
              </Button>
              <Button href="/register" variant="primary" size="sm" className="rounded-full">
                新規登録
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
