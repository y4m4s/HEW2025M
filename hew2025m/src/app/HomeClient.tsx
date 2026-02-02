"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import type { Product } from '@/components/products/ProductCard';
import Button from '@/components/ui/Button';
import SkeletonCard from '@/components/ui/SkeletonCard';
import LoginRequiredModal from '@/components/user/LoginRequiredModal';
import { Fish, Search, MapPin, Users, ArrowRight, Puzzle } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import { GiFishingPole, GiFishingHook, GiFishingLure, GiEarthWorm, GiSpanner } from 'react-icons/gi';
import { FaTape, FaTshirt, FaBox } from 'react-icons/fa';
import { SiHelix } from 'react-icons/si';

import { useAuth } from '@/lib/useAuth';

interface HomeClientProps {
  initialProducts: Product[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

  return (
    <div>
      <main className="container mx-auto max-w-6xl px-4 sm:px-5">
        {/* ヒーローセクション */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] text-white mb-8 sm:mb-12 md:mb-16 rounded-b-[30px] sm:rounded-b-[40px] md:rounded-b-[50px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6 sm:gap-8 md:gap-10">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 leading-tight" style={{fontFamily: "せのびゴシック, sans-serif"}}>釣り人のための<br />マーケットプレイス</h2>
              <p className="text-base sm:text-lg mb-6 sm:mb-8 md:mb-10 opacity-90 leading-relaxed p-2 sm:p-4">
                釣り用品の売買から釣り情報のシェア、マッチングまで。<br />
                釣り人の集まる街「ツリマチ」で、もっと釣りを楽しもう。
              </p>
              <div className="flex gap-3 sm:gap-5 flex-wrap justify-center lg:justify-start">
                <Button
                  onClick={() => {
                    if (!user) {
                      setLoginRequiredAction('商品を出品');
                      setShowLoginModal(true);
                    } else {
                      router.push('/sell');
                    }
                  }}
                  variant="primary"
                  size="lg"
                  className="bg-white text-[#2FA3E3] hover:shadow-xl py-3 sm:py-4 md:py-5 px-6 sm:px-8 md:px-9 text-sm sm:text-base"
                  icon={<Fish size={18} className="sm:w-5 sm:h-5" />}
                >
                  商品を出品
                </Button>
                <Button href="/product-list" variant="outline" size="lg" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#2FA3E3] py-3 sm:py-4 md:py-5 px-6 sm:px-8 md:px-9 text-sm sm:text-base" icon={<Search size={18} className="sm:w-5 sm:h-5" />}>
                  用品を探す
                </Button>
              </div>
            </div>
            <div className="relative hidden lg:flex justify-center items-center">
              <div className="w-36 h-36 bg-white/20 rounded-full flex items-center justify-center text-white relative z-10">
                <Fish size={60} />
              </div>
              <div className="absolute w-full h-full">
                <div className="absolute top-[20%] right-[10%] bg-white text-[#2FA3E3] py-4 px-5 rounded-2xl shadow-lg flex items-center gap-3 font-bold animate-[float_3s_ease-in-out_infinite]">
                  <Fish size={20} />
                  <span>釣竿</span>
                </div>
                <div className="absolute bottom-[30%] left-[5%] bg-white text-[#2FA3E3] py-4 px-5 rounded-2xl shadow-lg flex items-center gap-3 font-bold animate-[float_3s_ease-in-out_infinite] [animation-delay:1s]">
                  <FaTape size={20} />
                  <span>リール</span>
                </div>
                <div className="absolute top-[60%] right-[20%] bg-white text-[#2FA3E3] py-4 px-5 rounded-2xl shadow-lg flex items-center gap-3 font-bold animate-[float_3s_ease-in-out_infinite] [animation-delay:2s]">
                  <GiFishingLure size={20} />
                  <span>ルアー</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 人気カテゴリー */}
        <section className="py-8 sm:py-12 md:py-16 mb-8 sm:mb-12 md:mb-16">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>釣り用品カテゴリー</h3>
            <p className="text-sm sm:text-base text-gray-600">よく取引されている釣り用品をチェック</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {/* ロッド/竿 */}
            <Link href="/product-list?category=rod">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <GiFishingPole size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ロッド/竿</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">海釣り・川釣り用</p>
              </div>
            </Link>

            {/* リール */}
            <Link href="/product-list?category=reel">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <FaTape size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>リール</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">スピニング・ベイト</p>
              </div>
            </Link>

            {/* ルアー */}
            <Link href="/product-list?category=lure">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <GiFishingLure size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ルアー</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">ハード・ソフト</p>
              </div>
            </Link>

            {/* ライン/糸 */}
            <Link href="/product-list?category=line">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <SiHelix size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ライン/糸</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">各種ライン</p>
              </div>
            </Link>

            {/* ハリ/針 */}
            <Link href="/product-list?category=hook">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <GiFishingHook size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ハリ/針</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">各種フック</p>
              </div>
            </Link>

            {/* 餌 */}
            <Link href="/product-list?category=bait">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <GiEarthWorm size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>餌</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">生餌・練り餌</p>
              </div>
            </Link>

            {/* ウェア */}
            <Link href="/product-list?category=wear">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <FaTshirt size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ウェア</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">服・装備品</p>
              </div>
            </Link>

            {/* セット用品 */}
            <Link href="/product-list?category=set">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <FaBox size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>セット用品</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">まとめてお得</p>
              </div>
            </Link>

            {/* サービス */}
            <Link href="/product-list?category=service">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <GiSpanner size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>サービス</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">ガイド・修理</p>
              </div>
            </Link>

            {/* その他 */}
            <Link href="/product-list?category=other">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-white">
                  <Puzzle size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>その他</h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">その他の用品</p>
              </div>
            </Link>
          </div>
        </section>

        {/* 最新の出品 */}
        <section className="py-8 sm:py-12 md:py-16 mb-8 sm:mb-12 md:mb-16">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>最新の出品釣り用品</h3>
            <p className="text-sm sm:text-base text-gray-600">新しく出品された注目の釣り用品</p>
          </div>

          {initialProducts.length === 0 ? (
            <div className="text-center py-12 sm:py-16 md:py-20">
              <Fish className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-base sm:text-lg mb-4">まだ商品が出品されていません</p>
              <Button href="/sell" variant="primary" size="md" icon={<Fish size={18} />}>
                最初の商品を出品する
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10">
                {initialProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="featured" />
                ))}
              </div>
              <div className="text-center">
                <Button href="/product-list" variant="primary" size="lg" icon={<ArrowRight size={18} className="sm:w-5 sm:h-5" />}>
                  すべての商品を見る
                </Button>
              </div>
            </>
          )}
        </section>

