'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Megaphone, MessageSquare, Trash2, Heart, Star, ShoppingCart, UserPlus, Mail, Bell, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import CustomSelect from '@/components/CustomSelect';
import Button from '@/components/Button';
import UserHoverCard from '@/components/UserHoverCard';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

interface NotificationItem {
  id: string;
  iconType: 'system' | 'like' | 'rating' | 'comment' | 'message' | 'follow' | 'purchase' | 'sales';
  iconBgColor: string;
  title: string;
  description: string;
  timestamp: Timestamp | string; // FirestoreはTimestampを送信します
  tag: string;
  isUnread: boolean;
  link?: string; // 遷移先URL（オプション）
  linkUserId?: string; // メッセージ通知用のユーザーID（オプション）
  actorUserId?: string; // 通知の発信者のユーザーID（○○さんの部分）
  actorDisplayName?: string; // 通知の発信者の表示名
}

// 通知タイプごとに適切なアイコンを表示
const getNotificationIcon = (iconType: string) => {
  switch (iconType) {
    case 'system':
      return <Megaphone className="w-6 h-6 text-white" />;
    case 'like':
      return <Heart className="w-6 h-6 text-white" />;
    case 'rating':
      return <Star className="w-6 h-6 text-white" />;
    case 'comment':
      return <MessageSquare className="w-6 h-6 text-white" />;
    case 'message':
      return <Mail className="w-6 h-6 text-white" />;
    case 'follow':
      return <UserPlus className="w-6 h-6 text-white" />;
    case 'purchase':
    case 'sales':
      return <ShoppingCart className="w-6 h-6 text-white" />;
    default:
      return <Megaphone className="w-6 h-6 text-white" />;
  }
};

