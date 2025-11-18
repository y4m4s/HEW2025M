'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Send, Star, Flag } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc, // --- NOVO ---
} from 'firebase/firestore';

// --- NOVO ---
// Precisamos saber quem é o usuário atual.
// Idealmente, isso viria de um hook de autenticação (ex: useAuth).
// Por agora, vamos usar um valor fixo.
const MY_USER_ID = 'eduardo';

// --- MODIFICADO ---
// Mensagem agora guarda o ID real do remetente
interface Message {
  id: string;
  senderId: string; // 'me' ou 'partner' foi substituído por 'senderId'
  content: string;
  timestamp: string;
}

// --- MODIFICADO ---
// O ID da conversa agora deve ser o ID REAL do usuário parceiro
interface Conversation {
  id: string; // Este ID agora representa o ID do OUTRO usuário (ex: 'tanaka-taro')
  name: string;
  preview: string;
}

// --- MODIFICADO ---
// Vamos usar IDs mais realistas
const conversations: Conversation[] = [
  { id: 'tanaka-taro', name: '田中太郎', preview: '商品について質問が...' },
  { id: 'sato-hanako', name: '佐藤花子', preview: 'ありがとうございました' },
  { id: 'yamada-jiro', name: '山田次郎', preview: '配送方法について' },
];

// --- NOVO ---
// Função para criar um ID de sala de chat único e consistente
const getChatRoomId = (userId1: string, userId2: string) => {
  if (userId1 < userId2) {
    return `${userId1}_${userId2}`;
  } else {
    return `${userId2}_${userId1}`;
  }
};

export default function MessagePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedUser, setSelectedUser] = useState<Conversation>(conversations[0]);

  const addNotification = useNotificationStore(state => state.addNotification);

  // --- MODIFICADO ---
  // Firestoreとのリアルタイム同期
  useEffect(() => {
    // Se não há usuário selecionado, não faz nada
    if (!selectedUser) return;

    // --- NOVO ---
    // Cria o ID da sala de chat baseado no MEU ID e no ID do parceiro
    const partnerId = selectedUser.id;
    const chatRoomId = getChatRoomId(MY_USER_ID, partnerId);

    // --- NOVO ---
    // A referência agora aponta para a SUB-COLEÇÃO 'messages' dentro da sala de chat
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId, // --- MODIFICADO ---
          content: data.content,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate().toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : data.timestamp,
        };
      });
      setMessages(messagesData);
    });

    // Limpa a inscrição ao trocar de usuário ou desmontar o componente
    return () => unsubscribe();
  }, [selectedUser]); // --- MODIFICADO --- (Agora depende do selectedUser)

  // ... (o useEffect para auto-scroll continua o mesmo) ...
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // --- MODIFICADO ---
  // メッセージ送信処理
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedUser) return;

    // --- NOVO ---
    // Pega o ID da sala de chat correta
    const partnerId = selectedUser.id;
    const chatRoomId = getChatRoomId(MY_USER_ID, partnerId);

    // --- NOVO ---
    // Referência para a sub-coleção correta
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');

    // --- MODIFICADO ---
    // Salva o ID real do remetente
    const newMessage = {
      senderId: MY_USER_ID,
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    await addDoc(messagesRef, newMessage);

    setInputValue('');

    // A notificação pode continuar igual
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
    <div className="flex h-[calc(100vh-5rem)] bg-gray-50">
      {/* --- 1. サイドバー (Conversas) --- */}
      <div className="w-80 flex-shrink-0 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* ... (Header do sidebar) ... */}
        <div className="h-20 p-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">メッセージ履歴</h1>
        </div>

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
              {/* ... (Avatar e Nome) ... */}
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

      {/* --- 2. チャットウィンドウ (Central) --- */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {/* ... (Header do Chat) ... */}
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
          
          {/* --- MODIFICADO --- */}
          {/* A lógica de exibição 'me' vs 'partner' mudou */}
          {messages.map((msg) => {
            const isMe = msg.senderId === MY_USER_ID;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-4 py-3 max-w-md shadow-sm ${
                  isMe
                    ? 'bg-[#2FA3E3] text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <span className={`text-xs block text-right mt-1 ${
                    isMe ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ... (Área de Input) ... */}
        {/* Esta parte não precisa de modificação */}
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

      {/* --- 3. プロフィールサイドバー (Direita) --- */}
      {/* Esta parte não precisa de modificação */}
      <div className="w-80 flex-shrink-0 bg-white flex flex-col">
        {/* ... (Header) ... */}
        <div className="h-20 p-5 border-b border-gray-200 flex items-center justify-center bg-[#1d7bb8]">
          <h2 className="text-xl font-bold text-white">取引相手</h2>
        </div>
        
        <div className="flex-1 p-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-4">
            <User size={60} className="text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedUser.name}</h3>
          
          {/* ... (Avaliação e Botões) ... */}
          <div className="flex items-center gap-1 mb-6">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            {/* ... (outras estrelas) ... */}
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span className="text-md font-medium text-gray-700 ml-1">5.0</span>
            <span className="text-sm text-gray-500">(128)</span>
          </div>
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