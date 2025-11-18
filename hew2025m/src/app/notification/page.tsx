'use client';

import { useState, useEffect } from 'react'; // --- MODIFICADO --- (useEffect adicionado)
import { Megaphone, JapaneseYen, MessageSquare, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase'; // --- NOVO ---
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp, // --- NOVO ---
} from 'firebase/firestore';

// --- NOVO ---
// O mesmo ID de usuário do chat.
// Lembre-se de substituir isso por um hook de autenticação real.
const MY_USER_ID = 'eduardo';

// --- MODIFICADO ---
// A interface agora deve bater com o que vem do Firestore.
interface NotificationItem {
  id: string; // O ID do documento
  iconType: 'system' | 'sales' | 'comment';
  iconBgColor: string;
  title: string;
  description: string;
  timestamp: Timestamp | string; // O Firestore envia Timestamp
  tag: string;
  isUnread: boolean;
}

// --- 2. O sampleNotifications FOI REMOVIDO ---
// const sampleNotifications: NotificationItem[] = [ ... ];
// Não precisamos mais dele.

// --- 3. A função getNotificationIcon continua a mesma ---
const getNotificationIcon = (iconType: string) => {
  switch (iconType) {
    case 'system':
      return <Megaphone className="w-6 h-6 text-white" />;
    case 'sales':
      return <JapaneseYen className="w-6 h-6 text-white" />;
    case 'comment':
      return <MessageSquare className="w-6 h-6 text-white" />;
    default:
      return null;
  }
};

// --- 4. 通知ページのメインコンポーネント ---
export default function NotificationPage() {
  // --- MODIFICADO ---
  // O state agora começa vazio.
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // --- NOVO ---
  // Carregar notificações do Firestore
  useEffect(() => {
    if (!MY_USER_ID) return;

    // A referência agora aponta para a sub-coleção do usuário
    const notifRef = collection(db, 'users', MY_USER_ID, 'notifications');
    const q = query(notifRef, orderBy('timestamp', 'desc')); // Mais novas primeiro

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifData: NotificationItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp, // Mantém o timestamp (ou formata se preferir)
        } as NotificationItem;
      });
      setNotifications(notifData);
    });

    return () => unsubscribe();
  }, [MY_USER_ID]); // Depende do MY_USER_ID

  // --- NOVO ---
  // Função para formatar o Timestamp
  const formatTimestamp = (timestamp: Timestamp | string) => {
    if (typeof timestamp === 'string') return timestamp;
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString('ja-JP'); // Formato de data/hora
    }
    return 'Data inválida';
  };

  // --- MODIFICADO ---
  // Marcar como lida (agora funciona de verdade)
  const handleMarkAsRead = async (id: string) => {
    const docRef = doc(db, 'users', MY_USER_ID, 'notifications', id);
    try {
      await updateDoc(docRef, {
        isUnread: false,
      });
    } catch (error) {
      console.error("Erro ao marcar como lida: ", error);
    }
  };

  // --- MODIFICADO ---
  // Excluir (agora funciona de verdade)
  const handleDelete = async (id: string) => {
    const docRef = doc(db, 'users', MY_USER_ID, 'notifications', id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao deletar: ", error);
    }
  };
  
  // --- NOVO ---
  // Marcar todas como lidas
  const handleMarkAllAsRead = () => {
    // Para cada notificação não lida, chama o handleMarkAsRead
    notifications.forEach(notif => {
      if (notif.isUnread) {
        handleMarkAsRead(notif.id);
      }
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* ... (Pão e Migalhas) ... */}
        <nav className="text-sm text-gray-600 mb-4">
          <span>ホーム</span> &gt; <span>通知</span>
        </nav>

        {/* --- MODIFICADO --- */}
        {/* Header (botão "Marcar todas" agora funciona) */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">✉️ 通知</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleMarkAllAsRead} // --- MODIFICADO ---
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              すべて既読にする
            </button>
            {/* O filtro ainda não está implementado, mas o botão está lá */}
            <select className="border border-gray-300 rounded-md p-2 text-sm">
              <option>すべての通知</option>
              <option>未読の通知</option>
            </select>
          </div>
        </div>

        {/* --- MODIFICADO --- */}
        {/* Lista de Notificações */}
        <div className="space-y-4">
          {/* Mostra uma mensagem se não houver notificações */}
          {notifications.length === 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
              <p>🔔 まだ通知はありません。</p>
              <p>(Nenhuma notificação ainda.)</p>
            </div>
          )}

          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white shadow-md rounded-lg p-4 flex items-start gap-4 ${
                notification.isUnread
                  ? 'border-l-4 border-blue-500'
                  : 'border-l-4 border-transparent'
              }`}
            >
              {/* 1. Ícone */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.iconBgColor}`}
              >
                {getNotificationIcon(notification.iconType)}
              </div>

              {/* 2. Conteúdo */}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{notification.title}</h3>
                <p className="text-sm text-gray-700 mt-1">{notification.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  {/* --- MODIFICADO --- (Usa a função de formatar) */}
                  <span>{formatTimestamp(notification.timestamp)}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {notification.tag}
                  </span>
                </div>
              </div>

              {/* 3. Ações */}
              <div className="flex flex-col space-y-2">
                {/* --- NOVO --- (Só mostra o botão se não estiver lida) */}
                {notification.isUnread && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-700"
                  >
                    既読にする
                  </button>
                )}
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