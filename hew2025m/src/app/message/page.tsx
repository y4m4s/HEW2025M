'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Send } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar?: string;
}

export default function MessagePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('会話の取得に失敗しました');
      
      const data = await response.json();
      setConversations(data.conversations || []);
      
      if (data.conversations?.length > 0) {
        setSelectedConversation(data.conversations[0].id);
      }
    } catch (err) {
      console.error('会話取得エラー:', err);
      // ダミーデータを使用
      const dummyConversations: Conversation[] = Array.from({ length: 8 }, (_, i) => ({
        id: `conv-${i}`,
        userName: `釣り人${i + 1}`,
        lastMessage: i === 0 ? 'この商品はまだ販売中ですか？' : '商品について質問があります...',
        timestamp: i === 0 ? '5分前' : `${i + 1}時間前`,
        unread: i === 0
      }));
      setConversations(dummyConversations);
      setSelectedConversation('conv-0');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('メッセージの取得に失敗しました');
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('メッセージ取得エラー:', err);
      // ダミーデータを使用
      const dummyMessages: Message[] = [
        {
          id: '1',
          sender: '釣り人1',
          content: 'この商品はまだ販売中ですか？',
          timestamp: '15:30',
          isOwn: false
        },
        {
          id: '2',
          sender: 'You',
          content: 'はい、まだ販売中です！',
          timestamp: '15:32',
          isOwn: true
        },
        {
          id: '3',
          sender: '釣り人1',
          content: '購入を検討しているのですが、傷の具合はいかがですか？',
          timestamp: '15:35',
          isOwn: false
        }
      ];
      setMessages(dummyMessages);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: inputValue,
          timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        })
      });

      if (!response.ok) throw new Error('メッセージ送信に失敗しました');

      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'You',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };

      setMessages([...messages, newMessage]);
      setInputValue('');
    } catch (err) {
      console.error('メッセージ送信エラー:', err);
      // ローカルのみで追加（デモ用）
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'You',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };
      setMessages([...messages, newMessage]);
      setInputValue('');
    }
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-5 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 
            className="text-4xl font-bold text-center text-gray-800 mb-12"
            style={{ fontFamily: "せのびゴシック, sans-serif" }}
          >
            メッセージ
          </h1>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '600px' }}>
            <div className="flex h-full">
              {/* メッセージリスト */}
              <div className="w-1/3 border-r border-gray-200">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h2 
                    className="text-lg font-semibold text-gray-800"
                    style={{ fontFamily: "せのびゴシック, sans-serif" }}
                  >
                    メッセージ一覧
                  </h2>
                </div>
                <div className="overflow-y-auto h-full">
                  {conversations.map((conv, i) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                        selectedConversation === conv.id
                          ? 'bg-blue-50 border-l-4 border-l-[#2FA3E3]'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                          <User size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-medium text-gray-800 truncate">
                              {conv.userName}
                            </h3>
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {conv.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conv.lastMessage}
                          </p>
                          {conv.unread && (
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* メッセージ詳細 */}
              <div className="flex-1 flex flex-col">
                {/* ヘッダー */}
                {currentConversation ? (
                  <>
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                          <User size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {currentConversation.userName}
                          </h3>
                          <p className="text-sm text-gray-500">オンライン</p>
                        </div>
                      </div>
                    </div>

                    {/* メッセージエリア */}
                    <div className="flex-1 p-4 overflow-y-auto">
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex items-start gap-3 ${
                              msg.isOwn ? 'justify-end' : ''
                            }`}
                          >
                            {!msg.isOwn && (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                                <User size={16} />
                              </div>
                            )}
                            <div
                              className={`rounded-lg px-4 py-2 max-w-xs ${
                                msg.isOwn
                                  ? 'bg-[#2FA3E3] text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <span
                                className={`text-xs ${
                                  msg.isOwn
                                    ? 'text-blue-200'
                                    : 'text-gray-500'
                                }`}
                              >
                                {msg.timestamp}
                              </span>
                            </div>
                            {msg.isOwn && (
                              <div className="w-8 h-8 bg-[#2FA3E3] rounded-full flex items-center justify-center text-sm text-white flex-shrink-0">
                                <User size={16} />
                              </div>
                            )}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* メッセージ入力エリア */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="メッセージを入力..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim()}
                          className="bg-[#2FA3E3] text-white px-6 py-3 rounded-lg hover:bg-[#1d7bb8] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center gap-2"
                        >
                          <Send size={16} />
                          送信
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    会話を選択してください
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}