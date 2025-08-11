// API service for Event Admin theme management
export interface ThemeConfig {
  id: string;
  eventId: string;
  themeKey: string;
  fontKey: string;
  themeName: string;
  fontName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // IT Admin ID from different project
}

export interface EventAdminThemeSettings {
  isThemeAssigned: boolean;
  themeConfig?: ThemeConfig;
  canChangeTheme: boolean; // Will be true for Event Admin
}

export interface AvailableTheme {
  key: string;
  name: string;
  description: string;
  preview: string;
}

export interface AvailableFont {
  key: string;
  name: string;
  fontFamily: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Get available themes for Event Admin customization
export const getAvailableThemes = async (): Promise<AvailableTheme[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/themes/available`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available themes');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching available themes:', error);
    throw error;
  }
};

// Get available fonts for Event Admin customization
export const getAvailableFonts = async (): Promise<AvailableFont[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/fonts/available`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available fonts');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching available fonts:', error);
    throw error;
  }
};

// For Event Admin - Get assigned theme configuration (as starting point)
export const getEventAdminThemeConfig = async (eventId: string): Promise<ThemeConfig | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/theme`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No theme assigned yet
      }
      throw new Error('Failed to fetch theme configuration');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching theme configuration:', error);
    throw error;
  }
};

import { getAuthToken as getAuthTokenFromCookie } from '@/utils/cookieManager';

// Helper function to get auth token (implement based on your auth system)
function getAuthToken(): string {
  // Implement based on your authentication system
  // This could be from localStorage, cookies, or context
  return getAuthTokenFromCookie() || '';
} 