import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { User, Fish, List } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div>
      <Header />
      
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* プロフィール情報 */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                      <User size={48} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                      釣り好き太郎
                    </h1>
                    <p className="text-gray-600 mb-4">@tsurizuki_taro</p>
                    <div className="flex justify-center gap-6 text-sm text-gray-600 mb-6">
                      <div className="text-center">
                        <div className="font-semibold text-[#2FA3E3] text-lg">24</div>
                        <div>出品中</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-[#2FA3E3] text-lg">156</div>
                        <div>評価</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-[#2FA3E3] text-lg">89</div>
                        <div>フォロワー</div>
                      </div>
                    </div>
                    <button className="w-full bg-[#2FA3E3] text-white py-3 rounded-lg hover:bg-[#1d7bb8] transition-colors duration-300 mb-4">
                      プロフィール編集
                    </button>
                    <button className="w-full border border-[#2FA3E3] text-[#2FA3E3] py-3 rounded-lg hover:bg-[#2FA3E3] hover:text-white transition-all duration-300">
                      メッセージ
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                    自己紹介
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    釣り歴15年の釣り愛好家です。主にルアーフィッシングを楽しんでいます。
                    使わなくなった釣り具を出品していますので、お気軽にお声かけください。
                    質問などもお気軽にどうぞ！
                  </p>
                </div>
              </div>

              {/* タブコンテンツ */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg">
                  <div className="border-b border-gray-200">
                    <div className="flex">
                      <button className="px-6 py-4 text-[#2FA3E3] border-b-2 border-[#2FA3E3] font-medium">
                        出品中 (24)
                      </button>
                      <button className="px-6 py-4 text-gray-600 hover:text-[#2FA3E3] transition-colors duration-300">
                        販売済み (78)
                      </button>
                      <button className="px-6 py-4 text-gray-600 hover:text-[#2FA3E3] transition-colors duration-300">
                        評価 (156)
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300">
                          <div className="h-36 bg-gray-200 flex items-center justify-center text-3xl text-gray-400">
                            <Fish size={32} />
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-gray-800 mb-1 text-sm line-clamp-2">
                              釣り竿セット - 初心者向け
                            </h3>
                            <p className="text-lg font-bold text-[#2FA3E3] mb-1">¥3,500</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                出品中
                              </span>
                              <span>2日前</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* もっと見るボタン */}
                    <div className="text-center mt-8">
                      <button className="text-[#2FA3E3] hover:text-[#1d7bb8] font-medium transition-colors duration-300">
                        もっと見る
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}