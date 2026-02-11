"use client";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { RiLoaderFill } from "react-icons/ri";
import { FaCheck } from "react-icons/fa";
import { MdErrorOutline } from "react-icons/md";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 80, // ヘッダーの下に表示
        }}
        toastOptions={{
          duration: 3000,
          style: {
            maxWidth: '500px',
            fontSize: '15px',
          },
          error: {
            icon: <MdErrorOutline />,
            style: {
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '2px solid #dc2626',
              color: '#7f1d1d',
              boxShadow: '0 8px 30px rgba(220, 38, 38, 0.15)',
              borderRadius: '12px',
              padding: '16px 20px',
              fontWeight: '500',
            },
          },
          success: {
            icon: <FaCheck />,
            style: {
              background: '#fff',
              border: '2px solid #2FA3E3',
              color: '#0c4a6e',
              boxShadow: '0 8px 30px rgba(47, 163, 227, 0.15)',
              borderRadius: '12px',
              padding: '16px 20px',
              fontWeight: '500',
            },
          },
          loading: {
            icon: <RiLoaderFill />,
            style: {
              background: 'linear-gradient(135deg, #2FA3E3 0%, #1d7bb8 100%)',
              border: '2px solid #1d7bb8',
              color: '#fff',
              boxShadow: '0 8px 30px rgba(47, 163, 227, 0.2)',
              borderRadius: '12px',
              padding: '16px 20px',
              fontWeight: '500',
            },
          },
        }}
      />
      {children}
    </>
  );
}
