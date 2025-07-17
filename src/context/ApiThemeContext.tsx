'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { eventsApi } from '@/services/apiService';

// API Theme Response Types
interface ApiTheme {
  themeId: number;
  themeLabel: string;
  themeColor: string;
}

interface ApiFont {
  fontId: number;
  fontLabel: string;
  fontFamily: string;
  className: string;
}

interface ApiEventThemeDetails {
  id: number;
  eventId: number;
  theme: ApiTheme;
  font: ApiFont;
}

interface ApiThemeContextType {
  themeDetails: ApiEventThemeDetails | null;
  isLoading: boolean;
  error: string | null;
  refreshTheme: () => Promise<void>;
}

const ApiThemeContext = createContext<ApiThemeContextType | undefined>(undefined);

export const useApiTheme = () => {
  const context = useContext(ApiThemeContext);
  if (context === undefined) {
    throw new Error('useApiTheme must be used within an ApiThemeProvider');
  }
  return context;
};

// Theme configurations based on API theme labels
const createThemeFromApi = (theme: ApiTheme, font: ApiFont) => {
  const themeConfigs: Record<string, any> = {
    'Ocean Blue': {
      palette: {
        primary: {
          main: theme.themeColor,
          light: '#42a5f5',
          dark: '#1565c0',
        },
        secondary: {
          main: '#00acc1',
          light: '#4dd0e1',
          dark: '#00838f',
        },
        background: {
          default: '#e3f2fd',
          paper: '#ffffff',
        },
        text: {
          primary: '#1a202c',
          secondary: '#4a5568',
        },
      },
    },
    'Executive Gray': {
      palette: {
        primary: {
          main: theme.themeColor,
          light: '#6b7280',
          dark: '#1f2937',
        },
        secondary: {
          main: '#d97706',
          light: '#f59e0b',
          dark: '#92400e',
        },
        background: {
          default: '#f9fafb',
          paper: '#ffffff',
        },
        text: {
          primary: '#111827',
          secondary: '#4b5563',
        },
      },
    },
    'Forest Professional': {
      palette: {
        primary: {
          main: theme.themeColor,
          light: '#10b981',
          dark: '#047857',
        },
        secondary: {
          main: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        background: {
          default: '#f0fdf4',
          paper: '#ffffff',
        },
        text: {
          primary: '#1a202c',
          secondary: '#4a5568',
        },
      },
    },
    'Sunset Professional': {
      palette: {
        primary: {
          main: theme.themeColor,
          light: '#fb923c',
          dark: '#c2410c',
        },
        secondary: {
          main: '#7c3aed',
          light: '#a78bfa',
          dark: '#5b21b6',
        },
        background: {
          default: '#fff7ed',
          paper: '#ffffff',
        },
        text: {
          primary: '#1a202c',
          secondary: '#4a5568',
        },
      },
    },
    'Purple Gradient': {
      palette: {
        primary: {
          main: theme.themeColor,
          light: '#a78bfa',
          dark: '#5b21b6',
        },
        secondary: {
          main: '#ec4899',
          light: '#f472b6',
          dark: '#be185d',
        },
        background: {
          default: '#faf5ff',
          paper: '#ffffff',
        },
        text: {
          primary: '#1a202c',
          secondary: '#4a5568',
        },
      },
    },
  };

  const selectedTheme = themeConfigs[theme.themeLabel] || themeConfigs['Ocean Blue'];
  
  return createTheme({
    ...selectedTheme,
    typography: {
      fontFamily: font.fontFamily,
      h1: { fontSize: '2.5rem', fontWeight: 600, lineHeight: 1.2 },
      h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3 },
      h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
      h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
      h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '1rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
            padding: '8px 16px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e0e0e0',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500,
          },
        },
      },
    },
    shape: { borderRadius: 8 },
    spacing: 8,
  });
};

interface ApiThemeProviderProps {
  children: ReactNode;
  identifier: string;
}

