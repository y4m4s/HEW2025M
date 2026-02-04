import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証が必要なページ
const PROTECTED_PATHS = [
  '/profile',
  '/sell',
  '/cart',
  '/pay',
  '/pay-check',
  '/post',
  '/message',
  '/notification',
];

// 既にログイン済みなら遷移させないページ
const AUTH_PATHS = ['/login', '/register'];

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 対象パスの判定
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path));
  const needsAuthCheck = isProtectedPath || isAuthPath;

  // Firebase Auth セッションCookieの確認（必要な場合のみ）
  const isAuthenticated = needsAuthCheck ? await verifySessionCookie(request) : false;

  // 未ログインならログインへ
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済みならトップへ
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
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
