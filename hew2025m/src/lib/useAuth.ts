"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { subscribeToProfile, unsubscribeFromProfile } from "@/stores/useProfileStore";
import { useCartStore } from "@/stores/useCartStore";

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
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      useCartStore.getState().syncCartOwner(currentUser?.uid ?? null);

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
          const created = await createSessionCookie(currentUser);
          if (created) {
            sessionCreatedRef.current = true;
            retryCountRef.current = 0;
          } else if (retryCountRef.current < 2) {
            retryCountRef.current += 1;
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(async () => {
              if (!auth.currentUser || auth.currentUser.uid !== currentUser.uid) return;
              const retryCreated = await createSessionCookie(currentUser);
              if (retryCreated) {
                sessionCreatedRef.current = true;
                retryCountRef.current = 0;
              }
            }, 1500);
          }
        }
      } else {
        unsubscribeFromProfile();
        sessionCreatedRef.current = false;
        retryCountRef.current = 0;
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      }
    });

    return () => {
      unsubscribe();
      unsubscribeFromProfile();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
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
