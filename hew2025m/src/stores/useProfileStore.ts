import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

export interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  photoURL: string;
}

interface ProfileState {
  profile: UserProfile;
  loading: boolean;
  // Actions
  setProfile: (profile: UserProfile) => void;
  setLoading: (loading: boolean) => void;
  refreshProfile: (userId: string) => Promise<void>;
  resetProfile: () => void;
}

const defaultProfile: UserProfile = {
  displayName: '',
  username: '',
  bio: '',
  photoURL: '',
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: defaultProfile,
  loading: true,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  refreshProfile: async (userId: string) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        set({ profile: data });
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    }
  },

  resetProfile: () => set({ profile: defaultProfile, loading: true }),
}));

// Firestoreリアルタイム監視用のサブスクリプション管理
let unsubscribeFirestore: Unsubscribe | null = null;

/**
 * Firestoreのプロフィールをリアルタイム監視開始
 * useAuthと連携して使用する
 */
export function subscribeToProfile(
  userId: string,
  fallbackDisplayName?: string,
  fallbackEmail?: string,
  fallbackPhotoURL?: string
): void {
  // 既存のサブスクリプションを解除
  if (unsubscribeFirestore) {
    unsubscribeFirestore();
  }

  const { setProfile, setLoading } = useProfileStore.getState();
  setLoading(true);

  const docRef = doc(db, 'users', userId);

  unsubscribeFirestore = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
      } else {
        // 初回ログイン時のデフォルト値
        const defaultUserProfile: UserProfile = {
          displayName: fallbackDisplayName || '名無しユーザー',
          username: fallbackEmail?.split('@')[0] || 'user',
          bio: '',
          photoURL: fallbackPhotoURL || '',
        };
        setProfile(defaultUserProfile);
      }
      setLoading(false);
    },
    (error) => {
      console.error('プロフィール監視エラー:', error);

      // エラー時もデフォルト値を設定
      const defaultUserProfile: UserProfile = {
        displayName: fallbackDisplayName || '名無しユーザー',
        username: fallbackEmail?.split('@')[0] || 'user',
        bio: '',
        photoURL: fallbackPhotoURL || '',
      };
      setProfile(defaultUserProfile);
      setLoading(false);
    }
  );
}

/**
 * Firestoreのプロフィール監視を解除
 */
export function unsubscribeFromProfile(): void {
  if (unsubscribeFirestore) {
    unsubscribeFirestore();
    unsubscribeFirestore = null;
  }
  useProfileStore.getState().resetProfile();
}
