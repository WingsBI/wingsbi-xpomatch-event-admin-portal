'use client';

import React, { ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { useInView } from 'react-intersection-observer';
import { SimpleThemeSelector } from '@/components/theme/SimpleThemeSelector';
import { eventsApi } from '@/services/apiService';
import { notificationsApi } from '@/services/apiService';
import { ApiEventDetails } from '@/types';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import { getCurrentUserId } from '@/utils/authUtils';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Fab,
  Collapse,
  Badge,
  Tooltip,
  Container,
  Paper,
  Breadcrumbs,
  Link,
  Chip,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Event,
  Person,
  Business,
  Handshake,
  Science,
  Settings,
  Logout,
  AdminPanelSettings,
  Notifications,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Home,
  KeyboardArrowUp,
  Close,
  Brightness4,
  Brightness7,
  Fullscreen,
  FullscreenExit,
  Palette,
  CalendarMonth,
  Favorite as FavoriteIcon,
  Search,
  RocketLaunch,
  Security,
  Build,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '@/store';
import {
  toggleSidebar,
  setSidebarOpen,
  updateResponsiveState,
  setTheme,
  removeNotification,
  DeviceType,
  setIdentifier,
  setNotifications
} from '@/store/slices/appSlice';
import { logoutUser } from '@/store/slices/authSlice';
import { useRoleAccess } from '@/context/RoleAccessContext';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import NotificationProvider from '../providers/NotificationProvider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Person2RoundedIcon from '@mui/icons-material/Person2Rounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

interface ResponsiveDashboardLayoutProps {
  children: ReactNode;
  title: string | ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

interface NavigationItem {
  text: string;
  icon?: React.ReactNode;
  href?: string;
  children: NavigationItem[];
}

const getNavigationItems = (userRole: string, deviceType: DeviceType, identifier: string, permissions: any): NavigationItem[] => {
  let baseItems: NavigationItem[] = [];
  
  if (userRole === 'visitor') {
    // Visitor-specific navigation with role-based permissions
    baseItems = [
      { text: 'Dashboard', icon: <Dashboard />, href: `/${identifier}/dashboard/visitor_dashboard`, children: [] },
    ];
    
    // Show Visitors tab only if visitor permission is true
    if (permissions?.visitor) {
      baseItems.push({ text: 'Visitors', icon: <Person />, href: `/${identifier}/visitors`, children: [] });
    }
    
    // Show Exhibitors tab only if exhibitor permission is true
    if (permissions?.exhibitor) {
      baseItems.push({ text: 'Exhibitors', icon: <Business />, href: `/${identifier}/exhibitors`, children: [] });
    }
    
    // Show Meetings tab only if setMeeting permission is true
    if (permissions?.setMeeting) {
      baseItems.push({
        text: 'Meetings', 
        icon: <CalendarMonth />, 
        children: [
          { text: 'My Meetings', href: `/${identifier}/meetings?view=calendar`, children: [] },
          { text: 'My Invites', href: `/${identifier}/meetings?view=list`, children: [] },
        ]
      });
    }
    
    // Show Favourites tab only if isFavorite permission is true
    if (permissions?.isFavorite) {
      baseItems.push({ text: 'My Favourites', icon: <FavoriteIcon />, href: `/${identifier}/favourites`, children: [] });
    }
    
    
  } else if (userRole === 'exhibitor') {
    // Exhibitor-specific navigation with role-based permissions
    baseItems = [
      { text: 'Dashboard', icon: <Dashboard />, href: `/${identifier}/dashboard/exhibitor_dashboard`, children: [] },
      
    ];
    
    // Show Visitors tab only if visitor permission is true
    if (permissions?.visitor) {
      baseItems.push({ text: 'Visitors', icon: <Person />, href: `/${identifier}/visitors`, children: [] });
    }
    
    // Show Exhibitors tab only if exhibitor permission is true
    if (permissions?.exhibitor) {
      baseItems.push({ text: 'Exhibitors', icon: <Business />, href: `/${identifier}/exhibitors`, children: [] });
    }
    
    // Show Meetings tab only if setMeeting permission is true
    if (permissions?.setMeeting) {
      baseItems.push({
        text: 'Meetings', 
        icon: <CalendarMonth />, 
        children: [
          { text: 'My Meetings', href: `/${identifier}/meetings?view=calendar`, children: [] },
          { text: 'My Invites', href: `/${identifier}/meetings?view=list`, children: [] },
        ]
      });
    }
    
    // Show Favourites tab only if isFavorite permission is true
    if (permissions?.isFavorite) {
      baseItems.push({ text: 'My Favourites', icon: <FavoriteIcon />, href: `/${identifier}/favourites`, children: [] });
    }
    baseItems.push({ text: 'Interested Users', icon: <HowToRegIcon />, href: `/${identifier}/exhibitors/interested_user`, children: [] });
    
    baseItems.push({
      text: 'Settings', 
      icon: <Settings />, 
      children: [
         { text: 'Exhibitor Profile', href: `/${identifier}/dashboard/exhibitor_dashboard/exhibitor_details`, children: [] },
      ]
    });
   
    
  } else {
    // Default for event-admin role - full navigation (event-admin has all permissions)
    baseItems = [
      { text: 'Dashboard', icon: <DashboardOutlinedIcon />, href: `/${identifier}/dashboard`, children: [] },
      { text: 'Visitors', icon: <PeopleAltOutlinedIcon />, href: `/${identifier}/visitors`, children: [] },
      { text: 'Exhibitors', icon: <GroupAddOutlinedIcon />, href: `/${identifier}/exhibitors`, children: [] },
      { text: 'Meetings', icon: <DateRangeOutlinedIcon />, children: [
        { text: 'My Meetings', href: `/${identifier}/meetings?view=calendar`, children: [] },
        { text: 'My Invites', href: `/${identifier}/meetings?view=list`, children: [] },
      ] },
      { text: 'Settings', icon: <SettingsOutlinedIcon />, children: [
        { text: 'Theme Settings', href: '#', children: [] },
        { text: 'Visitors Onboarding', href: `/${identifier}/visitors/matching`, children: [] },
        { text: 'Exhibitors Onboarding', href: `/${identifier}/exhibitors/matching`, children: [] },
        { text: 'Matchmaking Settings', href: `/${identifier}/weightage`, children: [] },
        { text: 'Role Based Settings', href: `/${identifier}/exhibitor_visitor_settings`, children: [] },
        { text: 'Simulation', href: `/${identifier}/simulation`, children: [] },
      
    ]},
    ];
  }

  return baseItems;
};

export default function ResponsiveDashboardLayout({
  children,
  title,
  breadcrumbs = []
}: ResponsiveDashboardLayoutProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  // Redux state
  const {
    identifier,
    responsive,
    ui
  } = useSelector((state: RootState) => state.app);
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  // Role-based access permissions
  const { permissions } = useRoleAccess();

  // Define searchable pages
  const searchablePages = [
    {
      title: 'Dashboard',
      path: `/${identifier}/dashboard`,
      description: 'Main dashboard overview'
    },
    {
      title: 'Visitor Dashboard',
      path: `/${identifier}/dashboard/visitor_dashboard`,
      description: 'Visitor dashboard and exhibitor details'
    },
    {
      title: 'Exhibitor Dashboard',
      path: `/${identifier}/dashboard/exhibitor_dashboard`,
      description: 'Exhibitor dashboard'
    },
    {
      title: 'Exhibitors',
      path: `/${identifier}/exhibitors`,
      description: 'Manage exhibitors'
    },
    {
      title: 'Exhibitor Details',
      path: `/${identifier}/exhibitors/details`,
      description: 'View detailed exhibitor information'
    },
    {
      title: 'Exhibitors Onboarding',
      path: `/${identifier}/exhibitors/matching`,
      description: 'Map exhibitor fields'
    },
    {
      title: 'Visitors',
      path: `/${identifier}/visitors`,
      description: 'Manage visitors'
    },
    {
      title: 'Visitors Onboarding',
      path: `/${identifier}/visitors/matching`,
      description: 'Map visitor fields'
    },
   
  ];

  // Handle page navigation from search
  const handlePageSelect = (selectedPage: any) => {
    if (selectedPage && selectedPage.path) {
      router.push(selectedPage.path);
    }
  };

  // Local state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Restore expanded state from localStorage on initial load
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`expanded-nav-${identifier}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [eventDetails, setEventDetails] = useState<ApiEventDetails | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [notifications, setNotificationsLocal] = useState<any[]>([]);

  // Responsive breakpoints using custom theme breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 960px
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 960px - 1280px
  const isDesktop = useMediaQuery(theme.breakpoints.between('lg', 'xl')); // 1280px - 1920px
  const isLargeMonitor = useMediaQuery(theme.breakpoints.up('xl')); // >= 1920px
  const isTV = useMediaQuery('(min-width: 2560px)'); // >= 2560px (xxl)

  // More aggressive detection - hide sidebar when viewport is narrow
  // This catches zoom scenarios better - lowered threshold for zoom support
  const shouldHideSidebar = useMediaQuery('(max-width: 1200px)') ||
    responsive.screenWidth < 1200 ||
    isTablet;

  // Force hide for very narrow viewports with better zoom detection - but NOT for mobile
  const [currentViewport, setCurrentViewport] = useState({ width: 0, height: 0 });
  const forceHideSidebar = !isMobile && (currentViewport.width < 1200 || shouldHideSidebar);

  // Dynamic drawer width based on device
  const getDrawerWidth = () => {
    if (forceHideSidebar) return 0; // Return 0 when hidden

    // Handle collapsed state for all device types
    if (ui.sidebarCollapsed) return 64;

    if (isTV) return 220; // TV screens (>= 2560px) - reduced from 240
    if (isLargeMonitor) return 200; // Large monitors (>= 1920px) - reduced from 220
    if (isDesktop) return 180; // Desktop (1280px - 1920px) - reduced from 200
    if (isTablet) return 160; // Tablet (960px - 1280px) - reduced from 180
    return 180; // Default width - reduced from 200
  };

  const drawerWidth = getDrawerWidth();

  // Track viewport changes more accurately
  useEffect(() => {
    const updateViewport = () => {
      setCurrentViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Auto-hide sidebar when conditions are met - more aggressive
  useEffect(() => {
    console.log('Sidebar check:', {
      shouldHideSidebar,
      forceHideSidebar,
      sidebarOpen: ui.sidebarOpen,
      screenWidth: responsive.screenWidth,
      currentViewportWidth: currentViewport.width,
      drawerWidth,
      isMobile,
      responsiveIsMobile: responsive.isMobile
    });

    // Only auto-hide on desktop when viewport is too narrow, not on mobile
    if (forceHideSidebar && ui.sidebarOpen && !isMobile) {
      console.log('Hiding sidebar due to narrow viewport');
      dispatch(setSidebarOpen(false));
    }
  }, [shouldHideSidebar, forceHideSidebar, ui.sidebarOpen, responsive.screenWidth, currentViewport.width, isMobile, dispatch]);

  // Load event details
  const loadEventDetails = useCallback(async () => {
    try {
      setEventLoading(true);
      
      if (!identifier) {
        console.warn('⚠️ No identifier available for event details load');
        return;
      }
      
      console.log('🔍 Loading event details in layout for identifier:', identifier);
      const response = await eventsApi.getEventDetails(identifier);
      
      console.log('🔍 Layout event details response:', {
        success: response.success,
        status: response.status,
        hasData: !!response.data,
        hasResult: !!(response.data?.result),
        resultType: Array.isArray(response.data?.result) ? 'array' : typeof response.data?.result,
        resultLength: Array.isArray(response.data?.result) ? response.data.result.length : 'N/A'
      });
      
      if (response.success && response.data?.result && response.data.result.length > 0) {
        const eventData = response.data.result[0];
        // Clean the event title by removing "exhibitor" text (case insensitive)
        if (eventData.title) {
          eventData.title = eventData.title.replace(/exhibitor/gi, '').trim();
        }
        setEventDetails(eventData);
        console.log('✅ Event details loaded in layout:', eventData.title);
      } else {
        console.warn('⚠️ No event details found in layout response:', response);
      }
    } catch (error: any) {
      console.error('❌ Error loading event details in layout:', {
        message: error.message,
        status: error.response?.status,
        identifier
      });
      
      // Don't set error state in layout to avoid breaking the UI
      // Just log the error for debugging
    } finally {
      setEventLoading(false);
    }
  }, [identifier]);

  // Load event details on mount
  useEffect(() => {
    if (identifier) {
      loadEventDetails();
    }
  }, [loadEventDetails]);

  // Fetch notifications on mount or when identifier changes
  const fetchNotifications = useCallback(async () => {
    if (!identifier || !user) return;
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('No user ID available for fetching notifications');
        return;
      }
      
      const response = await notificationsApi.getAllNotification(identifier, userId);
      if (response.success && Array.isArray(response.data?.result)) {
        setNotificationsLocal(response.data.result);
        // Don't add notifications to Redux store to avoid system toast messages
        // Only keep the local state for dropdown display
        dispatch(setNotifications([]));
      } else {
        setNotificationsLocal([]);
        dispatch(setNotifications([]));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotificationsLocal([]);
      dispatch(setNotifications([]));
    }
  }, [identifier, user, dispatch]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Update responsive state
  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      dispatch(updateResponsiveState({
        screenWidth,
        screenHeight,
        orientation: screenWidth > screenHeight ? 'landscape' : 'portrait',
        isTouchDevice: 'ontouchstart' in window,
      }));
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, [dispatch]);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && ui.sidebarOpen) {
        dispatch(setSidebarOpen(false));
      }
    },
    onSwipedRight: () => {
      if (isMobile && !ui.sidebarOpen) {
        dispatch(setSidebarOpen(true));
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  const handleDrawerToggle = useCallback(() => {
    console.log('Drawer toggle clicked:', {
      responsiveIsMobile: responsive.isMobile,
      localIsMobile: isMobile,
      screenWidth: responsive.screenWidth,
      currentViewportWidth: currentViewport.width,
      sidebarOpen: ui.sidebarOpen,
      sidebarCollapsed: ui.sidebarCollapsed
    });

    // Use local isMobile for more reliable detection
    if (isMobile || responsive.screenWidth < 960) {
      // For mobile, toggle the sidebarOpen state
      console.log('Mobile: toggling sidebarOpen from', ui.sidebarOpen, 'to', !ui.sidebarOpen);
      dispatch(setSidebarOpen(!ui.sidebarOpen));
    } else {
      // For desktop, toggle the sidebarCollapsed state
      console.log('Desktop: toggling sidebarCollapsed from', ui.sidebarCollapsed, 'to', !ui.sidebarCollapsed);
      dispatch(toggleSidebar());
    }
  }, [dispatch, responsive.isMobile, responsive.screenWidth, isMobile, currentViewport.width, ui.sidebarOpen, ui.sidebarCollapsed]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser({ identifier, token: token || undefined }));

      // Manually update the identifier in Redux before navigation
      dispatch(setIdentifier(identifier));

      // Use setTimeout to avoid navigation conflicts
      setTimeout(() => {
        router.push(`/${identifier}`);
      }, 50);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear state and redirect
      setTimeout(() => {
        router.push(`/${identifier}`);
      }, 50);
    }
  };

  const handleThemeToggle = () => {
    dispatch(setTheme(ui.theme === 'light' ? 'dark' : 'light'));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExpandClick = (itemText: string) => {
    setExpandedItems(prev => {
      const newExpanded = prev.includes(itemText)
        ? prev.filter(item => item !== itemText)
        : [...prev, itemText];
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`expanded-nav-${identifier}`, JSON.stringify(newExpanded));
      }
      
      return newExpanded;
    });
  };

  // handleNotificationClose function removed - no longer needed since system notifications are disabled

  const handleThemeDialogOpen = () => {
    // Close sidebar on mobile
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
    
    // Find and click the hidden theme selector button
    setTimeout(() => {
      const themeButton = document.querySelector('[data-theme-selector-button] button') as HTMLButtonElement;
      if (themeButton) {
        themeButton.click();
      }
    }, 100);
  };

  // Memoize navigation items to prevent recalculation on every render
  const navigationItems = useMemo(() => {
    const items = getNavigationItems(user?.role || 'event-admin', responsive.deviceType, identifier, permissions);
    
    // Return items directly without dividers
    return items;
  }, [user?.role, responsive.deviceType, identifier, permissions]);

  // Auto-expand parent items based on current path
  useEffect(() => {
    const autoExpandForCurrentPath = () => {
      const currentPath = pathname;
      let shouldExpand: string[] = [];

      navigationItems.forEach(item => {
        if (item.children && item.children.length > 0) {
          const hasActiveChild = item.children.some(child => 
            child.href && currentPath.includes(child.href.split('?')[0])
          );
          if (hasActiveChild) {
            shouldExpand.push(item.text);
          }
        }
      });

      if (shouldExpand.length > 0) {
        setExpandedItems(prev => {
          const newExpanded = Array.from(new Set([...prev, ...shouldExpand]));
          // Persist to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(`expanded-nav-${identifier}`, JSON.stringify(newExpanded));
          }
          return newExpanded;
        });
      }
    };

    autoExpandForCurrentPath();
  }, [pathname, navigationItems, identifier]);

  // Optimized navigation item renderer - defined before drawerContent
  const renderNavigationItem = useCallback((item: any, level = 0) => {

    return (
      <React.Fragment key={item.text}>
      <ListItem disablePadding sx={{ 
        mb: level === 0 ? 0.5 : 0.25, 
        pl: level * 1.5,
        '&:last-child': {
          mb: 0
        }
      }}>
        <ListItemButton
          selected={item.href ? pathname === item.href : false}
          onClick={() => {
            // If sidebar is collapsed and this is a top-level item, expand sidebar first
            if (ui.sidebarCollapsed && level === 0 && !isMobile) {
              dispatch(toggleSidebar());
              return;
            }
            
            if (item.text === 'Theme Settings') {
              handleThemeDialogOpen();
            } else if (item.children && item.children.length > 0) {
              handleExpandClick(item.text);
            } else {
              console.log('Navigating to:', item.href);
              // Use replace for faster navigation and avoid browser back issues
              router.push(item.href);
              if (isMobile) {
                dispatch(setSidebarOpen(false));
              }
            }
          }}
          sx={{
            //borderRadius: level === 0 ? 2 : 1.5,
            minHeight: ui.sidebarCollapsed && level === 0 ? 30 : level === 0 ? 26 : 22,
            py: level === 0 ? 0.75 : 0.5,
            px: level === 0 ? 1 : 0.75,
            transition: 'all 0.2s ease-in-out',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s ease-in-out'
            },
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              color: 'text.primary',
              transform: 'translateX(2px)',
              '&::before': {
                backgroundColor: 'theme.palette.secondary.main'
              },
              '& .MuiListItemIcon-root': {
                color: 'black',
                transform: 'scale(1.1)'
              },
              '& .MuiListItemText-primary': {
                fontWeight: level === 0 ? 700 : 600,
                color: 'black'
              }
            },
            '&.Mui-selected': {
              backgroundColor: theme.palette.secondary.main,
              color: 'white',
              '&::before': {
                backgroundColor: 'white'
              },
              '& .MuiListItemIcon-root': {
                color: 'white'
              },
              '& .MuiListItemText-primary': {
                fontWeight: 900,
                color: 'white'
              },
              '&:hover': {
                backgroundColor: theme.palette.secondary.main,
                color: 'white',
                transform: 'translateX(2px)',
                '&::before': {
                  backgroundColor: 'white'
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                  transform: 'scale(1.1)'
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 900,
                  color: 'white'
                }
              }
            }
          }}
        >
          {item.icon && level === 0 && (
            <Tooltip 
              title={ui.sidebarCollapsed ? item.text : ''} 
              placement="right"
              disableHoverListener={!ui.sidebarCollapsed}
            >
              <ListItemIcon sx={{
                minWidth: ui.sidebarCollapsed ? 0 : 32,
                justifyContent: 'center',
                color: 'text.secondary',
                transition: 'all 0.2s ease-in-out',
                '& svg': {
                  fontSize: '1.1rem'
                }
              }}>
                {item.icon}
              </ListItemIcon>
            </Tooltip>
          )}

          {/* Enhanced bullet point for child items */}
          {level > 0 && (
            <Box sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'text.secondary',
              mr: 2,
              ml: 0.5,
              flexShrink: 0,
              opacity: 0.6,
              transition: 'all 0.2s ease-in-out',
              '.MuiListItemButton:hover &': {
                backgroundColor: 'white',
                opacity: 1
              },
              '.MuiListItemButton.Mui-selected &': {
                backgroundColor: 'white',
                opacity: 1
              }
            }} />
          )}

          {(!ui.sidebarCollapsed || isMobile) && (
            <>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  variant: level === 0 ? 'body1' : 'body2',
                  fontWeight: level === 0 ? 500 : 400,
                  lineHeight: 1.2,
                  color: level > 0 ? 'text.secondary' : 'text.primary'
                }}
                sx={{
                  '& .MuiListItemText-primary': {
                    transition: 'font-weight 0.2s ease-in-out'
                  }
                }}
              />
              {item.children && item.children.length > 0 && (
                <IconButton 
                  size="small" 
                  sx={{ 
                    p: 0.5,
                    color: 'text.secondary',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }
                  }}
                >
                  {expandedItems.includes(item.text) ? 
                    <ExpandLess sx={{ fontSize: '1.1rem' }} /> : 
                    <ExpandMore sx={{ fontSize: '1.1rem' }} />
                  }
                </IconButton>
              )}
            </>
          )}
        </ListItemButton>
      </ListItem>

             {/* Render children in a separate fragment to prevent parent from moving */}
       {item.children && item.children.length > 0 && (!ui.sidebarCollapsed || isMobile) && (
         <Collapse in={expandedItems.includes(item.text)} timeout="auto" unmountOnExit>
           <List component="div" disablePadding sx={{ 
             pl: 1,
             mt: 0.5,
             '& .MuiListItem-root': {
               mb: 0.25
             }
           }}>
             {item.children.map((child: any) => renderNavigationItem(child, level + 1))}
           </List>
         </Collapse>
       )}
     </React.Fragment>
   );
   }, [ui.sidebarCollapsed, isMobile, expandedItems, dispatch, router, handleThemeDialogOpen, handleExpandClick, pathname]);

  // Memoize drawer content to prevent re-renders
  const drawer = useMemo(() => (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      pt: '64px',
      background: 'white',
      borderRight: '1px solid rgba(0, 0, 0, 0.08)'
    }}>
     

      {/* Navigation */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: ui.sidebarCollapsed ? 0.5 : 1.5, 
        pt: ui.sidebarCollapsed ? 0.5 : 1
      }}>
        <List sx={{ 
          py: 0,
          '& .MuiListItem-root': {
            marginBottom: 0.5,
            animation: 'fadeInUp 0.3s ease-out'
          },
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(10px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}>
          {navigationItems.map((item, index) => (
            <Box
              key={item.text}
              sx={{
                animationDelay: `${index * 0.05}s`
              }}
            >
              {renderNavigationItem(item)}
            </Box>
          ))}
        </List>
      </Box>

      {/* Collapse button for desktop */}
      {!isMobile && (
        <Box sx={{ 
          p: 1, 
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <Tooltip title={ui.sidebarCollapsed ? 'Expand' : 'Collapse'}>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                width: '100%',
                justifyContent: 'center',
                color: 'text.secondary',
                py: 1,
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  color: 'text.primary',
                  transform: 'translateY(-1px)'
                },
                '& svg': {
                  fontSize: '1.2rem',
                  transition: 'transform 0.2s ease-in-out'
                },
                '&:hover svg': {
                  transform: ui.sidebarCollapsed ? 'translateX(2px)' : 'translateX(-2px)'
                }
              }}
            >
              {ui.sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  ), [navigationItems, ui.sidebarCollapsed, isMobile, handleDrawerToggle, renderNavigationItem]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }} {...swipeHandlers}>
              {/* Prefetch all navigation items to speed up subsequent tab loads */}
      {identifier && navigationItems && (
        <>
          {navigationItems.map(item => {
            if (item.href) {
              return <link key={item.href} rel="prefetch" href={item.href} as="document" />;
            }
            if (item.children) {
              return item.children.map(child => 
                child.href ? <link key={child.href} rel="prefetch" href={child.href} as="document" /> : null
              );
            }
            return null;
          })}
        </>
      )}
      {/* Unified Header Bar - spans full width */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: 'calc(100% - 16px)' },
         // background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.primary.main} 100%)`,
         background: theme.palette.primary.main,
         color: 'white',
          boxShadow: 'none',
          height: '60px',
          borderBottom: 'none',
          zIndex: theme.zIndex.drawer + 1,
          borderRadius: { md: '0 0 16px 16px' },
          margin: { md: '0 8px' },
        }}
      >
        <Toolbar variant={isMobile ? 'dense' : 'regular'} sx={{ px: 2, minHeight: '60px !important' }}>
          {/* Left Section - Sidebar Brand (Desktop) / Mobile Menu */}
          <Box sx={{
            width: {
              xs: '60%',
              md: forceHideSidebar ? '0px' : ui.sidebarCollapsed ? '0px' : `${drawerWidth + 200}px`
            },
            display: {
              xs: 'flex',
              md: forceHideSidebar ? 'none' : ui.sidebarCollapsed ? 'none' : 'flex'
            },
            alignItems: 'center',
            px: { xs: 1, md: ui.sidebarCollapsed ? 1 : 2 },
            minHeight: '64px',
            transition: theme.transitions.create(['width', 'padding'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            
            flexShrink: 0, // Prevent shrinking
            overflow: 'hidden', // Prevent content overflow
          }}>
            {/* Mobile hamburger menu */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 1,
                display: { xs: 'block', md: 'none' },
                minWidth: 'auto',
                color: 'white'
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Desktop Brand */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', width: '100%' , ml: -2  }}>
              {!ui.sidebarCollapsed && (
                <Box>
                   
                  <Typography variant="h5" fontWeight="bold"  noWrap sx={{ color: theme.palette.secondary.dark, fontWeight: 700,fontSize: '1.5rem',lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {eventDetails?.title}
                   
                   </Typography>
                  
                </Box>
              )}
            </Box>

            {/* Mobile Brand */}
            <Typography
              variant="h6"
              noWrap
              sx={{
                display: { xs: 'block', md: 'none' },
                fontWeight: 'bold',
                color: theme.palette.secondary.main,
                lineHeight: 1.2,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {  eventDetails?.title}
            </Typography>
          </Box>

          {/* Center Section - Search Bar and Page Title */}
          <Box sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { 
              xs: 1, 
              md: ui.sidebarCollapsed ? 1 : 1 
            },
            pl: { 
              xs: 0, 
              md: ui.sidebarCollapsed ? 4 : 1
            },
            minWidth: 0, // Allow content to shrink
            overflow: 'hidden' // Prevent overflow
          }}>
            {/* Search Bar */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 1, ml: 0 }}>
              <Autocomplete
                options={searchablePages}
                getOptionLabel={(option) => option.title}
                onChange={(event, value) => handlePageSelect(value)}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search Anything..."
                    variant="outlined"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <Search sx={{ color: 'white', mr: 1, opacity: 0.7 }} />,
                      sx: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'white',
                        },
                        '& input': {
                          color: 'text.secondary',
                        },
                        '& input::placeholder': {
                          color: 'text.secondary',
                          opacity: 0.7,
                        },
                      },
                    }}
                  />
                )}
                PaperComponent={(props) => (
                  <Paper 
                    {...props} 
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }} 
                  />
                )}
                sx={{ minWidth: 300, maxWidth: 400 }}
              />
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              

              {breadcrumbs.length > 0 && !responsive.isMobile && (
                <Breadcrumbs 
                  aria-label="breadcrumb"
                  sx={{
                    mt: 0.5,
                    '& .MuiBreadcrumbs-separator': { color: 'rgba(255,255,255,0.7)' }
                  }}
                >
                  <Link color="inherit" href="/" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    <Home sx={{ mr: 0.5 }} fontSize="inherit" />
                    Home
                  </Link>
                  {breadcrumbs.map((crumb, index) => (
                    <Typography key={index} sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      {crumb.label}
                    </Typography>
                  ))}
                </Breadcrumbs>
              )}
            </Box>

            {/* Action buttons */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.25, md: 1 },
              flexShrink: 0, // Prevent buttons from shrinking
              pl: { xs: 0.5, md: 1 }
            }}>
              {/* {!responsive.isMobile && !forceHideSidebar && (
              <>
                <Tooltip title="Toggle theme">
                    <IconButton onClick={handleThemeToggle} sx={{ color: 'white', p: 1 }}>
                    {ui.theme === 'dark' ? <Brightness7 /> : <Brightness4 />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Toggle fullscreen">
                    <IconButton onClick={toggleFullscreen} sx={{ color: 'white', p: 1 }}>
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Tooltip>
              </>
            )} */}

              {/* Welcome Message */}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  mr: 1,
                  fontWeight: 700,
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Welcome, {user?.firstName} {user?.lastName}!
              </Typography>

              <NotificationDropdown
                notifications={notifications}
                onNotificationClick={(notification) => {
                  console.log('Notification clicked:', notification);
                  // Handle notification click here - you could navigate to a specific page
                  // or show more details
                }}
                 onMarkAsRead={async (notificationId) => {
                   try {
                     // Update locally first for immediate UI feedback
                     setNotificationsLocal(prev => prev.map(n => 
                       n.id === notificationId ? { ...n, isRead: true } : n
                     ));
                     
                     // Call API to mark as read on server
                     await notificationsApi.markAsRead(identifier, notificationId);
                     
                     // Refresh the full notification list to ensure badge count is accurate
                     setTimeout(() => {
                       fetchNotifications();
                     }, 100);
                   } catch (error) {
                     console.error('Error marking notification as read:', error);
                     // Revert local change on error
                     setNotificationsLocal(prev => prev.map(n => 
                       n.id === notificationId ? { ...n, isRead: false } : n
                     ));
                   }
                 }}
                onIconClick={async () => {
                  try {
                    const userId = getCurrentUserId();
                    if (!userId) {
                      console.warn('No user ID available for updating notification read status');
                      return;
                    }
                    
                    // Call the UpdateNotificationReadStatus API
                    console.log('Calling UpdateNotificationReadStatus API...');
                    await notificationsApi.updateNotificationReadStatus(identifier, userId);
                    console.log('UpdateNotificationReadStatus API called successfully');
                  } catch (error) {
                    console.error('Error calling UpdateNotificationReadStatus API:', error);
                  }
                }}
                onClearNotification={async (notificationId) => {
                  try {
                    const userId = getCurrentUserId();
                    if (!userId) {
                      console.warn('No user ID available for clearing notification');
                      return;
                    }
                    
                    // Remove notification locally first for immediate UI feedback
                    setNotificationsLocal(prev => prev.filter(n => n.id !== notificationId));
                    
                    // Call API to clear specific notification
                    console.log('Calling ClearAllNotifications API for single notification:', notificationId);
                    await notificationsApi.clearAllNotifications(identifier, userId, notificationId);
                    console.log('Single notification cleared successfully');
                    
                    // Refresh the full notification list to ensure badge count is accurate
                    setTimeout(() => {
                      fetchNotifications();
                    }, 100);
                  } catch (error) {
                    console.error('Error clearing notification:', error);
                    // Refresh notifications on error to get correct state
                    fetchNotifications();
                  }
                }}
                onClearAllNotifications={async () => {
                  try {
                    const userId = getCurrentUserId();
                    if (!userId) {
                      console.warn('No user ID available for clearing all notifications');
                      return;
                    }
                    
                    // Clear all notifications locally first for immediate UI feedback
                    setNotificationsLocal([]);
                    
                    // Call API to clear all notifications
                    console.log('Calling ClearAllNotifications API for all notifications');
                    await notificationsApi.clearAllNotifications(identifier, userId);
                    console.log('All notifications cleared successfully');
                    
                    // Refresh the full notification list to ensure badge count is accurate
                    setTimeout(() => {
                      fetchNotifications();
                    }, 100);
                  } catch (error) {
                    console.error('Error clearing all notifications:', error);
                    // Refresh notifications on error to get correct state
                    fetchNotifications();
                  }
                }}
                onRefresh={fetchNotifications}
              />

              <Tooltip 
                componentsProps={{
                  tooltip: {
                    sx: { bgcolor: 'background.paper', color: 'text.primary' }
                  }
                }}
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {user?.role === 'visitor' || user?.role === 'event-admin'? (
                      <Person sx={{ fontSize: 20 }} />
                    ) : (
                      <Business sx={{ fontSize: 20 }} />
                    )}
                    <span>{`${user?.firstName} ${user?.lastName}`}</span>
                  </Box>
                }
              >
                <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, color: 'white' }}>
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            PaperProps={{
              sx: { mt: 1, minWidth: 200 },
            }}
          >
           <MenuItem onClick={() => router.push(`/${identifier}/profile`)}>
              <ListItemIcon>
              <Person fontSize="small" />
              </ListItemIcon>
                  Profile Settings
              </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
             
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { xs: 0, md: forceHideSidebar ? 0 : drawerWidth },
          flexShrink: { md: 0 },
          display: { xs: 'block', md: forceHideSidebar ? 'none' : 'block' }
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? ui.sidebarOpen : !ui.sidebarCollapsed}
          onClose={() => dispatch(setSidebarOpen(false))}
          ModalProps={{
            keepMounted: true,
            disableEnforceFocus: true,
            disableAutoFocus: true,
            disableRestoreFocus: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none', // Remove default border
              transition: theme.transitions.create(['width', 'transform'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              backgroundColor: 'theme.palette.primary.main',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              borderRadius: { md: '0 16px 16px 0' }, // Elegant rounded right edge
              margin: { md: '8px 0 8px 8px' }, // Add margin for border radius
              height: { md: 'calc(100vh - 16px)' }, // Adjust height for margin
              overflow: 'hidden', // Ensure content doesn't overflow rounded corners
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            xs: '100%',
            md: forceHideSidebar ? '100%' : `calc(100% - ${drawerWidth}px)`
          },
          mt: { xs: 7, md: 7 },
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'background.default',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ml: { md: forceHideSidebar ? 0 : 1 }, // Add small margin when sidebar is visible
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            p: {
              xs: 1.5,    // Mobile
              sm: 2,      // Large phones
              md: 2.5,    // Tablets
              lg: 3,      // Desktop
              xl: 3.5,    // Large monitors
            },
            maxWidth: isTV ? '90%' : '100%',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </Container>
      </Box>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <Fab
              color="primary"
              aria-label="scroll to top"
              onClick={scrollToTop}
              size="small"
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: theme.zIndex.speedDial,
              }}
            >
              <KeyboardArrowUp fontSize="small" />
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Notifications - Disabled to prevent auto-showing notifications from API */}
      {/* 
      {ui.notifications.map((notification: any) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={6000}
          onClose={() => handleNotificationClose(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={() => handleNotificationClose(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ 
              width: '100%',
              '& .MuiAlert-message': {
                color: '#000000 !important'
              }
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
      */}

      {/* Hidden Theme Selector for programmatic access */}
      <Box sx={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}>
        <div data-theme-selector-button>
          <SimpleThemeSelector variant="button" showLabel={false} />
        </div>
      </Box>
    </Box>
  );
} 