import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

function isValidUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 15 && USERNAME_PATTERN.test(username);
}

async function getCurrentUserUsernameStatus(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.json(
      { hasUsername: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const username = userDoc.data()?.username;
    const hasUsername = typeof username === 'string' && username.trim().length > 0;

    return NextResponse.json({
      hasUsername,
      username: hasUsername ? username : null,
    });
  } catch (error) {
    console.error('Session verification failed in check-username:', error);
    return NextResponse.json(
      { hasUsername: false, error: 'Invalid session' },
      { status: 401 }
    );
  }
}

export async function GET(request: NextRequest) {
  const usernameParam = request.nextUrl.searchParams.get('username');

  if (!usernameParam) {
    return getCurrentUserUsernameStatus(request);
  }

  const username = usernameParam.trim().toLowerCase();

  if (!isValidUsername(username)) {
    return NextResponse.json(
      { available: false, error: 'Invalid username format' },
      { status: 400 }
    );
  }

  try {
    const querySnapshot = await adminDb
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    const available = querySnapshot.empty;

    return NextResponse.json({
      available,
      username,
      message: available ? 'Username is available' : 'Username is already taken',
    });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { available: false, error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
