export default function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 animate-pulse">
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-4 md:py-6">
        {/* 戻るボタンのスケルトン */}
        <div className="h-10 w-24 bg-gray-200 rounded-lg mb-4 md:mb-6"></div>

        {/* メイングリッド */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 bg-white rounded-lg shadow-md p-4 md:p-6">
          {/* 左側: 商品画像のスケルトン */}
          <section className="space-y-4 md:space-y-6">
            {/* タイトルと日付のスケルトン */}
            <div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </div>

            {/* 価格のスケルトン */}
            <div className="border-b pb-4">
              <div className="h-10 bg-gray-200 rounded w-40"></div>
            </div>

            {/* 画像のスケルトン */}
            <div className="relative overflow-hidden rounded-lg bg-gray-200" style={{ aspectRatio: '4/3' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-400 rounded-full animate-spin"></div>
              </div>
            </div>
          </section>

          {/* 右側: 商品詳細のスケルトン */}
          <section className="space-y-4 md:space-y-6">
            {/* 商品説明のスケルトン */}
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="min-h-[120px] rounded-lg border border-gray-200 p-3 md:p-4 bg-gray-50/50 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>

            {/* 商品情報のスケルトン */}
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </div>
            </div>

            {/* ボタンのスケルトン */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
              <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </section>
        </div>

        {/* 出品者情報のスケルトン */}
        <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>

        {/* コメントセクションのスケルトン */}
        <section className="mt-6 md:mt-8 bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-100 rounded-lg"></div>
            <div className="h-24 bg-gray-100 rounded-lg"></div>
          </div>
        </section>

        {/* 関連商品のスケルトン */}
        <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
