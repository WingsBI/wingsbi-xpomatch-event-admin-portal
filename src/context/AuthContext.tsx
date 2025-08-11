'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginCredentials, AuthResponse, AuthContextType, UserRole } from '@/types/auth';
import { setAuthToken, setUserData, clearAllAuthCookies, getAuthToken, getUserData } from '@/utils/cookieManager';

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
        clearAllAuthCookies();
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
        
        // Store in cookies for persistence
        setAuthToken(data.token);
        setUserData(data.user);

        // Handle role-based redirection
        const userRole = data.user.role;
        const eventId = credentials.eventId;
        
        if (userRole === 'visitor') {
          // Redirect visitor to exhibitors matching page
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

    // Clear all authentication cookies
    clearAllAuthCookies();

    // Clear user state
    setUser(null);
    setToken(null);
  };

  const refreshAuth = async () => {
    // Check cookies for valid authentication data
    const token = getAuthToken();
    const userData = getUserData();
    
    console.log('AuthContext refreshAuth - Token:', token ? 'Found' : 'Not found');
    console.log('AuthContext refreshAuth - User data:', userData);
    
    if (token && userData) {
      try {
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
    
    // If we reach here, there's no valid authentication data
    throw new Error('No valid authentication data found');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update user data in cookies
      setUserData(updatedUser);
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