import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, documentId } from 'firebase/firestore';

// Tipos para clareza
interface Rating {
  id: string;
  ratedUserId: string;
  raterUserId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface UserData {
  displayName: string;
  photoURL: string;
}

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // 1. Buscar todas as avaliações para o usuário alvo
    const ratingsQuery = query(collection(db, 'ratings'), where('ratedUserId', '==', userId));
    const ratingsSnapshot = await getDocs(ratingsQuery);
    const ratingsData = ratingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Rating[];

    if (ratingsData.length === 0) {
      return NextResponse.json({ ratings: [], averageRating: 0, totalRatings: 0 });
    }

    // 2. Coletar todos os IDs dos avaliadores (sem duplicatas)
    const raterIds = [...new Set(ratingsData.map(r => r.raterUserId).filter(id => id))];

    // Firestoreの'in'クエリは30個の要素の制限があるため、配列をチャンクに分割します。
    // また、空の配列を渡すとエラーになるため、そのケースも処理します。
    if (raterIds.length === 0) {
      // 評価は存在するが、評価者のIDがない場合。ユーザー情報なしで評価を返す。
      const ratingsWithUser = ratingsData.map(rating => ({
        ...rating,
        raterName: '名無しユーザー',
        raterPhotoURL: '',
      })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return NextResponse.json({ ratings: ratingsWithUser });
    }

    const usersMap = new Map<string, UserData>();
    const CHUNK_SIZE = 30;

    // raterIdsをチャンクに分割し、並行してユーザー情報を取得します。
    const chunks: string[][] = [];
    for (let i = 0; i < raterIds.length; i += CHUNK_SIZE) {
      chunks.push(raterIds.slice(i, i + CHUNK_SIZE));
    }

    const fetchPromises = chunks.map(chunk => {
      const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', chunk));
      return getDocs(usersQuery);
    });

    const snapshots = await Promise.all(fetchPromises);

    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        usersMap.set(doc.id, {
          displayName: doc.data().displayName || '名無しユーザー',
          photoURL: doc.data().photoURL || '',
        });
      });
    });

    // 4. Combinar os dados das avaliações com os dados dos usuários
    const ratingsWithUser = ratingsData.map(rating => ({
      ...rating,
      raterName: usersMap.get(rating.raterUserId)?.displayName || '名無しユーザー',
      raterPhotoURL: usersMap.get(rating.raterUserId)?.photoURL || '',
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Ordenar por data

    return NextResponse.json({ ratings: ratingsWithUser });
  } catch (error) {
    console.error('Error fetching ratings with user data:', error);
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
}