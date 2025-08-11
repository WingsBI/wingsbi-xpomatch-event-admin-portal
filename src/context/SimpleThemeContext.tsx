'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getEventAdminThemeConfig } from '@/lib/themeApi';
import { ThemeConfig, EventAdminThemeSettings } from '@/types';
import { setCookie, getCookie } from '@/utils/cookieManager';

// Font families available for selection - Nunito Sans as default
export const fontFamilies = {
  nunitosans: '"Nunito Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  inter: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  roboto: '"Roboto", "Helvetica", "Arial", sans-serif',
  poppins: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  montserrat: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
  opensans: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  lato: '"Lato", "Roboto", "Helvetica", "Arial", sans-serif',
};

// Create theme function with font family parameter
const createAdvancedTheme = (config: any, fontFamily: string) => createTheme({
  ...config,
  typography: {
    ...config.typography,
    fontFamily,
  },
});

// Define professional, sober, eye-catching themes
const createThemes = (fontFamily: string = fontFamilies.nunitosans) => ({
  default:
     {
    name: 'Ocean Blue',
    description: 'Professional blue theme with clean design',
    preview: '#1976d2',
    theme: createAdvancedTheme({
      palette: {
        mode: 'light' as const,
        primary: {
          main: '#1976d2',     // Ocean Blue
          light: '#42a5f5',    // Sky Blue
          dark: '#1565c0',     // Deep Blue
        },
        secondary: {
          main: '#00acc1',     // Cyan
          light: '#4dd0e1',    // Light Teal
          dark: '#00838f',     // Deep Teal
        },
        background: {
          default: '#e3f2fd → #f0f4f8',   // Light bluish-gray
          paper: '#ffffff',
        },
        text: {
          primary: '#1a202c',  // Almost black
          secondary: '#4a5568',
        },
        divider: 'rgba(25, 118, 210, 0.12)',
        action: {
          hover: 'rgba(25, 118, 210, 0.04)',
          selected: 'rgba(25, 118, 210, 0.08)',
        },
      },
      typography: {
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              background: 'linear-gradient(to bottom,rgb(241, 244, 247) 0%, #f0f4f8 100%)',
              minHeight: '100vh',
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
              backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)',
              boxShadow: '0 6px 16px rgba(245, 246, 250, 0.9)',
              transform: 'translateY(-2px)',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 6,
              backgroundImage: 'linear-gradient(to right, #1976d2, #1565c0)',
              color: '#fff',
              '&:hover': {
                backgroundImage: 'linear-gradient(to right, #42a5f5, #1e88e5)',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'linear-gradient(to bottom right,rgb(243, 245, 247) 0%, #ffffff 100%)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
    }, fontFamily),
  },
  corporate: {
    name: 'Executive Gray',
    description: 'Professional corporate theme with neutral tones',
    preview: '#374151',
    theme: createAdvancedTheme({
      palette: {
        mode: 'light' as const,
        primary: {
          main: '#374151',  // Slate Gray
          light: '#6b7280', // Cool Gray
          dark: '#1f2937', 
        },
        secondary: {
          main: '#d97706',  // Amber
          light: '#f59e0b', // Warm Gold
          dark: '#92400e', 


        },
        background: {
          default: '#f9fafb → #f3f4f6', // Light neutral
          paper: '#ffffff',
    
        },
        text: {
          primary: '#111827',  // Charcoal
        secondary: '#4b5563',
        },
        divider: 'rgba(55, 65, 81, 0.12)',
    action: {
      hover: 'rgba(55, 65, 81, 0.04)',
      selected: 'rgba(55, 65, 81, 0.08)',
    },
      },
      typography: {
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
      },  
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              background: 'linear-gradient(to bottom,rgb(234, 236, 238) 0%,rgb(250, 251, 253) 100%)',
              minHeight: '100vh',
    
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
              backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)',
              boxShadow: '0 6px 16px rgba(245, 246, 250, 0.9)',
              transform: 'translateY(-2px)',
          },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
          fontWeight: 500,
          borderRadius: 6,
          backgroundImage: 'linear-gradient(to right, #4b5563, #1f2937)',
          color: '#fff',
          '&:hover': {
            backgroundImage: 'linear-gradient(to right, #6b7280, #374151)',
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
      },
    }, fontFamily),
  },
  green: {
    name: 'Forest Professional',
    description: 'Clean green theme for a fresh professional look',
    preview: '#059669',
    theme: createAdvancedTheme({
      palette: {
        mode: 'light' as const,
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
          default: '#f0fdf4 → #dcfce7',  // slightly brighter than before
          paper: '#ffffff',
  
        },
        text: {
          primary: '#1a202c',
          secondary: '#4a5568',
  
        },
        divider: 'rgba(5, 150, 105, 0.12)',
        action: {
          hover: 'rgba(5, 150, 105, 0.04)',
          selected: 'rgba(5, 150, 105, 0.08)',
        },
  
      },
      typography: {
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
      },
      shape: {
        borderRadius: 8,
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
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease-in-out',
            '&:hover': {
              backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)',
              boxShadow: '0 6px 16px rgba(245, 246, 250, 0.9)',
              transform: 'translateY(-2px)',
            },
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
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'linear-gradient(to bottom right, #ecfdf5, #ffffff)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',  },
          },
        },
      },
    }, fontFamily),
  },
  teal: {
    name: 'Teal Professional',
    description: 'Modern teal theme with sophisticated appeal',
    preview: '#0891b2',
    theme: createAdvancedTheme({
      palette: {
        mode: 'light' as const,
        primary: {
          main: '#0891b2',
          light: '#06b6d4',
          dark: '#0e7490',
        },
        secondary: {
          main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
        },
        background: {
          default: '#f0fdfa → #ccfbf1',
          paper: '#ffffff',
        },
        text: {
          primary: '#1a202c',
        secondary: '#4a5568',
        },
        divider: 'rgba(8, 145, 178, 0.12)',
        action: {
          hover: 'rgba(8, 145, 178, 0.04)',
          selected: 'rgba(8, 145, 178, 0.08)',
        },
      },
      typography: {
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              background: 'linear-gradient(to bottom, #f0fdfa, #e0f7fa)',
            minHeight: '100vh',
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
              backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)',
              boxShadow: '0 6px 16px rgba(245, 246, 250, 0.9)',
              transform: 'translateY(-2px)',

            },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            fontWeight: 500,
            borderRadius: 6,
            backgroundImage: 'linear-gradient(to right, #06b6d4, #0891b2)',
            color: '#fff',
            '&:hover': {
              backgroundImage: 'linear-gradient(to right, #38bdf8, #0e7490)',
            },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'linear-gradient(to bottom right, #f0fdfa, #ffffff)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)', },
          },
        },
      },
    }, fontFamily),
  },
  orange: {
    name: 'Sunset Professional',
    description: 'Warm orange theme with energetic professional vibes',
    preview: '#ea580c',
    theme: createAdvancedTheme({
      palette: {
        mode: 'light' as const,
        primary: {
          main: '#ea580c',
          light: '#fb923c',
          dark: '#c2410c',
        },
        secondary: {
          main: '#0891b2',
          light: '#06b6d4',
          dark: '#0e7490',
        },
        background: {
          default: '#fff7ed → #fffbeb',
          paper: '#ffffff',
        },
        text: {
          primary: '#1a202c',
          secondary: '#4a5568',
        },
        divider: 'rgba(234, 88, 12, 0.12)',
        action: {
          hover: 'rgba(234, 88, 12, 0.04)',
          selected: 'rgba(234, 88, 12, 0.08)',
        },
      },
      typography: {
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
      },
      shape: {
        borderRadius: 8,
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
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease-in-out',
            '&:hover': {
              backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)',
              boxShadow: '0 6px 16px rgba(245, 246, 250, 0.9)',
              transform: 'translateY(-2px)',
              },
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
      },
    }, fontFamily),
  }
  
});

