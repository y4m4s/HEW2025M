import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { adminDb } from '@/lib/firebase-admin';

interface RatingDoc {
  ratedUserId: string;
  raterUserId: string;
  rating: number;
  comment: string;
  createdAt: FirebaseFirestore.Timestamp;
}

interface RatingWithUser {
  id: string;
  raterName: string;
  raterPhotoURL: string;
  ratedUserId: string;
  raterUserId: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO string
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const ratingsQuery = query(
      collection(adminDb, 'ratings'),
      where('ratedUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const ratingsSnapshot = await getDocs(ratingsQuery);

    if (ratingsSnapshot.empty) {
      return NextResponse.json({ ratings: [] }, { status: 200 });
    }

    const ratings: RatingWithUser[] = await Promise.all(
      ratingsSnapshot.docs.map(async (ratingDoc) => {
        const ratingData = ratingDoc.data() as RatingDoc;
        const raterId = ratingData.raterUserId;

        const userRef = doc(adminDb, 'users', raterId);
        const userSnap = await getDoc(userRef);

        let raterName = '名無しさん';
        let raterPhotoURL = '/avatars/default.png'; 

        if (userSnap.exists()) {
          const userData = userSnap.data();
          raterName = userData.displayName || '名無しさん';
          raterPhotoURL = userData.photoURL || '/avatars/default.png';
        }

        return {
          id: ratingDoc.id,
          ...ratingData,
          createdAt: ratingData.createdAt.toDate().toISOString(),
          raterName,
          raterPhotoURL,
        };
      })
    );

    return NextResponse.json({ ratings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
