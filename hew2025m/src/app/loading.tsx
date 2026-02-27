export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      {/* ヒーローセクション */}
      <div className="bg-gray-200 rounded-b-[50px] mx-4 mb-12" style={{ height: '280px' }} />

      <div className="container mx-auto max-w-6xl px-4 sm:px-5">
        {/* カテゴリセクションタイトル */}
        <div className="h-7 bg-gray-200 rounded w-48 mb-6" />

        {/* カテゴリグリッド */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>

        {/* 新着商品タイトル */}
        <div className="h-7 bg-gray-200 rounded w-36 mb-6" />

        {/* 商品カードグリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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

        {/* CTAバナー */}
        <div className="h-32 bg-gray-200 rounded-2xl mb-12" />
      </div>
    </div>
  );
}
