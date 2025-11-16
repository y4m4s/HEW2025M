// message/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Send } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { db } from '@/lib/firebase'; // firebase使うか
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Message {
  id: string;
  sender: 'me' | 'partner';
  content: string;
  timestamp: string;
}

export default function MessagePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Zustand store
  const addNotification = useNotificationStore(state => state.addNotification);

  // 参照するFirestoreのコレクション
  const messagesRef = collection(db, 'messages');

  // 初期メッセージとFirestoreのリアルタイム同期
  useEffect(() => {
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          sender: data.sender,
          content: data.content,
          timestamp: data.timestamp,
        };
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // メッセージをFirebaseに保存
    await addDoc(messagesRef, {
      sender: newMessage.sender,
      content: newMessage.content,
      timestamp: new Date(),
    });

    setInputValue('');

    // 通知を追加
    addNotification({
      id: Date.now(),
      type: 'message',
      title: '新しいメッセージ',
      content: '新しいメッセージを送信しました',
      time: '今',
      unread: true,
      icon: 'message',
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-5 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">メッセージ</h1>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '600px' }}>
            <div className="flex flex-col h-full">
              {/* ヘッダー */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">釣り人ユーザー</h3>
                    <p className="text-sm text-gray-500">オンライン</p>
                  </div>
                </div>
              </div>

              {/* メッセージエリア */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'partner' && (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                          <User size={14} />
                        </div>
                      )}

                      <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.sender === 'me' ? 'bg-[#2FA3E3] text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <p>{msg.content}</p>
                        <span className={`text-xs ${msg.sender === 'me' ? 'text-blue-200' : 'text-gray-500'}`}>{msg.timestamp}</span>
                      </div>

                      {msg.sender === 'me' && (
                        <div className="w-8 h-8 bg-[#2FA3E3] text-white rounded-full flex items-center justify-center ml-2">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 入力エリア */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="メッセージを入力..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-[#2FA3E3]/30"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-[#2FA3E3] text-white px-6 py-3 rounded-lg hover:bg-[#1d7bb8] disabled:bg-gray-400 flex items-center gap-2"
                  >
                    <Send size={16} />
                    送信
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
