import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message = 'データを読み込み中……',
  size = 'md',
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* 回転するスピナー */}
      <div className="relative">
        {/* 外側のリング */}
        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200`}></div>
        {/* 回転するアクセントリング */}
        <Loader2
          className={`${sizeClasses[size]} text-[#2FA3E3] absolute top-0 left-0 animate-spin`}
          strokeWidth={3}
        />
      </div>

      {/* メッセージ */}
      <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
