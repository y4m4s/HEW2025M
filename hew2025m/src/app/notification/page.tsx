'use client';

import { useState } from 'react';
import { Megaphone, JapaneseYen, MessageSquare, Trash2 } from 'lucide-react';

// --- 1. 通知アイテムの型定義 ---
interface NotificationItem {
  id: string;
  iconType: 'system' | 'sales' | 'comment'; // アイコンの種類を限定
  iconBgColor: string; // Tailwindのクラス
  title: string;
  description: string;
  timestamp: string;
  tag: string;
  isUnread: boolean;
}

// --- 2. サンプルの通知データ ---
const sampleNotifications: NotificationItem[] = [
  {
    id: '1',
    iconType: 'system',
    iconBgColor: 'bg-cyan-500', // 青緑系
    title: 'システムメンテナンスのお知らせ',
    description: '明日午前2時〜4時にシステムメンテナンスを実施いたします。サービスをご利用いただけない時間帯がございますので、ご了承ください。',
    timestamp: '2時間前',
    tag: 'システム通知',
    isUnread: true,
  },
  {
    id: '2',
    iconType: 'sales',
    iconBgColor: 'bg-green-500', // 緑系
    title: '商品が売れました！',
    description: '「ダイワ エメラルダス MX 83M」が売れました。購入者への発送準備をお願いいたします。',
    timestamp: '3時間前',
    tag: '売上通知',
    isUnread: true,
  },
  {
    id: '3',
    iconType: 'comment',
    iconBgColor: 'bg-yellow-500', // 黄色系
    title: '商品にコメントが付きました',
    description: '田中太郎さんが「シマノ ステラ SW 8000HG」にコメントしました：「この商品の状態について詳しく教えてください」',
    timestamp: '5時間前',
    tag: 'コメント',
    isUnread: true,
  },
];

// --- 3. アイコンを返すヘルパー関数 ---
const getNotificationIcon = (iconType: string) => {
  switch (iconType) {
    case 'system':
      return <Megaphone className="w-6 h-6 text-white" />;
    case 'sales':
      return <JapaneseYen className="w-6 h-6 text-white" />; // ✅ CORRIGIDO
    case 'comment':
      return <MessageSquare className="w-6 h-6 text-white" />;
    default:
      return null;
  }
};

// --- 4. 通知ページのメインコンポーネント ---
export default function NotificationPage() {
  // 通知のリストをStateで管理
  const [notifications, setNotifications] = useState(sampleNotifications);

  // 既読にする処理（ダミー）
  const handleMarkAsRead = (id: string) => {
    console.log(`Mark as read: ${id}`);
    // 実際の処理: setNotifications(...) で対象アイテムの isUnread を false にする
  };

  // 削除する処理（ダミー）
  const handleDelete = (id: string) => {
    console.log(`Delete: ${id}`);
    // 実際の処理: setNotifications(...) で対象アイテムをリストから削除する
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* パンくずリスト */}
        <nav className="text-sm text-gray-600 mb-4">
          <span>ホーム</span> &gt; <span>通知</span>
        </nav>

        {/* ヘッダー（タイトルと操作） */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">✉️ 通知</h1>
          <div className="flex items-center gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              すべて既読にする
            </button>
            <select className="border border-gray-300 rounded-md p-2 text-sm">
              <option>すべての通知</option>
              <option>未読の通知</option>
            </select>
          </div>
        </div>

        {/* 通知リストのコンテナ */}
        <div className="space-y-4">
          
          {/* 通知リストをループ処理 */}
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white shadow-md rounded-lg p-4 flex items-start gap-4 ${
                notification.isUnread ? 'border-l-4 border-blue-500' : 'border-l-4 border-transparent'
              }`}
            >
              {/* 1. アイコンセクション */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.iconBgColor}`}
              >
                {getNotificationIcon(notification.iconType)}
              </div>

              {/* 2. コンテンツセクション */}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{notification.title}</h3>
                <p className="text-sm text-gray-700 mt-1">{notification.description}</p>
                
                {/* メタ情報（タイムスタンプとタグ） */}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{notification.timestamp}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {notification.tag}
                  </span>
                </div>
              </div>

              {/* 3. アクションボタンセクション */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-700"
                >
                  既読にする
                </button>
                <button
                  onClick={() => handleDelete(notification.id)}
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