"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { subscribeToProfile, unsubscribeFromProfile } from "@/stores/useProfileStore";

/**
 * セッションCookieを作成する関数
 */
async function createSessionCookie(user: User): Promise<boolean> {
  try {
    const idToken = await user.getIdToken();

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return false;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCreatedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Zustand ProfileStoreのFirestore監視を開始/停止
      if (currentUser) {
        subscribeToProfile(
          currentUser.uid,
          currentUser.displayName || undefined,
          currentUser.email || undefined,
          currentUser.photoURL || undefined
        );

        // セッションCookieをまだ作成していない場合は作成
        if (!sessionCreatedRef.current) {
          await createSessionCookie(currentUser);
          sessionCreatedRef.current = true;
        }
      } else {
        unsubscribeFromProfile();
        sessionCreatedRef.current = false;
      }
    });

    return () => {
      unsubscribe();
      unsubscribeFromProfile();
    };
  }, []);

  return { user, loading };
}

/**
 * 認証ガードフック
 * 未ログインの場合、指定されたパスにリダイレクトする
 * @param redirectPath リダイレクト先のパス（デフォルト: '/login'）
 * @returns { user, loading, isAuthenticated }
 */
export function useAuthGuard(redirectPath: string = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectPath);
    }
  }, [user, loading, router, redirectPath]);

  return {
    user,
    loading,
    isAuthenticated: !loading && !!user
  };
}
