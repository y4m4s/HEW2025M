"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  photoURL: string;
}

interface ProfileContextType {
  profile: UserProfile;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    username: "",
    bio: "",
    photoURL: "",
  });
  const [loading, setLoading] = useState(true);

  // プロフィールを手動で再取得する関数
  const refreshProfile = async () => {
    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
      } else {
        // 初回ログイン時のデフォルト値
        const defaultProfile: UserProfile = {
          displayName: user.displayName || "名無しユーザー",
          username: user.email?.split("@")[0] || "user",
          bio: "",
          photoURL: user.photoURL || "",
        };
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error("プロフィール取得エラー:", error);
    }
  };

  // Firestoreのリアルタイム監視
  useEffect(() => {
    if (!user) {
      setProfile({
        displayName: "",
        username: "",
        bio: "",
        photoURL: "",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, "users", user.uid);

    // Firestoreの変更をリアルタイムで監視
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
        } else {
          // 初回ログイン時のデフォルト値
          const defaultProfile: UserProfile = {
            displayName: user.displayName || "名無しユーザー",
            username: user.email?.split("@")[0] || "user",
            bio: "",
            photoURL: user.photoURL || "",
          };
          setProfile(defaultProfile);
        }
        setLoading(false);
      },
      (error) => {
        console.error("プロフィール監視エラー:", error);

        // エラー時もデフォルト値を設定
        const defaultProfile: UserProfile = {
          displayName: user.displayName || "名無しユーザー",
          username: user.email?.split("@")[0] || "user",
          bio: "",
          photoURL: user.photoURL || "",
        };
        setProfile(defaultProfile);
        setLoading(false);
      }
    );

    // クリーンアップ
    return () => {
      unsubscribe();
    };
  }, [user]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
