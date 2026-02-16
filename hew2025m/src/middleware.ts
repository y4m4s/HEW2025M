import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証が必要なページ
const PROTECTED_PATHS = [
  '/sell',
  '/cart',
  '/pay',
  '/pay-check',
  '/post',
  '/message',
  '/notification',
  '/settings',
];

// 既にログイン済みなら遷移させないページ
const AUTH_PATHS = ['/login', '/register'];

// username設定が必須でないページ（認証済みでもアクセス可能）
const ALLOWED_WITHOUT_USERNAME = ['/setup-username', '/login', '/register', '/api'];

/**
 * セッションCookieをAPIで検証（EdgeではAdmin SDKが使えないため）
 */
async function verifySessionCookie(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get('__session')?.value;
  if (!sessionCookie) return false;

  try {
    const verifyUrl = new URL('/api/auth/session', request.url);
    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        cookie: `__session=${sessionCookie}`,
      },
      cache: 'no-store',
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * ユーザーがusernameを設定済みか確認
 */
async function checkUsername(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get('__session')?.value;
  if (!sessionCookie) return false;

  try {
    const checkUrl = new URL('/api/auth/check-username', request.url);
    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        cookie: `__session=${sessionCookie}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.hasUsername;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // username設定が必須でないページかチェック
  const isAllowedWithoutUsername = ALLOWED_WITHOUT_USERNAME.some(path => pathname.startsWith(path));

  // 対象パスの判定
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path));

  // 認証確認が必要なパスかどうか
  const needsAuthCheck = isProtectedPath || isAuthPath || !isAllowedWithoutUsername;

  // Firebase Auth セッションCookieの確認（必要な場合のみ）
  const isAuthenticated = needsAuthCheck ? await verifySessionCookie(request) : false;

  // === 1. 未認証ユーザーの処理 ===

  // 未ログインで保護されたページにアクセス → ログインへ
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // === 2. 認証済みユーザーの処理 ===

  if (isAuthenticated) {
    // login/registerページにアクセス → username確認してリダイレクト
    if (isAuthPath) {
      const hasUsername = await checkUsername(request);

      if (!hasUsername) {
        // username未設定 → setup-usernameへ
        return NextResponse.redirect(new URL('/setup-username', request.url));
      } else {
        // username設定済み → ホームへ
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // setup-username以外のページでusername未設定 → setup-usernameへ
    if (!isAllowedWithoutUsername && pathname !== '/setup-username') {
      const hasUsername = await checkUsername(request);

      if (!hasUsername) {
        return NextResponse.redirect(new URL('/setup-username', request.url));
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, fonts, images (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|fonts|images).*)',
  ],
};
