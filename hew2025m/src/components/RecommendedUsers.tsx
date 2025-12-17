"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, User as UserIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";

interface RecommendedUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalRatings: number;
  ratingSum: number;
  averageRating: number;
}

export default function RecommendedUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<RecommendedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRecommendedUsers = async () => {
    try {
      setLoading(true);

      // 全ユーザーを取得（複合インデックス不要）
      const usersQuery = query(collection(db, "users"));
      const snapshot = await getDocs(usersQuery);

      const usersData: RecommendedUser[] = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          const totalRatings = data.totalRatings || 0;
          const ratingSum = data.ratingSum || 0;
          const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;

          return {
            uid: doc.id,
            displayName: data.displayName || "名無しユーザー",
            photoURL: data.photoURL,
            totalRatings,
            ratingSum,
            averageRating,
          };
        })
        // 評価を受けたユーザーのみをフィルタ、かつログイン中のユーザーを除外
        .filter((u) => u.totalRatings > 0 && u.uid !== user?.uid);

      // 平均評価でソートし、上位3人を取得
      const sortedUsers = usersData
        .sort((a, b) => {
          // 平均評価が高い順
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          // 平均評価が同じ場合は評価数が多い順
          return b.totalRatings - a.totalRatings;
        })
        .slice(0, 3);

      setUsers(sortedUsers);
    } catch (error) {
      // permission-deniedエラーの場合は静かに処理（ログアウト時など）
      if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
        // エラーを静かに処理
      } else {
        console.error("おすすめユーザーの取得エラー:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center text-gray-500 border border-gray-100">
        <p className="text-sm">評価されたユーザーがまだいません</p>
        <p className="text-xs text-gray-400 mt-1">取引を行って評価をもらうと表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user, index) => (
        <Link
          key={user.uid}
          href={`/profile/${user.uid}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200 group"
        >
          {/* ランキング番号 */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
            {index + 1}
          </div>

          {/* プロフィール画像 */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={20} className="text-gray-400" />
            )}
          </div>

          {/* ユーザー情報 */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 truncate group-hover:text-purple-600 transition-colors">
              {user.displayName}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{user.averageRating.toFixed(1)}</span>
              <span className="text-gray-400">({user.totalRatings})</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
