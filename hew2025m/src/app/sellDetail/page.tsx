'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SellDetail() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('comments');

  const images = [
    "https://via.placeholder.com/400x300/e9ecef/6c757d?text=商品画像1",
    "https://via.placeholder.com/400x300/e9ecef/6c757d?text=商品画像2",
    "https://via.placeholder.com/400x300/e9ecef/6c757d?text=商品画像3",
    "https://via.placeholder.com/400x300/e9ecef/6c757d?text=商品画像4"
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 container mx-auto px-4 py-6">
        <nav className="mb-6">
          <span className="text-gray-600">ホーム &gt; 商品を探す &gt; 商品詳細</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">商品名</h1>
              <div className="flex gap-4 text-sm text-gray-600">
                <div className="bg-gray-100 px-3 py-1 rounded">出品日時</div>
                <div className="bg-gray-100 px-3 py-1 rounded">出品者</div>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {images.map((src, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <img
                        src={src}
                        alt={`商品画像${index + 1}`}
                        className="w-full h-80 object-cover"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex justify-center mt-4 gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      currentSlide === index ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold">商品詳細</h2>

            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded">
                商品詳細 + この商品に紐づいた製品情報など
              </div>

              <div className="bg-gray-100 p-3 rounded">カテゴリ</div>

              <div className="bg-gray-100 p-3 rounded">商品の状態</div>
            </div>

            <div className="flex gap-4">
              <button className="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded transition-colors">
                ブックマーク
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded transition-colors">
                カートに入れる
              </button>
            </div>
          </section>
        </div>

        <section className="mt-12">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                コメント
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                評価
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-gray-100 p-4 rounded mb-4 min-h-[100px]">
              コメント入力エリア
            </div>

            <div className="flex gap-4">
              <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded transition-colors">
                返信する
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
                コメントする
              </button>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}