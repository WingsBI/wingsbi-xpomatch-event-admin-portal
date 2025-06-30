import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { User } from '@/types/auth';

// Mock user database - same as login route
const mockUsers: Record<string, User> = {
  '1': {
    id: '1',
    email: 'admin@event.com',
    firstName: 'John',
    lastName: 'Admin',
    role: 'event-admin',
    eventId: 'EVT001',
    permissions: ['manage_events', 'manage_users', 'view_analytics'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  '2': {
    id: '2',
    email: 'visitor@event.com',
    firstName: 'Jane',
    lastName: 'Visitor',
    role: 'visitor',
    eventId: 'EVT001',
    permissions: ['view_events', 'join_sessions'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  '3': {
    id: '3',
    email: 'exhibitor@event.com',
    firstName: 'Mike',
    lastName: 'Exhibitor',
    role: 'exhibitor',
    eventId: 'EVT001',
    permissions: ['manage_booth', 'view_visitors', 'upload_materials'],
    createdAt: '2024-01-01T00:00:00Z',
  },
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    const userDataCookie = cookieStore.get('user-data')?.value;

    if (!token || !userDataCookie) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Validate token (in real implementation, verify JWT signature)
    if (!token.startsWith('token_')) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 401 }
      );
    }

    try {
      // Decode token payload
      const tokenData = token.replace('token_', '');
      const payload = JSON.parse(Buffer.from(tokenData, 'base64').toString());
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        return NextResponse.json(
          { success: false, error: 'Token expired' },
          { status: 401 }
        );
      }

      // Parse user data
      const userData: User = JSON.parse(userDataCookie);

      return NextResponse.json({
        success: true,
        user: userData,
        token: token
      });

    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or user data' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock token validation - replace with proper JWT implementation
function validateToken(token: string): User | null {
  try {
    if (!token.startsWith('token_')) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(token.substring(6), 'base64').toString()
    );

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Get user data
    const user = mockUsers[payload.userId];
    if (!user) {
      return null;
    }

    return {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
} 