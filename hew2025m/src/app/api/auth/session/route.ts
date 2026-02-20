import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

/**
 * セッションCookieを作成するAPIエンドポイント
 * Firebase AuthenticationのIDトークンからセッションCookieを生成し、HTTPOnly Cookieとして設定する
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'IDトークンが必要です' },
        { status: 400 }
      );
    }

    // IDトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // セッションCookieの有効期限（14日間）
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds

    // セッションCookieを作成
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Cookieを設定
    const cookieStore = await cookies();
    cookieStore.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000, // seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json(
      {
        success: true,
        uid: decodedToken.uid,
        expiresIn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session API error:', error);

    return NextResponse.json(
      { error: 'セッションCookieの作成に失敗しました' },
      { status: 401 }
    );
  }
}

/**
 * セッションCookieの検証API
 * Middleware(Edge)からの検証用に使用
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    return NextResponse.json(
      {
        authenticated: true,
        uid: decoded.uid,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}

/**
 * セッションCookieを削除するAPIエンドポイント（ログアウト用）
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('__session');

    return NextResponse.json(
      { success: true, message: 'ログアウトしました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('ログアウトエラー:', error);

    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    );
  }
}
