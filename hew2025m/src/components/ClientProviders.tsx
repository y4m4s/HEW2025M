"use client";
import { ReactNode } from "react";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { Toaster } from "react-hot-toast";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          error: {
            icon: null, // アイコンを非表示
            style: {
              background: '#fee2e2', // 薄い赤 (red-100)
              border: '2px solid #dc2626', // 濃い赤の縁 (red-600)
              color: '#7f1d1d', // 濃い赤のテキスト (red-900)
            },
          },
          success: {
            style: {
              background: '#dcfce7', // 薄い緑 (green-100)
              border: '2px solid #16a34a', // 濃い緑の縁 (green-600)
              color: '#14532d', // 濃い緑のテキスト (green-900)
            },
          },
        }}
      />
      {children}
    </ProfileProvider>
  );
}
