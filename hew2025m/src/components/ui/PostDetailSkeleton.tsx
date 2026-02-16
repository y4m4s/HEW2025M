export default function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="container mx-auto max-w-4xl px-4 py-4 md:py-8">
        {/* 戻るボタンのスケルトン */}
        <div className="h-10 w-24 bg-gray-200 rounded-lg mb-4 md:mb-6"></div>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* ヘッダー */}
          <div className="p-4 md:p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              {/* タグのスケルトン */}
              <div className="flex flex-wrap gap-2">
                <div className="h-7 w-20 bg-gray-200 rounded-full"></div>
                <div className="h-7 w-24 bg-gray-200 rounded-full"></div>
              </div>
              {/* 日付のスケルトン */}
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
            </div>

            {/* タイトルのスケルトン */}
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>

          {/* 画像ギャラリーのスケルトン */}
          <div className="bg-gray-100 p-3 md:p-4">
            <div className="relative overflow-hidden rounded-lg bg-gray-200" style={{ aspectRatio: '4/3' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-400 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>

          {/* 本文のスケルトン */}
          <div className="p-4 md:p-6">
            <div className="space-y-3 mb-4 md:mb-6">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>

            {/* 場所のスケルトン */}
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 md:mb-6"></div>

            {/* アクションボタンのスケルトン */}
            <div className="flex items-center gap-4 md:gap-6 pt-4 border-t">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </article>

        {/* 投稿者情報のスケルトン */}
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
      </div>
    </div>
  );
}
