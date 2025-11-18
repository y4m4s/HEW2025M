import { create } from 'zustand';

export type Notification = {
  id: number;
  type: string;
  title: string;
  content: string;
  time: string;
  unread: boolean;
  icon: string;
};

type NotificationStore = {
  notifications: Notification[];
  setNotifications: (items: Notification[]) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  addNotification: (item: Notification) => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  setNotifications: (items) => set({ notifications: items }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        unread: false,
      })),
    })),

  addNotification: (item) =>
    set((state) => ({
      notifications: [item, ...state.notifications],
    })),
}));
