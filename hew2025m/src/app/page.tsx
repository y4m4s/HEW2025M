"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard, { Product } from '@/components/ProductCard';
import Button from '@/components/Button';
import { Fish, Search, MapPin, Users, ArrowRight, Circle, Bug, Package, Shirt, Ship, Zap, Info } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // Firestoreからユーザー情報を取得
  const fetchUserProfile = async (sellerId: string) => {
    try {
      const uid = sellerId.startsWith('user-') ? sellerId.replace('user-', '') : sellerId;
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        return {
          displayName: userData.displayName || undefined,
          photoURL: userData.photoURL || undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      return null;
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/products?status=available');
      if (!response.ok) {
        throw new Error('商品の取得に失敗しました');
      }

      const data = await response.json();

      // 最新4件を取得 + Firestoreからユーザー情報取得
      const formattedProducts: Product[] = await Promise.all(
        data.products
          .slice(0, 4)
          .map(async (product: {
            _id: string;
            title: string;
            price: number;
            condition: string;
            images?: string[];
            sellerId?: string;
            sellerName?: string;
            createdAt: string;
          }) => {
            // Firestoreから最新のユーザー情報を取得
            let sellerDisplayName: string = product.sellerName || '出品者未設定';
            let sellerPhotoURL: string | undefined;
            if (product.sellerId) {
              const userProfile = await fetchUserProfile(product.sellerId);
              sellerDisplayName = userProfile?.displayName || product.sellerName || '出品者未設定';
              sellerPhotoURL = userProfile?.photoURL;
            }

            return {
              id: product._id,
              name: product.title,
              price: product.price,
              location: sellerDisplayName,
              condition: formatCondition(product.condition),
              postedDate: formatDate(product.createdAt),
              imageUrl: product.images?.[0],
              sellerPhotoURL,
            };
          })
      );

      setFeaturedProducts(formattedProducts);
    } catch (err) {
      console.error('商品取得エラー:', err);
      // エラー時は空配列を設定（エラー表示はせず、商品なしの状態にする）
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 状態を日本語に変換
  const formatCondition = (cond: string): string => {
    const conditionMap: Record<string, string> = {
      'new': '新品・未使用',
      'like-new': '未使用に近い',
      'good': '目立った傷汚れなし',
      'fair': 'やや傷や汚れあり',
      'poor': '傷や汚れあり'
    };
    return conditionMap[cond] || cond;
  };

  // 日付をフォーマット
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今日';
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

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
                <Button href="/sell" variant="primary" size="lg" className="bg-white text-[#2FA3E3] hover:shadow-xl" icon={<Fish size={20} />}>
                  釣り用品を出品
                </Button>
                <Button href="/productList" variant="outline" size="lg" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#2FA3E3]" icon={<Search size={20} />}>
                  用品を探す
                </Button>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* ロッド/竿 */}
            <Link href="/productList?category=rod">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Fish size={28} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ロッド/竿</h4>
                <p className="text-gray-600 text-sm mb-3">海釣り・川釣り用</p>
              </div>
            </Link>

            {/* リール */}
            <Link href="/productList?category=reel">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Circle size={28} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>リール</h4>
                <p className="text-gray-600 text-sm mb-3">スピニング・ベイト</p>
              </div>
            </Link>

            {/* ルアー */}
            <Link href="/productList?category=lure">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Bug size={28} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ルアー</h4>
                <p className="text-gray-600 text-sm mb-3">ハード・ソフト</p>
              </div>
            </Link>

            {/* ライン/糸 */}
            <Link href="/productList?category=line">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Zap size={28} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ライン/糸</h4>
                <p className="text-gray-600 text-sm mb-3">各種ライン</p>
              </div>
            </Link>

            {/* ハリ/針 */}
            <Link href="/productList?category=hook">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Search size={28} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ハリ/針</h4>
                <p className="text-gray-600 text-sm mb-3">各種フック</p>
              </div>
            </Link>

            {/* 餌 */}
            <Link href="/productList?category=bait">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Fish size={28} className="rotate-45" />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>餌</h4>
                <p className="text-gray-600 text-sm mb-3">生餌・練り餌</p>
              </div>
            </Link>

            {/* ウェア */}
            <Link href="/productList?category=wear">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Shirt size={28} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>ウェア</h4>
                <p className="text-gray-600 text-sm mb-3">服・装備品</p>
              </div>
            </Link>

            {/* セット用品 */}
            <Link href="/productList?category=set">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Package size={28} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>セット用品</h4>
                <p className="text-gray-600 text-sm mb-3">まとめてお得</p>
              </div>
            </Link>

            {/* サービス */}
            <Link href="/productList?category=service">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Users size={28} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>サービス</h4>
                <p className="text-gray-600 text-sm mb-3">ガイド・修理</p>
              </div>
            </Link>

            {/* その他 */}
            <Link href="/productList?category=other">
              <div className="bg-white p-6 rounded-2xl shadow-lg transition-all duration-300 text-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl cursor-pointer before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#2FA3E3] before:to-[#007bff] before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2FA3E3] to-[#007bff] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Info size={28} />
                </div>
                <h4 className="text-lg font-bold mb-2 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>その他</h4>
                <p className="text-gray-600 text-sm mb-3">その他の用品</p>
              </div>
            </Link>
          </div>
        </section>

        {/* 最新の出品 */}
        <section className="py-16 mb-16">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold mb-3 text-gray-800" style={{fontFamily: "せのびゴシック, sans-serif"}}>最新の出品釣り用品</h3>
            <p className="text-base text-gray-600">新しく出品された注目の釣り用品</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA3E3]"></div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-20">
              <Fish className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600 text-lg mb-4">まだ商品が出品されていません</p>
              <Button href="/sell" variant="primary" size="md" icon={<Fish size={18} />}>
                最初の商品を出品する
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="featured" />
                ))}
              </div>
              <div className="text-center">
                <Button href="/productList" variant="primary" size="lg" icon={<ArrowRight size={20} />}>
                  すべての商品を見る
                </Button>
              </div>
            </>
          )}
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
              <Button href="/register" variant="primary" size="lg" className="py-5 px-9" icon={<Fish size={20} />}>
                釣り人として参加
              </Button>
              <Button href="/productList" variant="outline" size="lg" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-gray-700 py-5 px-9" icon={<Search size={20} />}>
                釣り用品を探す
              </Button>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}