'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Megaphone, MessageSquare, Trash2, Heart, Star, ShoppingCart, UserPlus, Mail, Bell, Home, ChevronRight, CheckCheck, ChevronLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import CustomSelect from '@/components/CustomSelect';
import Button from '@/components/Button';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
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
  const itemsPerPage = 10;

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
  
  // すべてを既読にする処理
  const handleMarkAllAsRead = () => {
    // 未読の通知それぞれに対して、handleMarkAsReadを呼び出します
    notifications.forEach(notif => {
      if (notif.isUnread) {
        handleMarkAsRead(notif.id);
      }
    });
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
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* パンくずリスト */}
        <nav className="text-sm text-gray-600 mb-4 flex items-center gap-2">
          <Home size={16} />
          <span>ホーム</span>
          <ChevronRight size={16} />
          <span>通知</span>
        </nav>

        {/* ヘッダー（「すべて既読にする」ボタンが機能するようになりました） */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell size={28} className="text-[#2FA3E3]" />
            通知
          </h1>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleMarkAllAsRead}
              variant="primary"
              size="sm"
              icon={<CheckCheck size={16} />}
            >
              すべて既読にする
            </Button>
            <Button
              onClick={handleDeleteAll}
              variant="secondary"
              size="sm"
              icon={<Trash2 size={16} />}
            >
              すべて削除する
            </Button>
            {/* フィルター機能 */}
            <div className="w-48">
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
        <div className="space-y-4">
          {/* 通知がない場合にメッセージを表示します */}
          {filteredNotifications.length === 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <Bell size={20} />
                <p>{filterValue === 'unread' ? '未読の通知はありません。' : 'まだ通知はありません。'}</p>
              </div>
            </div>
          )}

          {paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl p-5 flex items-start gap-4 transition-all duration-300 ${
                notification.isUnread
                  ? 'border-l-4 border-[#2FA3E3] shadow-lg'
                  : 'border-l-4 border-transparent shadow-md'
              } ${notification.link || notification.linkUserId ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-l-[#1d7bb8]' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* 1. アイコン */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#2FA3E3] to-[#1d7bb8] shadow-md"
              >
                {getNotificationIcon(notification.iconType)}
              </div>

              {/* 2. コンテンツ */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 break-words text-base">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2 break-words leading-relaxed">
                  {notification.description}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Bell size={12} />
                    {formatTimestamp(notification.timestamp)}
                  </span>
                  <span className="bg-gradient-to-r from-blue-50 to-cyan-50 text-[#2FA3E3] px-3 py-1 rounded-full font-medium border border-blue-100">
                    {notification.tag}
                  </span>
                </div>
              </div>

              {/* 3. アクション */}
              <div className="flex flex-col space-y-2">
                {notification.isUnread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    既読
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              icon={<ChevronLeft size={16} />}
            >
              前へ
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${
                    currentPage === page
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
            >
              次へ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}