import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/terms', '/privacy', '/privacy-policy', '/terms-of-service', '/demo'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

// Admin routes have their own authentication
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from cookies (localStorage isn't available in middleware)
    const token = request.cookies.get('ritmo_access_token')?.value;
    const isAuthenticated = !!token;

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith('/public')
    );

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
        return NextResponse.redirect(loginUrl);
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
