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
      main: '#ffffff', // White background
      light: '#ffffff',
      dark: '#f0f0f0', // Subtle contrast
    },
    secondary: {
      main: '#00a0df', // Sidebar & logo blue
      light: '#33b5e5',
      dark: '#007bb1',
    },
    background: {
      default: '#ffffff', // Clean white background
      paper: '#f9fafb',   // Light grayish for cards/panels
    },
    text: {
      primary: '#1a202c',   // Dark gray (not pure black, softer)
      secondary: '#4a5568', // Muted gray for secondary text
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
          main: '#ffffff', // White background
          light: '#ffffff',
          dark: '#f0f0f0', // Subtle contrast
        },
        secondary: {
          main: '#00a0df', // Sidebar & logo blue
          light: '#33b5e5',
          dark: '#007bb1',
        },
        background: {
          default: '#ffffff', // Clean white background
          paper: '#f9fafb',   // Light grayish for cards/panels
        },
        text: {
          primary: '#1a202c',   // Dark gray (not pure black, softer)
          secondary: '#4a5568', // Muted gray for secondary text
        },


      },
    },
    'executive-gray': {
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
    },
    'forest-green': {
      palette: {
        primary: {
          main: '#ffffff',  // White
          light: '#ffffff',
          dark: '#f0f0f0',  // Subtle contrast
        },
        secondary: {
          main: '#047857',
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
    },
    'sunset-orange': {
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
    },
    'midnight-purple': {
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

