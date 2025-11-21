'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: (finalIndex?: number) => void;
}

export default function ImageModal({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleClose = () => {
    onClose(currentIndex);
  };

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentIndex]);

  if (!isOpen) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={handleClose}
    >
      {/* モーダルコンテンツ */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="閉じる"
        >
          <X size={32} />
        </button>

        {/* 画像表示エリア */}
        <div className="relative flex-1 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={images[currentIndex]}
              alt={`画像 ${currentIndex + 1}`}
              width={1200}
              height={900}
              className="max-w-full max-h-[80vh] object-contain"
            />

            {/* ナビゲーションボタン（複数画像がある場合のみ表示） */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-3 shadow-lg transition-all"
                  aria-label="前の画像"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-3 shadow-lg transition-all"
                  aria-label="次の画像"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* インジケーター（複数画像がある場合のみ表示） */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentIndex === index ? 'bg-white' : 'bg-gray-500'
                }`}
                aria-label={`画像 ${index + 1} に移動`}
              />
            ))}
          </div>
        )}

        {/* 画像カウンター */}
        <div className="text-center text-white mt-2">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
