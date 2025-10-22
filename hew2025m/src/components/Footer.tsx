import Link from 'next/link';
import { Twitter, Facebook, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#2c3e50] to-[#34495e] text-white py-16 mt-20 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>

      <div className="container mx-auto px-5">
        <div className="grid grid-cols-4 gap-10 mb-10">
          <div className="col-span-2">
            <Link href="/" className="text-3xl font-bold text-[#2FA3E3] no-underline inline-block mb-5" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              ツリマチ
            </Link>
            <p className="text-gray-300 leading-7 mb-8 text-sm">
              釣り人のためのマーケットプレイス。<br />
              釣り用品の売買から情報共有まで、釣り人と釣り人をつなぐコミュニティプラットフォームです。
            </p>
            <div className="flex gap-4">
              <a href="#" className="flex items-center justify-center w-10 h-10 bg-[#2FA3E3]/20 text-[#2FA3E3] rounded-full text-lg transition-all duration-300 hover:bg-[#2FA3E3] hover:text-white hover:transform hover:-translate-y-1" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="flex items-center justify-center w-10 h-10 bg-[#2FA3E3]/20 text-[#2FA3E3] rounded-full text-lg transition-all duration-300 hover:bg-[#2FA3E3] hover:text-white hover:transform hover:-translate-y-1" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="flex items-center justify-center w-10 h-10 bg-[#2FA3E3]/20 text-[#2FA3E3] rounded-full text-lg transition-all duration-300 hover:bg-[#2FA3E3] hover:text-white hover:transform hover:-translate-y-1" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="flex items-center justify-center w-10 h-10 bg-[#2FA3E3]/20 text-[#2FA3E3] rounded-full text-lg transition-all duration-300 hover:bg-[#2FA3E3] hover:text-white hover:transform hover:-translate-y-1" aria-label="YouTube">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white text-lg font-semibold mb-5 border-b-2 border-[#2FA3E3] pb-2 inline-block" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              サービス
            </h3>
            <ul className="list-none">
              <li className="mb-3">
                <Link href="/sell" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">商品を出品</Link>
              </li>
              <li className="mb-3">
                <Link href="/search" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">商品を探す</Link>
              </li>
              <li className="mb-3">
                <Link href="/community" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">コミュニティ</Link>
              </li>
              <li className="mb-3">
                <a href="#" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">投稿一覧</a>
              </li>
              <li className="mb-3">
                <a href="#" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">マップ</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-lg font-semibold mb-5 border-b-2 border-[#2FA3E3] pb-2 inline-block" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              サポート
            </h3>
            <ul className="list-none">
              <li className="mb-3">
                <a href="#" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">ヘルプ・FAQ</a>
              </li>
              <li className="mb-3">
                <a href="#" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">お問い合わせ</a>
              </li>
              <li className="mb-3">
                <a href="#" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">利用規約</a>
              </li>
              <li className="mb-3">
                <a href="#" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">プライバシーポリシー</a>
              </li>
              <li className="mb-3">
                <a href="#" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3]">特定商取引法</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-5 flex justify-between items-center flex-wrap gap-5">
          <div>
            <p className="text-gray-400 text-sm m-0">&copy; 2024 ツリマチ. All rights reserved.</p>
          </div>
          <ul className="flex list-none gap-8">
            <li>
              <a href="#" className="text-gray-400 text-xs transition-colors duration-300 hover:text-[#2FA3E3]">利用規約</a>
            </li>
            <li>
              <a href="#" className="text-gray-400 text-xs transition-colors duration-300 hover:text-[#2FA3E3]">プライバシーポリシー</a>
            </li>
            <li>
              <a href="#" className="text-gray-400 text-xs transition-colors duration-300 hover:text-[#2FA3E3]">Cookie設定</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}