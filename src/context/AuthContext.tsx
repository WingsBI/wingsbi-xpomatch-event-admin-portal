'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginCredentials, AuthResponse, AuthContextType, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
}

// Helper function to delete cookie
function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Initialize auth state from cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing authentication
        await refreshAuth();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear any invalid cookies
        deleteCookie('auth-token');
        deleteCookie('refresh-token');
        deleteCookie('user-data');
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies in the request
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          eventId: credentials.eventId,
          role: credentials.role,
        }),
      });

      const data = await response.json();

      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        
        // Also store in localStorage as fallback for iframe scenarios
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Handle role-based redirection
        const userRole = data.user.role;
        const eventId = credentials.eventId;
        
        if (userRole === 'visitor') {
          // Redirect visitor to visitor dashboard
          router.push(`/${eventId}/event-admin/dashboard/visitor_dashboard`);
        } else if (userRole === 'exhibitor') {
          // Redirect exhibitor to exhibitor dashboard
          router.push(`/${eventId}/event-admin/dashboard/exhibitor_dashboard`);
        } else {
          // Default: event-admin goes to main dashboard
          router.push(`/${eventId}/event-admin/dashboard`);
        }
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API to clear server-side cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // Clear client-side cookies manually as fallback
    deleteCookie('auth-token');
    deleteCookie('refresh-token');
    deleteCookie('user-data');

    // Clear localStorage as well
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('theme');
      localStorage.removeItem('fontFamily');
    }

    // Clear user state
    setUser(null);
    setToken(null);
  };

  const refreshAuth = async () => {
    // Check localStorage for valid authentication data (compatible with Azure API system)
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      console.log('AuthContext refreshAuth - Token:', token ? 'Found' : 'Not found');
      console.log('AuthContext refreshAuth - User data:', userStr);
      
      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('AuthContext refreshAuth - Parsed user data:', userData);
          
          // Validate that user data is complete
          if (userData.id && userData.email) {
            // Basic token validation (check if it's a JWT)
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              console.log('AuthContext refreshAuth - Setting user with role:', userData.role);
              setUser(userData);
              setToken(token);
              return; // Success
            }
          }
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError);
        }
      }
    }
    
    // If we reach here, there's no valid authentication data
    throw new Error('No valid authentication data found');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update cookie by making API call or directly update document.cookie
      if (typeof document !== 'undefined') {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = `path=/; ${isProduction ? 'secure;' : ''} samesite=lax; max-age=${24 * 60 * 60}`;
        document.cookie = `user-data=${JSON.stringify(updatedUser)}; ${cookieOptions}`;
      }
      
      // Update localStorage as fallback
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider; 