'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { User, Send, Star, Flag, Search } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  where,
  doc,
  getDocs,
  setDoc,
  getDoc,
} from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

// Firestoreのユーザー情報を表す型
interface AppUser {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string;
  email: string;
}

// 会話IDは、実際の相手ユーザーのIDである必要があります
interface Conversation {
  id: string;
  name: string;
  preview: string;
  photoURL?: string;
  lastMessageTime?: Date;
}

// 一貫性のある一意のチャットルームIDを作成する関数
const getChatRoomId = (userId1: string, userId2: string) => {
  if (userId1 < userId2) {
    return `${userId1}_${userId2}`;
  } else {
    return `${userId2}_${userId1}`;
  }
};

export default function MessagePage() {
  const { user, loading: authLoading } = useAuth(); // ログイン状態を取得
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 検索と会話リストの状態管理
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]); // 既存の会話リスト
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);

  const addNotification = useNotificationStore(state => state.addNotification);

  // URLクエリパラメータから userId を取得して、自動的にユーザーを選択
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (!userId || !user) return;

    // 既にユーザーが選択されている場合はスキップ
    if (selectedUser?.id === userId) return;

    const fetchAndSelectUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSelectedUser({
            id: userId,
            name: userData.displayName || '不明なユーザー',
            preview: `@${userData.username} - ${userData.email}`,
            photoURL: userData.photoURL || '',
          });
        }
      } catch (error) {
        console.error('ユーザー情報の取得エラー:', error);
      }
    };

    fetchAndSelectUser();
  }, [searchParams, user, selectedUser]);

  // 既存の会話履歴を読み込む
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const conversationsRef = collection(db, 'users', user.uid, 'conversations');
    const q = query(conversationsRef, orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id, // partnerのUID
          name: data.partnerName || '不明なユーザー',
          preview: data.lastMessage || '',
          photoURL: data.partnerPhotoURL || '',
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
        };
      });
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [user]);

  // ユーザーを検索する機能
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !user) {
        setSearchResults([]);
        return;
      }

      const usersRef = collection(db, 'users');
      const searchLower = searchQuery.toLowerCase();

      // displayNameで前方一致検索
      const qDisplayName = query(
        usersRef,
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff')
      );

      // usernameで前方一致検索
      const qUsername = query(
        usersRef,
        where('username', '>=', searchLower),
        where('username', '<=', searchLower + '\uf8ff')
      );

      // 両方のクエリを実行
      const [displayNameSnapshot, usernameSnapshot] = await Promise.all([
        getDocs(qDisplayName),
        getDocs(qUsername)
      ]);

      // 結果をマージ（重複を除去）
      const usersMap = new Map<string, AppUser>();

      displayNameSnapshot.forEach((doc) => {
        if (doc.id !== user.uid) {
          usersMap.set(doc.id, { uid: doc.id, ...doc.data() } as AppUser);
        }
      });

      usernameSnapshot.forEach((doc) => {
        if (doc.id !== user.uid) {
          usersMap.set(doc.id, { uid: doc.id, ...doc.data() } as AppUser);
        }
      });

      setSearchResults(Array.from(usersMap.values()));
    };

    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 300); // 300ms待ってから検索を実行

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user]);

  // Firestoreとのリアルタイム同期
  useEffect(() => {
    // ユーザーが選択されていない場合は何もしません
    if (!selectedUser || !user) {
      setMessages([]);
      return;
    };

    // 自分のIDと相手のIDに基づいてチャットルームIDを作成します
    const MY_USER_ID = user.uid;
    const partnerId = selectedUser.id;
    const chatRoomId = getChatRoomId(MY_USER_ID, partnerId);

    // 参照はチャットルーム内のサブコレクション 'messages' を指すようになります
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
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

    // ユーザーを切り替えるか、コンポーネントがアンマウントされる時に購読を解除します
    return () => unsubscribe();
  }, [selectedUser, user]); // userも依存配列に追加

  // 表示する会話リストを決定
  const conversationList = useMemo(() => {
    if (searchQuery) {
      return searchResults.map(u => ({
        id: u.uid,
        name: u.displayName,
        preview: `@${u.username} - ${u.email}`,
        photoURL: u.photoURL
      }));
    }
    return conversations;
  }, [searchQuery, searchResults, conversations]);


  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // メッセージ送信処理
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedUser || !user) return;

    // 正しいチャットルームIDを取得します
    const MY_USER_ID = user.uid;
    const partnerId = selectedUser.id;
    const chatRoomId = getChatRoomId(MY_USER_ID, partnerId);

    // 正しいサブコレクションへの参照
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');

    // 送信者の実際のIDを保存します
    const newMessage = {
      senderId: MY_USER_ID,
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    await addDoc(messagesRef, newMessage);

    // 相手の通知コレクションへの参照を作成
    const notificationRef = collection(db, 'users', partnerId, 'notifications');
    // 通知ドキュメントを作成
    await addDoc(notificationRef, {
      iconType: 'comment',
      iconBgColor: 'bg-green-500',
      title: `${user.displayName}さんから新しいメッセージ`,
      description: inputValue.trim(),
      timestamp: new Date(),
      tag: 'メッセージ',
      isUnread: true,
    });

    // --- 会話履歴を両方のユーザーに保存 ---
    const messageContent = inputValue.trim();
    const messageTime = new Date();

    // 相手のユーザー情報を取得
    const partnerDocRef = doc(db, 'users', partnerId);
    const partnerDoc = await getDoc(partnerDocRef);
    const partnerData = partnerDoc.data();

    // 自分のユーザー情報を取得（Firestoreから）
    const myDocRef = doc(db, 'users', MY_USER_ID);
    const myDoc = await getDoc(myDocRef);
    const myData = myDoc.data();

    // 自分の会話リストを更新（相手の情報を保存）
    await setDoc(
      doc(db, 'users', MY_USER_ID, 'conversations', partnerId),
      {
        partnerName: partnerData?.displayName || selectedUser.name,
        partnerUsername: partnerData?.username || '',
        partnerPhotoURL: partnerData?.photoURL || '',
        lastMessage: messageContent,
        lastMessageTime: messageTime,
      },
      { merge: true }
    );

    // 相手の会話リストを更新（自分の情報を保存）
    await setDoc(
      doc(db, 'users', partnerId, 'conversations', MY_USER_ID),
      {
        partnerName: myData?.displayName || user.displayName || '不明なユーザー',
        partnerUsername: myData?.username || '',
        partnerPhotoURL: myData?.photoURL || user.photoURL || '',
        lastMessage: messageContent,
        lastMessageTime: messageTime,
      },
      { merge: true }
    );

    setInputValue('');

  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">読み込み中...</div>;
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">メッセージ機能を利用するには<a href="/login" className="text-blue-500 underline ml-2">ログイン</a>が必要です。</div>;
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-50">
      {/* --- 1. サイドバー (Conversas) --- */}
      <div className="w-80 flex-shrink-0 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="h-20 p-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">メッセージ履歴</h1>
        </div>

        {/* --- 検索バー --- */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ユーザーを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationList.map((convo) => (
            <div
              key={convo.id}
              className={`flex items-center p-4 cursor-pointer border-l-4 transition-colors duration-150 ${
                selectedUser?.id === convo.id
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
        {selectedUser ? (
          <>
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
          
          {messages.length === 0 && <p className="text-center text-gray-500">まだメッセージはありません。</p>}
          {messages.map((msg) => {
            if (!user) return null;
            const isMe = msg.senderId === user.uid;
            
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

        {/* 入力エリア */}
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
        </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">ユーザーを選択してチャットを開始してください。</p>
          </div>
        )}
      </div>

      {/* --- 3. プロフィールサイドバー (Direita) --- */}
      <div className="w-80 flex-shrink-0 bg-white flex flex-col">
        {selectedUser ? (
          <>
            <div className="h-20 p-5 border-b border-gray-200 flex items-center justify-center bg-[#1d7bb8]">
              <h2 className="text-xl font-bold text-white">取引相手</h2>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-4">
                <User size={60} className="text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedUser.name}</h3>
              
              <div className="flex items-center gap-1 mb-6">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="text-md font-medium text-gray-700 ml-1">5.0</span>
                <span className="text-sm text-gray-500">(128)</span>
              </div>
              <div className="w-full space-y-3">
                <button
                  onClick={() => router.push(`/profile/${selectedUser.id}`)}
                  className="w-full bg-[#2FA3E3] text-white px-6 py-3 rounded-lg hover:bg-[#1d7bb8] flex items-center justify-center gap-2"
                >
                  <User size={16} />
                  プロフィールを見る
                </button>
                <button
                  onClick={() => alert(`ユーザー「${selectedUser.name}」を報告します。`)}
                  className="w-full bg-transparent text-red-600 px-6 py-3 rounded-lg border border-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <Flag size={16} />
                  報告する
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}