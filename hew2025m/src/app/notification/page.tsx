'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Megaphone, MessageSquare, Trash2, Heart, Star, ShoppingCart, UserPlus, Mail } from 'lucide-react';
import { db } from '@/lib/firebase';
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

  // すべて削除する処理（既読にすることで削除）
  const handleDeleteAll = () => {
    // すべての通知を既読にします
    notifications.forEach(notif => {
      handleMarkAsRead(notif.id);
    });
  };

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

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* パンくずリスト */}
        <nav className="text-sm text-gray-600 mb-4">
          <span>ホーム</span> &gt; <span>通知</span>
        </nav>

        {/* ヘッダー（「すべて既読にする」ボタンが機能するようになりました） */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">✉️ 通知</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleMarkAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              すべて既読にする
            </button>
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
            >
              すべて削除する
            </button>
            {/* フィルター機能は未実装ですが、ボタンは配置済みです */}
            <select className="border border-gray-300 rounded-md p-2 text-sm">
              <option>すべての通知</option>
              <option>未読の通知</option>
            </select>
          </div>
        </div>

        {/* 通知リスト */}
        <div className="space-y-4">
          {/* 通知がない場合にメッセージを表示します */}
          {notifications.length === 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
              <p>🔔 まだ通知はありません。</p>
            </div>
          )}

          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white shadow-md rounded-lg p-4 flex items-start gap-4 ${
                notification.isUnread
                  ? 'border-l-4 border-blue-500'
                  : 'border-l-4 border-transparent'
              } ${notification.link || notification.linkUserId ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* 1. アイコン */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#2FA3E3]"
              >
                {getNotificationIcon(notification.iconType)}
              </div>

              {/* 2. コンテンツ */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 break-words">
                  {notification.title}
                  {(notification.link || notification.linkUserId) && (
                    <span className="ml-2 text-blue-500 text-xs">→ クリックして詳細を表示</span>
                  )}
                </h3>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2 break-words">
                  {notification.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{formatTimestamp(notification.timestamp)}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {notification.tag}
                  </span>
                </div>
              </div>

              {/* 3. アクション */}
              <div className="flex flex-col space-y-2">
                {notification.isUnread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 親のクリックイベントを防止
                      handleMarkAsRead(notification.id);
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-700"
                  >
                    既読にする
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 親のクリックイベントを防止
                    handleDelete(notification.id);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-red-700 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}