import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/v2', '/login', '/register', '/forgot-password', '/terms', '/privacy', '/privacy-policy', '/terms-of-service', '/demo', '/manifest.json'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

// Admin routes have their own authentication
const adminRoutes = ['/admin'];

// System routes that should never be treated as public booking slugs
const systemRoutes = ['/dashboard', '/admin', '/api', '/_next', '/v2', '/login', '/register', '/forgot-password', '/terms', '/privacy', '/privacy-policy', '/terms-of-service', '/demo', '/public', '/manifest.json'];

/**
 * Check if a pathname is a potential public booking slug
 * A valid slug: single segment path (e.g., /stefaniamakke), not a system route
 */
function isPublicBookingSlug(pathname: string): boolean {
    // Must start with /
    if (!pathname.startsWith('/')) return false;
    
    // Remove leading slash and check if it's a single segment (no additional slashes)
    const segment = pathname.slice(1);
    if (!segment || segment.includes('/')) return false;
    
    // Must not be a system route
    const isSystemRoute = systemRoutes.some(route => 
        pathname === route || pathname.startsWith(route + '/')
    );
    if (isSystemRoute) return false;
    
    // Valid slug pattern: alphanumeric, hyphens, underscores (2-50 chars)
    const slugPattern = /^[a-zA-Z0-9_-]{2,50}$/;
    return slugPattern.test(segment);
}

function looksLikeJwt(token: string): boolean {
    return token.split('.').length === 3;
}

function decodeBase64Url(base64Url: string): string {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return atob(padded);
}

function isExpiredJwt(token: string, skewSeconds = 30): boolean {
    if (!looksLikeJwt(token)) return false;

    try {
        const payloadRaw = token.split('.')[1];
        if (!payloadRaw) return true;
        const payload = JSON.parse(decodeBase64Url(payloadRaw)) as { exp?: number };
        if (typeof payload.exp !== 'number') return true;

        const nowInSeconds = Math.floor(Date.now() / 1000);
        return payload.exp <= nowInSeconds + skewSeconds;
    } catch {
        return true;
    }
}

function clearAuthCookies(response: NextResponse): void {
    response.cookies.set('ritmo_access_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('ritmo_refresh_token', '', { path: '/', maxAge: 0 });
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from cookies (localStorage isn't available in middleware)
    const token = request.cookies.get('ritmo_access_token')?.value;
    const tokenExpired = !!token && isExpiredJwt(token);
    const isAuthenticated = !!token && !tokenExpired;

    // Check if this is a public booking slug (e.g., /stefaniamakke)
    const isBookingSlug = isPublicBookingSlug(pathname);

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith('/public')
    ) || isBookingSlug;

    // Check if current route is an auth route (login, register)
    const isAuthRoute = authRoutes.some(route => pathname === route);

    // Check if current route is admin (has its own auth)
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    // Admin routes bypass normal auth
    if (isAdminRoute) {
        return NextResponse.next();
    }

    // If authenticated and trying to access auth routes, redirect to dashboard
    if (isAuthenticated && isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If not authenticated and trying to access protected routes
    if (!isAuthenticated && !isPublicRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(loginUrl);
        if (tokenExpired) {
            clearAuthCookies(response);
        }
        return response;
    }

    if (tokenExpired) {
        const response = NextResponse.next();
        clearAuthCookies(response);
        return response;
    }

    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes
         */
        '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
    ],
};
