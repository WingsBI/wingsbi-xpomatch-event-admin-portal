'use client';

import React, { useEffect, ReactNode } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { store, persistor, extractIdentifierFromURL } from '@/store';
import { initializeApp, updateResponsiveState } from '@/store/slices/appSlice';

interface ReduxProviderProps {
  children: ReactNode;
}

// Component to handle app initialization
function AppInitializer({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Extract identifier from URL
    const identifier = extractIdentifierFromURL();
    
    // Get initial responsive state
    const responsive = {
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
      screenHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
      orientation: typeof window !== 'undefined' ? 
        (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait') as 'landscape' | 'portrait' : 'landscape',
      isTouchDevice: typeof window !== 'undefined' ? 'ontouchstart' in window : false,
    };

    // Initialize the app with identifier and responsive state
    dispatch(initializeApp({ identifier, responsive }));

    // Listen for URL changes to update identifier
    const handleRouteChange = () => {
      const newIdentifier = extractIdentifierFromURL();
      if (newIdentifier !== identifier) {
        dispatch(initializeApp({ 
          identifier: newIdentifier, 
          responsive: {
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
            isTouchDevice: 'ontouchstart' in window,
          }
        }));
      }
    };

    // Handle responsive updates
    const handleResize = () => {
      dispatch(updateResponsiveState({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      }));
    };

    const handleOrientationChange = () => {
      // Delay to get accurate dimensions after orientation change
      setTimeout(() => {
        dispatch(updateResponsiveState({
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        }));
      }, 100);
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Monitor route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(history, arguments as any);
      handleRouteChange();
    };

    history.replaceState = function() {
      originalReplaceState.apply(history, arguments as any);
      handleRouteChange();
    };

    window.addEventListener('popstate', handleRouteChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [dispatch, pathname, router]);

  return <>{children}</>;
}

// Loading component for PersistGate
function LoadingComponent() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        gap: 2,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" color="text.secondary">
        Loading Application...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Initializing responsive interface
      </Typography>
    </Box>
  );
}

// Error boundary for Redux operations
class ReduxErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Redux Provider Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'background.default',
            p: 3,
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Application Error
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Something went wrong with the application state.
            <br />
            Please refresh the page to try again.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Refresh Page
            </button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Main Redux Provider
export default function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <ReduxErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingComponent />} persistor={persistor}>
          <AppInitializer>
            {children}
          </AppInitializer>
        </PersistGate>
      </Provider>
    </ReduxErrorBoundary>
  );
}

// Hook to access store outside of React components
export const getStoreState = () => store.getState();
export const dispatchStoreAction = (action: any) => store.dispatch(action); 