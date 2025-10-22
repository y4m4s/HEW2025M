import { Mail, DollarSign, Heart, Users, MessageCircle, Megaphone, Bell } from 'lucide-react';
import Button from '@/components/Button';

function getNotificationIcon(iconType: string) {
  switch (iconType) {
    case 'mail': return <Mail size={24} />;
    case 'dollar': return <DollarSign size={24} />;
    case 'heart': return <Heart size={24} />;
    case 'users': return <Users size={24} />;
    case 'message': return <MessageCircle size={24} />;
    case 'megaphone': return <Megaphone size={24} />;
    default: return <Bell size={24} />;
  }
}

export default function NotificationPage() {
  const notifications = [
    {
      id: 1,
      type: 'message',
      title: '新しいメッセージ',
      content: '釣り人1さんからメッセージが届きました',
      time: '5分前',
      unread: true,
icon: 'mail'
    },
    {
      id: 2,
      type: 'sell',
      title: '商品が購入されました',
      content: 'あなたの商品「釣り竿セット」が購入されました',
      time: '1時間前',
      unread: true,
icon: 'dollar'
    },
    {
      id: 3,
      type: 'like',
      title: 'いいね！がつきました',
      content: 'あなたの商品「ルアーセット」にいいね！がつきました',
      time: '3時間前',
      unread: false,
icon: 'heart'
    },
    {
      id: 4,
      type: 'follow',
      title: '新しいフォロワー',
      content: '釣り好き太郎さんがあなたをフォローしました',
      time: '5時間前',
      unread: false,
icon: 'users'
    },
    {
      id: 5,
      type: 'comment',
      title: 'コメントがつきました',
      content: 'あなたの投稿にコメントがつきました',
      time: '1日前',
      unread: false,
icon: 'message'
    },
    {
      id: 6,
      type: 'system',
      title: 'システム通知',
      content: '新機能「マップ検索」がリリースされました',
      time: '2日前',
      unread: false,
icon: 'megaphone'
    }
  ];

  return (
    <div>
      
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                通知
              </h1>
              <Button variant="ghost" size="md" className="text-[#2FA3E3] hover:text-[#1d7bb8]">
                すべて既読にする
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-4">
                  <Button variant="primary" size="md">
                    すべて
                  </Button>
                  <Button variant="ghost" size="md" className="text-gray-600 hover:text-[#2FA3E3]">
                    未読のみ
                  </Button>
                  <Button variant="ghost" size="md" className="text-gray-600 hover:text-[#2FA3E3]">
                    メッセージ
                  </Button>
                  <Button variant="ghost" size="md" className="text-gray-600 hover:text-[#2FA3E3]">
                    取引
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                      notification.unread ? 'bg-blue-50 border-l-4 border-l-[#2FA3E3]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-semibold ${notification.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {notification.time}
                            </span>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm ${notification.unread ? 'text-gray-700' : 'text-gray-600'}`}>
                          {notification.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 空の状態表示 */}
              {notifications.length === 0 && (
                <div className="p-12 text-center">
                  <div className="text-6xl text-gray-300 mb-4">
                    <Bell size={64} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    通知はありません
                  </h3>
                  <p className="text-gray-500">
                    新しい通知があるとここに表示されます
                  </p>
                </div>
              )}

              {/* ページネーション */}
              {notifications.length > 0 && (
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="md" className="text-gray-500 hover:text-[#2FA3E3]">
                        ← 前へ
                      </Button>
                      <Button variant="primary" size="md">1</Button>
                      <Button variant="ghost" size="md" className="text-gray-600 hover:text-[#2FA3E3]">2</Button>
                      <Button variant="ghost" size="md" className="text-gray-600 hover:text-[#2FA3E3]">3</Button>
                      <Button variant="ghost" size="md" className="text-gray-500 hover:text-[#2FA3E3]">
                        次へ →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}