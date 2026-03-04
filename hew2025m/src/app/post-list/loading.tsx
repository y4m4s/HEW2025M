export default function PostListLoading() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      <div className="container mx-auto max-w-7xl px-4 py-8">

        {/* モバイル用フィルターボタン */}
        <div className="lg:hidden mb-6">
          <div className="h-10 bg-gray-200 rounded-lg w-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* 左側: 投稿一覧 */}
          <div className="lg:col-span-3">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-7 bg-gray-200 rounded w-28 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-52" />
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-24 shrink-0" />
            </div>

            {/* 投稿カードリスト */}
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                  {/* ユーザー情報 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                  {/* タイトル */}
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
                  {/* 本文 */}
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                  {/* タグ */}
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded-full w-16" />
                    <div className="h-6 bg-gray-200 rounded-full w-12" />
                  </div>
                  {/* アクション（いいね・コメント・場所） */}
                  <div className="flex gap-4">
                    <div className="h-5 bg-gray-200 rounded w-12" />
                    <div className="h-5 bg-gray-200 rounded w-12" />
                    <div className="h-5 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右側: サイドバー */}
          <div className="hidden lg:block lg:col-span-1 order-first lg:order-last">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
              {/* タイトル */}
              <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
              {/* キーワード検索 */}
              <div className="mb-6">
                <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-10 bg-gray-200 rounded-lg" />
              </div>
              {/* 並び替え */}
              <div className="mb-6">
                <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-10 bg-gray-200 rounded-lg" />
              </div>
              {/* タグリスト（8件） */}
              <div>
                <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                <div className="space-y-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-9 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
