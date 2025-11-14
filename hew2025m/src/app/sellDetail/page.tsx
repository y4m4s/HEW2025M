"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function SellDetail() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("comments");
  const [rakutenProducts, setRakutenProducts] = useState<any[]>([]);

  const images = [
    "https://via.placeholder.com/400x300/e9ecef/6c757d?text=商品画像1",
    "https://via.placeholder.com/400x300/e9ecef/6c757d?text=商品画像2",
    "https://via.placeholder.com/400x300/e9ecef/6c757d?text=商品画像3",
    "https://via.placeholder.com/400x300/e9ecef/6c757d?text=商品画像4",
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % images.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  // ✅ Buscar API Rakuten
  useEffect(() => {
    fetch(
      `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?applicationId=${process.env.NEXT_PUBLIC_RAKUTEN_APP_ID}&keyword=釣り竿&hits=6`
    )
      .then((res) => res.json())
      .then((data) => setRakutenProducts(data.Items || []))
      .catch(() => console.log("Erro API Rakuten"));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6">
        <nav className="mb-6">
          <span className="text-gray-600">ホーム &gt; 商品を探す &gt; 商品詳細</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left */}
          <section className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">商品名</h1>
              <div className="flex gap-4 text-sm text-gray-600">
                <div className="bg-gray-100 px-3 py-1 rounded">出品日時</div>
                <div className="bg-gray-100 px-3 py-1 rounded">出品者</div>
              </div>
            </div>

            {/* ✅ Carousel */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      className="w-full h-80 object-cover flex-shrink-0"
                    />
                  ))}
                </div>

                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex justify-center mt-4 gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`w-3 h-3 rounded-full ${
                      currentSlide === i ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Right */}
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
              <button className="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded">
                ブックマーク
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded">
                カートに入れる
              </button>
            </div>
          </section>
        </div>

        {/* Tabs */}
        <section className="mt-12">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              {["comments", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  {tab === "comments" ? "コメント" : "評価"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-gray-100 p-4 rounded mb-4 min-h-[100px]">
              コメント入力エリア
            </div>

            <div className="flex gap-4">
              <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded">
                返信する
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                コメントする
              </button>
            </div>
          </div>
        </section>

        {/* ✅ Rakuten */}
        {/* ✅ Rakuten 商品ランキング風デザイン */}
<section className="mt-16 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
  <h2 className="text-2xl font-bold mb-6 text-center text-blue-700 tracking-wide">
    Rakuten 人気商品ランキング 🛍️
  </h2>

  {/* 🔍 検索フォーム */}
  <form
    onSubmit={(e) => e.preventDefault()}
    className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8"
  >
    <div className="flex items-center gap-2">
      <label htmlFor="genre" className="text-sm font-medium text-gray-700">
        ジャンルID
      </label>
      <input
        id="genre"
        type="text"
        placeholder="例: 100005 (米・雑穀)"
        className="border rounded px-3 py-2 w-48 text-sm"
      />
    </div>

    <div className="flex items-center gap-2">
      <label htmlFor="keyword" className="text-sm font-medium text-gray-700">
        キーワード
      </label>
      <input
        id="keyword"
        type="text"
        placeholder="例: お米"
        className="border rounded px-3 py-2 w-48 text-sm"
      />
    </div>

    <button
      type="submit"
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-semibold shadow-sm"
    >
      検索
    </button>
  </form>

  {/* 📋 ランキングリスト */}
  <div className="space-y-6">
    {rakutenProducts.map((p, idx) => (
      <div
        key={idx}
        className="flex items-start gap-4 border-b pb-4 last:border-none"
      >
        {/* 🏆 ランキング番号 */}
        <div className="text-2xl font-bold text-blue-600 w-8 text-center">
          {idx + 1}.
        </div>

        {/* 🖼️ 商品画像 */}
        <img
          src={p.Item.mediumImageUrls[0].imageUrl}
          alt={p.Item.itemName}
          className="w-20 h-20 object-cover rounded border"
        />

        {/* 📦 詳細 */}
        <div className="flex-1">
          <a
            href={p.Item.itemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:underline text-sm"
          >
            {p.Item.itemName}
          </a>

          <div className="text-sm text-gray-500 mt-1">
            Loja: {p.Item.shopName}
          </div>

          <div className="text-lg font-bold text-gray-800 mt-1">
            ¥{p.Item.itemPrice.toLocaleString()}
          </div>
        </div>
      </div>
    ))}
  </div>
</section>


      </main>
    </div>
  );
}
