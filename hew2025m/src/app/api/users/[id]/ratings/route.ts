// src/app/api/users/[id]/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Firestoreから評価データを取得
    const ratingsQuery = query(
      collection(db, 'ratings'),
      where('ratedUserId', '==', userId)
    );

    const snapshot = await getDocs(ratingsQuery);
    const ratingsData = await Promise.all(
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
          ratedUserId: ratingData.ratedUserId,
          raterUserId: ratingData.raterUserId,
          rating: ratingData.rating,
          comment: ratingData.comment,
          createdAt: ratingData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          raterName,
          raterPhotoURL,
        };
      })
    );

    // 評価を新しい順にソート
    ratingsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      ratings: ratingsData
    });

  } catch (error) {
    console.error('Get user ratings error:', error);
    return NextResponse.json({
      error: 'Failed to fetch user ratings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
