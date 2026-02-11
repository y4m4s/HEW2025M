'use client';

import { useEffect, useState } from 'react';
import { decodeHtmlEntities } from '@/lib/sanitize';
import { X, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { collection, query, where, getDocs, doc, getDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { createFollowNotification } from '@/lib/notifications';
import toast from 'react-hot-toast';

interface UserInfo {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string;
  bio: string;
}

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'following' | 'followers';
  onFollowChange?: () => void; // フォロー数が変更された時のコールバック
}

export default function FollowListModal({ isOpen, onClose, userId, type: initialType, onFollowChange }: FollowListModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStates, setFollowStates] = useState<Record<string, { isFollowing: boolean; docId: string | null; isMutual: boolean }>>({});
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(initialType);
  const [profileUser, setProfileUser] = useState<{ displayName: string; username: string } | null>(null);

  // プロフィールユーザーの情報を取得
  useEffect(() => {
    if (!isOpen) return;

    const fetchProfileUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileUser({
            displayName: data.displayName || '不明なユーザー',
            username: data.username || 'unknown',
          });
        }
      } catch (error) {
        console.error('プロフィールユーザー取得エラー:', error);
      }
    };

    fetchProfileUser();
  }, [isOpen, userId]);

  // タブが変わったら初期タブをリセット
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
    }
  }, [isOpen, initialType]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchFollowList = async () => {
      setLoading(true);
      try {
        const followsRef = collection(db, 'follows');
        let q;

        if (activeTab === 'following') {
          // フォローしているユーザーを取得
          q = query(followsRef, where('followingUserId', '==', userId));
        } else {
          // フォロワーを取得
          q = query(followsRef, where('followedUserId', '==', userId));
        }

        const snapshot = await getDocs(q);
        const userIds = snapshot.docs.map(doc => {
          const data = doc.data();
          return activeTab === 'following' ? data.followedUserId : data.followingUserId;
        });

        // 各ユーザーの情報を取得
        const userInfoPromises = userIds.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            return {
              uid: userDoc.id,
              displayName: data.displayName || '不明なユーザー',
              username: data.username || 'unknown',
              photoURL: data.photoURL || '',
              bio: data.bio || '',
            };
          }
          return null;
        });

        const userInfos = await Promise.all(userInfoPromises);
        const filteredUsers = userInfos.filter((u): u is UserInfo => u !== null);
        setUsers(filteredUsers);

        // 各ユーザーのフォロー状態をチェック
        if (user) {
          const followStatesMap: Record<string, { isFollowing: boolean; docId: string | null; isMutual: boolean }> = {};

          for (const userInfo of filteredUsers) {
            if (userInfo.uid === user.uid) {
              // 自分自身はスキップ
              followStatesMap[userInfo.uid] = { isFollowing: false, docId: null, isMutual: false };
              continue;
            }

            const followsRef = collection(db, 'follows');

            // 自分が相手をフォローしているかチェック
            const q = query(
              followsRef,
              where('followingUserId', '==', user.uid),
              where('followedUserId', '==', userInfo.uid)
            );
            const snapshot = await getDocs(q);

            // 相手が自分をフォローしているかチェック（相互フォロー判定）
            const reverseQ = query(
              followsRef,
              where('followingUserId', '==', userInfo.uid),
              where('followedUserId', '==', user.uid)
            );
            const reverseSnapshot = await getDocs(reverseQ);

            const isFollowing = !snapshot.empty;
            const isFollowedBack = !reverseSnapshot.empty;

            followStatesMap[userInfo.uid] = {
              isFollowing,
              docId: isFollowing ? snapshot.docs[0].id : null,
              isMutual: isFollowing && isFollowedBack
            };
          }

          setFollowStates(followStatesMap);
        }
      } catch (error) {
        console.error('フォローリスト取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowList();
  }, [isOpen, userId, activeTab, user]);

  // ESCキーでモーダルを閉じる & スクロール制御
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleUserClick = (uid: string) => {
    onClose();
    router.push(`/profile/${uid}`);
  };

  const handleFollowToggle = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // プロフィールへの遷移を防ぐ

    if (!user) return;

    const currentState = followStates[targetUserId];
    if (!currentState) return;

    try {
      if (currentState.isFollowing && currentState.docId) {
        // フォロー解除
        await deleteDoc(doc(db, 'follows', currentState.docId));
        setFollowStates(prev => ({
          ...prev,
          [targetUserId]: { isFollowing: false, docId: null, isMutual: false }
        }));

        // フォロー数変更を親コンポーネントに通知
        if (onFollowChange) {
          onFollowChange();
        }
      } else {
        // フォロー
        const followData = {
          followingUserId: user.uid,
          followedUserId: targetUserId,
          createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, 'follows'), followData);

        // 相手が自分をフォローしているかチェック
        const followsRef = collection(db, 'follows');
        const reverseQ = query(
          followsRef,
          where('followingUserId', '==', targetUserId),
          where('followedUserId', '==', user.uid)
        );
        const reverseSnapshot = await getDocs(reverseQ);
        const isMutual = !reverseSnapshot.empty;

        setFollowStates(prev => ({
          ...prev,
          [targetUserId]: { isFollowing: true, docId: docRef.id, isMutual }
        }));

        // フォロー通知を作成
        await createFollowNotification(targetUserId, user.uid);

        // フォロー数変更を親コンポーネントに通知
        if (onFollowChange) {
          onFollowChange();
        }
      }
    } catch (error) {
      console.error('フォロー処理エラー:', error);
      toast.error('フォロー処理に失敗しました');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30 p-4"
      onClick={onClose}
    >
      {/* モーダルコンテンツ */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white rounded-t-lg border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              {profileUser && (
                <div>
                  <h3 className="text-lg font-bold">{profileUser.displayName}</h3>
                  <p className="text-sm text-gray-500">@{profileUser.username}</p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="閉じる"
            >
              <X size={20} />
            </button>
          </div>

          {/* タブ */}
          <div className="flex border-t">
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'following'
                  ? 'text-[#2FA3E3] border-b-2 border-[#2FA3E3]'
                  : 'text-gray-600 hover:text-[#2FA3E3] hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('following')}
            >
              Following
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'followers'
                  ? 'text-[#2FA3E3] border-b-2 border-[#2FA3E3]'
                  : 'text-gray-600 hover:text-[#2FA3E3] hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('followers')}
            >
              Followers
            </button>
          </div>
        </div>

        {/* ユーザーリスト */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2FA3E3]"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {activeTab === 'following' ? 'フォローしているユーザーはいません' : 'フォロワーはいません'}
            </p>
          ) : (
            <div className="space-y-4">
              {users.map((userItem) => {
                const followState = followStates[userItem.uid];
                const isOwnProfile = user?.uid === userItem.uid;

                return (
                  <div
                    key={userItem.uid}
                    className="p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      {/* アバター */}
                      <div
                        className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden relative flex-shrink-0 cursor-pointer"
                        onClick={() => handleUserClick(userItem.uid)}
                      >
                        {userItem.photoURL ? (
                          <Image
                            src={decodeHtmlEntities(userItem.photoURL)}
                            alt={userItem.displayName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <User size={24} className="text-gray-600" />
                        )}
                      </div>

                      {/* ユーザー情報 */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="cursor-pointer"
                          onClick={() => handleUserClick(userItem.uid)}
                        >
                          <p className="font-semibold text-gray-900 truncate hover:text-[#2FA3E3] transition-colors">
                            {userItem.displayName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            @{userItem.username}
                          </p>
                        </div>

                        {/* Bio */}
                        {userItem.bio && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2 break-words-safe">
                            {userItem.bio}
                          </p>
                        )}
                      </div>

                      {/* フォローボタン */}
                      {!isOwnProfile && followState && (
                        <div className="flex items-center gap-2">
                          {followState.isMutual && (
                            <span className="text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-full bg-gray-50">
                              相互フォロー
                            </span>
                          )}
                          <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                              followState.isFollowing
                                ? 'border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                                : 'bg-[#2FA3E3] text-white hover:bg-[#1d7bb8]'
                            }`}
                            onClick={(e) => handleFollowToggle(userItem.uid, e)}
                          >
                            {followState.isFollowing ? 'フォロー解除' : 'フォローする'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター（閉じるボタン） */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
