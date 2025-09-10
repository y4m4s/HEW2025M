import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-4xl font-bold text-[#2FA3E3]" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            ツリマチ
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl p-10 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>
          
          <h2 className="text-3xl font-bold text-center mb-9 text-gray-800 relative" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            ログイン
            <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>
          </h2>
          
          <form>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス/ユーザーネーム</label>
              <input 
                type="text" 
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20" 
                placeholder="メールアドレスまたはユーザーネーム" 
                required 
              />
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
              <input 
                type="password" 
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20" 
                placeholder="パスワードを入力" 
                required 
              />
            </div>

            <button 
              type="submit" 
              className="w-full p-4 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 mt-2.5 relative overflow-hidden hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#2FA3E3]/30 active:transform active:translate-y-0"
            >
              ログイン
            </button>
          </form>

          <div className="text-center mt-5">
            <a href="#" className="text-[#2FA3E3] no-underline text-sm transition-colors duration-300 hover:text-[#1d7bb8] hover:underline">
              パスワードをお忘れですか？
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl px-8 py-6 flex items-center justify-between gap-5 shadow-md relative">
          <span className="text-sm text-gray-600 flex-1 leading-6">
            ユーザー登録がお済みでない方は<br />
            コチラから登録をお願いします
          </span>
          <span className="mx-4 text-xl text-[#2FA3E3] font-bold transition-transform duration-300">→</span>
          <Link 
            href="/register" 
            className="bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white border-none px-6 py-3 rounded-full text-sm font-bold cursor-pointer transition-all duration-300 whitespace-nowrap relative overflow-hidden hover:transform hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#2FA3E3]/30"
          >
            新規登録
          </Link>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#2c3e50] to-[#34495e] text-white py-5">
        <div className="container mx-auto px-5 text-center">
          <p className="text-sm text-gray-400 m-0">&copy; 2024 ツリマチ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}