export default function ProductListLoading() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      <div className="container mx-auto max-w-7xl px-4 py-8">

        {/* モバイル用フィルターボタン */}
        <div className="lg:hidden mb-6">
          <div className="h-10 bg-gray-200 rounded-lg w-full" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* 左側: 商品一覧 */}
          <div className="flex-1 min-w-0">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-7 bg-gray-200 rounded w-24 mb-2" />
                <div className="hidden sm:block h-4 bg-gray-200 rounded w-56" />
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-24 shrink-0" />
            </div>

            {/* 件数 */}
            <div className="h-4 bg-gray-200 rounded w-24 mb-4" />

            {/* 商品グリッド */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 rounded-full" />
                        <div className="h-3 bg-gray-200 rounded w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右側: フィルターサイドバー */}
          <div className="hidden lg:block lg:w-72 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              {/* タイトル */}
              <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
              <div className="space-y-6">
                {/* キーワード */}
                <div>
                  <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-10 bg-gray-200 rounded-lg" />
                </div>
                {/* カテゴリー */}
                <div>
                  <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-10 bg-gray-200 rounded-lg" />
                </div>
                {/* 価格 */}
                <div>
                  <div className="h-3 bg-gray-200 rounded w-28 mb-2" />
                  <div className="flex gap-2 items-center">
                    <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                    <div className="h-4 bg-gray-200 rounded w-3 shrink-0" />
                    <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                  </div>
                </div>
                {/* 送料負担 */}
                <div>
                  <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                  <div className="h-10 bg-gray-200 rounded-lg" />
                </div>
                {/* SOLDボタン */}
                <div className="h-10 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
