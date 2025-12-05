'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { User, Send, Search, Menu, X } from 'lucide-react';
import Image from 'next/image';
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
  username?: string;
  bio?: string;
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isMessagesReady, setIsMessagesReady] = useState(false);

  // 検索と会話リストの状態管理
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]); // 既存の会話リスト
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);

  // レスポンシブ対応: モバイル用のサイドバー表示制御
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  // URLクエリパラメータから userId を取得して、自動的にユーザーを選択（初回のみ）
  const hasLoadedFromUrl = useRef(false);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (!userId || !user) return;

    // 既にURLから読み込んでいる場合はスキップ
    if (hasLoadedFromUrl.current) return;

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
            preview: `@${userData.username}`,
            photoURL: userData.photoURL || '',
            username: userData.username || '',
            bio: userData.bio || '',
          });
          hasLoadedFromUrl.current = true; // 読み込み完了フラグ
        }
      } catch (error) {
        console.error('ユーザー情報の取得エラー:', error);
      }
    };

    fetchAndSelectUser();
  }, [searchParams, user, selectedUser]);

  // ユーザーを選択する関数（URLは更新しない）
  const handleSelectUser = (convo: Conversation) => {
    setSelectedUser(convo);
    setShowSidebar(false); // モバイルでユーザー選択時にサイドバーを閉じる
  };

  // 選択されたユーザーの情報をリアルタイムで更新
  useEffect(() => {
    if (!selectedUser) return;

    const userId = selectedUser.id;

    const fetchLatestUserInfo = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSelectedUser(prev => {
            if (!prev || prev.id !== userId) return prev;
            return {
              ...prev,
              name: userData.displayName || prev.name,
              photoURL: userData.photoURL || '',
              username: userData.username || prev.username,
              bio: userData.bio || '',
            };
          });
        }
      } catch (error) {
        console.error('選択ユーザー情報の更新エラー:', error);
      }
    };

    // 初回読み込み
    fetchLatestUserInfo();

    // 30秒ごとに更新（リアルタイム性を保つため）
    const interval = setInterval(fetchLatestUserInfo, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id]); // selectedUser.idが変わった時のみ再実行

  // 既存の会話履歴を読み込む
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const conversationsRef = collection(db, 'users', user.uid, 'conversations');
    const q = query(conversationsRef, orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // 各会話の相手の最新情報をFirestoreから取得
      const convos: Conversation[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const partnerId = docSnap.id;

          // Firestoreから最新のユーザー情報を取得
          try {
            const partnerDocRef = doc(db, 'users', partnerId);
            const partnerDoc = await getDoc(partnerDocRef);

            if (partnerDoc.exists()) {
              const partnerData = partnerDoc.data();
              return {
                id: partnerId,
                name: partnerData.displayName || data.partnerName || '不明なユーザー',
                preview: data.lastMessage || '',
                photoURL: partnerData.photoURL || '',
                username: partnerData.username || '',
                bio: partnerData.bio || '',
                lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
              };
            }
          } catch (error) {
            console.error('パートナー情報取得エラー:', error);
          }

          // Firestoreから取得できなかった場合はconversationsの古いデータを使用
          return {
            id: partnerId,
            name: data.partnerName || '不明なユーザー',
            preview: data.lastMessage || '',
            photoURL: data.partnerPhotoURL || '',
            username: data.partnerUsername || '',
            bio: data.partnerBio || '',
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          };
        })
      );
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
        preview: `@${u.username}`,
        photoURL: u.photoURL,
        username: u.username,
        bio: '' // 検索時はbioを取得しない
      }));
    }
    return conversations;
  }, [searchQuery, searchResults, conversations]);


  // メッセージの自動スクロール処理
  const prevMessagesLength = useRef(0);
  const isInitialLoad = useRef(true);

  // selectedUserが変わった時は初回ロードフラグをリセット
  useEffect(() => {
    isInitialLoad.current = true;
    prevMessagesLength.current = 0;
    setIsMessagesReady(false); // メッセージを非表示にする
  }, [selectedUser]);

  // useLayoutEffectを使用してDOMの描画前にスクロール
  useLayoutEffect(() => {
    const scrollToBottom = (smooth = false) => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        if (smooth) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          // 即座にスクロール（アニメーションなし）
          container.scrollTop = container.scrollHeight;
        }
      }
    };

    // 初回ロード時は即座に最新メッセージへスクロール
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      prevMessagesLength.current = messages.length;

      if (messages.length > 0) {
        // 同期的にスクロール（DOM更新前）
        scrollToBottom(false);
      }

      // スクロール完了後、メッセージを表示
      setIsMessagesReady(true);
      return;
    }

    // メッセージが増えた時はスムーズにスクロール
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom(true);
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

    // 相手の通知コレクションへの参照を作成
    const notificationRef = collection(db, 'users', partnerId, 'notifications');

    // 通知ドキュメントのデータを準備
    const notificationData = {
      iconType: 'comment' as const,
      iconBgColor: 'bg-green-500',
      title: `${myData?.displayName || user.displayName || '不明なユーザー'}さんから新しいメッセージ`,
      description: inputValue.trim(),
      timestamp: new Date(),
      tag: 'メッセージ',
      isUnread: true,
      linkUserId: MY_USER_ID, // 送信者のIDを保存（メッセージページで使用）
    };

    // 通知ドキュメントを作成
    await addDoc(notificationRef, notificationData);

    // 自分の会話リストを更新（相手の情報を保存）
    await setDoc(
      doc(db, 'users', MY_USER_ID, 'conversations', partnerId),
      {
        partnerName: partnerData?.displayName || selectedUser.name,
        partnerUsername: partnerData?.username || '',
        partnerPhotoURL: partnerData?.photoURL || '',
        partnerBio: partnerData?.bio || '',
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
        partnerBio: myData?.bio || '',
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
    <div className="flex h-[85vh] bg-gray-50 relative">
      {/* モバイル用: オーバーレイ (サイドバーが開いている時に背景をクリックで閉じる) */}
      {(showSidebar || showProfileSidebar) && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => {
            setShowSidebar(false);
            setShowProfileSidebar(false);
          }}
        />
      )}

      {/* --- 1. サイドバー (会話リスト) --- */}
      {/* デスクトップ: 常に表示、モバイル: showSidebarがtrueの時のみ表示 */}
      <div className={`
        w-80 flex-shrink-0 bg-white shadow-lg border-r border-gray-200 flex flex-col h-full
        lg:relative lg:translate-x-0
        fixed inset-y-0 left-0 z-30 transform transition-transform duration-300
        ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 p-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">メッセージ履歴</h1>
          {/* モバイル用: 閉じるボタン */}
          <button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* --- 検索バー --- */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
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

        <div className="flex-1 overflow-y-auto min-h-0">
          {conversationList.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-gray-500">ユーザーが見つかりませんでした。</p>
            </div>
          ) : (
            conversationList.map((convo) => (
              <div
                key={convo.id}
                className={`flex items-center p-4 cursor-pointer border-l-4 transition-colors duration-150 ${selectedUser?.id === convo.id
                  ? 'bg-blue-50 border-blue-500'
                  : 'border-transparent hover:bg-gray-100'
                  }`}
                onClick={() => handleSelectUser(convo)}
              >
                {/* アバター画像 */}
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden relative">
                  {convo.photoURL ? (
                    <Image
                      src={convo.photoURL}
                      alt={convo.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <User size={20} className="text-gray-600" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-md font-semibold text-gray-900">{convo.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{convo.preview}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- 2. チャットウィンドウ (Central) --- */}
      <div className="flex-1 flex flex-col border-r border-gray-200 h-full">
        {selectedUser ? (
          <>
            {/* チャットヘッダー */}
            <div className="h-16 p-4 flex items-center bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
              {/* モバイル用: サイドバー開閉ボタン */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>

              {/* アバター画像 */}
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4 flex-shrink-0 overflow-hidden relative">
                {selectedUser.photoURL ? (
                  <Image
                    src={selectedUser.photoURL}
                    alt={selectedUser.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <User size={20} className="text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
              </div>

              {/* モバイル用: プロフィールサイドバー開閉ボタン */}
              <button
                onClick={() => setShowProfileSidebar(!showProfileSidebar)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User size={20} className="text-gray-600" />
              </button>
            </div>

            {/* メッセージ表示エリア */}
            <div
              ref={messagesContainerRef}
              className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50 min-h-0 relative"
              style={{ overflowAnchor: 'none' }}
            >
              {/* ローディングオーバーレイ */}
              {!isMessagesReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  {messages.length > 0 && (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div>
                  )}
                </div>
              )}

              {/* メッセージコンテンツ（常にDOMに配置、visibility で制御） */}
              <div style={{ visibility: isMessagesReady ? 'visible' : 'hidden' }}>
                {messages.length === 0 && isMessagesReady && <p className="text-center text-gray-500">まだメッセージはありません。</p>}
                {messages.map((msg) => {
                  if (!user) return null;
                  const isMe = msg.senderId === user.uid;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex flex-col max-w-[70%] md:max-w-[60%] lg:max-w-md">
                        <div className={`rounded-lg px-4 py-3 shadow-sm break-words ${isMe
                          ? 'bg-[#2FA3E3] text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                          }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className={`m-2 text-xs mt-1 text-gray-400 ${isMe ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>

                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 入力エリア */}
            <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
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
                  className="bg-[#2FA3E3] text-white p-3 rounded-lg hover:bg-[#1d7bb8] disabled:bg-gray-400 flex items-center justify-center transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
            {/* モバイル用: サイドバーを開くボタン */}
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden mb-4 bg-[#2FA3E3] text-white px-6 py-3 rounded-lg hover:bg-[#1d7bb8] flex items-center gap-2 transition-colors"
            >
              <Menu size={20} />
              会話リストを開く
            </button>
            <p className="text-gray-500 text-center">ユーザーを選択してチャットを開始してください。</p>
          </div>
        )}
      </div>

      {/* --- 3. プロフィールサイドバー --- */}
      {/* デスクトップ: 常に表示、モバイル: showProfileSidebarがtrueの時のみ表示 */}
      <div className={`
        w-80 flex-shrink-0 bg-white flex flex-col h-full
        lg:relative lg:translate-x-0
        fixed inset-y-0 right-0 z-30 transform transition-transform duration-300
        ${showProfileSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {selectedUser ? (
          <>
            <div className="h-16 p-4 border-b border-gray-200 flex items-center justify-between bg-[#2FA3E3] flex-shrink-0">
              {/* モバイル用: 閉じるボタン */}
              <button
                onClick={() => setShowProfileSidebar(false)}
                className="lg:hidden p-2 hover:bg-[#165a8a] rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
              <h2 className="text-xl font-bold text-white flex-1 text-center">ユーザー情報</h2>
              {/* 閉じるボタンとのバランスを取るための空div */}
              <div className="w-9 lg:hidden"></div>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center">
              {/* アバター画像 */}
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-4 overflow-hidden relative">
                {selectedUser.photoURL ? (
                  <Image
                    src={selectedUser.photoURL}
                    alt={selectedUser.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <User size={60} className="text-gray-600" />
                )}
              </div>

              {/* ユーザー名情報 */}
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedUser.name}</h3>
              <p className="text-gray-500 text-sm mb-4">@{selectedUser.username || 'unknown'}</p>

              {/* 自己紹介 */}
              <div className="w-full mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">自己紹介</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                  {selectedUser.bio || 'まだ自己紹介が設定されていません。'}
                </p>
              </div>

              {/* プロフィールを見るボタン */}
              <div className="w-full">
                <button
                  onClick={() => router.push(`/profile/${selectedUser.id}`)}
                  className="w-full bg-[#2FA3E3] text-white px-6 py-3 rounded-lg hover:bg-[#1d7bb8] flex items-center justify-center gap-2 transition-colors"
                >
                  <User size={16} />
                  プロフィールを見る
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}