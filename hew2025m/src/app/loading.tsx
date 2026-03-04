export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      <main className="container mx-auto max-w-6xl px-4 sm:px-5">

        {/* ヒーローセクション */}
        <div className="bg-gray-200 rounded-b-[30px] sm:rounded-b-[40px] md:rounded-b-[50px] mb-8 sm:mb-12 md:mb-16" style={{ height: '280px' }} />

        {/* カテゴリーセクション */}
        <div className="py-8 sm:py-12 md:py-16 mb-8 sm:mb-12 md:mb-16">
          {/* タイトル */}
          <div className="flex flex-col items-center mb-6 sm:mb-8 md:mb-10">
            <div className="h-7 bg-gray-200 rounded w-48 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-56" />
          </div>
          {/* カテゴリーグリッド（2列→4列） */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 sm:h-48 md:h-56 bg-gray-200 rounded-xl sm:rounded-2xl" />
            ))}
          </div>
        </div>

        {/* 最新の出品セクション */}
        <div className="py-8 sm:py-12 md:py-16 mb-8 sm:mb-12 md:mb-16">
          {/* タイトル */}
          <div className="flex flex-col items-center mb-6 sm:mb-8 md:mb-10">
            <div className="h-7 bg-gray-200 rounded w-52 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
          {/* 商品グリッド（1列→2列→4列） */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
          {/* もっと見るボタン */}
          <div className="flex justify-center">
            <div className="h-11 bg-gray-200 rounded-lg w-44" />
          </div>
        </div>

        {/* 特徴セクション（3カードグリッド） */}
        <div className="py-8 sm:py-12 md:py-16 mb-8 sm:mb-12 md:mb-16">
          {/* タイトル */}
          <div className="flex flex-col items-center mb-6 sm:mb-8 md:mb-10">
            <div className="h-7 bg-gray-200 rounded w-56 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 sm:h-56 md:h-64 bg-gray-200 rounded-xl sm:rounded-2xl" />
            ))}
          </div>
        </div>

        {/* CTAセクション */}
        <div className="h-40 sm:h-48 md:h-56 bg-gray-200 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 md:mb-10" />

      </main>
    </div>
  );
}
