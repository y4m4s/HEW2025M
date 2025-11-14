"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell, Mail, User as UserIcon } from "lucide-react";
import Button from "@/components/Button";
import LogoutModal from "@/components/LogoutModal";
import { useAuth } from "@/lib/useAuth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");

  // Firestoreからユーザー情報を取得
  useEffect(() => {
    if (!user) {
      setUsername("");
      setDisplayName("");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username || "");
          setDisplayName(data.displayName || user.displayName || "ユーザー");
        } else {
          setDisplayName(user.displayName || "ユーザー");
        }
      } catch (error) {
        console.error("ユーザー情報取得エラー:", error);
        setDisplayName(user.displayName || "ユーザー");
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await auth.signOut(); // desloga do Firebase
      router.push("/"); // トップページに遷移
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
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
            className="relative no-underline text-gray-800 text-base hover:text-[#2FA3E3] transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#2FA3E3] after:transition-all after:duration-300 hover:after:w-full"
          >
            出品する
          </Link>
          <Link
            href="/search"
            className="relative no-underline text-gray-800 text-base hover:text-[#2FA3E3] transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#2FA3E3] after:transition-all after:duration-300 hover:after:w-full"
          >
            商品を探す
          </Link>
          <Link
            href="/community"
            className="relative no-underline text-gray-800 text-base hover:text-[#2FA3E3] transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#2FA3E3] after:transition-all after:duration-300 hover:after:w-full"
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
                <span>{username ? `@${username}` : displayName}</span>
              </Link>

              <button
                onClick={handleLogoutClick}
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

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </header>
  );
}
