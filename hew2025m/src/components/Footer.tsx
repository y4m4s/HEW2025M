'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import LoginRequiredModal from '@/components/LoginRequiredModal';

export default function Footer() {
  const { user } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');
  return (
    <footer className="bg-gradient-to-r from-[#2c3e50] to-[#34495e] text-white py-16 relative">

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8]"></div>

      <div className="container mx-auto max-w-6xl px-5">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-3xl font-bold text-[#2FA3E3] no-underline inline-block mb-5" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              ツリマチ
            </Link>
            <p className="text-gray-300 leading-7 mb-8 text-sm pr-0 md:pr-10">
              釣り人のためのマーケットプレイス。<br />
              釣り用品の売買から情報共有まで、釣り人と釣り人をつなぐコミュニティプラットフォームです。
            </p>
            <div className="flex gap-4">
              <Link href="#" className="flex items-center justify-center w-10 h-10 bg-[#2FA3E3]/20 text-[#2FA3E3] rounded-full text-lg transition-all duration-300 hover:bg-[#2FA3E3] hover:text-white hover:transform hover:-translate-y-1" aria-label="Twitter">
                <Twitter size={18} />
              </Link>
              <Link href="#" className="flex items-center justify-center w-10 h-10 bg-[#2FA3E3]/20 text-[#2FA3E3] rounded-full text-lg transition-all duration-300 hover:bg-[#2FA3E3] hover:text-white hover:transform hover:-translate-y-1" aria-label="Facebook">
                <Facebook size={18} />
              </Link>
              <Link href="#" className="flex items-center justify-center w-10 h-10 bg-[#2FA3E3]/20 text-[#2FA3E3] rounded-full text-lg transition-all duration-300 hover:bg-[#2FA3E3] hover:text-white hover:transform hover:-translate-y-1" aria-label="Instagram">
                <Instagram size={18} />
              </Link>
              <Link href="#" className="flex items-center justify-center w-10 h-10 bg-[#2FA3E3]/20 text-[#2FA3E3] rounded-full text-lg transition-all duration-300 hover:bg-[#2FA3E3] hover:text-white hover:transform hover:-translate-y-1" aria-label="YouTube">
                <Youtube size={18} />
              </Link>
            </div>
          </div>

          {/* 中央：サービス */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-6 border-b-2 border-[#2FA3E3] pb-2 inline-block" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              サービス
            </h3>
            <ul className="list-none space-y-3">
              <li>
                <button
                  onClick={() => {
                    if (!user) {
                      setLoginRequiredAction('商品を出品');
                      setShowLoginModal(true);
                    } else {
                      router.push('/sell');
                    }
                  }}
                  className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3] hover:pl-1 bg-transparent border-0 cursor-pointer p-0 text-left"
                >
                  商品を出品
                </button>
              </li>
              <li>
                <Link href="/product-list" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3] hover:pl-1">商品を探す</Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3] hover:pl-1">コミュニティ</Link>
              </li>
              <li>
                <Link href="/post-list" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3] hover:pl-1">投稿一覧</Link>
              </li>
              <li>
                <Link href="/map" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3] hover:pl-1">マップ</Link>
              </li>
            </ul>
          </div>

          {/* 右側：サポート */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-6 border-b-2 border-[#2FA3E3] pb-2 inline-block" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              サポート
            </h3>
            <ul className="list-none space-y-3">
              <li>
                <Link href="/legal" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3] hover:pl-1">
                  特定商取引法に基づく表記
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3] hover:pl-1">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 text-sm transition-colors duration-300 hover:text-[#2FA3E3] hover:pl-1">
                  利用規約
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">

          <ul className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 list-none p-0">
            <li>
              <Link href="/legal" className="text-gray-400 text-xs transition-colors duration-300 hover:text-[#2FA3E3]">
                特定商取引法に基づく表記
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-gray-400 text-xs transition-colors duration-300 hover:text-[#2FA3E3]">
                プライバシーポリシー
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-gray-400 text-xs transition-colors duration-300 hover:text-[#2FA3E3]">
                利用規約
              </Link>
            </li>
          </ul>

          <p className="text-gray-400 text-sm m-0 text-center md:text-right">
            &copy; {new Date().getFullYear()} ツリマチ. All rights reserved.
          </p>
        </div>
      </div>

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </footer>
  );
}