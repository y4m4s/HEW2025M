'use client';

import React from 'react';
import { GiFishingPole } from "react-icons/gi";

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "読み込み中..." }) => {
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadein">
            {/* 釣りリールのアニメーション */}
            <div className="relative mb-8">
                <div className="relative animate-spin-slow">
                    {/* リールのハンドルを模したアニメーション */}
                    <div className="w-24 h-24 border-4 border-[#2FA3E3] rounded-full flex items-center justify-center relative">
                        <div className="absolute top-0 left-1/2 w-4 h-4 bg-[#2FA3E3] rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md"></div>
                        <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full animate-reverse-spin"></div>
                        <GiFishingPole size={48} className="text-[#2FA3E3] relative z-10" />
                    </div>
                </div>
                {/* 糸巻きの装飾 */}
                <div className="absolute -right-12 top-1/2 w-12 h-0.5 bg-[#2FA3E3]/50 transform -rotate-12 origin-left"></div>
            </div>

            <p className="text-xl font-bold text-gray-700 mb-4 tracking-widest" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                {message}
            </p>

            {/* プログレスバー */}
            <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] w-1/2 animate-shimmer rounded-full"></div>
            </div>

            <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        .animate-reverse-spin {
          animation: reverse-spin 3s linear infinite;
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
        </div>
    );
};

export default LoadingScreen;
