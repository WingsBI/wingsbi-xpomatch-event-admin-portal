// Authentication API service for Azure backend
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export interface LoginCredentials {
  email: string;
  password: string;
  identifier: string;
  eventId?: string;
  role?: string;
}

export interface JWTPayload {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  eventId?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'it-admin' | 'event-admin' | 'exhibitor' | 'visitor';
      eventId?: string;
      avatar?: string;
      createdAt: string;
    };
    token: string;
    refreshToken?: string;
  };
  message?: string;
  error?: string;
}

class AuthApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('Auth API Service initialized with base URL:', this.baseURL);
  }

  // Decode JWT token to extract user information
  private decodeJWT(token: string): JWTPayload | null {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      console.log('Decoded JWT payload:', decoded);
      return decoded;
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  // Map numeric role IDs to string literals
  private mapRoleToString(role: string | number, roleName?: string): 'it-admin' | 'event-admin' | 'exhibitor' | 'visitor' {
    // First try to map by roleName if available
    if (roleName) {
      switch (roleName.toLowerCase()) {
        case 'visitor':
          return 'visitor';
        case 'exhibitor':
          return 'exhibitor';
        case 'event-admin':
        case 'eventadmin':
          return 'event-admin';
        case 'it-admin':
        case 'itadmin':
          return 'it-admin';
      }
    }

    // Fallback to numeric role mapping
    switch (role.toString()) {
      case '1':
        return 'it-admin';
      case '2':
        return 'event-admin';
      case '3':
        return 'exhibitor';
      case '4':
        return 'visitor';
      default:
        // If it's already a string literal, return as is
        if (['it-admin', 'event-admin', 'exhibitor', 'visitor'].includes(role as string)) {
          return role as 'it-admin' | 'event-admin' | 'exhibitor' | 'visitor';
        }
        return 'event-admin'; // Default fallback
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Using the correct API path format: /api/{identifier}/Auth/login (capital A)
      const apiUrl = `${this.baseURL}/api/${credentials.identifier}/Auth/login`;
      
      console.log('Attempting login with Azure API:', {
        url: apiUrl,
        email: credentials.email
      });

      const payload = {
        email: credentials.email,
        password: credentials.password
      };

      console.log('Login payload:', payload);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Login response data:', data);

      // Check for your specific backend response format
      if (!response.ok || !data.result || !data.result.token) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}: Login failed`,
          message: data.message || 'Authentication failed'
        };
      }

      // Extract JWT token from response.result
      const jwtToken = data.result.token;
      const refreshToken = data.result.refreshToken;

      if (!jwtToken) {
        return {
          success: false,
          error: 'No JWT token received from server',
          message: 'Invalid server response'
        };
      }

      // Decode JWT to extract user information
      const jwtPayload = this.decodeJWT(jwtToken);
      
      // Extract user information from JWT payload
      const userId = jwtPayload?.id || '1';
      const userEmail = jwtPayload?.email || credentials.email;
      const firstName = jwtPayload?.firstName || '';
      const lastName = jwtPayload?.lastName || '';
      const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName || userEmail.split('@')[0];
      const userRole = this.mapRoleToString(jwtPayload?.role || jwtPayload?.roleid || '2', jwtPayload?.roleName);
      const eventId = jwtPayload?.eventId || credentials.identifier;

      return {
        success: true,
        data: {
          user: {
            id: userId,
            email: userEmail,
            firstName: firstName || 'Unknown',
            lastName: lastName || 'User',
            role: userRole,
            eventId: eventId,
            avatar: jwtPayload?.avatar,
            createdAt: new Date().toISOString(),
          },
          token: jwtToken,
          refreshToken: refreshToken,
        },
        message: data.message || 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to connect to authentication service'
      };
    }
  }

  async logout(identifier: string, token?: string): Promise<boolean> {
    try {
      const apiUrl = `${this.baseURL}/api/${identifier}/Auth/logout`;
      
      console.log('Attempting logout with Azure API:', {
        url: apiUrl
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      console.log('Logout response status:', response.status);
      
      // If the logout endpoint doesn't exist (404), we still consider it successful
      // since we'll clear the local storage anyway
      if (response.status === 404) {
        console.log('Logout endpoint not found (404), but clearing local session');
        return true;
      }
      
      return response.ok;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, we still want to clear local state
      return true;
    }
  }

  async refreshToken(identifier: string, refreshToken: string): Promise<AuthResponse> {
    try {
      const apiUrl = `${this.baseURL}/api/${identifier}/Auth/refresh`;
      
      console.log('Attempting token refresh with Azure API:', {
        url: apiUrl
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      const data = await response.json();
      console.log('Token refresh response:', { status: response.status, data });

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Token refresh failed',
          message: data.message || 'Failed to refresh authentication'
        };
      }

      const newToken = data.token || data.accessToken;
      const newRefreshToken = data.refreshToken || data.refresh_token;
      
      if (!newToken) {
        return {
          success: false,
          error: 'No new token received',
          message: 'Invalid refresh response'
        };
      }

      // Decode new JWT token
      const jwtPayload = this.decodeJWT(newToken);

      return {
        success: true,
        data: {
          user: {
            id: jwtPayload?.sub || data.userId || '1',
            email: jwtPayload?.email || data.email,
            firstName: jwtPayload?.firstName || 'Unknown',
            lastName: jwtPayload?.lastName || 'User',
            role: this.mapRoleToString(jwtPayload?.role || data.role || '2', jwtPayload?.roleName || data.roleName),
            eventId: jwtPayload?.eventId || data.eventId,
            avatar: jwtPayload?.avatar || data.avatar,
            createdAt: new Date().toISOString(),
          },
          token: newToken,
          refreshToken: newRefreshToken,
        },
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to refresh token'
      };
    }
  }

  async validateToken(identifier: string, token: string): Promise<boolean> {
    try {
      const apiUrl = `${this.baseURL}/api/${identifier}/Auth/validate`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Helper method to check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeJWT(token);
      if (!payload?.exp) return true;
      
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

export const authApi = new AuthApiService();
export default authApi; 