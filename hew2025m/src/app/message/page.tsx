import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User, Send } from 'lucide-react';

export default function MessagePage() {
  return (
    <div>
      <Header />
      
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-12" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              メッセージ
            </h1>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '600px' }}>
              <div className="flex h-full">
                {/* メッセージリスト */}
                <div className="w-1/3 border-r border-gray-200">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
                      メッセージ一覧
                    </h2>
                  </div>
                  <div className="overflow-y-auto h-full">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div 
                        key={i} 
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${i === 0 ? 'bg-blue-50 border-l-4 border-l-[#2FA3E3]' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl">
                            <User size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="font-medium text-gray-800 truncate">
                                釣り人{i + 1}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {i === 0 ? '5分前' : `${i + 1}時間前`}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {i === 0 ? 'この商品はまだ販売中ですか？' : '商品について質問があります...'}
                            </p>
                            {i === 0 && (
                              <div className="w-2 h-2 bg-red-500 rounded-full float-right -mt-1"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* メッセージ詳細 */}
                <div className="flex-1 flex flex-col">
                  {/* ヘッダー */}
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-lg">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">釣り人1</h3>
                        <p className="text-sm text-gray-500">オンライン</p>
                      </div>
                    </div>
                  </div>

                  {/* メッセージエリア */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {/* 受信メッセージ */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
                          <User size={16} />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                          <p className="text-gray-800">この商品はまだ販売中ですか？</p>
                          <span className="text-xs text-gray-500">15:30</span>
                        </div>
                      </div>

                      {/* 送信メッセージ */}
                      <div className="flex items-start gap-3 justify-end">
                        <div className="bg-[#2FA3E3] text-white rounded-lg px-4 py-2 max-w-xs">
                          <p>はい、まだ販売中です！</p>
                          <span className="text-xs text-blue-200">15:32</span>
                        </div>
                        <div className="w-8 h-8 bg-[#2FA3E3] rounded-full flex items-center justify-center text-sm text-white">
                          <User size={16} />
                        </div>
                      </div>

                      {/* 受信メッセージ */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
                          <User size={16} />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                          <p className="text-gray-800">購入を検討しているのですが、傷の具合はいかがですか？</p>
                          <span className="text-xs text-gray-500">15:35</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* メッセージ入力エリア */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="メッセージを入力..." 
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20 transition-all duration-300"
                      />
                      <button className="bg-[#2FA3E3] text-white px-6 py-3 rounded-lg hover:bg-[#1d7bb8] transition-colors duration-300 flex items-center gap-2">
                        <Send size={16} />
                        送信
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