'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { eventsApi } from '@/services/apiService';
import { setCookie, getCookie, removeCookie } from '@/utils/cookieManager';

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

export interface ApiEventThemeDetails {
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
          main: '#ffffff', // White background
          light: '#ffffff',
          dark: '#f0f0f0',
        },
        secondary: {
          main: '#00a0df', // Brand blue
          light: '#33b5e5',
          dark: '#007bb1',
        },
        background: {
          default: '#ffffff',
          paper: '#f9fafb',
        },
        text: {
          primary: '#1a202c',
          secondary: '#4a5568',
        },
      },
      
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              background: 'linear-gradient(to bottom, #ffffff, #f7fafc)',
              minHeight: '100vh',
            },
          },
        },
      
        // 🚀 Gradient Buttons
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 6,
              backgroundImage: 'linear-gradient(90deg, #00a0df, #007bb1)', // Blue gradient
              color: '#fff',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundImage: 'linear-gradient(90deg, #33b5e5, #006494)', // lighter → deeper
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
              },
            },
            contained: {
              boxShadow: 'none',
            },
            outlined: {
              borderColor: '#00a0df',
              color: '#00a0df',
              '&:hover': {
                borderColor: '#007bb1',
                color: '#007bb1',
                backgroundColor: 'rgba(0,160,223,0.04)',
              },
            },
          },
        },
      
        // 🚀 Gradient Avatars
        MuiAvatar: {
          styleOverrides: {
            root: {
              backgroundImage: 'linear-gradient(135deg, #33b5e5, #007bb1)', // blue gradient
              color: '#fff',
              fontWeight: 600,
            },
          },
        },
      
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                transform: 'translateY(-2px)',
              },
            },
          },
        },
      
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 8,
                '& fieldset': {
                  borderColor: '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: '#00a0df',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#007bb1',
                },
              },
            },
          },
        },
      
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
            },
          },
        },
      
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              fontWeight: 500,
              backgroundColor: '#e6f7fc',
              color: '#007bb1',
              '&.MuiChip-colorSecondary': {
                backgroundImage: 'linear-gradient(90deg, #00a0df, #007bb1)', // gradient secondary chip
                color: '#fff',
              },
            },
          },
        },
      },
      
      shape: { borderRadius: 8 },
      spacing: 8,
    },
    'Executive Gray': {
      palette: {
        primary: {
          main: '#ffffff',  // Pure white
          light: '#ffffff',
          dark: '#f3f4f6',  // Subtle off-white for contrast
        },
        secondary: {
          main: '#4b5563',  // Executive Gray (neutral, professional)
          light: '#9ca3af', // Lighter gray for hover/accents
          dark: '#1f2937',  // Strong dark gray for depth
        },
        background: {
          default: '#f9fafb', // Light neutral background
          paper: '#ffffff',   // White for cards/surfaces
        },
        text: {
          primary: '#111827',   // Almost black (high contrast for readability)
          secondary: '#4b5563', // Muted gray for secondary text
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%)',
              minHeight: '100vh',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 6,
              backgroundImage: 'linear-gradient(to right,rgb(123, 134, 150),rgb(116, 130, 151))',
             //backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
             color: '#ffff',
              '&:hover': {
                backgroundImage: 'linear-gradient(to right, #6b7280, #374151)',
              },
    
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
             backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundImage: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                transform: 'translateY(-2px)',
              },
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
              backgroundImage: 'linear-gradient(to bottom right, #f9fafb 0%, #ffffff 100%)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
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
    },
    'Forest Professional': {
      palette: {
        primary: {
          main: '#ffffff',  // White
          light: '#ffffff',
          dark: '#f0f0f0',  // Subtle contrast
        },
        secondary: {
          main: theme.themeColor,
           light: '#10b981',
            dark: '#047857',  // Dark Green (deep forest tone)
        },
        background: {
          default: '#f9fafb',  // Subtle off-white background
          paper: '#ffffff',    // Card / surfaces
        },
        text: {
          primary: '#1a202c',   // Charcoal gray (professional text)
          secondary: '#4a5568', // Muted gray
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              background: 'linear-gradient(to bottom, #f0fdf4 0%, #ecfdf5 100%)',
              minHeight: '100vh',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            fontWeight: 500,
            borderRadius: 6,
            backgroundImage: 'linear-gradient(to right, #10b981, #059669)',
            color: '#fff',
            '&:hover': {
              backgroundImage: 'linear-gradient(to right, #34d399, #047857)',
            },
            },
            contained: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              },
            },
          },
        },
           // 🚀 Gradient Avatars
           MuiAvatar: {
            styleOverrides: {
              root: {
                backgroundImage: 'linear-gradient(to right, #10b981, #059669)',
                color: '#fff',
                fontWeight: 600,
              },
            },
          },
        MuiCard: {
          styleOverrides: {
            root: {
             backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundImage: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                transform: 'translateY(-2px)',
              },
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
              backgroundImage: 'linear-gradient(to bottom right, #ecfdf5, #ffffff)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
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
    },
    'Sunset Professional': {
      palette: {
        primary: {
          main: '#ffffff',  // White
          light: '#ffffff',
          dark: '#f3f4f6',  // Soft off-white
        },
        secondary: {
          main: '#fb923c',  // Sunset Orange (professional main)
          light: '#fdba74', // Warm Sunset Glow
          dark: '#c2410c',  // Deep Burnt Sunset
        },
        background: {
          default: '#fff7ed', // Soft warm beige (sunset vibe)
          paper: '#ffffff',   // Clean white for cards
        },
        text: {
          primary: '#1a202c',   // Strong charcoal
          secondary: '#4a5568', // Muted professional gray
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              background: 'linear-gradient(to bottom, #fffbeb, #fff7e6)',
              minHeight: '100vh',
  
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 6,
                backgroundImage: 'linear-gradient(to right, #fb923c, #ea580c)',
                color: '#fff',
                '&:hover': {
                  backgroundImage: 'linear-gradient(to right, #fdba74, #c2410c)',
                },
            },
            contained: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              },
            },
          },
        },

        MuiAvatar: {
          styleOverrides: {
            root: {
              backgroundImage: 'linear-gradient(to right, #fb923c, #ea580c)',
              color: '#fff',
              fontWeight: 600,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
             backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundImage: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                transform: 'translateY(-2px)',
              },
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
              backgroundImage: 'linear-gradient(to bottom right, #fffbeb, #ffffff)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
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
    },
    'Purple Gradient': {
      palette: {
        primary: {
          main: '#ffffff',  // White
          light: '#ffffff',
          dark: '#f3f4f6',  // Soft off-white for subtle contrast
        },
        secondary: {
          main: '#4b0082',  // Midnight Purple (deep indigo-purple)
          light: '#7c3aed', // Vibrant purple accent
          dark: '#2e003e',  // Almost black-purple (midnight depth)
        },
        background: {
          default: '#f5f3ff', // Soft lavender-white (very light purple tint)
          paper: '#ffffff',   // Pure white for cards/surfaces
        },
        text: {
          primary: '#1a202c',   // Charcoal gray for readability
          secondary: '#4a5568', // Neutral muted gray
        },
      
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              background: 'linear-gradient(to bottom, #f0fdfa,rgb(242, 243, 243))',
              minHeight: '100vh',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 6,
              backgroundImage: 'linear-gradient(to right, #8b5cf6, #6d28d9)',
              color: '#fff',
              '&:hover': {
                backgroundImage: 'linear-gradient(to right, #a78bfa, #5b21b6)',
              },
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
             backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundImage: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                transform: 'translateY(-2px)',
              },
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

        MuiAvatar: {
          styleOverrides: {
            root: {
              backgroundImage: 'linear-gradient(to right, #8b5cf6, #6d28d9)',
              color: '#fff',
              fontWeight: 600,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'linear-gradient(to bottom right, #ede9fe, #ffffff)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
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
    },
    'Teal Professional': {
      palette: {
        primary: {
          main: '#ffffff',  // White
          light: '#ffffff',
          dark: '#f3f4f6',  // Subtle off-white
        },
        secondary: {
          main: '#0f766e',  // Professional Teal (balanced tone)
          light: '#2dd4bf', // Soft aqua teal for highlights
          dark: '#115e59',  // Deep teal (executive, serious)
        },
        background: {
          default: '#f0fdfa', // Very light aqua background
          paper: '#ffffff',   // Clean white cards/surfaces
        },
        text: {
          primary: '#1a202c',   // Strong charcoal gray
          secondary: '#4a5568', // Muted professional gray
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                background: 'linear-gradient(to bottom, #f0fdfa,rgb(242, 243, 243))',
                minHeight: '100vh',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 6,
                backgroundImage: 'linear-gradient(to right, #14b8a6, #0f766e)',
                color: '#fff',
                '&:hover': {
                  backgroundImage: 'linear-gradient(to right, #2dd4bf, #115e59)',
                },
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                },
              },
            },
          },

          MuiAvatar: {
            styleOverrides: {
              root: {
                backgroundImage: 'linear-gradient(to right, #14b8a6, #0f766e)',
                color: '#fff',
                fontWeight: 600,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
               backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  backgroundImage: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                  transform: 'translateY(-2px)',
                },
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
                backgroundImage: 'linear-gradient(to bottom right, #f0fdfa, #ffffff)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
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
  const loadingRef = useRef(false); // Prevent multiple simultaneous API calls

  const loadThemeFromApi = async () => {
    // Prevent multiple simultaneous API calls
    if (loadingRef.current) {
      console.log('🔍 Theme API call already in progress, skipping...');
      return;
    }
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading theme from API for identifier:', identifier);
      
      // Check if we have cached theme data for this identifier
      const cacheKey = `theme_${identifier}`;
      const cacheTimestampKey = `theme_${identifier}_timestamp`;
      const cachedTheme = getCookie(cacheKey);
      const cacheTimestamp = getCookie(cacheTimestampKey);
      
      // Cache is valid for 5 minutes
      const cacheValidDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
      const isCacheValid = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < cacheValidDuration;
      
      if (cachedTheme && isCacheValid) {
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
          setCookie(cacheKey, JSON.stringify(themeData));
          setCookie(cacheTimestampKey, Date.now().toString());
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
      loadingRef.current = false;
    }
  };

  // Debounced refresh function to prevent excessive API calls
  const refreshTheme = useCallback(async () => {
    // Clear any existing cache to force fresh data
    if (identifier) {
      const cacheKey = `theme_${identifier}`;
      const cacheTimestampKey = `theme_${identifier}_timestamp`;
      removeCookie(cacheKey);
      removeCookie(cacheTimestampKey);
    }
    await loadThemeFromApi();
  }, [identifier, loadThemeFromApi]);

  // Single useEffect for theme loading with proper dependency management
  useEffect(() => {
    if (identifier) {
      console.log('🔍 Identifier available, loading theme immediately');
      loadThemeFromApi();
    }
  }, [identifier]); // Only depend on identifier changes

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