"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Fish, Search, ArrowRight, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';

import ProductCard from '@/components/products/ProductCard';
import type { Product } from '@/components/products/ProductCard';
import Button from '@/components/ui/Button';
import LoginRequiredModal from '@/components/user/LoginRequiredModal';


// カテゴリー情報の定義
const CATEGORIES = [
  { id: 'rod', name: 'ロッド/竿', description: '海釣り・川釣り用', image: '/category/ロッド.webp' },
  { id: 'reel', name: 'リール', description: 'スピニング・ベイト', image: '/category/リール.webp' },
  { id: 'lure', name: 'ルアー', description: 'ハード・ソフト', image: '/category/ルアー.webp' },
  { id: 'line', name: 'ライン/糸', description: '各種ライン', image: '/category/ライン.webp' },
  { id: 'hook', name: 'ハリ/針', description: '各種フック', image: '/category/針.webp' },
  { id: 'bait', name: '餌', description: '生餌・練り餌', image: '/category/餌.webp' },
  { id: 'wear', name: 'ウェア', description: '服・装備品', image: '/category/ウェア.webp' },
  { id: 'set', name: 'セット用品', description: 'まとめてお得', image: '/category/セット.webp' },
  { id: 'service', name: 'サービス', description: 'ガイド・修理', image: '/category/サービス.webp' },
  { id: 'other', name: 'その他', description: 'その他の用品', image: '/category/その他.webp' },
] as const;

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
        <section className="relative py-8 sm:py-12 px-4 sm:px-8 text-white mb-8 sm:mb-12 md:mb-16 rounded-b-[30px] sm:rounded-b-[40px] md:rounded-b-[50px] overflow-hidden">
          {/* 背景画像 */}
          <div className="absolute inset-0">
            <Image
              src="/back/hero.webp"
              alt="釣り場の風景"
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
              className="object-cover object-center sm:object-center"
            />
            {/* グラデーションオーバーレイで青みを加える */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2FA3E3]/80 via-[#2FA3E3]/75 to-[#007bff]/75"></div>
            {/* 追加のぼかしレイヤー（モバイルで濃く） */}
            <div className="absolute inset-0 bg-[#2FA3E3]/70 sm:bg-[#2FA3E3]/60"></div>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-4 sm:gap-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-5 leading-tight">
                釣り人のための<br />
                マーケットプレイス
              </h2>
              <p className="text-sm sm:text-base mb-5 sm:mb-6 md:mb-8 lg:mb-10 opacity-90 leading-relaxed px-2 sm:px-0 sm:pl-5">
                釣り用品の売買から釣り情報のシェア、<br className="sm:hidden" />
                マッチングまで。<br />
                釣り人の集まる街「ツリマチ」で、<br className="sm:hidden" />
                もっと釣りを楽しもう。
              </p>
              <div className="flex gap-3 sm:gap-6 md:gap-10 lg:gap-15 flex-wrap justify-center">
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
                  className="bg-white text-[#2FA3E3] hover:shadow-xl py-2.5 sm:py-3 md:py-4 lg:py-5 px-5 sm:px-6 md:px-8 lg:px-9 text-xs sm:text-sm md:text-base"
                  icon={<Fish size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />}
                >
                  商品を出品
                </Button>
                <Button href="/product-list" variant="outline" size="lg" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#2FA3E3] py-2.5 sm:py-3 md:py-4 lg:py-5 px-5 sm:px-6 md:px-8 lg:px-9 text-xs sm:text-sm md:text-base" icon={<Search size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />}>
                  用品を探す
                </Button>
              </div>
            </div>
            {/* 商品・投稿の自動スクロールカルーセル */}
            <div className="hidden lg:block relative overflow-hidden rounded-2xl h-[400px]">
              {/* 縦スクロールコンテナ */}
              <div className="flex flex-col gap-4 animate-scroll-vertical px-2 py-4">
                {/* 最初のセット */}
                {initialProducts.slice(0, 6).map((product) => (
                  <Link key={`first-${product.id}`} href={`/product-detail/${product.id}`}>
                    <div className="group flex-shrink-0 bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-[1.02]">
                      <div className="flex gap-4 p-4">
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {product.imageUrl && (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="96px"
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-800 truncate mb-1 group-hover:text-[#2FA3E3] transition-colors duration-300">{product.name}</h4>
                          <p className="text-lg font-bold text-[#2FA3E3]">¥{product.price.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {product.sellerPhotoURL && (
                              <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <Image
                                  src={product.sellerPhotoURL}
                                  alt="出品者"
                                  fill
                                  sizes="20px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <p className="text-xs text-gray-500 truncate">{product.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* 2回目のセット（シームレスなループ用） */}
                {initialProducts.slice(0, 6).map((product) => (
                  <Link key={`second-${product.id}`} href={`/product-detail/${product.id}`}>
                    <div className="group flex-shrink-0 bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-[1.02]">
                      <div className="flex gap-4 p-4">
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {product.imageUrl && (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="96px"
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-800 truncate mb-1 group-hover:text-[#2FA3E3] transition-colors duration-300">{product.name}</h4>
                          <p className="text-lg font-bold text-[#2FA3E3]">¥{product.price.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {product.sellerPhotoURL && (
                              <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <Image
                                  src={product.sellerPhotoURL}
                                  alt="出品者"
                                  fill
                                  sizes="20px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <p className="text-xs text-gray-500 truncate">{product.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {/* グラデーションオーバーレイ（上下をフェードアウト） */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#2FA3E3] to-transparent pointer-events-none z-10"></div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#007bff] to-transparent pointer-events-none z-10"></div>
            </div>
          </div>
        </section>

        {/* 人気カテゴリー */}
        <section className="py-8 sm:py-12 md:py-16 mb-8 sm:mb-12 md:mb-16">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-gray-800">釣り用品カテゴリー</h3>
            <p className="text-sm sm:text-base text-gray-600">よく取引されている釣り用品をチェック</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {CATEGORIES.map((category) => (
              <Link key={category.id} href={`/product-list?category=${category.id}`}>
                <div className="relative rounded-xl sm:rounded-2xl shadow-lg overflow-hidden group cursor-pointer h-40 sm:h-48 md:h-56 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#4FC3F7] before:to-[#29B6F6] before:scale-x-0 before:transition-transform before:duration-300 before:shadow-lg before:z-20 hover:before:scale-x-100">
                  {/* 背景画像 */}
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-300 z-0"
                  />

                  {/* グラデーションオーバーレイ（下部を暗く） */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>

                  {/* テキストコンテンツ */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 z-10">
                    <h4 className="text-white text-sm sm:text-base md:text-lg font-bold mb-0.5 sm:mb-1 drop-shadow-lg">
                      {category.name}
                    </h4>
                    <p className="text-white/90 text-xs sm:text-sm drop-shadow-md">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 最新の出品 */}
        <section className="py-8 sm:py-12 md:py-16 mb-8 sm:mb-12 md:mb-16">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-gray-800">最新の出品釣り用品</h3>
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
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-gray-800">釣り人のためのコミュニティ</h3>
            <p className="text-sm sm:text-base text-gray-600">釣り用品の取引から情報交換まで</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            <Link href="/post-list">
              <div className="relative rounded-xl sm:rounded-2xl shadow-lg overflow-hidden group cursor-pointer h-48 sm:h-56 md:h-64 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#4FC3F7] before:to-[#29B6F6] before:scale-x-0 before:transition-transform before:duration-300 before:shadow-lg before:z-20 hover:before:scale-x-100">
                {/* 背景画像 */}
                <Image
                  src="/community/釣果.webp"
                  alt="釣果情報"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300 z-0"
                />
                {/* グラデーションオーバーレイ（下部を暗く） */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
                {/* テキストコンテンツ */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 z-10">
                  <h4 className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 drop-shadow-lg">釣果情報</h4>
                  <p className="text-white/90 text-sm sm:text-base drop-shadow-md">みんなの釣行記録をチェック</p>
                </div>
              </div>
            </Link>
            <Link href="/map">
              <div className="relative rounded-xl sm:rounded-2xl shadow-lg overflow-hidden group cursor-pointer h-48 sm:h-56 md:h-64 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#4FC3F7] before:to-[#29B6F6] before:scale-x-0 before:transition-transform before:duration-300 before:shadow-lg before:z-20 hover:before:scale-x-100">
                {/* 背景画像 */}
                <Image
                  src="/community/釣り場.webp"
                  alt="釣り場情報共有"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300 z-0"
                />
                {/* グラデーションオーバーレイ（下部を暗く） */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
                {/* テキストコンテンツ */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 z-10">
                  <h4 className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 drop-shadow-lg">釣り場情報共有</h4>
                  <p className="text-white/90 text-sm sm:text-base drop-shadow-md">地域の情報をシェア</p>
                </div>
              </div>
            </Link>
            <Link href="/community">
              <div className="relative rounded-xl sm:rounded-2xl shadow-lg overflow-hidden group cursor-pointer h-48 sm:h-56 md:h-64 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#4FC3F7] before:to-[#29B6F6] before:scale-x-0 before:transition-transform before:duration-300 before:shadow-lg before:z-20 hover:before:scale-x-100">
                {/* 背景画像 */}
                <Image
                  src="/community/釣り仲間.webp"
                  alt="釣り仲間と交流"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300 z-0"
                />
                {/* グラデーションオーバーレイ（下部を暗く） */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
                {/* テキストコンテンツ */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 z-10">
                  <h4 className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 drop-shadow-lg">釣り仲間と交流</h4>
                  <p className="text-white/90 text-sm sm:text-base drop-shadow-md">近くの釣り人との情報交換</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* CTA セクション */}
        {!user ? (
          // 未ログインユーザー向け：参加を促すCTA
          <section className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-12 sm:py-16 md:py-20 rounded-2xl sm:rounded-3xl text-center mb-6 sm:mb-8 md:mb-10 relative overflow-hidden before:absolute before:top-[-50%] before:left-[-50%] before:w-[200%] before:h-[200%] before:bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] before:animate-[spin_20s_linear_infinite]">
            <div className="relative z-10 px-4">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5">釣り人のコミュニティに参加しよう</h3>
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
          <section className="text-white py-12 sm:py-16 md:py-20 rounded-2xl sm:rounded-3xl text-center mb-6 sm:mb-8 md:mb-10 relative overflow-hidden">
            {/* 背景画像 */}
            <div className="absolute inset-0">
              <Image
                src="/back/sea.webp"
                alt="海の風景"
                fill
                sizes="100vw"
                className="object-cover"
              />
              {/* グラデーションオーバーレイ */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#2FA3E3]/75 to-[#007bff]/75"></div>
              <div className="absolute inset-0 bg-[#2FA3E3]/10"></div>
            </div>
            {/* アニメーション効果 */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] animate-[spin_20s_linear_infinite] z-10"></div>
            <div className="relative z-20 px-4">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5">もっと釣りを楽しもう！</h3>
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
