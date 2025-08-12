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
      'https://xpomatch-dev-event-admin-portal.azurewebsites.net',
      'https://xpomatch-test-event-admin-portal.azurewebsites.net'
    ];

    // Allow all origins for test environment or if origin is in allowed list
    if (process.env.NODE_ENV === 'production' && origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      // For test and development environments, be more permissive
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');

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
                          pathname.includes('/profile') ||
                          pathname.includes('/favourites') ||
                          pathname.includes('/meetings');

  if (isProtectedRoute) {
    const authToken = request.cookies.get('auth-token');
    
    // If no auth token and not already on login page, redirect to the single base login page
    if (!authToken && !pathname.includes('/login')) {
      const identifier = pathname.split('/')[1]; // Extract identifier from path
      const loginUrl = new URL(`/${identifier}`, request.url);
      
      // Add redirect parameter to return user to original page after login
      loginUrl.searchParams.set('redirect', pathname);
      
      console.log(`No auth token found for protected route ${pathname}, redirecting to /${identifier}`);
      return NextResponse.redirect(loginUrl);
    }

    // If token exists but user is on login page, validate token first
    if (authToken && pathname.includes('/login')) {
      // Let the client-side validation handle this case
      // Don't automatically redirect here as the token might be invalid
      console.log(`Auth token found but user on login page: ${pathname}`);
      return NextResponse.next();
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