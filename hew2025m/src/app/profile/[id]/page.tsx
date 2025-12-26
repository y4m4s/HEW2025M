"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { useRouter, useParams } from "next/navigation";
import { User, LogOut, Loader2 } from "lucide-react";

import { useAuth } from "@/lib/useAuth";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, Timestamp } from "firebase/firestore";
import ProfileEdit from "@/components/ProfileEdit";
import ProfSelling from "@/components/ProfSelling";
import ProfHistory from "@/components/ProfHistory";
import ProfBookmark from "@/components/ProfBookmark";
import ProfLikedPosts from "@/components/ProfLikedPosts";
import ProfPost from "@/components/ProfPost";
import RecentlyViewed from "@/components/RecentlyViewed";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadingScreen from "@/components/LoadingScreen";

import UserRating from "@/components/UserRating";
import FollowListModal from "@/components/FollowListModal";
import LogoutModal from "@/components/LogoutModal";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { createFollowNotification } from "@/lib/notifications";
import toast from "react-hot-toast";

type TabType = "selling" | "history" | "bookmarks" | "likedPosts" | "posts";

interface UserProfile {
  uid: string;
  displayName: string;
  username?: string; // ユーザー名（@xxxx）を追加。存在しない場合もあるためオプショナルに。

  photoURL: string;
  bio: string;
  email: string;
}

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("selling");
  const [sellingCount, setSellingCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [likedPostsCount, setLikedPostsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<'following' | 'followers'>('following');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 対象ユーザーのプロフィールを取得
  const fetchUserProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setTargetProfile({
          uid: userDoc.id,
          ...userDoc.data(),
        } as UserProfile);
      } else {
        // ユーザーが存在しない場合
        router.push("/");
      }
    } catch (error) {
      console.error("プロフィール取得エラー:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  // フォロー/フォロワー数を取得
  const fetchFollowCounts = async () => {
    if (!userId) return;

    try {
      const followsRef = collection(db, 'follows');

      // フォロー数を取得
      const followingQuery = query(followsRef, where('followingUserId', '==', userId));
      const followingSnapshot = await getDocs(followingQuery);
      setFollowingCount(followingSnapshot.size);

      // フォロワー数を取得
      const followersQuery = query(followsRef, where('followedUserId', '==', userId));
      const followersSnapshot = await getDocs(followersQuery);
      setFollowersCount(followersSnapshot.size);
    } catch (error) {
      console.error('フォロー数取得エラー:', error);
    }
  };

  // 現在のユーザーがこのプロフィールをフォローしているか確認
  const checkFollowStatus = async () => {
    if (!user || !userId || user.uid === userId) {
      setIsFollowing(false);
      setFollowDocId(null);
      return;
    }

    try {
      const followsRef = collection(db, 'follows');
      const q = query(
        followsRef,
        where('followingUserId', '==', user.uid),
        where('followedUserId', '==', userId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setIsFollowing(true);
        setFollowDocId(snapshot.docs[0].id);
      } else {
        setIsFollowing(false);
        setFollowDocId(null);
      }
    } catch (error) {
      console.error('フォロー状態確認エラー:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchFollowCounts();
    // ログイン時のみフォロー状態をチェック
    if (user) {
      checkFollowStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user]);

  // 自分のプロフィールかどうかを判定
  const isOwnProfile = user?.uid === userId;

  // フォロー/フォロー解除処理
  const handleFollowToggle = async () => {
    if (!user) {
      setLoginRequiredAction('フォロー');
      setShowLoginModal(true);
      return;
    }
    if (!targetProfile) return;

    try {
      if (isFollowing && followDocId) {
        // フォロー解除
        await deleteDoc(doc(db, 'follows', followDocId));
        setIsFollowing(false);
        setFollowDocId(null);
        setFollowersCount(prev => prev - 1);
      } else {
        // フォロー
        const followData = {
          followingUserId: user.uid,
          followedUserId: targetProfile.uid,
          createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, 'follows'), followData);
        setIsFollowing(true);
        setFollowDocId(docRef.id);
        setFollowersCount(prev => prev + 1);

        // フォロー通知を作成
        await createFollowNotification(targetProfile.uid, user.uid);
      }
    } catch (error) {
      console.error('フォロー処理エラー:', error);
      toast.error('フォロー処理に失敗しました');
    }
  };

  // メッセージページへ遷移
  const handleSendMessage = () => {
    if (!user) {
      setLoginRequiredAction('メッセージを送る');
      setShowLoginModal(true);
      return;
    }
    if (!targetProfile) return;
    router.push(`/message?userId=${targetProfile.uid}`);
  };

  // ログアウト処理
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      setShowLogoutModal(false);
      toast.success('ログアウトしました');
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      setShowLogoutModal(false);
      toast.error('ログアウトに失敗しました');
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  if (loading || authLoading || !targetProfile) {
    return <LoadingSpinner message="プロフィールを読み込み中……" size="lg" fullScreen />;
  }

  if (isLoggingOut) {
    return <LoadingScreen message="ログアウトしています..." />;
  }

  return (
    <>
      {/* Profile Edit Modal (自分のプロフィールの場合のみ) */}
      {isOwnProfile && (
        <ProfileEdit
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          currentProfile={targetProfile}
          onSaveSuccess={fetchUserProfile}
        />
      )}

      {/* Follow List Modal */}
      <FollowListModal
        isOpen={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        userId={userId}
        type={followModalType}
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />

      {/* ページ */}
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Profile Left */}
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center">
                  {targetProfile.photoURL ? (
                    <Image
                      src={targetProfile.photoURL}
                      alt="プロフィール画像"
                      width={96}
                      height={96}
                      quality={90}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} />
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "せのびゴシック" }}>
                  {targetProfile.displayName || "名無しユーザー"}
                </h1>
                <p className="text-gray-600 mb-4">@{targetProfile.username || 'user'}</p>

                {/* フォロー/フォロワー表示 */}
                <div className="flex justify-center gap-6 mb-4 text-sm">
                  <button
                    onClick={() => {
                      setFollowModalType('following');
                      setFollowModalOpen(true);
                    }}
                    className="hover:text-[#2FA3E3] transition-colors"
                  >
                    <span className="font-bold">{followingCount}</span>
                    <span className="text-gray-600 ml-1">フォロー</span>
                  </button>
                  <button
                    onClick={() => {
                      setFollowModalType('followers');
                      setFollowModalOpen(true);
                    }}
                    className="hover:text-[#2FA3E3] transition-colors"
                  >
                    <span className="font-bold">{followersCount}</span>
                    <span className="text-gray-600 ml-1">フォロワー</span>
                  </button>
                </div>

                {/* ボタンエリア - 高さを統一 */}
                <div className="space-y-3">
                  {isOwnProfile ? (
                    // 自分のプロフィールの場合: プロフィール編集ボタンとログアウトボタン
                    <>
                      <button
                        className="w-full bg-[#2FA3E3] text-white py-3 rounded-lg hover:bg-[#1d7bb8] transition-colors"
                        onClick={() => setEditOpen(true)}
                      >
                        プロフィール編集
                      </button>
                      <button
                        className="w-full border border-red-500 text-red-500 py-3 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        onClick={handleLogoutClick}
                      >
                        <LogOut size={18} />
                        ログアウト
                      </button>
                    </>
                  ) : (
                    // 他人のプロフィールの場合: フォローボタンとメッセージボタン
                    <>
                      <button
                        className={`w-full py-3 rounded-lg transition-colors ${isFollowing
                            ? 'border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                            : 'bg-[#2FA3E3] text-white hover:bg-[#1d7bb8]'
                          }`}
                        onClick={handleFollowToggle}
                      >
                        {isFollowing ? 'フォロー解除' : 'フォローする'}
                      </button>
                      <button
                        className="w-full border border-[#2FA3E3] text-[#2FA3E3] py-3 rounded-lg hover:bg-[#2FA3E3] hover:text-white transition-colors"
                        onClick={handleSendMessage}
                      >
                        メッセージ
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="font-bold mb-2" style={{ fontFamily: "せのびゴシック" }}>
                  自己紹介
                </h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                  {targetProfile.bio || "自己紹介が設定されていません"}
                </p>
              </div>

              {/* 評価カード */}
              <UserRating targetUserId={userId} isOwnProfile={isOwnProfile} />
            </div>

            {/* 商品タブ */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg">
              <div className="flex border-b text-sm overflow-x-auto">
                <button
                  className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === "selling"
                      ? "text-[#2FA3E3] border-b-2 border-[#2FA3E3]"
                      : "text-gray-600 hover:text-[#2FA3E3]"
                    }`}
                  onClick={() => setActiveTab("selling")}
                >
                  出品中 ({sellingCount})
                </button>
                <button
                  className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === "history"
                      ? "text-[#2FA3E3] border-b-2 border-[#2FA3E3]"
                      : "text-gray-600 hover:text-[#2FA3E3]"
                    }`}
                  onClick={() => setActiveTab("history")}
                >
                  出品履歴 ({historyCount})
                </button>
                <button
                  className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === "posts"
                      ? "text-[#2FA3E3] border-b-2 border-[#2FA3E3]"
                      : "text-gray-600 hover:text-[#2FA3E3]"
                    }`}
                  onClick={() => setActiveTab("posts")}
                >
                  投稿 ({postsCount})
                </button>
                {/* ブックマークは自分のプロフィールの場合のみ表示 */}
                {isOwnProfile && (
                  <button
                    className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === "bookmarks"
                        ? "text-[#2FA3E3] border-b-2 border-[#2FA3E3]"
                        : "text-gray-600 hover:text-[#2FA3E3]"
                      }`}
                    onClick={() => setActiveTab("bookmarks")}
                  >
                    ブックマーク ({bookmarkCount})
                  </button>
                )}
                {/* いいねは自分のプロフィールの場合のみ表示 */}
                {isOwnProfile && (
                  <button
                    className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === "likedPosts"
                        ? "text-[#2FA3E3] border-b-2 border-[#2FA3E3]"
                        : "text-gray-600 hover:text-[#2FA3E3]"
                      }`}
                    onClick={() => setActiveTab("likedPosts")}
                  >
                    いいね ({likedPostsCount})
                  </button>
                )}
              </div>

              <div style={{ display: activeTab === "selling" ? "block" : "none" }}>
                <ProfSelling onCountChange={setSellingCount} userId={userId} />
              </div>
              <div style={{ display: activeTab === "history" ? "block" : "none" }}>
                <ProfHistory onCountChange={setHistoryCount} userId={userId} />
              </div>
              <div style={{ display: activeTab === "posts" ? "block" : "none" }}>
                <ProfPost onCountChange={setPostsCount} userId={userId} />
              </div>
              {isOwnProfile && (
                <>
                  <div style={{ display: activeTab === "bookmarks" ? "block" : "none" }}>
                    <ProfBookmark onCountChange={setBookmarkCount} />
                  </div>
                  <div style={{ display: activeTab === "likedPosts" ? "block" : "none" }}>
                    <ProfLikedPosts onCountChange={setLikedPostsCount} userId={userId} />
                  </div>
                </>
              )}
            </div>

          </div>
          {/* Recently Viewed Products */}
          <RecentlyViewed />
        </div>
      </div>
    </>
  );
}