export function ApiThemeProvider({ children, identifier }: ApiThemeProviderProps) {
  const [themeDetails, setThemeDetails] = useState<ApiEventThemeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);

  const loadThemeFromApi = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading theme from API for identifier:', identifier);
      console.log('🔍 Available tokens in localStorage:', {
        jwtToken: !!localStorage.getItem('jwtToken'),
        authToken: !!localStorage.getItem('authToken'),
        user: !!localStorage.getItem('user')
      });
      
      // Check if we have cached theme data for this identifier
      const cacheKey = `theme_${identifier}`;
      const cachedTheme = localStorage.getItem(cacheKey);
      
      if (cachedTheme) {
        try {
          const themeData = JSON.parse(cachedTheme);
          console.log('🔍 Using cached theme data:', themeData.theme.themeLabel);
          setThemeDetails(themeData);
          const muiTheme = createThemeFromApi(themeData.theme, themeData.font);
          setTheme(muiTheme);
          setIsLoading(false);
          return; // Use cached data immediately
        } catch (parseError) {
          console.log('🔍 Cached theme data invalid, loading from API');
        }
      }
      
      const response = await eventsApi.getEventThemeDetails(identifier);
      
      console.log('🔍 Theme API response:', response);
      
      if (response.success && response.data?.result) {
        const themeData = response.data.result;
        setThemeDetails(themeData);
        
        // Cache the theme data for faster subsequent loads
        try {
          localStorage.setItem(cacheKey, JSON.stringify(themeData));
          console.log('🔍 Theme data cached for identifier:', identifier);
        } catch (cacheError) {
          console.log('🔍 Failed to cache theme data:', cacheError);
        }
        
        // Create and apply theme
        const muiTheme = createThemeFromApi(themeData.theme, themeData.font);
        setTheme(muiTheme);
        
        console.log('✅ Theme applied successfully:', themeData.theme.themeLabel, 'Font:', themeData.font.fontLabel);
      } else {
        console.log('❌ Theme API response indicates failure:', response);
        setError('Failed to load theme details');
        // Use default theme
        const defaultTheme = createTheme();
        setTheme(defaultTheme);
      }
    } catch (err: any) {
      console.error('❌ Error loading theme from API:', err);
      setError(err.message || 'Failed to load theme');
      // Use default theme on error
      const defaultTheme = createTheme();
      setTheme(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTheme = async () => {
    await loadThemeFromApi();
  };

  useEffect(() => {
    if (identifier) {
      // Load theme immediately when identifier is available
      console.log('🔍 Identifier available, loading theme immediately');
      loadThemeFromApi();
      
      // Also set up a more aggressive retry if the first load fails
      const aggressiveRetry = setTimeout(() => {
        if (!themeDetails && !isLoading) {
          console.log('🔄 Aggressive retry for theme load');
          loadThemeFromApi();
        }
      }, 1000); // Retry after 1 second if still no theme

      return () => clearTimeout(aggressiveRetry);
    }
  }, [identifier]);

  // Add a retry mechanism for theme loading
  useEffect(() => {
    if (identifier && !themeDetails && !isLoading) {
      // If we have an identifier but no theme details and we're not loading, try again after a delay
      const retryTimeout = setTimeout(() => {
        console.log('🔄 Retrying theme load for identifier:', identifier);
        loadThemeFromApi();
      }, 500); // Retry after 500ms for faster loading

      return () => clearTimeout(retryTimeout);
    }
  }, [identifier, themeDetails, isLoading]);

  const value: ApiThemeContextType = {
    themeDetails,
    isLoading,
    error,
    refreshTheme,
  };

  if (!theme) {
    // Show loading state instead of default theme to prevent flash
    return (
      <ApiThemeContext.Provider value={value}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            flexDirection: 'column',
            gap: 2
          }}
        >
         
        </Box>
      </ApiThemeContext.Provider>
    );
  }

  return (
    <ApiThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ApiThemeContext.Provider>
  );
} 