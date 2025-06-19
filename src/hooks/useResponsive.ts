import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { RootState, AppDispatch } from '@/store';
import { updateResponsiveState, toggleSidebar, DeviceType } from '@/store/slices/appSlice';

interface ResponsiveUtils {
  // Device detection
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isTV: boolean;
  
  // Device type
  deviceType: DeviceType;
  
  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;
  
  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
  
  // Touch capabilities
  isTouchDevice: boolean;
  
  // Responsive utilities
  getResponsiveValue: <T>(values: ResponsiveValues<T>) => T;
  shouldCollapseSidebar: boolean;
  shouldShowMobileMenu: boolean;
  
  // Actions
  updateDimensions: () => void;
  handleSidebarToggle: () => void;
  
  // Breakpoint utilities
  breakpoints: {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
  };
  
  // Container max widths
  getContainerMaxWidth: () => string | false;
  
  // Grid spacing
  getGridSpacing: () => number;
  
  // Typography scale
  getTypographyScale: () => number;
}

interface ResponsiveValues<T> {
  mobile?: T;
  tablet?: T;
  laptop?: T;
  desktop?: T;
  tv?: T;
  default: T;
}

export const useResponsive = (): ResponsiveUtils => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { responsive, ui } = useSelector((state: RootState) => state.app);
  
  // MUI breakpoints
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Device type calculations
  const isMobile = responsive.screenWidth < 768;
  const isTablet = responsive.screenWidth >= 768 && responsive.screenWidth < 1024;
  const isLaptop = responsive.screenWidth >= 1024 && responsive.screenWidth < 1440;
  const isDesktop = responsive.screenWidth >= 1440 && responsive.screenWidth < 1920;
  const isTV = responsive.screenWidth >= 1920;
  
  // Orientation
  const isPortrait = responsive.orientation === 'portrait';
  const isLandscape = responsive.orientation === 'landscape';
  
  // Update dimensions function
  const updateDimensions = useCallback(() => {
    if (typeof window !== 'undefined') {
      dispatch(updateResponsiveState({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        isTouchDevice: 'ontouchstart' in window,
      }));
    }
  }, [dispatch]);
  
  // Handle sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);
  
  // Responsive value getter
  const getResponsiveValue = useCallback(<T>(values: ResponsiveValues<T>): T => {
    if (isTV && values.tv !== undefined) return values.tv;
    if (isDesktop && values.desktop !== undefined) return values.desktop;
    if (isLaptop && values.laptop !== undefined) return values.laptop;
    if (isTablet && values.tablet !== undefined) return values.tablet;
    if (isMobile && values.mobile !== undefined) return values.mobile;
    return values.default;
  }, [isMobile, isTablet, isLaptop, isDesktop, isTV]);
  
  // Container max width
  const getContainerMaxWidth = useCallback((): string | false => {
    return getResponsiveValue({
      mobile: 'sm',
      tablet: 'md',
      laptop: 'lg',
      desktop: 'xl',
      tv: 'xxl', // No max width for TV
      default: 'lg',
    });
  }, [getResponsiveValue]);
  
  // Grid spacing
  const getGridSpacing = useCallback((): number => {
    return getResponsiveValue({
      mobile: 2,
      tablet: 3,
      laptop: 3,
      desktop: 4,
      tv: 5,
      default: 3,
    });
  }, [getResponsiveValue]);
  
  // Typography scale
  const getTypographyScale = useCallback((): number => {
    return getResponsiveValue({
      mobile: 0.9,
      tablet: 1,
      laptop: 1,
      desktop: 1.1,
      tv: 1.3,
      default: 1,
    });
  }, [getResponsiveValue]);
  
  // Auto-update on window resize
  useEffect(() => {
    const handleResize = () => updateDimensions();
    const handleOrientationChange = () => {
      // Delay to get accurate dimensions after orientation change
      setTimeout(updateDimensions, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Initial update
    updateDimensions();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateDimensions]);
  
  return {
    // Device detection
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isTV,
    
    // Device type
    deviceType: responsive.deviceType,
    
    // Orientation
    isPortrait,
    isLandscape,
    
    // Screen dimensions
    screenWidth: responsive.screenWidth,
    screenHeight: responsive.screenHeight,
    
    // Touch capabilities
    isTouchDevice: responsive.isTouchDevice,
    
    // Responsive utilities
    getResponsiveValue,
    shouldCollapseSidebar: isDesktop && !ui.sidebarCollapsed,
    shouldShowMobileMenu: isMobile,
    
    // Actions
    updateDimensions,
    handleSidebarToggle,
    
    // Breakpoint utilities
    breakpoints: {
      xs: isXs,
      sm: isSm,
      md: isMd,
      lg: isLg,
      xl: isXl,
    },
    
    // Container max widths
    getContainerMaxWidth,
    
    // Grid spacing
    getGridSpacing,
    
    // Typography scale
    getTypographyScale,
  };
};

// Hook for getting responsive CSS values
export const useResponsiveStyles = () => {
  const { getResponsiveValue } = useResponsive();
  
  return {
    padding: getResponsiveValue({
      mobile: '12px',
      tablet: '16px',
      laptop: '20px',
      desktop: '24px',
      tv: '32px',
      default: '16px',
    }),
    
    margin: getResponsiveValue({
      mobile: '8px',
      tablet: '12px',
      laptop: '16px',
      desktop: '20px',
      tv: '24px',
      default: '12px',
    }),
    
    borderRadius: getResponsiveValue({
      mobile: '8px',
      tablet: '12px',
      laptop: '12px',
      desktop: '16px',
      tv: '20px',
      default: '12px',
    }),
    
    fontSize: {
      small: getResponsiveValue({
        mobile: '0.75rem',
        tablet: '0.8rem',
        laptop: '0.85rem',
        desktop: '0.9rem',
        tv: '1rem',
        default: '0.8rem',
      }),
      medium: getResponsiveValue({
        mobile: '0.9rem',
        tablet: '1rem',
        laptop: '1rem',
        desktop: '1.1rem',
        tv: '1.3rem',
        default: '1rem',
      }),
      large: getResponsiveValue({
        mobile: '1.2rem',
        tablet: '1.4rem',
        laptop: '1.5rem',
        desktop: '1.7rem',
        tv: '2rem',
        default: '1.4rem',
      }),
    },
  };
};

// Hook for responsive animations
export const useResponsiveAnimations = () => {
  const { deviceType, isTouchDevice } = useResponsive();
  
  return {
    // Reduce animations on mobile for performance
    shouldReduceMotion: deviceType === 'mobile' || isTouchDevice,
    
    // Animation durations
    duration: {
      fast: deviceType === 'mobile' ? 0.15 : 0.2,
      normal: deviceType === 'mobile' ? 0.2 : 0.3,
      slow: deviceType === 'mobile' ? 0.3 : 0.5,
    },
    
    // Easing functions
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Spring configs for framer-motion
    spring: {
      type: 'spring',
      damping: deviceType === 'mobile' ? 25 : 20,
      stiffness: deviceType === 'mobile' ? 300 : 200,
    },
  };
};

export default useResponsive; 