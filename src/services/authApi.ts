// Authentication API service for Azure backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export interface LoginCredentials {
  email: string;
  password: string;
  eventId: string;
  role: string;
  identifier: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      role: string;
      eventId?: string;
      name?: string;
      avatar?: string;
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

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Attempting login with Azure API:', {
        url: `${this.baseURL}/api/${credentials.identifier}/auth/login`,
        email: credentials.email,
        role: credentials.role,
        eventId: credentials.eventId
      });

      const response = await fetch(`${this.baseURL}/api/${credentials.identifier}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          eventId: credentials.eventId,
          role: credentials.role,
        }),
      });

      console.log('Login response status:', response.status);

      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Login failed',
          message: data.message || 'Authentication failed'
        };
      }

      return {
        success: true,
        data: {
          user: {
            id: data.user?.id || data.id || '1',
            email: data.user?.email || credentials.email,
            role: data.user?.role || credentials.role,
            eventId: data.user?.eventId || credentials.eventId,
            name: data.user?.name || data.user?.email?.split('@')[0],
            avatar: data.user?.avatar,
          },
          token: data.token || data.accessToken || 'demo-token-' + Date.now(),
          refreshToken: data.refreshToken,
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
      console.log('Attempting logout with Azure API:', {
        url: `${this.baseURL}/api/${identifier}/auth/logout`
      });

      const response = await fetch(`${this.baseURL}/api/${identifier}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      console.log('Logout response status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  async refreshToken(identifier: string, refreshToken: string): Promise<AuthResponse> {
    try {
      console.log('Attempting token refresh with Azure API:', {
        url: `${this.baseURL}/api/${identifier}/auth/refresh`
      });

      const response = await fetch(`${this.baseURL}/api/${identifier}/auth/refresh`, {
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

      return {
        success: true,
        data: {
          user: data.user,
          token: data.token || data.accessToken,
          refreshToken: data.refreshToken,
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
      const response = await fetch(`${this.baseURL}/api/${identifier}/auth/validate`, {
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
}

export const authApi = new AuthApiService();
export default authApi; 