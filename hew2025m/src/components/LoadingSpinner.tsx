import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message,
  size = 'md',
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 sm:h-8 sm:w-8 border-b-2',
    md: 'h-10 w-10 sm:h-12 sm:w-12 border-b-2',
    lg: 'h-16 w-16 border-b-4',
  };

  const spinner = (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-[#2FA3E3]`}></div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        {spinner}
        {message && (
          <p className="mt-4 text-gray-600 font-medium text-sm sm:text-base">
            {message}
          </p>
        )}
      </div>
    );
  }

  // If there is a message, wrap in a flex column
  if (message) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        {spinner}
        <p className="text-xs sm:text-sm text-gray-500">{message}</p>
      </div>
    );
  }

  return spinner;
}
