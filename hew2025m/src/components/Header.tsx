"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Bell, Mail, User as UserIcon } from "lucide-react";
import Button from "@/components/Button";
import LogoutModal from "@/components/LogoutModal";
import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Header() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // 未読通知数を取得
  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, where('isUnread', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotificationCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Firebase Authからログアウト
      await auth.signOut();

      // モーダルを閉じる
      setShowLogoutModal(false);

      // トップページに遷移
      router.push("/");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <header className="bg-white py-4 px-10 border-b border-gray-200">
      <div className="flex justify-around items-center">
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
                className="relative flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3]"
                aria-label="通知"
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </Link>

              <Link
                href="/message"
                className="flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3]"
                aria-label="メッセージ"
              >
                <Mail size={18} />
              </Link>

              <Link
                href={user?.uid ? `/profile/${user.uid}` : "/profile"}
                className="flex items-center gap-2 text-gray-800 hover:text-blue-600"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {profile.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt="プロフィール画像"
                      width={32}
                      height={32}
                      quality={90}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={18} />
                  )}
                </div>
                <span>{profile.displayName || "ユーザー"}</span>
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
