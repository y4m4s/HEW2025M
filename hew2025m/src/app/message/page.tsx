'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { User, Send, Search, Menu, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { uploadFileToFirebase } from '@/lib/firebaseUtils';

import ImageModal from '@/components/ImageModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import Button from '@/components/Button';

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
  imageUrl?: string;
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
  unreadCount?: number;
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
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  // 画像添付用の状態
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 画像モーダル用の状態
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string>('');

  // URLクエリパラメータから userId を取得して、自動的にユーザーを選択（初回のみ）
  const hasLoadedFromUrl = useRef(false);

  // 認証チェック：未ログインならログインページへリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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
          setShowSidebar(false); // モバイルの場合はサイドバーを閉じてチャットを表示
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
                unreadCount: data.unreadCount || 0,
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
            unreadCount: data.unreadCount || 0,
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

    // チャットルームを開いたら未読カウントを0にリセット
    const clearUnreadCount = async () => {
      const conversationRef = doc(db, 'users', MY_USER_ID, 'conversations', partnerId);
      await setDoc(conversationRef, { unreadCount: 0 }, { merge: true });
    };
    clearUnreadCount();

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
          imageUrl: data.imageUrl,
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
        bio: '', // 検索時はbioを取得しない
        unreadCount: 0 // 検索結果には未読カウント表示しない
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

  // 画像選択ハンドラー
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像削除ハンドラー
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 画像クリック時のハンドラー
  const handleImageClick = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  // メッセージ送信処理
  const handleSendMessage = async () => {
    // テキストまたは画像のいずれかが必要
    if ((!inputValue.trim() && !selectedImage) || !selectedUser || !user) return;

    // 文字数制限チェック
    if (inputValue.length > 500) return;

    try {
      // 正しいチャットルームIDを取得します
      const MY_USER_ID = user.uid;
      const partnerId = selectedUser.id;
      const chatRoomId = getChatRoomId(MY_USER_ID, partnerId);

      // 画像をアップロード（画像が選択されている場合）
      let imageUrl: string | undefined;
      if (selectedImage) {
        try {
          // Firebase Storageに保存
          imageUrl = await uploadFileToFirebase(selectedImage, 'messages');
        } catch (error) {
          console.error('画像アップロードエラー:', error);
          throw new Error('画像のアップロードに失敗しました');
        }
      }

      // 正しいサブコレクションへの参照
      const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');

      // 送信者の実際のIDを保存します
      const newMessage: {
        senderId: string;
        content: string;
        timestamp: Date;
        imageUrl?: string;
      } = {
        senderId: MY_USER_ID,
        content: inputValue.trim(),
        timestamp: new Date(),
      };

      if (imageUrl) {
        newMessage.imageUrl = imageUrl;
      }

      await addDoc(messagesRef, newMessage);

      // --- 会話履歴を両方のユーザーに保存 ---
      const messageContent = inputValue.trim() || '画像を送信しました';
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
          partnerBio: partnerData?.bio || '',
          lastMessage: messageContent,
          lastMessageTime: messageTime,
          unreadCount: 0, // 自分が送信したので未読カウント0
        },
        { merge: true }
      );

      // 相手の会話リストを更新（自分の情報を保存）& 未読カウントを増やす
      const partnerConversationRef = doc(db, 'users', partnerId, 'conversations', MY_USER_ID);
      const partnerConversationDoc = await getDoc(partnerConversationRef);
      const currentUnreadCount = partnerConversationDoc.exists()
        ? (partnerConversationDoc.data().unreadCount || 0)
        : 0;

      await setDoc(
        partnerConversationRef,
        {
          partnerName: myData?.displayName || user.displayName || '不明なユーザー',
          partnerUsername: myData?.username || '',
          partnerPhotoURL: myData?.photoURL || user.photoURL || '',
          partnerBio: myData?.bio || '',
          lastMessage: messageContent,
          lastMessageTime: messageTime,
          unreadCount: currentUnreadCount + 1, // 未読カウントを増やす
        },
        { merge: true }
      );

      // 入力をクリア
      setInputValue('');
      handleRemoveImage();
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      toast.error('メッセージの送信に失敗しました。');
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner message="読み込み中..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">メッセージ機能を利用するには<a href="/login" className="text-blue-500 underline ml-2">ログイン</a>が必要です。</div>;
  }

  return (
    <div className="flex h-[85vh] bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 relative">
      {/* モバイル用: オーバーレイ (サイドバーが開いている時に背景をクリックで閉じる) */}
      {(showSidebar || showProfileSidebar) && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20 backdrop-blur-sm"
          onClick={() => {
            setShowSidebar(false);
            setShowProfileSidebar(false);
          }}
        />
      )}

      {/* --- 1. サイドバー (会話リスト) --- */}
      {/* デスクトップ: 常に表示、モバイル: showSidebarがtrueの時のみ表示 */}
      <div className={`
        w-full lg:w-80 flex-shrink-0 bg-white shadow-xl border-r border-gray-100 flex flex-col h-full
        lg:relative lg:translate-x-0
        fixed inset-y-0 left-0 z-30 transform transition-transform duration-300
        ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 p-4 border-b border-gray-100 bg-gradient-to-r from-[#2FA3E3] to-[#1d88c9] flex-shrink-0 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            メッセージ
          </h1>
          {/* モバイル用: 閉じるボタン */}
          <Button
            onClick={() => setShowSidebar(false)}
            variant="ghost"
            size="sm"
            className="lg:hidden !p-2 hover:!bg-white/20 !text-white"
            icon={<X size={20} />}
          >
            <span className="sr-only">閉じる</span>
          </Button>
        </div>

        {/* --- 検索バー --- */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-b from-gray-50 to-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2FA3E3]" size={18} />
            <input
              type="text"
              placeholder="ユーザーを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 pr-4 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/30 focus:border-[#2FA3E3] transition-all duration-300 text-sm placeholder:text-gray-400 shadow-sm hover:shadow-md"
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
                className={`flex items-center p-4 cursor-pointer border-l-4 transition-all duration-200 relative group ${selectedUser?.id === convo.id
                  ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 border-l-[#2FA3E3] shadow-sm'
                  : 'border-l-transparent hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:border-l-gray-300 hover:shadow-sm'
                  }`}
                onClick={() => handleSelectUser(convo)}
              >
                {/* アバター画像 */}
                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden relative ring-2 ring-white shadow-md group-hover:ring-[#2FA3E3]/30 transition-all duration-200">
                  {convo.photoURL ? (
                    <Image
                      src={convo.photoURL}
                      alt={convo.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <User size={22} className="text-gray-600" />
                  )}
                </div>
                <div className="overflow-hidden flex-1">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#2FA3E3] transition-colors duration-200">{convo.name}</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{convo.preview}</p>
                </div>
                {/* 未読バッジ */}
                {convo.unreadCount && convo.unreadCount > 0 ? (
                  <div className="bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-2 ml-2 shadow-lg shadow-red-500/30 animate-pulse">
                    {convo.unreadCount > 99 ? '99+' : convo.unreadCount}
                  </div>
                ) : null}
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
            <div className="h-16 p-4 flex items-center bg-white border-b border-gray-100 shadow-md flex-shrink-0 relative overflow-hidden">
              {/* 背景装飾 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2FA3E3]/5 to-transparent"></div>

              {/* モバイル用: サイドバー開閉ボタン */}
              <Button
                onClick={() => setShowSidebar(!showSidebar)}
                variant="ghost"
                size="sm"
                className="lg:hidden !mr-3 !p-2 hover:!bg-gray-100 !text-gray-700 z-10 hover:!scale-105"
                icon={<Menu size={20} />}
              >
                <span className="sr-only">メニュー</span>
              </Button>

              {/* アバター画像 */}
              <div className="w-11 h-11 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden relative ring-2 ring-white shadow-lg z-10">
                {selectedUser.photoURL ? (
                  <Image
                    src={selectedUser.photoURL}
                    alt={selectedUser.name}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                ) : (
                  <User size={22} className="text-gray-600" />
                )}
              </div>
              <div className="flex-1 z-10">
                <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                <p className="text-xs text-gray-500">@{selectedUser.username || 'unknown'}</p>
              </div>

              {/* モバイル用: プロフィールサイドバー開閉ボタン */}
              <Button
                onClick={() => setShowProfileSidebar(!showProfileSidebar)}
                variant="ghost"
                size="sm"
                className="lg:hidden !p-2 hover:!bg-gray-100 !text-gray-700 z-10 hover:!scale-105"
                icon={<User size={20} />}
              >
                <span className="sr-only">プロフィール</span>
              </Button>
            </div>

            {/* メッセージ表示エリア */}
            <div
              ref={messagesContainerRef}
              className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50/50 to-blue-50/20 min-h-0 relative"
              style={{
                overflowAnchor: 'none',
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(47, 163, 227, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(47, 163, 227, 0.03) 0%, transparent 50%)'
              }}
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
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                      <div className="flex flex-col max-w-[75%] md:max-w-[65%] lg:max-w-lg">
                        <div className={`rounded-2xl shadow-lg break-words overflow-hidden transform transition-all duration-200 hover:scale-[1.02] ${isMe
                          ? 'bg-gradient-to-br from-[#2FA3E3] to-[#1d88c9] text-white shadow-[#2FA3E3]/20'
                          : 'bg-white text-gray-800 border border-gray-100 shadow-gray-200/50'
                          }`}>
                          {msg.imageUrl && (
                            <div className={msg.content ? "p-2 pb-0" : "p-2"}>
                              <Image
                                src={msg.imageUrl}
                                alt="送信画像"
                                width={300}
                                height={300}
                                className="rounded-xl object-cover max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                unoptimized
                                onClick={() => handleImageClick(msg.imageUrl!)}
                              />
                            </div>
                          )}
                          {msg.content && (
                            <p className="text-sm whitespace-pre-wrap px-4 py-3 leading-relaxed">{msg.content}</p>
                          )}
                        </div>
                        <span className={`mx-2 text-xs mt-1.5 text-gray-400 font-medium ${isMe ? 'text-right' : 'text-left'}`}>
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
            <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0 shadow-2xl shadow-gray-200/50">
              <div className="flex justify-center">
                <div className="w-full flex flex-col gap-3">
                  {/* 画像プレビュー */}
                  {imagePreview && (
                    <div className="relative inline-block animate-fadeIn">
                      <Image
                        src={imagePreview}
                        alt="添付画像"
                        width={200}
                        height={200}
                        className="rounded-xl border-2 border-[#2FA3E3]/30 object-cover shadow-lg"
                      />
                      <Button
                        onClick={handleRemoveImage}
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 !bg-gradient-to-br !from-red-500 !to-red-600 !text-white !rounded-full !p-1.5 hover:!scale-110 !shadow-lg shadow-red-500/30 !min-w-0 !w-auto !h-auto"
                        icon={<X size={16} />}
                      >
                        <span className="sr-only">削除</span>
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 w-full items-end">
                    {/* 画像添付ボタン */}
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="ghost"
                      size="sm"
                      className="!bg-gradient-to-br !from-gray-100 !to-gray-200 !text-gray-700 !p-3.5 !rounded-xl hover:!from-[#2FA3E3] hover:!to-[#1d88c9] hover:!text-white transition-all duration-300 flex-shrink-0 shadow-sm hover:shadow-md hover:!scale-105 group !min-w-0 !w-auto"
                      icon={<Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />}
                      type="button"
                    >
                      <span className="sr-only">画像を添付</span>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <div className="flex-1 flex flex-col gap-2">
                      <textarea
                        placeholder="メッセージを入力..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={2}
                        className={`w-full p-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 resize-none transition-all duration-300 shadow-sm hover:shadow-md ${inputValue.length > 500
                          ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-200 focus:ring-[#2FA3E3]/30 focus:border-[#2FA3E3]'
                          }`}
                      />
                      <div className={`text-right text-xs font-medium ${inputValue.length > 500 ? 'text-red-600' : 'text-gray-400'}`}>
                        {inputValue.length}/500文字
                        {inputValue.length > 500 && (
                          <span className="ml-1">({inputValue.length - 500}文字超過)</span>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleSendMessage}
                      disabled={(!inputValue.trim() && !selectedImage) || inputValue.length > 500}
                      variant="primary"
                      size="sm"
                      className="!p-3.5 !rounded-xl hover:!shadow-lg hover:!scale-105 disabled:!from-gray-300 disabled:!to-gray-400 flex-shrink-0 !shadow-md shadow-[#2FA3E3]/30 disabled:!shadow-none group !min-w-0 !w-auto"
                      icon={<Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />}
                      type="button"
                    >
                      <span className="sr-only">送信</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6">
            {/* モバイル用: サイドバーを開くボタン */}
            <Button
              onClick={() => setShowSidebar(true)}
              variant="primary"
              size="md"
              className="lg:hidden mb-6 !px-8 !py-3.5 !rounded-xl hover:!shadow-xl hover:!scale-105 !shadow-lg shadow-[#2FA3E3]/30 !font-semibold"
              icon={<Menu size={20} />}
            >
              会話リストを開く
            </Button>
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-gradient-to-br from-[#2FA3E3]/20 to-[#1d88c9]/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Send size={36} className="text-[#2FA3E3]" />
              </div>
              <p className="text-gray-600 text-lg font-medium">メッセージを始めましょう</p>
              <p className="text-gray-400 text-sm max-w-md">ユーザーを選択してチャットを開始してください</p>
            </div>
          </div>
        )}
      </div>

      {/* --- 3. プロフィールサイドバー --- */}
      {/* デスクトップ: 常に表示、モバイル: showProfileSidebarがtrueの時のみ表示 */}
      <div className={`
        w-80 flex-shrink-0 bg-white flex flex-col h-full shadow-xl
        lg:relative lg:translate-x-0
        fixed inset-y-0 right-0 z-30 transform transition-transform duration-300
        ${showProfileSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {selectedUser ? (
          <>
            <div className="h-16 p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#2FA3E3] to-[#1d88c9] flex-shrink-0 shadow-md">
              {/* モバイル用: 閉じるボタン */}
              <Button
                onClick={() => setShowProfileSidebar(false)}
                variant="ghost"
                size="sm"
                className="lg:hidden !p-2 hover:!bg-white/20 !text-white"
                icon={<X size={20} />}
              >
                <span className="sr-only">閉じる</span>
              </Button>
              <h2 className="text-xl font-bold text-white flex-1 text-center">プロフィール</h2>
              {/* 閉じるボタンとのバランスを取るための空div */}
              <div className="w-9 lg:hidden"></div>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center bg-gradient-to-b from-blue-50/30 to-white overflow-y-auto">
              {/* アバター画像 */}
              <div className="relative mb-3 group">
                <div className="w-28 h-28 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center overflow-hidden relative ring-4 ring-white shadow-2xl shadow-gray-300/50 group-hover:ring-[#2FA3E3]/30 transition-all duration-300">
                  {selectedUser.photoURL ? (
                    <Image
                      src={selectedUser.photoURL}
                      alt={selectedUser.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <User size={64} className="text-gray-600" />
                  )}
                </div>
              </div>

              {/* ユーザー名情報 */}
              <h3 className="text-2xl font-bold text-gray-900 mb-1 text-center">{selectedUser.name}</h3>
              <p className="text-[#2FA3E3] text-sm font-semibold mb-3">@{selectedUser.username || 'unknown'}</p>

              {/* 自己紹介 */}
              <div className="w-full mb-6 bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-3 border border-gray-100 shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-gradient-to-b from-[#2FA3E3] to-[#1d88c9] rounded-full"></div>
                  <h4 className="text-sm font-bold text-gray-800">自己紹介</h4>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words leading-relaxed">
                  {selectedUser.bio || 'まだ自己紹介が設定されていません。'}
                </p>
              </div>

              {/* プロフィールを見るボタン */}
              <div className="w-full">
                <Button
                  onClick={() => router.push(`/profile/${selectedUser.id}`)}
                  variant="primary"
                  size="md"
                  className="w-full !px-6 !py-3.5 !rounded-xl hover:!shadow-xl hover:!scale-105 !font-semibold !shadow-lg shadow-[#2FA3E3]/30"
                  icon={<User size={18} />}
                >
                  プロフィールを見る
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* 画像モーダル */}
      <ImageModal
        images={modalImageUrl ? [modalImageUrl] : []}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </div>
  );
}