"use client";

import Link from "next/link";
import { decodeHtmlEntities } from '@/lib/sanitize';
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  User as UserIcon,
  ShoppingCart,
  MessageSquare,
  List,
  Map,
  Menu,
  X
} from "lucide-react";
import { GiFishingPole, GiFishingHook, GiFishingLure, GiEarthWorm, GiSpanner } from "react-icons/gi";
import { FaTape, FaTshirt, FaBox } from "react-icons/fa";
import { SiHelix } from "react-icons/si";
import { Users, Puzzle } from "lucide-react";

import Button from '@/components/ui/Button';
import DropdownMenu from '@/components/ui/DropdownMenu';
import HoverCard from '@/components/ui/HoverCard';
import LoginRequiredModal from '@/components/user/LoginRequiredModal';
import { useAuth } from "@/lib/useAuth";
import { useProfileStore } from "@/stores/useProfileStore";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useCartStore } from "@/stores/useCartStore";
import { useRouter } from "next/navigation";

// カテゴリーリストを釣り関連のアイテムに修正（DBの保存値と一致させる）
const categories = [
  { name: "ロッド/竿", href: "/product-list?category=rod", Icon: GiFishingPole },
  { name: "リール", href: "/product-list?category=reel", Icon: FaTape },
  { name: "ルアー", href: "/product-list?category=lure", Icon: GiFishingLure },
  { name: "ライン/糸", href: "/product-list?category=line", Icon: SiHelix },
  { name: "ハリ/針", href: "/product-list?category=hook", Icon: GiFishingHook },
  { name: "餌", href: "/product-list?category=bait", Icon: GiEarthWorm },
  { name: "ウェア", href: "/product-list?category=wear", Icon: FaTshirt },
  { name: "セット用品", href: "/product-list?category=set", Icon: FaBox },
  { name: "サービス", href: "/product-list?category=service", Icon: GiSpanner },
  { name: "その他", href: "/product-list?category=other", Icon: Puzzle },
];