        {/* 特徴セクション */}
        <section className="py-8 sm:py-12 md:py-16 mb-8 sm:mb-12 md:mb-16">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>釣り人のためのコミュニティ</h3>
            <p className="text-sm sm:text-base text-gray-600">釣り用品の取引から情報交換まで</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            <Link href="/post-list">
              <div className="bg-white text-center py-6 sm:py-8 px-4 sm:px-5 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-green-500 before:to-emerald-500 before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 text-white">
                  <MessageSquare size={24} className="sm:w-8 sm:h-8" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">釣果情報</h4>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">みんなの釣行記録をチェック</p>
              </div>
            </Link>
            <Link href="/map">
              <div className="bg-white text-center py-6 sm:py-8 px-4 sm:px-5 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-green-500 before:to-emerald-500 before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 text-white">
                  <MapPin size={24} className="sm:w-8 sm:h-8" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">釣り場情報共有</h4>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">地域の情報をシェア</p>
              </div>
            </Link>
            <Link href="/community">
              <div className="bg-white text-center py-6 sm:py-8 px-4 sm:px-5 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-green-500 before:to-emerald-500 before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 text-white">
                  <Users size={24} className="sm:w-8 sm:h-8" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">釣り仲間と交流</h4>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">近くの釣り人との情報交換</p>
              </div>
            </Link>
          </div>
        </section>

        {/* CTA セクション */}
        {!user ? (
          // 未ログインユーザー向け：参加を促すCTA
          <section className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-12 sm:py-16 md:py-20 rounded-2xl sm:rounded-3xl text-center mb-6 sm:mb-8 md:mb-10 relative overflow-hidden before:absolute before:top-[-50%] before:left-[-50%] before:w-[200%] before:h-[200%] before:bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] before:animate-[spin_20s_linear_infinite]">
            <div className="relative z-10 px-4">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5" style={{fontFamily: "せのびゴシック, sans-serif"}}>釣り人のコミュニティに参加しよう</h3>
              <p className="text-base sm:text-lg mb-6 sm:mb-8 md:mb-10 opacity-90">
                無料で簡単に始められます。あなたの釣り用品を必要な人に届けませんか？
              </p>
              <div className="flex gap-3 sm:gap-5 justify-center flex-wrap">
                <Button href="/register" variant="primary" size="lg" className="py-3 sm:py-4 md:py-5 px-6 sm:px-8 md:px-9 text-sm sm:text-base" icon={<Fish size={18} className="sm:w-5 sm:h-5" />}>
                  釣り人として参加
                </Button>
                <Button href="/product-list" variant="outline" size="lg" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-gray-700 py-3 sm:py-4 md:py-5 px-6 sm:px-8 md:px-9 text-sm sm:text-base" icon={<Search size={18} className="sm:w-5 sm:h-5" />}>
                  釣り用品を探す
                </Button>
              </div>
            </div>
          </section>
        ) : (
          // ログイン済みユーザー向け：出品や活動を促すCTA
          <section className="bg-gradient-to-r from-[#2FA3E3] to-[#007bff] text-white py-12 sm:py-16 md:py-20 rounded-2xl sm:rounded-3xl text-center mb-6 sm:mb-8 md:mb-10 relative overflow-hidden before:absolute before:top-[-50%] before:left-[-50%] before:w-[200%] before:h-[200%] before:bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] before:animate-[spin_20s_linear_infinite]">
            <div className="relative z-10 px-4">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5" style={{fontFamily: "せのびゴシック, sans-serif"}}>もっと釣りを楽しもう！</h3>
              <p className="text-base sm:text-lg mb-6 sm:mb-8 md:mb-10 opacity-90">
                使わなくなった釣り用品を出品したり、釣果情報をシェアしたりして、コミュニティを盛り上げましょう！
              </p>
              <div className="flex gap-3 sm:gap-5 justify-center flex-wrap">
                <Button
                  onClick={() => router.push('/sell')}
                  variant="primary"
                  size="lg"
                  className="bg-white text-[#2FA3E3] hover:shadow-xl py-3 sm:py-4 md:py-5 px-6 sm:px-8 md:px-9 text-sm sm:text-base"
                  icon={<Fish size={18} className="sm:w-5 sm:h-5" />}
                >
                  商品を出品
                </Button>
                <Button
                  onClick={() => router.push('/post')}
                  variant="outline"
                  size="lg"
                  className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#2FA3E3] py-3 sm:py-4 md:py-5 px-6 sm:px-8 md:px-9 text-sm sm:text-base"
                  icon={<MessageSquare size={18} className="sm:w-5 sm:h-5" />}
                >
                  釣果を投稿
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}
