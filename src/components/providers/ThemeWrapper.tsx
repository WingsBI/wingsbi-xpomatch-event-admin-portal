'use client';

import { ReactNode, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
  import { useSelector } from 'react-redux';
import { ApiThemeProvider, useApiTheme } from '@/context/ApiThemeContext';
import { RootState } from '@/store';
import { getEventIdentifier } from '@/utils/cookieManager';

interface ThemeWrapperProps {
  children: ReactNode;
  identifier?: string; // <-- allow optional identifier prop
}

// Component that listens for auth changes and refreshes theme
function ThemeRefreshListener({ children }: { children: ReactNode }) {
  // Use Redux auth state to detect changes
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
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

  // Resolve identifier synchronously to ensure ApiThemeProvider is present on first render
  const identifier = useMemo(() => {
    if (propIdentifier) return propIdentifier;
    const parts = (pathname || '').split('/').filter(Boolean);
    if (parts.length > 0) {
      return parts[0];
    }
    try {
      return getEventIdentifier() || null;
    } catch {
      return null;
    }
  }, [pathname, propIdentifier]);

  console.log('🔍 ThemeWrapper - Current pathname:', pathname, 'Identifier:', identifier);

  if (!identifier) {
    console.log('🔍 ThemeWrapper - No identifier found yet, delaying children render');
    return null;
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