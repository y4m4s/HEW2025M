import { Camera, Fish } from 'lucide-react';

export default function SellPage() {
  return (
    <div>
      
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              商品を出品する
            </h1>
            <p className="text-center text-gray-600 mb-12">
              釣り用品を出品して、他の釣り人とつながりましょう
            </p>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <form className="space-y-8">
                {/* 商品画像 */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">商品画像</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#2FA3E3] transition-colors duration-300">
                    <div className="text-6xl text-gray-400 mb-4">
                      <Camera size={64} />
                    </div>
                    <p className="text-gray-500 mb-4">画像をドラッグ&ドロップまたはクリックして選択</p>
                    <button type="button" className="bg-[#2FA3E3] text-white px-6 py-3 rounded-lg hover:bg-[#1d7bb8] transition-colors duration-300">
                      画像を選択
                    </button>
                  </div>
                </div>

                {/* 基本情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">商品名</label>
                    <input 
                      type="text" 
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                      placeholder="商品名を入力してください"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">価格</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                      <input 
                        type="number" 
                        className="w-full p-4 pl-8 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* カテゴリーと状態 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">カテゴリー</label>
                    <select className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300">
                      <option value="">選択してください</option>
                      <option value="rod">釣り竿</option>
                      <option value="reel">リール</option>
                      <option value="lure">ルアー</option>
                      <option value="line">ライン</option>
                      <option value="tackle">仕掛け</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">商品の状態</label>
                    <select className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300">
                      <option value="">選択してください</option>
                      <option value="new">新品・未使用</option>
                      <option value="like-new">未使用に近い</option>
                      <option value="good">目立った傷や汚れなし</option>
                      <option value="fair">やや傷や汚れあり</option>
                      <option value="poor">傷や汚れあり</option>
                    </select>
                  </div>
                </div>

                {/* 商品説明 */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">商品の説明</label>
                  <textarea 
                    rows={6}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                    placeholder="商品の詳細、使用感、注意事項などを記載してください"
                    required
                  ></textarea>
                </div>

                {/* 配送情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">配送料の負担</label>
                    <select className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300">
                      <option value="">選択してください</option>
                      <option value="seller">送料込み（出品者負担）</option>
                      <option value="buyer">着払い（購入者負担）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-3">発送までの日数</label>
                    <select className="w-full p-4 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300">
                      <option value="">選択してください</option>
                      <option value="1-2">1〜2日で発送</option>
                      <option value="2-3">2〜3日で発送</option>
                      <option value="4-7">4〜7日で発送</option>
                    </select>
                  </div>
                </div>

                {/* 出品ボタン */}
                <div className="text-center pt-6">
                  <button 
                    type="submit"
                    className="bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white px-12 py-4 rounded-full text-xl font-bold hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 justify-center"
                  >
                    <Fish size={24} />
                    商品を出品する
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}