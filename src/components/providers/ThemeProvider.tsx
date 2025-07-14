'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getEventAdminThemeConfig, getAvailableThemes, getAvailableFonts } from '@/lib/themeApi';
import { ThemeConfig, AvailableTheme, AvailableFont } from '@/types';

// Font families mapping
const fontFamilies = {
  nunitosans: '"Nunito Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  inter: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  roboto: '"Roboto", "Helvetica", "Arial", sans-serif',
  poppins: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  montserrat: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
  opensans: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  lato: '"Lato", "Roboto", "Helvetica", "Arial", sans-serif',
};

// Default theme as fallback
const defaultTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: fontFamilies.inter,
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

// Theme configurations based on backend themes
const createThemeFromConfig = (themeKey: string, fontKey: string) => {
  const fontFamily = fontFamilies[fontKey as keyof typeof fontFamilies] || fontFamilies.inter;
  
  // Define theme configurations based on theme keys
  const themeConfigs: Record<string, any> = {
    'ocean-blue': {
      palette: {
        primary: {
          main: '#1976d2',
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
    'executive-gray': {
      palette: {
        primary: {
          main: '#374151',
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
    'forest-green': {
      palette: {
        primary: {
          main: '#059669',
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
    'sunset-orange': {
      palette: {
        primary: {
          main: '#ea580c',
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
    'midnight-purple': {
      palette: {
        primary: {
          main: '#7c3aed',
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

  const selectedTheme = themeConfigs[themeKey] || themeConfigs['ocean-blue'];
  
  return createTheme({
    ...selectedTheme,
    typography: {
      fontFamily,
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

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);
  const { identifier } = useSelector((state: RootState) => state.app);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const loadThemeFromBackend = async () => {
      try {
        setIsLoading(true);
        
        // Only fetch theme config if we have an identifier and user is authenticated
        if (identifier && user) {
          console.log('Loading theme configuration for:', identifier);
          
          const themeConfig = await getEventAdminThemeConfig(identifier);
          
          if (themeConfig) {
            console.log('Theme config loaded:', themeConfig);
            
            // Create theme from backend configuration
            const dynamicTheme = createThemeFromConfig(
              themeConfig.themeKey, 
              themeConfig.fontKey
            );
            
            setTheme(dynamicTheme);
            console.log('Theme applied:', themeConfig.themeName);
          } else {
            console.log('No theme config found, using default theme');
            setTheme(defaultTheme);
          }
        } else {
          console.log('No identifier or user, using default theme');
          setTheme(defaultTheme);
        }
      } catch (error) {
        console.error('Error loading theme from backend:', error);
        setTheme(defaultTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeFromBackend();
  }, [identifier, user]);

  if (isLoading) {
    // Return a loading state or the default theme while loading
    return (
      <MuiThemeProvider theme={defaultTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    );
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
} 

