import React from 'react';

interface SkeletonCardProps {
  variant?: 'product' | 'post' | 'user';
  count?: number;
}

export default function SkeletonCard({ variant = 'product', count = 1 }: SkeletonCardProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'product':
        return (
          <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            {/* 画像部分 */}
            <div className="h-48 bg-gray-200 skeleton" />

            {/* コンテンツ部分 */}
            <div className="p-4 space-y-3">
              {/* タイトル */}
              <div className="h-4 bg-gray-200 rounded skeleton w-3/4" />

              {/* 価格とセラー情報 */}
              <div className="flex items-center justify-between gap-2">
                <div className="h-6 bg-gray-200 rounded skeleton w-1/3" />
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 rounded-full skeleton" />
                  <div className="h-3 bg-gray-200 rounded skeleton w-16" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'post':
        return (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 animate-pulse">
            {/* ユーザー情報 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded skeleton w-1/3" />
                <div className="h-3 bg-gray-200 rounded skeleton w-1/4" />
              </div>
            </div>

            {/* タイトル */}
            <div className="h-6 bg-gray-200 rounded skeleton w-2/3 mb-3" />

            {/* 本文 */}
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded skeleton w-full" />
              <div className="h-4 bg-gray-200 rounded skeleton w-5/6" />
              <div className="h-4 bg-gray-200 rounded skeleton w-4/5" />
            </div>

            {/* 画像 */}
            <div className="h-48 bg-gray-200 rounded-lg skeleton mb-4" />

            {/* アクションボタン */}
            <div className="flex gap-4">
              <div className="h-8 bg-gray-200 rounded skeleton w-20" />
              <div className="h-8 bg-gray-200 rounded skeleton w-20" />
              <div className="h-8 bg-gray-200 rounded skeleton w-20" />
            </div>
          </div>
        );

      case 'user':
        return (
          <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded skeleton w-2/3" />
                <div className="h-3 bg-gray-200 rounded skeleton w-1/2" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
}
