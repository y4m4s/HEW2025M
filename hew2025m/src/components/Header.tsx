"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
// ChevronRight アイコンを追加しました
import { Bell, Mail, User as UserIcon, ShoppingCart, ChevronRight } from "lucide-react";
import Button from "@/components/Button";
import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useCartStore } from "@/components/useCartStore";

// カテゴリーリストを釣り関連のアイテムに修正（DBの保存値と一致させる）
const categories = [
  { name: "ロッド/竿", href: "/productList?category=rod" },
  { name: "リール", href: "/productList?category=reel" },
  { name: "ルアー", href: "/productList?category=lure" },
  { name: "ライン/糸", href: "/productList?category=line" },
  { name: "ウェア", href: "/productList?category=wear" },
  { name: "アクセサリー", href: "/productList?category=accessories" },
  { name: "その他", href: "/productList?category=other" },
];

export default function Header() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const cartItems = useCartStore((state) => state.items);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

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
      await auth.signOut();
      setShowLogoutModal(false);
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
    <header className="bg-white py-4 px-10 border-b border-gray-200 relative z-50">
      <div className="flex justify-around items-center">
        <h1
          className="text-7xl font-bold text-[#2FA3E3]"
          style={{ fontFamily: "せのびゴシック, sans-serif" }}
        >
          <Link href="/">ツリマチ</Link>
        </h1>

        <nav className="mx-11 flex justify-around gap-12 items-center">
          <Link
            href="/sell"
            className="relative no-underline text-gray-800 text-base hover:text-[#2FA3E3] transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#2FA3E3] after:transition-all after:duration-300 hover:after:w-full"
          >
            出品する
          </Link>

          {/* --- ドロップダウンメニューの開始 --- */}
          <div className="relative group py-2">
            <Link
              href="/productList"
              className="relative no-underline text-gray-800 text-base hover:text-[#2FA3E3] transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#2FA3E3] after:transition-all after:duration-300 hover:after:w-full flex items-center gap-1"
            >
              商品を探す
            </Link>

            {/* ドロップダウンリスト本体 */}
            <div className="absolute top-full left-0 pt-2 w-[280px] invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-in-out z-50">
              <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="py-2">
                  {categories.map((category, index) => (
                    <Link
                      key={index}
                      href={category.href}
                      className="flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-blue-50 hover:text-[#2FA3E3] transition-colors duration-150 border-b border-gray-50 last:border-0"
                    >
                      <span>{category.name}</span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* --- ドロップダウンメニューの終了 --- */}

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

              <Link href="/cart" className="relative flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3]" aria-label="カート">
                <ShoppingCart size={18} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {cartItems.length}
                  </span>
                )}
              </Link>
              
              <Link
                href={user?.uid ? `/profile/${user.uid}` : "/profile"}
                className="flex items-center gap-3 px-4 py-2 rounded-full border border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-[#2FA3E3] hover:text-[#2FA3E3] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {profile.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt="プロフィール画像"
                      width={40}
                      height={40}
                      quality={90}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <UserIcon size={20} />
                  )}
                </div>
                <span className="font-medium">{profile.displayName || "ユーザー"}</span>
              </Link>
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