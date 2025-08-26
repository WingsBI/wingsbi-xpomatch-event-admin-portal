import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear all authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0, // Expire immediately
      path: '/',
    };

    response.cookies.set('auth-token', '', cookieOptions);
    response.cookies.set('refresh-token', '', cookieOptions);
    response.cookies.set('user-data', '', {
      ...cookieOptions,
      httpOnly: false,
    });
    response.cookies.set('event-identifier', '', cookieOptions);
    response.cookies.set('user-role', '', cookieOptions);
    response.cookies.set('user-email', '', cookieOptions);
    // Note: We intentionally don't clear 'login-first-time' cookie as it should persist across sessions

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 