export default function Header() {
  const { user } = useAuth();
  const profile = useProfileStore((state) => state.profile);
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { name: "投稿一覧", href: "/post-list", Icon: List },
    { name: "地図", href: "/map", Icon: Map },
  ];

  // リアルタイムリスナーの代わりにポーリングを使用（Firestoreコスト削減）
  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0);
      setUnreadMessageCount(0);
      return;
    }

    const fetchUnreadCounts = async () => {
      try {
        // 未読通知数を取得
        const notificationsRef = collection(db, 'users', user.uid, 'notifications');
        const notifQuery = query(notificationsRef, where('isUnread', '==', true));
        const notifSnapshot = await getDocs(notifQuery);
        setUnreadNotificationCount(notifSnapshot.size);

        // 未読メッセージ数を取得
        const conversationsRef = collection(db, 'users', user.uid, 'conversations');
        const convSnapshot = await getDocs(conversationsRef);
        let totalUnread = 0;
        convSnapshot.forEach((doc) => {
          const data = doc.data();
          totalUnread += data.unreadCount || 0;
        });
        setUnreadMessageCount(totalUnread);
      } catch (error) {
        console.error('未読件数の取得に失敗:', error);
      }
    };

    // 初回実行
    fetchUnreadCounts();

    // 60秒ごとにポーリング（Firestoreコスト削減のため30秒から延長）
    const interval = setInterval(fetchUnreadCounts, 60000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 bg-white py-3 sm:py-4 px-4 sm:px-6 lg:px-10 border-b border-gray-200 z-50">
      <div className="flex justify-between lg:justify-around items-center">
        {/* ロゴ */}
        <h1
          className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#2FA3E3]"
         
        >
          <Link
            href="/"
            className="inline-block transition-all duration-300 hover:scale-105 hover:opacity-80"
          >
            ツリマチ
          </Link>
        </h1>

        {/* デスクトップナビゲーション */}
        <nav className="hidden lg:flex mx-11 justify-around gap-12 items-center">
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
              href="/product-list"
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

        {/* デスクトップアイコン */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/notification"
                className="relative flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3] hover:ring-2 hover:ring-[#2FA3E3] hover:ring-offset-2"
                aria-label="通知"
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                ) : null}
              </Link>

              <Link
                href="/message"
                className="relative flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3] hover:ring-2 hover:ring-[#2FA3E3] hover:ring-offset-2"
                aria-label="メッセージ"
              >
                <Mail size={18} />
                {unreadMessageCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                ) : null}
              </Link>

              <Link
                href="/cart"
                className="relative flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3] hover:ring-2 hover:ring-[#2FA3E3] hover:ring-offset-2"
                aria-label="カート"
              >
                <ShoppingCart size={18} />
                {cartItems.length > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {cartItems.length}
                  </span>
                ) : null}
              </Link>

              <HoverCard
                trigger={
                  <Link
                    href={user?.uid ? `/profile/${user.uid}` : "/profile"}
                    className="block w-10 h-10 rounded-full bg-gray-200 border-1 border-gray-300 hover:ring-2 hover:ring-[#2FA3E3] hover:ring-offset-2 transition-all duration-300"
                    aria-label="プロフィール"
                  >
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                      {profile.photoURL ? (
                        <Image
                          src={decodeHtmlEntities(profile.photoURL)}
                          alt="プロフィール画像"
                          width={40}
                          height={40}
                          quality={90}
                          sizes="40px"
                          className="w-full h-full object-cover"
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
                            src={decodeHtmlEntities(profile.photoURL)}
                            alt="プロフィール画像"
                            width={48}
                            height={48}
                            quality={90}
                            sizes="48px"
                            className="w-full h-full object-cover"
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

        {/* モバイル用アイコンとメニューボタン */}
        <div className="flex lg:hidden items-center gap-2 sm:gap-3">
          {user && (
            <>
              {/* メッセージアイコン（モバイル） */}
              <Link
                href="/message"
                className="relative flex justify-center items-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 transition-all duration-300 hover:bg-gray-200"
                aria-label="メッセージ"
              >
                <Mail size={16} />
                {unreadMessageCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                ) : null}
              </Link>

              {/* カートアイコン（モバイル） */}
              <Link
                href="/cart"
                className="relative flex justify-center items-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 transition-all duration-300 hover:bg-gray-200"
                aria-label="カート"
              >
                <ShoppingCart size={16} />
                {cartItems.length > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {cartItems.length}
                  </span>
                ) : null}
              </Link>

              {/* 通知アイコン（モバイル） */}
              <Link
                href="/notification"
                className="relative flex justify-center items-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 transition-all duration-300 hover:bg-gray-200"
                aria-label="通知"
              >
                <Bell size={16} />
                {unreadNotificationCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                ) : null}
              </Link>
            </>
          )}

          {/* ハンバーガーメニューボタン */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex justify-center items-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 transition-all duration-300 hover:bg-gray-200 relative"
            aria-label="メニュー"
          >
            <div className="relative w-5 h-5">
              <Menu
                size={20}
                className={`absolute inset-0 transition-all duration-300 ${isMobileMenuOpen
                  ? 'opacity-0 rotate-90 scale-50'
                  : 'opacity-100 rotate-0 scale-100'
                  }`}
              />
              <X
                size={20}
                className={`absolute inset-0 transition-all duration-300 ${isMobileMenuOpen
                  ? 'opacity-100 rotate-0 scale-100'
                  : 'opacity-0 -rotate-90 scale-50'
                  }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-200 bg-white ${isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 border-t-0'
          }`}
      >
        <nav className="px-4 py-4 space-y-1">
          {user ? (
            <>
              {/* ユーザー情報 */}
              <Link
                href={user?.uid ? `/profile/${user.uid}` : "/profile"}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                    {profile.photoURL ? (
                      <Image
                        src={decodeHtmlEntities(profile.photoURL)}
                        alt="プロフィール画像"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                                              />
                    ) : (
                      <UserIcon size={20} />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{profile.displayName || "ユーザー"}</p>
                  {profile.username && (
                    <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
                  )}
                </div>
              </Link>

              <div className="border-t border-gray-200 my-2"></div>

              {/* メニュー項目 */}
              <Link
                href="/sell"
                className="block px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                出品する
              </Link>

              <Link
                href="/product-list"
                className="block px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                商品を探す
              </Link>

              <Link
                href="/community"
                className="block px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                コミュニティ
              </Link>

              <Link
                href="/post"
                className="block px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                投稿する
              </Link>

              <Link
                href="/post-list"
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                投稿一覧
              </Link>

              <Link
                href="/map"
                className="block px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                地図
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/product-list"
                className="block px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                商品を探す
              </Link>

              <Link
                href="/community"
                className="block px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                コミュニティ
              </Link>

              <div className="border-t border-gray-200 my-2"></div>

              <Link
                href="/login"
                className="block px-3 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-center text-gray-700 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ログイン
              </Link>

              <Link
                href="/register"
                className="block px-3 py-3 rounded-lg bg-[#2FA3E3] hover:bg-[#2892c9] transition-colors text-center text-white font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                新規登録
              </Link>
            </>
          )}
        </nav>
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
