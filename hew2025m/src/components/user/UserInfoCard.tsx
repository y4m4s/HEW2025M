'use client';

import { useState, useEffect } from 'react';
import { decodeHtmlEntities } from '@/lib/sanitize';
import Link from 'next/link';
import Image from 'next/image';
import { User, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import RatingListModal from './RatingListModal';
import { Button } from '@/components';

interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
}

interface RatingWithUser {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  ratedUserId: string;
  raterUserId: string;
  raterName: string;
  raterPhotoURL: string;
}

interface UserInfoCardProps {
  title: string;
  userProfile: UserProfile | null;
  loading?: boolean;
  fallbackName?: string;
  showRating?: boolean; // 評価を表示するか
}

export default function UserInfoCard({
  title,
  userProfile,
  loading = false,
  fallbackName,
  showRating = false,
}: UserInfoCardProps) {
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratings, setRatings] = useState<RatingWithUser[]>([]);

  // 評価情報を取得
  useEffect(() => {
    if (!showRating || !userProfile?.uid) return;

    const fetchRating = async () => {
      try {
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('ratedUserId', '==', userProfile.uid)
        );

        const snapshot = await getDocs(ratingsQuery);

        // 評価データと評価者情報を取得
        const ratingsWithUsers = await Promise.all(
          snapshot.docs.map(async (ratingDoc) => {
            const ratingData = ratingDoc.data();

            // 評価者の情報を取得
            let raterName = '不明なユーザー';
            let raterPhotoURL = '';

            try {
              const raterDocRef = doc(db, 'users', ratingData.raterUserId);
              const raterDocSnap = await getDoc(raterDocRef);

              if (raterDocSnap.exists()) {
                const raterData = raterDocSnap.data();
                raterName = raterData.displayName || raterData.username || '不明なユーザー';
                raterPhotoURL = raterData.photoURL || '';
              }
            } catch (error) {
              console.error('評価者情報の取得エラー:', error);
            }

            return {
              id: ratingDoc.id,
              rating: ratingData.rating,
              comment: ratingData.comment,
              createdAt: ratingData.createdAt?.toDate?.() || new Date(),
              ratedUserId: ratingData.ratedUserId,
              raterUserId: ratingData.raterUserId,
              raterName,
              raterPhotoURL,
            };
          })
        );

        // 新しい順にソート
        ratingsWithUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRatings(ratingsWithUsers);

        if (ratingsWithUsers.length > 0) {
          const avg = ratingsWithUsers.reduce((sum, r) => sum + r.rating, 0) / ratingsWithUsers.length;
          setAverageRating(Math.round(avg * 10) / 10);
          setTotalRatings(ratingsWithUsers.length);
        } else {
          setAverageRating(0);
          setTotalRatings(0);
        }
      } catch (error) {
        console.error('評価情報の取得エラー:', error);
        setTotalRatings(0);
        setAverageRating(0);
      }
    };

    fetchRating();
  }, [showRating, userProfile?.uid]);


  return (
    <section className="px-4 md:px-6 py-3 md:py-4 mt-6 md:mt-8 bg-white rounded-lg shadow-md overflow-hidden">
      <div>
        <h3 className="text-lg md:text-xl font-bold text-gray-800">{title}</h3>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 md:h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-3 md:h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
            </div>
          </div>
        ) : userProfile ? (
          <div className="flex flex-row gap-4 md:gap-6">
            {/* 左側: ユーザープロフィールカード */}
            <Link href={`/profile/${userProfile.uid}`} className="flex-1">
              <div className="flex items-center justify-center sm:justify-start sm:items-start gap-3 md:gap-4 px-4 h-full rounded-lg bg-white hover:bg-gray-50 border border-transparent hover:border-[#2FA3E3] transition-colors cursor-pointer">
                {/* プロフィール画像 */}
                <div className="p-2 flex-shrink-0 self-center">
                  {userProfile.photoURL ? (
                    <Image
                      src={decodeHtmlEntities(userProfile.photoURL)}
                      alt={userProfile.displayName}
                      width={64}
                      height={64}
                      quality={90}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={32} className="text-gray-600 md:w-10 md:h-10" />
                    </div>
                  )}
                </div>

                {/* 名前とユーザー名 */}
                <div className="flex-shrink-0 self-center">
                  <p className="font-semibold text-lg md:text-xl whitespace-nowrap">
                    {userProfile.displayName}
                  </p>
                  <p className="text-sm md:text-base text-gray-500 whitespace-nowrap">
                    @{userProfile.username}
                  </p>
                </div>

                {/* Bio */}
                {userProfile.bio && (
                  <div className="hidden sm:block flex-1 min-w-0 self-center">
                    <p className="text-xs md:text-sm text-gray-700 break-words-safe whitespace-pre-wrap line-clamp-3">
                      {userProfile.bio}
                    </p>
                  </div>
                )}
              </div>
            </Link>

            {/* 右側: 評価（showRatingがtrueの場合のみ） */}
            {showRating && (
              <div className="flex items-center">
                {/* 評価カード */}
                <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl md:text-4xl font-bold text-gray-800">
                      {averageRating > 0 ? averageRating.toFixed(1) : '---'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={20}
                            className={`${i < Math.round(averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                              } transition-colors`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">{totalRatings}件の評価</p>
                    </div>
                  </div>
                  {/* 評価を見るボタン */}
                  {totalRatings > 0 && (
                    <Button
                      onClick={() => setIsRatingModalOpen(true)}
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                    >
                      評価を見る
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={24} className="text-gray-600 md:w-8 md:h-8" />
            </div>
            <div>
              <p className="font-semibold text-base md:text-lg">{fallbackName || '不明なユーザー'}</p>
              <p className="text-xs md:text-sm text-gray-600">
                {title.includes('出品') ? '出品者' : '投稿者'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 評価一覧モーダル */}
      <RatingListModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        ratings={ratings}
        averageRating={averageRating}
      />
    </section>
  );
}
