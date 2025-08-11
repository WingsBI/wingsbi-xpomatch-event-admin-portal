'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ApiThemeProvider, useApiTheme } from '@/context/ApiThemeContext';
import { useAuth } from '@/context/AuthContext';

interface ThemeWrapperProps {
  children: ReactNode;
  identifier?: string; // <-- allow optional identifier prop
}

// Component that listens for auth changes and refreshes theme
function ThemeRefreshListener({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { refreshTheme } = useApiTheme();
  const lastAuthState = useRef<{ isAuthenticated: boolean; userId?: string }>({ isAuthenticated: false });
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if authentication state has changed
    const currentAuthState = { isAuthenticated, userId: user?.id };
    const previousAuthState = lastAuthState.current;

    console.log('🔍 ThemeRefreshListener - Auth state check:', {
      current: currentAuthState,
      previous: previousAuthState,
      hasChanged: currentAuthState.isAuthenticated !== previousAuthState.isAuthenticated ||
                 currentAuthState.userId !== previousAuthState.userId
    });

    if (
      currentAuthState.isAuthenticated !== previousAuthState.isAuthenticated ||
      currentAuthState.userId !== previousAuthState.userId
    ) {
      console.log('🔄 Authentication state changed, refreshing theme');
      
      // Clear any existing timeout to prevent multiple refreshes
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Add a delay to ensure authentication state is fully settled and debounce multiple changes
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Executing theme refresh...');
        refreshTheme();
      }, 200); // Increased delay for better debouncing
      
      lastAuthState.current = currentAuthState;
    }
  }, [isAuthenticated, user?.id, refreshTheme]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return <>{children}</>;
}

export default function ThemeWrapper({ children, identifier: propIdentifier }: ThemeWrapperProps) {
  const pathname = usePathname();
  const [identifier, setIdentifier] = useState<string | null>(propIdentifier || null);

  useEffect(() => {
    if (propIdentifier) {
      setIdentifier(propIdentifier);
      return;
    }
    // Extract identifier from URL path
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      setIdentifier(pathParts[0]);
    }
  }, [pathname, propIdentifier]);

  console.log('🔍 ThemeWrapper - Current pathname:', pathname, 'Identifier:', identifier);

  if (!identifier) {
    console.log('🔍 ThemeWrapper - No identifier found, rendering without theme provider');
    return <>{children}</>;
  }

  console.log('🔍 ThemeWrapper - Rendering with ApiThemeProvider for identifier:', identifier);

  return (
    <ApiThemeProvider identifier={identifier}>
      <ThemeRefreshListener>
        {children}
      </ThemeRefreshListener>
    </ApiThemeProvider>
  );
} 