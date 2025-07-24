import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'tv';
export type Orientation = 'portrait' | 'landscape';

interface ResponsiveState {
  deviceType: DeviceType;
  orientation: Orientation;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
}

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
}

interface AppState {
  identifier: string;
  responsive: ResponsiveState;
  ui: UIState;
  initialized: boolean;
}

const getDeviceType = (width: number): DeviceType => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1440) return 'laptop';
  if (width < 1920) return 'desktop';
  return 'tv';
};

const initialState: AppState = {
  identifier: '',
  responsive: {
    deviceType: 'desktop',
    orientation: 'landscape',
    screenWidth: 1920,
    screenHeight: 1080,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
  },
  ui: {
    sidebarOpen: true,
    sidebarCollapsed: false,
    theme: 'light',
    loading: false,
    notifications: [],
  },
  initialized: false,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setIdentifier: (state, action: PayloadAction<string>) => {
      state.identifier = action.payload;
    },
    updateResponsiveState: (state, action: PayloadAction<Partial<ResponsiveState>>) => {
      const { screenWidth = state.responsive.screenWidth } = action.payload;
      
      state.responsive = {
        ...state.responsive,
        ...action.payload,
        deviceType: getDeviceType(screenWidth),
        isMobile: screenWidth < 768,
        isTablet: screenWidth >= 768 && screenWidth < 1024,
        isDesktop: screenWidth >= 1024,
      };

      // Auto-collapse sidebar on mobile
      if (state.responsive.isMobile) {
        state.ui.sidebarOpen = false;
      } else if (state.responsive.isDesktop) {
        state.ui.sidebarOpen = true;
        state.ui.sidebarCollapsed = false;
      }
    },
    toggleSidebar: (state) => {
      if (state.responsive.isMobile) {
        state.ui.sidebarOpen = !state.ui.sidebarOpen;
      } else {
        state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
      }
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.ui.sidebarOpen = action.payload;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.ui.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.ui.theme = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.ui.loading = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<AppState['ui']['notifications'][0], 'id' | 'timestamp'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      state.ui.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.ui.notifications = state.ui.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.ui.notifications = [];
    },
    setNotifications: (state, action: PayloadAction<UIState['notifications']>) => {
      state.ui.notifications = action.payload;
    },
    initializeApp: (state, action: PayloadAction<{ identifier: string; responsive: Partial<ResponsiveState> }>) => {
      const { identifier, responsive } = action.payload;
      state.identifier = identifier;
      state.responsive = {
        ...state.responsive,
        ...responsive,
        deviceType: getDeviceType(responsive.screenWidth || state.responsive.screenWidth),
        isMobile: (responsive.screenWidth || state.responsive.screenWidth) < 768,
        isTablet: (responsive.screenWidth || state.responsive.screenWidth) >= 768 && (responsive.screenWidth || state.responsive.screenWidth) < 1024,
        isDesktop: (responsive.screenWidth || state.responsive.screenWidth) >= 1024,
      };
      state.initialized = true;
    },
  },
});

export const {
  setIdentifier,
  updateResponsiveState,
  toggleSidebar,
  setSidebarOpen,
  setSidebarCollapsed,
  setTheme,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setNotifications,
  initializeApp,
} = appSlice.actions;

export default appSlice.reducer; 