interface SimpleThemeContextType {
  currentThemeName: string;
  currentFontFamily: string;
  fontFamilies: typeof fontFamilies;
  themes: ReturnType<typeof createThemes>;
  setTheme: (themeName: string) => void;
  setFontFamily: (fontFamily: string) => void;
  themeSettings: EventAdminThemeSettings;
  isLoading: boolean;
  refreshThemeConfig: () => Promise<void>;
}

const SimpleThemeContext = createContext<SimpleThemeContextType | undefined>(undefined);

export const useSimpleTheme = () => {
  const context = useContext(SimpleThemeContext);
  if (context === undefined) {
    throw new Error('useSimpleTheme must be used within a SimpleThemeProvider');
  }
  return context;
};

interface SimpleThemeProviderProps {
  children: ReactNode;
  eventId?: string; // Event ID for Event Admin users
  isEventAdmin?: boolean; // Simple boolean to indicate if user is Event Admin
}

export function SimpleThemeProvider({ children, eventId, isEventAdmin = false }: SimpleThemeProviderProps) {
  const [currentThemeName, setCurrentThemeName] = useState('default');
  const [currentFontFamily, setCurrentFontFamily] = useState(fontFamilies.nunitosans);
  const [isLoading, setIsLoading] = useState(false);
  const [themeSettings, setThemeSettings] = useState<EventAdminThemeSettings>({
    isThemeAssigned: false,
    canChangeTheme: true, // Everyone can change themes, including Event Admin
  });

  // Function to fetch theme configuration for Event Admin (as initial/default theme)
  const fetchThemeConfig = async () => {
    if (!isEventAdmin || !eventId) return;

    setIsLoading(true);
    try {
      const themeConfig = await getEventAdminThemeConfig(eventId);
      
      if (themeConfig) {
        // Use assigned theme as starting point, but allow changes
        setCurrentThemeName(themeConfig.themeKey);
        
        // Find and set the font family
        const fontFamilyValue = Object.values(fontFamilies).find(
          (_, index) => Object.keys(fontFamilies)[index] === themeConfig.fontKey
        );
        if (fontFamilyValue) {
          setCurrentFontFamily(fontFamilyValue);
        }

        setThemeSettings({
          isThemeAssigned: true,
          themeConfig,
          canChangeTheme: true, // Event Admin can change themes
        });
      } else {
        // No theme assigned, use defaults and allow changes
        setThemeSettings({
          isThemeAssigned: false,
          canChangeTheme: true,
        });
      }
    } catch (error) {
      console.error('Error fetching theme configuration:', error);
      // Fallback to default theme with change capability
      setThemeSettings({
        isThemeAssigned: false,
        canChangeTheme: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshThemeConfig = async () => {
    await fetchThemeConfig();
  };

  useEffect(() => {
    if (isEventAdmin && eventId) {
      // For Event Admin, fetch assigned theme as starting point
      fetchThemeConfig();
    } else {
      // For other roles, load from cookies
      const savedTheme = getCookie('theme');
      const savedFont = getCookie('fontFamily');
      
      if (savedTheme) {
        setCurrentThemeName(savedTheme);
      }
      
      if (savedFont) {
        setCurrentFontFamily(savedFont);
      }

      setThemeSettings({
        isThemeAssigned: false,
        canChangeTheme: true,
      });
    }
  }, [isEventAdmin, eventId]);

  const themes = createThemes(currentFontFamily);
  const currentTheme = themes[currentThemeName as keyof typeof themes]?.theme || themes.default.theme;

  const setTheme = (themeName: string) => {
    setCurrentThemeName(themeName);
    
    // For Event Admin, save to cookies for session persistence
    // For other users, also save to cookies
    setCookie('theme', themeName);
  };

  const setFontFamily = (fontFamily: string) => {
    setCurrentFontFamily(fontFamily);
    
    // For Event Admin, save to cookies for session persistence
    // For other users, also save to cookies
    setCookie('fontFamily', fontFamily);
  };

  const value: SimpleThemeContextType = {
    currentThemeName,
    currentFontFamily,
    fontFamilies,
    themes,
    setTheme,
    setFontFamily,
    themeSettings,
    isLoading,
    refreshThemeConfig,
  };

  return (
    <SimpleThemeContext.Provider value={value}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </SimpleThemeContext.Provider>
  );
} 