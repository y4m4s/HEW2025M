"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fish } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Bookmark {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  createdAt: string;
}

interface ProfBookmarkProps {
  onCountChange?: (count: number) => void;
}

export default function ProfBookmark({ onCountChange }: ProfBookmarkProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
        const bookmarksSnap = await getDocs(bookmarksRef);

        const bookmarkList: Bookmark[] = [];
        bookmarksSnap.forEach((doc) => {
          bookmarkList.push({
            id: doc.id,
            ...doc.data() as Omit<Bookmark, 'id'>
          });
        });

        // 作成日時の降順でソート
        bookmarkList.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setBookmarks(bookmarkList);

        // 親コンポーネントにブックマーク数を通知
        if (onCountChange) {
          onCountChange(bookmarkList.length);
        }
      } catch (error) {
        console.error("ブックマーク取得エラー:", error);
        setBookmarks([]);
        if (onCountChange) {
          onCountChange(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user, onCountChange]);

  const handleProductClick = (productId: string) => {
    router.push(`/productDetail/${productId}`);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="p-6 text-center">
        <Fish size={64} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">ブックマークした商品がありません</p>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
          onClick={() => handleProductClick(bookmark.productId)}
        >
          <div className="h-36 bg-gray-200 flex items-center justify-center overflow-hidden">
            {bookmark.image ? (
              <Image
                src={bookmark.image}
                alt={bookmark.title}
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : (
              <Fish className="text-gray-400" />
            )}
          </div>
          <div className="p-3 text-sm">
            <p className="font-medium truncate">{bookmark.title}</p>
            <p className="text-lg font-bold text-[#2FA3E3]">¥{bookmark.price.toLocaleString()}</p>
            <p className="text-xs text-gray-500">ブックマーク済み</p>
          </div>
        </div>
      ))}
    </div>
  );
}
