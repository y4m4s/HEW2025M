import Link from 'next/link';
import { Bell, Mail, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white py-4 px-10 border-b border-gray-200">
      <div className="flex justify-around items-center mb-5">
        <h1 className="text-7xl font-bold text-[#2FA3E3]" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
          <Link href="/">ツリマチ</Link>
        </h1>
        <nav className="mx-11 flex justify-around gap-12">
          <Link href="/sell" className="no-underline text-gray-800 text-base hover:text-blue-600 hover:border-b-2 hover:border-blue-600 transition-all duration-300">
            出品する
          </Link>
          <Link href="/search" className="no-underline text-gray-800 text-base hover:text-blue-600 hover:border-b-2 hover:border-blue-600 transition-all duration-300">
            商品を探す
          </Link>
          <Link href="/community" className="no-underline text-gray-800 text-base hover:text-blue-600 hover:border-b-2 hover:border-blue-600 transition-all duration-300">
            コミュニティ
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/notification" className="flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3]" aria-label="通知">
            <Bell size={18} />
          </Link>
          <Link href="/message" className="flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-lg transition-all duration-300 hover:bg-gray-200 hover:text-[#2FA3E3]" aria-label="メッセージ">
            <Mail size={18} />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center py-2.5 px-5 rounded-full text-sm font-medium no-underline cursor-pointer border-none transition-all duration-300 gap-2 bg-transparent text-[#2FA3E3] border border-[#2FA3E3] hover:bg-[#2FA3E3] hover:text-white">
            ログイン
          </Link>
          <Link href="/register" className="inline-flex items-center justify-center py-2.5 px-5 rounded-full text-sm font-medium no-underline cursor-pointer border-none transition-all duration-300 gap-2 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white hover:bg-[#1d7bb8]">
            新規登録
          </Link>
        </div>
      </div>
      <div className="flex justify-center">
        <form className="relative max-w-2xl w-full">
          <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-600">
            <Search size={16} />
          </div>
          <input 
            type="search" 
            placeholder="キーワードで検索" 
            className="w-full py-4 px-5 pl-12 border-2 border-gray-200 rounded-full text-base outline-none transition-colors duration-300 focus:border-[#2FA3E3] placeholder:text-gray-400"
          />
        </form>
      </div>
    </header>
  );
}
