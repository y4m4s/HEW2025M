import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証が必要なルート
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

// 認証済みユーザーがアクセスすべきでないルート
const AUTH_PATHS = ['/login', '/register'];

/**
 * セッションCookieの基本的な検証
 * Edge Runtimeで動作するため、Firebase Admin SDKは使用できません
 * 完全な検証はAPI Routeで行います
 */
function validateSessionCookie(sessionCookie: string | undefined): boolean {
    if (!sessionCookie) return false;

    // 基本的な形式チェック（JWTは3つのドット区切りパート）
    const parts = sessionCookie.split('.');
    if (parts.length !== 3) return false;

    // 各パートがBase64URLとして有効かチェック
    try {
        for (const part of parts) {
            if (!/^[A-Za-z0-9_-]+$/.test(part)) return false;
        }

        // ペイロード部分をデコードして有効期限をチェック
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(payloadBase64));

        // 有効期限チェック（expクレームがある場合）
        if (payload.exp && typeof payload.exp === 'number') {
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) return false;
        }

        return true;
    } catch {
        return false;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Firebase Auth セッションCookieの検証
    const sessionCookie = request.cookies.get('__session')?.value;
    const isAuthenticated = validateSessionCookie(sessionCookie);

    // 保護されたパスへのアクセスチェック
    const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
    const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path));

    // 未認証ユーザーが保護されたページにアクセスしようとした場合
    if (isProtectedPath && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 認証済みユーザーがログイン/登録ページにアクセスしようとした場合
    if (isAuthPath && isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // セキュリティヘッダーを追加
    const response = NextResponse.next();

    // Referrer-Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy
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
