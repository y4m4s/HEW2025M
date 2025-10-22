import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-6xl font-bold text-[#2FA3E3] tracking-wider" style={{ fontFamily: "せのびゴシック, sans-serif", textShadow: "0 2px 4px rgba(47, 163, 227, 0.1)" }}>
            ツリマチ
          </Link>
        </div>
        
        <div className="text-center text-base text-gray-600 mb-9 leading-6 p-5 bg-white rounded-xl shadow-sm">
          新たなマッチングを求めて<br />
          釣り人の集まる街「ツリマチ」に参加しよう。
        </div>
        
        <div className="bg-white rounded-2xl p-10 shadow-xl relative overflow-hidden mb-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>
          
          <h2 className="text-3xl font-bold text-center mb-9 text-gray-800 relative" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
            新規登録
            <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>
          </h2>
          
          <form>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <input 
                type="email" 
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20" 
                placeholder="example@email.com" 
                required 
              />
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">ユーザーネーム</label>
              <input 
                type="text" 
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20" 
                placeholder="ユーザーネームを入力" 
                required 
              />
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
              <input 
                type="password" 
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20" 
                placeholder="8文字以上で入力" 
                required 
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード確認</label>
              <input 
                type="password" 
                className="w-full p-4 border border-gray-300 rounded-lg text-base transition-all duration-300 focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20" 
                placeholder="パスワードを再入力" 
                required 
              />
            </div>

            <button 
              type="submit" 
              className="w-full p-4 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 mt-5 relative overflow-hidden hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#2FA3E3]/30 active:transform active:translate-y-0"
            >
              アカウント作成
            </button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-2">既にアカウントをお持ちですか？</p>
          <Link 
            href="/login" 
            className="text-[#2FA3E3] no-underline font-medium transition-colors duration-300 hover:text-[#1d7bb8] hover:underline"
          >
            ログイン
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