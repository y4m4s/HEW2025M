'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Fish } from 'lucide-react';
import ImageModal from './ImageModal';
import { IMAGE_QUALITY, BLUR_DATA_URLS } from '@/lib/imageOptimization';
import { decodeHtmlEntities } from '@/lib/sanitize';

export interface CarouselImage {
  url: string;
  alt?: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  /** 画像がない場合のプレースホルダーテキスト */
  emptyText?: string;
  /** 画像の高さクラス（Tailwind） - 非推奨、aspectRatioを使用してください */
  heightClass?: string;
  /** アスペクト比（例: "4/3", "16/9", "1/1"） - デフォルト: "4/3" */
  aspectRatio?: string;
  /** アクセントカラー（インジケーター用） */
  accentColor?: string;
  /** 初期表示するスライドのインデックス */
  initialSlide?: number;
  /** スライド変更時のコールバック */
  onSlideChange?: (index: number) => void;
}

/**
 * 共通の画像カルーセルコンポーネント
 * - 複数画像のスライド表示
 * - モーダルでの拡大表示
 * - ナビゲーションボタンとインジケーター
 */
export default function ImageCarousel({
  images,
  emptyText = '画像がありません',
  heightClass,
  aspectRatio = '4/3',
  accentColor = 'bg-[#2FA3E3]',
  initialSlide = 0,
  onSlideChange,
}: ImageCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;

  const nextSlide = useCallback(() => {
    if (hasImages) {
      const newIndex = (currentSlide + 1) % images.length;
      setCurrentSlide(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [currentSlide, images.length, hasImages, onSlideChange]);

  const prevSlide = useCallback(() => {
    if (hasImages) {
      const newIndex = (currentSlide - 1 + images.length) % images.length;
      setCurrentSlide(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [currentSlide, images.length, hasImages, onSlideChange]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    onSlideChange?.(index);
  }, [onSlideChange]);

  const handleImageClick = useCallback((index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback((finalIndex?: number) => {
    setIsModalOpen(false);
    if (finalIndex !== undefined) {
      setCurrentSlide(finalIndex);
      onSlideChange?.(finalIndex);
    }
  }, [onSlideChange]);

  if (!hasImages) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-gray-200 ${heightClass} flex flex-col items-center justify-center`}>
        <Fish size={48} className="text-gray-400 mb-3 md:w-16 md:h-16" />
        <p className="text-gray-500 text-sm">{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full flex-shrink-0 relative" style={{ aspectRatio: heightClass ? undefined : aspectRatio }}>
              <Image
                src={decodeHtmlEntities(image.url)}
                alt={image.alt || `画像${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 800px"
                quality={IMAGE_QUALITY.STANDARD}
                priority={index === 0}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URLS.product}
                className={`${heightClass ? `w-full ${heightClass} object-cover` : 'object-contain'} cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => handleImageClick(index)}
              />
            </div>
          ))}
        </div>

        {hasMultipleImages && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-1.5 md:p-2 shadow-lg transition-all"
              aria-label="前の画像"
            >
              <ChevronLeft size={18} className="md:w-5 md:h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-1.5 md:p-2 shadow-lg transition-all"
              aria-label="次の画像"
            >
              <ChevronRight size={18} className="md:w-5 md:h-5" />
            </button>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="flex justify-center mt-3 md:mt-4 gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-colors ${
                currentSlide === index ? accentColor : 'bg-gray-300'
              }`}
              aria-label={`画像${index + 1}に移動`}
            />
          ))}
        </div>
      )}

      {/* 画像モーダル */}
      <ImageModal
        isOpen={isModalOpen}
        images={images.map(img => decodeHtmlEntities(img.url))}
        initialIndex={modalImageIndex}
        onClose={handleCloseModal}
      />
    </>
  );
}