// --- 通知ページのメインコンポーネント ---
export default function NotificationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // stateは空の配列で初期化します。
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterValue, setFilterValue] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 認証チェック：未ログインならログインページへリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Firestoreから通知を読み込みます
  useEffect(() => {
    if (!user) return;

    // 参照はユーザーのサブコレクションを指します
    const notifRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notifRef, orderBy('timestamp', 'desc')); // 新しい順に並べ替え

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifData: NotificationItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp, // timestampをそのまま保持します (または必要に応じてフォーマットします)
        } as NotificationItem;
      });
      setNotifications(notifData);
    });

    return () => unsubscribe();
  }, [user]); // userに依存します

  // 未読IDを追跡するためのRef
  const unreadIdsRef = useRef<string[]>([]);

  // 通知が更新されたら未読IDリストを更新
  useEffect(() => {
    unreadIdsRef.current = notifications
      .filter(n => n.isUnread)
      .map(n => n.id);
  }, [notifications]);

  // コンポーネントのアンマウント時（ページ遷移時など）にまとめて既読にする
  useEffect(() => {
    return () => {
      const idsToMark = unreadIdsRef.current;
      if (idsToMark.length > 0 && user) {
        // バッチ書き込みを行う非同期関数を即時実行
        const markAllRead = async () => {
          try {
            const batch = writeBatch(db);
            idsToMark.forEach(id => {
              const docRef = doc(db, 'users', user.uid, 'notifications', id);
              batch.update(docRef, { isUnread: false });
            });
            await batch.commit();
            console.log('Marked notifications as read on cleanup');
          } catch (error) {
            console.error('Error marking notifications as read:', error);
          }
        };
        markAllRead();
      }
    };
  }, [user]); // userが変わるとき（ログアウト時）も実行される

  // Timestampをフォーマットする関数
  const formatTimestamp = (timestamp: Timestamp | string) => {
    if (typeof timestamp === 'string') return timestamp;
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }); // 日付/時刻のフォーマット（秒なし）
    }
    return 'Data inválida';
  };

  // 既読にする処理（Firestoreと連携）
  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid, 'notifications', id);
    try {
      await updateDoc(docRef, {
        isUnread: false,
      });
    } catch (error) {
      console.error("Erro ao marcar como lida: ", error);
    }
  };

  // 削除処理（Firestoreと連携）
  const handleDelete = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid, 'notifications', id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao deletar: ", error);
    }
  };

  // すべて削除する処理
  const handleDeleteAll = () => {
    // すべての通知を削除します
    notifications.forEach(notif => {
      handleDelete(notif.id);
    });
  };

  // ページ変更時は先頭にスクロール
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // フィルター変更時はページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [filterValue]);

  // 通知をクリックした際の処理（遷移先に移動して既読にする）
  const handleNotificationClick = async (notification: NotificationItem) => {

    // リンクがない場合は何もしない
    if (!notification.linkUserId && !notification.link) {
      return;
    }

    // 既読にする
    if (notification.isUnread) {
      await handleMarkAsRead(notification.id);
    }

    // 遷移先がある場合は移動
    if (notification.linkUserId) {
      // メッセージ通知の場合
      router.push(`/message?userId=${notification.linkUserId}`);
    } else if (notification.link) {
      // その他のリンクがある場合
      router.push(notification.link);
    }
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">読み込み中...</div>;
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">通知機能を利用するには<a href="/login" className="text-blue-500 underline ml-2">ログイン</a>が必要です。</div>;
  }

  // フィルター適用後の通知リスト
  const filteredNotifications = filterValue === 'all'
    ? notifications
    : notifications.filter(notif => notif.isUnread);

  // ページング計算
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  // フィルターオプション
  const filterOptions = [
    { value: 'all', label: 'すべての通知' },
    { value: 'unread', label: '未読の通知' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-3 sm:p-5 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー（「すべて既読にする」ボタンが機能するようになりました） */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell size={24} className="text-[#2FA3E3] sm:w-7 sm:h-7" />
            通知
          </h1>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              onClick={handleDeleteAll}
              variant="secondary"
              size="sm"
              icon={<Trash2 size={16} />}
              className="flex-shrink-0"
            >
              すべて削除する
            </Button>
            {/* フィルター機能 */}
            <div className="flex-1 sm:flex-none sm:w-48">
              <CustomSelect
                value={filterValue}
                onChange={setFilterValue}
                options={filterOptions}
                placeholder="フィルター"
              />
            </div>
          </div>
        </div>

        {/* 通知リスト */}
        <div className="space-y-3 sm:space-y-4">
          {/* 通知がない場合にメッセージを表示します */}
          {filteredNotifications.length === 0 && (
            <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 text-center text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <Bell size={18} className="sm:w-5 sm:h-5" />
                <p className="text-sm sm:text-base">{filterValue === 'unread' ? '未読の通知はありません。' : 'まだ通知はありません。'}</p>
              </div>
            </div>
          )}

          {paginatedNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 flex items-start gap-2 sm:gap-3 md:gap-4 transition-all duration-300 relative ${notification.isUnread
                ? 'border-l-4 border-[#2FA3E3] shadow-lg'
                : 'border-l-4 border-transparent shadow-md'
                } ${notification.link || notification.linkUserId ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-l-[#2FA3E3]' : ''}`}
              style={{ zIndex: paginatedNotifications.length - index }}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* 削除ボタン（右上） */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notification.id);
                }}
                className="absolute top-1 sm:top-2 right-1 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-500 hover:bg-red-500 text-white flex items-center justify-center transition-colors duration-200"
                aria-label="削除"
              >
                <X size={14} className="sm:w-4 sm:h-4" />
              </button>

              {/* 1. アイコン */}
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 my-auto rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#2FA3E3] to-[#1d7bb8] shadow-md"
              >
                {getNotificationIcon(notification.iconType)}
              </div>

              {/* 2. コンテンツ */}
              <div className="flex-1 min-w-0 pr-6 sm:pr-8">
                <h3 className="text-gray-900 break-words text-sm sm:text-base">
                  {(() => {
                    // actorUserIdとactorDisplayNameがある場合はUserHoverCardを使用
                    if (notification.actorUserId && notification.actorDisplayName) {
                      const match = notification.title.match(/^(.+?さん)(.+)$/);
                      if (match) {
                        return (
                          <>
                            <UserHoverCard
                              userId={notification.actorUserId}
                              displayName={notification.actorDisplayName}
                            />
                            <span className="font-normal">{match[2]}</span>
                          </>
                        );
                      }
                    }

                    // それ以外は通常の表示
                    const match = notification.title.match(/^(.+?さん)(.+)$/);
                    if (match) {
                      return (
                        <>
                          <span className="font-bold">{match[1]}</span>
                          <span className="font-normal">{match[2]}</span>
                        </>
                      );
                    }
                    return <span className="font-bold">{notification.title}</span>;
                  })()}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 line-clamp-2 break-words leading-relaxed">
                  {notification.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Bell size={12} />
                    <span className="text-[10px] sm:text-xs">{formatTimestamp(notification.timestamp)}</span>
                  </span>
                  <span className="bg-gradient-to-r from-blue-50 to-cyan-50 text-[#2FA3E3] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium border border-blue-100 text-[10px] sm:text-xs w-16 sm:w-20 text-center">
                    {notification.tag}
                  </span>
                  {notification.isUnread && (
                    <span className="bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-sm animate-pulse">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 sm:mt-8">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              icon={<ChevronLeft size={16} />}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">前へ</span>
            </Button>

            <div className="flex items-center gap-1 sm:gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${currentPage === page
                    ? 'bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              icon={<ChevronRight size={16} />}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">次へ</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}