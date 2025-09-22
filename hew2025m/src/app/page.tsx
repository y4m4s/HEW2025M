"use client";

import Link from 'next/link';
import ProductCard, { Product } from '@/components/ProductCard';
import { Fish, Search, MapPin, Users, ArrowRight, Circle, Bug, Package, Shirt, Ship } from 'lucide-react';

export default function Home() {
  const featuredProducts: Product[] = [
    {
      id: 1,
      name: 'ダイワ製 海釣り用ロッド',
      price: 18000,
      location: '湘南・江ノ島',
      condition: '良好',
      postedDate: '2日前'
    },
    {
      id: 2,
      name: 'シマノ電動リール',
      price: 45000,
      location: '横浜・本牧',
      condition: '未使用に近い',
      postedDate: '1日前'
    },
    {
      id: 3,
      name: 'メガバス ルアーセット',
      price: 12500,
      location: '多摩川・調布',
      condition: '良好',
      postedDate: '3日前'
    },
    {
      id: 4,
      name: 'タックルボックス一式',
      price: 8000,
      location: '東京湾・船橋',
      condition: '新品',
      postedDate: '1日前'
    }
  ];

  return (
    <div>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      <main className="container mx-auto max-w-6xl px-5">
        {/* ヒーローセクション */}
        <section className="py-20 px-4 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] text-white mb-16 rounded-b-[50px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-5 leading-tight" style={{fontFamily: "せのびゴシック, sans-serif"}}>釣り人のための<br />マーケットプレイス</h2>
              <p className="text-lg mb-10 opacity-90 leading-relaxed p-4">
                釣り用品の売買から釣り情報のシェア、マッチングまで。<br />
                釣り人の集まる街「ツリマチ」で、もっと釣りを楽しもう。
              </p>
              <div className="flex gap-5 flex-wrap">
                <Link href="/sell" className="inline-flex items-center gap-3 py-4 px-8 bg-white text-[#2FA3E3] rounded-full text-base font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                  <Fish size={20} />
                  釣り用品を出品
                </Link>
                <Link href="/search" className="inline-flex items-center gap-3 py-4 px-8 bg-transparent text-white border-2 border-white rounded-full text-base font-bold transition-all duration-300 hover:bg-white hover:text-[#2FA3E3]">
                  <Search size={20} />
                  用品を探す
                </Link>
              </div>
            </div>
            <div className="relative flex justify-center items-center">
              <div className="w-36 h-36 bg-white/20 rounded-full flex items-center justify-center text-6xl text-white relative z-10">
                <Fish size={60} />
              </div>
              <div className="absolute w-full h-full hidden lg:block">
                <div className="absolute top-[20%] right-[10%] bg-white text-[#2FA3E3] py-4 px-5 rounded-2xl shadow-lg flex items-center gap-3 font-bold animate-[float_3s_ease-in-out_infinite]">
                  <Fish size={20} />
                  <span>釣竿</span>
                </div>
                <div className="absolute bottom-[30%] left-[5%] bg-white text-[#2FA3E3] py-4 px-5 rounded-2xl shadow-lg flex items-center gap-3 font-bold animate-[float_3s_ease-in-out_infinite] [animation-delay:1s]">
                  <Circle size={20} />
                  <span>リール</span>
                </div>
                <div className="absolute top-[60%] right-[20%] bg-white text-[#2FA3E3] py-4 px-5 rounded-2xl shadow-lg flex items-center gap-3 font-bold animate-[float_3s_ease-in-out_infinite] [animation-delay:2s]">
                  <Bug size={20} />
                  <span>ルアー</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 人気カテゴリー */}
        <section className="py-16 mb-16">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>釣り用品カテゴリー</h3>
            <p className="text-base text-gray-600">よく取引されている釣り用品をチェック</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
              <div className="w-20 h-20 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-5 text-white">
                <Fish size={32} />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ロッド・竿</h4>
              <p className="text-gray-600 mb-4">海釣り・川釣り・ルアー竿</p>
              <span className="inline-block bg-blue-50 text-[#2FA3E3] py-1 px-4 rounded-full text-sm font-bold">1,234件</span>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
              <div className="w-20 h-20 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-5 text-white">
                <Circle size={32} />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>リール</h4>
              <p className="text-gray-600 mb-4">スピニング・ベイト・電動リール</p>
              <span className="inline-block bg-blue-50 text-[#2FA3E3] py-1 px-4 rounded-full text-sm font-bold">856件</span>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
              <div className="w-20 h-20 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-5 text-white">
                <Bug size={32} />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ルアー・仕掛け</h4>
              <p className="text-gray-600 mb-4">ハードルアー・ワーム・針</p>
              <span className="inline-block bg-blue-50 text-[#2FA3E3] py-1 px-4 rounded-full text-sm font-bold">2,189件</span>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
              <div className="w-20 h-20 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-5 text-white">
                <Package size={32} />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>タックルボックス</h4>
              <p className="text-gray-600 mb-4">道具箱・収納・ケース</p>
              <span className="inline-block bg-blue-50 text-[#2FA3E3] py-1 px-4 rounded-full text-sm font-bold">423件</span>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
              <div className="w-20 h-20 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-5 text-white">
                <Shirt size={32} />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ウェア・装身具</h4>
              <p className="text-gray-600 mb-4">ライフジャケット・帽子・サングラス</p>
              <span className="inline-block bg-blue-50 text-[#2FA3E3] py-1 px-4 rounded-full text-sm font-bold">678件</span>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
              <div className="w-20 h-20 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-5 text-white">
                <Ship size={32} />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ボート・船外機</h4>
              <p className="text-gray-600 mb-4">フィッシングボート・カヤック</p>
              <span className="inline-block bg-blue-50 text-[#2FA3E3] py-1 px-4 rounded-full text-sm font-bold">145件</span>
            </div>
          </div>
        </section>

        {/* 最新の出品 */}
        <section className="py-16 mb-16">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>最新の出品釣り用品</h3>
            <p className="text-base text-gray-600">新しく出品された注目の釣り用品</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} variant="featured" />
            ))}
          </div>
          <div className="text-center">
            <Link href="/search" className="inline-flex items-center gap-3 py-4 px-8 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] text-white rounded-full font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              すべての商品を見る
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* 特徴セクション */}
        <section className="py-16 bg-white rounded-3xl mb-16 shadow-sm">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>釣り人のためのコミュニティ</h3>
            <p className="text-base text-gray-600">釣り用品の取引から情報交換まで</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center py-8 px-5">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 text-white">
                <Fish size={32} />
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">釣り用品専門</h4>
              <p className="text-gray-600 leading-relaxed">釣り竿からルアーまで、釣り用品に特化した専門マーケット</p>
            </div>
            <div className="text-center py-8 px-5">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 text-white">
                <MapPin size={32} />
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">釣り場情報共有</h4>
              <p className="text-gray-600 leading-relaxed">地域の釣り場情報や釣果報告をシェア</p>
            </div>
            <div className="text-center py-8 px-5">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 text-white">
                <Users size={32} />
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">釣り仲間と交流</h4>
              <p className="text-gray-600 leading-relaxed">近くの釣り人との情報交換やグループ釣行の企画</p>
            </div>
          </div>
        </section>

        {/* CTA セクション */}
        <section className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-20 rounded-3xl text-center mb-10 relative overflow-hidden before:absolute before:top-[-50%] before:left-[-50%] before:w-[200%] before:h-[200%] before:bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] before:animate-[spin_20s_linear_infinite]">
          <div className="relative z-10">
            <h3 className="text-3xl lg:text-4xl font-bold mb-5" style={{fontFamily: "せのびゴシック, sans-serif"}}>釣り人のコミュニティに参加しよう</h3>
            <p className="text-lg mb-10 opacity-90">
              無料で簡単に始められます。あなたの釣り用品を必要な人に届けませんか？
            </p>
            <div className="flex gap-5 justify-center flex-wrap">
              <Link href="/register" className="inline-flex items-center gap-3 py-5 px-9 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] text-white rounded-full text-base font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                <Fish size={20} />
                釣り人として参加
              </Link>
              <Link href="/search" className="inline-flex items-center gap-3 py-5 px-9 bg-transparent text-white border-2 border-white rounded-full text-base font-bold transition-all duration-300 hover:bg-white hover:text-gray-700">
                <Search size={20} />
                釣り用品を探す
              </Link>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}