export default function PostListLoading() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* 左側: 投稿一覧 */}
          <div className="lg:col-span-3">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-7 bg-gray-200 rounded w-28 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-52" />
              </div>
            </div>

            {/* 投稿カードリスト */}
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                  {/* ユーザー情報 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
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
                  {/* アクション */}
                  <div className="flex gap-4">
                    <div className="h-7 bg-gray-200 rounded w-16" />
                    <div className="h-7 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右側: サイドバー */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            {/* 投稿ボタン */}
            <div className="h-14 bg-gray-200 rounded-full" />

            {/* 検索・絞り込みパネル */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="h-5 bg-gray-200 rounded w-32 mb-6" />
              {/* 検索バー */}
              <div className="h-10 bg-gray-200 rounded-lg mb-6" />
              {/* タグリスト */}
              <div className="space-y-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-9 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
