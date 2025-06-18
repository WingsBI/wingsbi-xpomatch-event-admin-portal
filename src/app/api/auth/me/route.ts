import { NextRequest, NextResponse } from 'next/server';
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
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Validate and decode token
    const user = validateToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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