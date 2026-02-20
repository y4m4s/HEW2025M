import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  overlay?: boolean;
}

export default function LoadingSpinner({
  message,
  subMessage,
  size = 'md',
  fullScreen = false,
  overlay = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 sm:h-8 sm:w-8',
    md: 'h-10 w-10 sm:h-12 sm:w-12',
    lg: 'h-16 w-16',
  };

  const spinner = (
    <Loader2 className={`${sizeClasses[size]} text-[#2FA3E3] animate-spin`} />
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        {spinner}
        {message && (
          <p className="text-xl font-bold text-gray-800 mb-2 mt-4">{message}</p>
        )}
        {subMessage && (
          <p className="text-sm text-gray-600">{subMessage}</p>
        )}
      </div>
    );
  }

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        {spinner}
        {message && (
          <p className="mt-4 text-gray-600 font-medium text-sm sm:text-base">
            {message}
          </p>
        )}
        {subMessage && (
          <p className="mt-2 text-xs sm:text-sm text-gray-500">{subMessage}</p>
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
