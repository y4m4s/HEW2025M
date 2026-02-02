'use client';

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "読み込み中..." }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadein">
      <LoadingSpinner message={message} size="lg" />
    </div>
  );
};

export default LoadingScreen;
