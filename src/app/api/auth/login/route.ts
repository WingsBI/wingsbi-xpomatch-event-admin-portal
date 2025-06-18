import { NextRequest, NextResponse } from 'next/server';
import { User, LoginCredentials, AuthResponse, UserRole } from '@/types/auth';

// Mock user database - replace with your actual database integration
const mockUsers: Record<string, User & { password: string; userId: string }> = {
  'admin': {
    id: '1',
    email: 'admin@event.com',
    userId: 'admin',
    password: 'admin123',
    firstName: 'John',
    lastName: 'Admin',
    role: 'event-admin',
    eventId: 'EVT001',
    permissions: ['manage_events', 'manage_users', 'view_analytics'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  'visitor': {
    id: '2',
    email: 'visitor@event.com',
    userId: 'visitor',
    password: 'visitor123',
    firstName: 'Jane',
    lastName: 'Visitor',
    role: 'visitor',
    eventId: 'EVT001',
    permissions: ['view_events', 'join_sessions'],
    createdAt: '2024-01-01T00:00:00Z',
  },
  'exhibitor': {
    id: '3',
    email: 'exhibitor@event.com',
    userId: 'exhibitor',
    password: 'exhibitor123',
    firstName: 'Mike',
    lastName: 'Exhibitor',
    role: 'exhibitor',
    eventId: 'EVT001',
    permissions: ['manage_booth', 'view_visitors', 'upload_materials'],
    createdAt: '2024-01-01T00:00:00Z',
  },
};

export async function POST(request: NextRequest) {
  try {
    const credentials: LoginCredentials = await request.json();
    const { email, password, eventId, role } = credentials;

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required',
      } as AuthResponse);
    }

    // Accept any email/password combination
    // Create a user based on the provided email and selected role
    const user: User = {
      id: Math.random().toString(36).substr(2, 9), // Generate random ID
      email: email,
      firstName: 'User',
      lastName: 'Demo',
      role: role || 'event-admin', // Use selected role or default to event-admin
      eventId: eventId || 'EVT001',
      permissions: ['manage_events', 'manage_users', 'view_analytics', 'view_events', 'join_sessions', 'manage_booth', 'view_visitors', 'upload_materials'],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Generate tokens (in real implementation, use proper JWT)
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return NextResponse.json({
      success: true,
      user: user,
      token,
      refreshToken,
      message: `Login successful as ${role || 'event-admin'}`,
    } as AuthResponse);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as AuthResponse, { status: 500 });
  }
}

// Mock token generation - replace with proper JWT implementation
function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    eventId: user.eventId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };
  
  // In real implementation, use JWT library
  return `token_${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
}

function generateRefreshToken(user: User): string {
  const payload = {
    userId: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };
  
  return `refresh_${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
} 