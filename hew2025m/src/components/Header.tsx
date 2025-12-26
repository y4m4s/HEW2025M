"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  User as UserIcon,
  ShoppingCart,
  MessageSquare,
  List,
  Map
} from "lucide-react";
import { GiFishingPole, GiFishingHook, GiFishingLure, GiEarthWorm, GiSpanner  } from "react-icons/gi";
import { FaTape, FaTshirt, FaBox } from "react-icons/fa";
import { SiHelix } from "react-icons/si";
import { Users, Puzzle } from "lucide-react";

import Button from "@/components/Button";
import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useCartStore } from "@/components/useCartStore";
import DropdownMenu from "@/components/DropdownMenu";
import HoverCard from "@/components/HoverCard";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { useRouter } from "next/navigation";

// カテゴリーリストを釣り関連のアイテムに修正（DBの保存値と一致させる）
const categories = [
  { name: "ロッド/竿", href: "/productList?category=rod", Icon: GiFishingPole },
  { name: "リール", href: "/productList?category=reel", Icon: FaTape },
  { name: "ルアー", href: "/productList?category=lure", Icon: GiFishingLure },
  { name: "ライン/糸", href: "/productList?category=line", Icon: SiHelix },
  { name: "ハリ/針", href: "/productList?category=hook", Icon: GiFishingHook },
  { name: "餌", href: "/productList?category=bait", Icon: GiEarthWorm },
  { name: "ウェア", href: "/productList?category=wear", Icon: FaTshirt },
  { name: "セット用品", href: "/productList?category=set", Icon: FaBox },
  { name: "サービス", href: "/productList?category=service", Icon: GiSpanner },
  { name: "その他", href: "/productList?category=other", Icon: Puzzle },
];

export default function Header() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

  // コミュニティメニューリスト（useStateフック内で定義してuserを参照できるようにする）
  const communityMenuItems = [
    { name: "コミュニティ", href: "/community", Icon: Users },
    {
      name: "投稿",
      Icon: MessageSquare,
      onClick: () => {
        if (!user) {
          setLoginRequiredAction('投稿');
          setShowLoginModal(true);
        } else {
          router.push('/post');
        }
      }
    },
    { name: "投稿一覧", href: "/postList", Icon: List },
    { name: "地図", href: "/map", Icon: Map },
  ];

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

  // 未読メッセージ数を取得
  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }

    const conversationsRef = collection(db, 'users', user.uid, 'conversations');

    const unsubscribe = onSnapshot(conversationsRef, (snapshot) => {
      let totalUnread = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        totalUnread += data.unreadCount || 0;
      });
      setUnreadMessageCount(totalUnread);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <header className="bg-white py-4 px-10 border-b border-gray-200 relative z-50">
      <div className="flex justify-around items-center">
        <h1
          className="text-7xl font-bold text-[#2FA3E3]"
          style={{ fontFamily: "せのびゴシック, sans-serif" }}
        >
          <Link
            href="/"
            className="inline-block transition-all duration-300 hover:scale-105 hover:opacity-80"
          >
            ツリマチ
          </Link>
        </h1>

        <nav className="mx-11 flex justify-around gap-12 items-center">
          <button
            onClick={() => {
              if (!user) {
                setLoginRequiredAction('出品する');
                setShowLoginModal(true);
              } else {
                router.push('/sell');
              }
            }}
            className="relative no-underline text-gray-800 text-base hover:text-[#2FA3E3] transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#2FA3E3] after:transition-all after:duration-300 hover:after:w-full bg-transparent border-0 cursor-pointer"
          >
            出品する
          </button>

          {/* --- 商品を探すドロップダウンメニュー --- */}
          <div className="relative group py-2">
            <Link
              href="/productList"
              className="relative no-underline text-gray-800 text-base hover:text-[#2FA3E3] transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#2FA3E3] after:transition-all after:duration-300 hover:after:w-full flex items-center gap-1"
            >
              商品を探す
            </Link>
            <DropdownMenu items={categories} columns={2} />
          </div>

          {/* --- コミュニティドロップダウンメニュー --- */}
          <div className="relative group py-2">
            <Link
              href="/community"
              className="relative no-underline text-gray-800 text-base hover:text-[#2FA3E3] transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#2FA3E3] after:transition-all after:duration-300 hover:after:w-full flex items-center gap-1"
            >
              コミュニティ
            </Link>
            <DropdownMenu items={communityMenuItems} columns={1} />
          </div>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/notification"
                className="relative flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3] hover:ring-2 hover:ring-[#2FA3E3] hover:ring-offset-2"
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
                className="relative flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3] hover:ring-2 hover:ring-[#2FA3E3] hover:ring-offset-2"
                aria-label="メッセージ"
              >
                <Mail size={18} />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3] hover:ring-2 hover:ring-[#2FA3E3] hover:ring-offset-2"
                aria-label="カート"
              >
                <ShoppingCart size={18} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {cartItems.length}
                  </span>
                )}
              </Link>
              
              <HoverCard
                trigger={
                  <Link
                    href={user?.uid ? `/profile/${user.uid}` : "/profile"}
                    className="block w-10 h-10 rounded-full bg-gray-200 border-1 border-gray-300 hover:ring-2 hover:ring-[#2FA3E3] hover:ring-offset-2 transition-all duration-300"
                  >
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
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
                  </Link>
                }
                side="bottom"
                align="end"
              >
                <Link
                  href={user?.uid ? `/profile/${user.uid}` : "/profile"}
                  className="block w-[280px] rounded-lg p-1 -m-1 duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 border-1 border-gray-300 flex-shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                        {profile.photoURL ? (
                          <Image
                            src={profile.photoURL}
                            alt="プロフィール画像"
                            width={48}
                            height={48}
                            quality={90}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <UserIcon size={24} />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">{profile.displayName || "ユーザー"}</h3>
                      {profile.username && (
                        <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
                      )}
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{profile.bio}</p>
                  )}
                </Link>
              </HoverCard>
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

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </header>
  );
}