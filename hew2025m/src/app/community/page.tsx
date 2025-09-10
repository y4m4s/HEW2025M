import Link from 'next/link';

export default function CommunityPage() {
  return (
    <div>
      
      <div className="bg-gray-50 min-h-screen">
        <main className="flex max-w-7xl mx-auto px-5 py-8 gap-8">
          <div className="flex-1">
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>人気の投稿</h2>
                <Link href="#" className="bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300">
                  投稿する
                </Link>
              </div>
              <div className="bg-white rounded-lg shadow-md p-8 mb-6 min-h-48 flex items-center justify-center text-gray-500">
                投稿内容
              </div>
            </section>

            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>最新の投稿</h2>
                <Link href="#" className="text-[#2FA3E3] font-medium hover:text-[#1d7bb8] transition-colors duration-300">
                  もっと見る
                </Link>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6 min-h-32 flex items-center justify-center text-gray-500">
                  投稿内容
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 min-h-32 flex items-center justify-center text-gray-500">
                  投稿内容
                </div>
              </div>
              <div className="text-center mt-8">
                <Link href="#" className="text-[#2FA3E3] font-medium hover:text-[#1d7bb8] transition-colors duration-300">
                  もっと見る
                </Link>
              </div>
            </section>
          </div>

          <aside className="w-80">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mb-4">
                地図
              </div>
              <Link href="#" className="block w-full text-center bg-[#2FA3E3] text-white py-3 rounded-lg hover:bg-[#1d7bb8] transition-colors duration-300">
                マップページへ
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: "せのびゴシック, sans-serif" }}>投稿を見る</h3>
              <p className="text-gray-600 text-sm mb-4">すべての投稿を一覧で確認できます</p>
              <Link href="#" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white py-3 rounded-lg hover:shadow-lg transition-all duration-300">
                📋 投稿一覧を見る
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: "せのびゴシック, sans-serif" }}>おすすめのユーザー</h3>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                おすすめユーザー一覧
              </div>
            </div>
          </aside>
        </main>
      </div>

    </div>
  );
}