// pages/message/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
// Star e Flag foram adicionados para a nova barra de perfil
import { User, Send, Star, Flag } from 'lucide-react'; 
import { useNotificationStore } from '@/store/useNotificationStore';
import { db } from '@/lib/firebase'; // Firebase
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

// メッセージの型定義
interface Message {
  id: string;
  sender: 'me' | 'partner';
  content: string;
  timestamp: string;
}

// 会話相手の型定義
interface Conversation {
  id: string;
  name: string;
  preview: string;
}

// サイドバーに表示するダミーの会話データ
const conversations: Conversation[] = [
  { id: '1', name: '田中太郎', preview: '商品について質問が...' },
  { id: '2', name: '佐藤花子', preview: 'ありがとうございました' },
  { id: '3', name: '山田次郎', preview: '配送方法について' },
];

export default function MessagePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 現在選択されている会話相手を管理するState
  const [selectedUser, setSelectedUser] = useState<Conversation>(conversations[0]);

  // Zustand store (通知用)
  const addNotification = useNotificationStore(state => state.addNotification);

  // Firestoreの'messages'コレクションへの参照
  const messagesRef = collection(db, 'messages');

  // Firestoreとのリアルタイム同期
  useEffect(() => {
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sender: data.sender,
          content: data.content,
          timestamp: data.timestamp instanceof Timestamp
            ? data.timestamp.toDate().toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : data.timestamp,
        };
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [messagesRef]);

  // メッセージの自動スクロール処理
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // メッセージ送信処理
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Omit<Message, 'id' | 'timestamp'> = {
      sender: 'me',
      content: inputValue.trim(),
    };

    await addDoc(messagesRef, {
      ...newMessage,
      timestamp: new Date(),
    });

    setInputValue('');

    addNotification({
      id: Date.now(),
      type: 'message',
      title: '新しいメッセージ',
      content: 'メッセージを送信しました！',
      time: '今',
      unread: true,
      icon: 'message',
    });
  };

  return (
    // --- メインレイアウトコンテナ (3カラムに変更) ---
    <div className="flex h-screen bg-gray-50">

      {/* --- 1. サイドバー (会話リスト) --- */}
      <div className="w-80 flex-shrink-0 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        
        {/* サイドバーヘッダー */}
        <div className="h-20 p-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">メッセージ履歴</h1>
        </div>

        {/* 会話リスト */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`flex items-center p-4 cursor-pointer border-l-4 transition-colors duration-150 ${
                selectedUser.id === convo.id
                  ? 'bg-blue-50 border-blue-500'
                  : 'border-transparent hover:bg-gray-100'
              }`}
              onClick={() => setSelectedUser(convo)}
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-md font-semibold text-gray-900">{convo.name}</h3>
                <p className="text-sm text-gray-500 truncate">{convo.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- 2. チャットウィンドウ (中央) --- */}
      {/* このdivに border-r を追加して、右サイドバーとの区切り線を作成 */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        
        {/* チャットヘッダー */}
        <div className="h-20 p-5 flex items-center bg-white border-b border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4">
            <User size={20} className="text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
          </div>
        </div>

        {/* メッセージ表示エリア */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-4 py-3 max-w-md shadow-sm ${
                msg.sender === 'me'
                  ? 'bg-[#2FA3E3] text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <span className={`text-xs block text-right mt-1 ${
                  msg.sender === 'me' ? 'text-blue-100' : 'text-gray-400'
                }`}>{msg.timestamp}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* メッセージ入力エリア */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="メッセージを入力..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-[#2FA3E3] text-white p-3 rounded-lg hover:bg-[#1d7bb8] disabled:bg-gray-400 flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* --- 3. プロフィールサイドバー (新規追加) --- */}
      <div className="w-80 flex-shrink-0 bg-white flex flex-col">
        
        {/* ヘッダー (画像に合わせて青色) */}
        <div className="h-20 p-5 border-b border-gray-200 flex items-center justify-center bg-[#1d7bb8]">
          <h2 className="text-xl font-bold text-white">取引相手</h2>
        </div>
        
        {/* プロフィール本体 */}
        <div className="flex-1 p-6 flex flex-col items-center">
          {/* アバター */}
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-4">
            <User size={60} className="text-gray-600" />
          </div>
          
          {/* 名前 (選択中のユーザー名を動的に表示) */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedUser.name}</h3>
          
          {/* 評価 (ダミーデータ) */}
          <div className="flex items-center gap-1 mb-6">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span className="text-md font-medium text-gray-700 ml-1">5.0</span>
            <span className="text-sm text-gray-500">(128)</span>
          </div>
          
          {/* ボタン */}
          <div className="w-full space-y-3">
            <button className="w-full bg-[#2FA3E3] text-white px-6 py-3 rounded-lg hover:bg-[#1d7bb8] flex items-center justify-center gap-2">
              <User size={16} />
              プロフィールを見る
            </button>
            <button className="w-full bg-transparent text-red-600 px-6 py-3 rounded-lg border border-red-600 hover:bg-red-50 flex items-center justify-center gap-2">
              <Flag size={16} />
              報告する
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}