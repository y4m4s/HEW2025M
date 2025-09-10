import { Fish, MapPin } from 'lucide-react';

export default function SearchPage() {
  return (
    <div>
      
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              商品を探す
            </h1>
            <p className="text-center text-gray-600 mb-12">
              あなたが探している釣り用品を見つけましょう
            </p>

            {/* 検索フィルター */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none">
                    <option value="">すべて</option>
                    <option value="rod">釣り竿</option>
                    <option value="reel">リール</option>
                    <option value="lure">ルアー</option>
                    <option value="line">ライン</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">価格帯</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none">
                    <option value="">指定なし</option>
                    <option value="0-1000">〜1,000円</option>
                    <option value="1000-5000">1,000〜5,000円</option>
                    <option value="5000-10000">5,000〜10,000円</option>
                    <option value="10000-">10,000円〜</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状態</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none">
                    <option value="">すべて</option>
                    <option value="new">新品・未使用</option>
                    <option value="like-new">未使用に近い</option>
                    <option value="good">目立った傷汚れなし</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button className="w-full bg-[#2FA3E3] text-white py-3 rounded-lg hover:bg-[#1d7bb8] transition-colors duration-300">
                    検索
                  </button>
                </div>
              </div>
            </div>

            {/* 並び替え */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">検索結果: 24件</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">並び替え:</span>
                <select className="p-2 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none">
                  <option value="newest">新着順</option>
                  <option value="price-low">価格の安い順</option>
                  <option value="price-high">価格の高い順</option>
                  <option value="popular">人気順</option>
                </select>
              </div>
            </div>

            {/* 商品一覧 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300">
                  <div className="h-48 bg-gray-200 flex items-center justify-center text-4xl text-gray-400">
                    <Fish size={48} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      釣り竿セット - 初心者向け
                    </h3>
                    <p className="text-xl font-bold text-[#2FA3E3] mb-2">¥3,500</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                      <MapPin size={16} /> <span>東京都</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        良好
                      </span>
                      <span className="text-xs text-gray-500">
                        2日前
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ページネーション */}
            <div className="flex justify-center mt-12">
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-gray-500 hover:text-[#2FA3E3] transition-colors duration-300">
                  ← 前へ
                </button>
                <button className="px-4 py-2 bg-[#2FA3E3] text-white rounded-lg">1</button>
                <button className="px-4 py-2 text-gray-600 hover:text-[#2FA3E3] transition-colors duration-300">2</button>
                <button className="px-4 py-2 text-gray-600 hover:text-[#2FA3E3] transition-colors duration-300">3</button>
                <span className="px-2 text-gray-500">...</span>
                <button className="px-4 py-2 text-gray-600 hover:text-[#2FA3E3] transition-colors duration-300">10</button>
                <button className="px-4 py-2 text-gray-500 hover:text-[#2FA3E3] transition-colors duration-300">
                  次へ →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}