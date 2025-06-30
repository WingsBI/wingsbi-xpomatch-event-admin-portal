import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Set CORS headers
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:3000',
      'https://xpomatch-dev-event-admin-portal.azurewebsites.net'
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }

    return response;
  }

  // Check authentication for protected routes
  const isProtectedRoute = pathname.includes('/dashboard') || 
                          pathname.includes('/exhibitors') || 
                          pathname.includes('/visitors') ||
                          pathname.includes('/profile');

  if (isProtectedRoute) {
    const authToken = request.cookies.get('auth-token');
    
    // If no auth token and not already on login page, redirect to login
    if (!authToken && !pathname.includes('/login')) {
      const identifier = pathname.split('/')[1]; // Extract identifier from path
      const loginUrl = new URL(`/${identifier}/auth/event-admin/login`, request.url);
      
      // Add redirect parameter to return user to original page after login
      loginUrl.searchParams.set('redirect', pathname);
      
      return NextResponse.redirect(loginUrl);
    }

    // If token exists but user is on login page, redirect to dashboard
    if (authToken && pathname.includes('/login')) {
      const identifier = pathname.split('/')[1];
      const dashboardUrl = new URL(`/${identifier}/event-admin/dashboard`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 