'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, User as UserIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface LikedUser {
  _id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  createdAt: string;
}

interface EnrichedLikedUser extends LikedUser {
  displayName: string;
  username: string;
  photoURL: string;
}

interface LikedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export default function LikedUsersModal({ isOpen, onClose, postId }: LikedUsersModalProps) {
  const [users, setUsers] = useState<EnrichedLikedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchLikedUsers();
    }
  }, [isOpen, postId]);

  const fetchLikedUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}/likes`);
      if (!response.ok) throw new Error('いいねユーザーの取得に失敗しました');
      const data = await response.json();
      const likes: LikedUser[] = data.likes || [];

      // 各ユーザーのFirestore情報を取得
      const enrichedUsers = await Promise.all(
        likes.map(async (like) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', like.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...like,
                displayName: userData.displayName || '名無しユーザー',
                username: userData.username || 'user',
                photoURL: userData.photoURL || '',
              };
            }
            // Firestoreにデータがない場合はデフォルト値
            return {
              ...like,
              displayName: like.userName || '名無しユーザー',
              username: 'user',
              photoURL: like.userPhotoURL || '',
            };
          } catch (error) {
            console.error(`ユーザー ${like.userId} の情報取得エラー:`, error);
            return {
              ...like,
              displayName: like.userName || '名無しユーザー',
              username: 'user',
              photoURL: like.userPhotoURL || '',
            };
          }
        })
      );

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('いいねユーザー取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-bold">いいねしたユーザー</h3>
            {!loading && users.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">合計 {users.length} 件のいいね</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              まだいいねがありません
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <Link
                  key={user._id}
                  href={`/profile/${user.userId}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon size={24} className="text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{user.displayName}</p>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(user.createdAt).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
