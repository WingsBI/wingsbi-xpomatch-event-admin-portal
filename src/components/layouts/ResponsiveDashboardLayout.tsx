'use client';

import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { useInView } from 'react-intersection-observer';
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
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Event,
  People,
  Business,
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
} from '@mui/icons-material';
import { RootState, AppDispatch } from '@/store';
import { 
  toggleSidebar, 
  setSidebarOpen, 
  updateResponsiveState, 
  setTheme,
  removeNotification,
  DeviceType,
  setIdentifier
} from '@/store/slices/appSlice';
import { logoutUser } from '@/store/slices/authSlice';

interface ResponsiveDashboardLayoutProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const getNavigationItems = (userRole: string, deviceType: DeviceType, identifier: string) => {
  const baseItems = userRole === 'it-admin' ? [
    { text: 'Dashboard', icon: <Dashboard />, href: `/${identifier}/it-admin/dashboard`, children: [] },
    { text: 'Events', icon: <Event />, href: `/${identifier}/it-admin/events`, children: [] },
    { text: 'Event Admins', icon: <AdminPanelSettings />, href: `/${identifier}/it-admin/admins`, children: [] },
    { text: 'Settings', icon: <Settings />, href: `/${identifier}/it-admin/settings`, children: [
      { text: 'General', href: `/${identifier}/it-admin/settings/general` },
      { text: 'Security', href: `/${identifier}/it-admin/settings/security` },
    ] },
  ] : userRole === 'exhibitor' ? [
    { text: 'Dashboard', icon: <Dashboard />, href: `/${identifier}/exhibitor/dashboard`, children: [] },
    { text: 'My Booth', icon: <Business />, href: `/${identifier}/exhibitor/booth`, children: [] },
    { text: 'Meetings', icon: <People />, href: `/${identifier}/exhibitor/meetings`, children: [] },
    { text: 'Schedule', icon: <Event />, href: `/${identifier}/exhibitor/schedule`, children: [] },
  ] : [
    { text: 'Dashboard', icon: <Dashboard />, href: `/${identifier}/event-admin/dashboard`, children: [] },
    { text: 'Event Details', icon: <Event />, href: `/${identifier}/event-admin/event`, children: [] },
    { text: 'Visitors', icon: <People />, href: `/${identifier}/event-admin/visitors`, children: [
      { text: 'Visitors List', href: `/${identifier}/event-admin/visitors` },
      { text: 'Visitors Matching', href: `/${identifier}/event-admin/visitors/matching` },
    ] },
    { text: 'Exhibitors', icon: <Business />, href: `/${identifier}/event-admin/exhibitors`, children: [
      { text: 'Exhibitors List', href: `/${identifier}/event-admin/exhibitors` },
      { text: 'Exhibitors Matching', href: `/${identifier}/event-admin/exhibitors/matching` },
    ] },
    { text: 'Settings', icon: <Settings />, href: `/${identifier}/event-admin/attributes`, children: [] },
  ];

  // Simplify navigation for mobile devices
  if (deviceType === 'mobile') {
    return baseItems.map(item => ({ ...item, children: [] }));
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
  const theme = useTheme();

  // Redux state
  const { 
    identifier,
    responsive, 
    ui 
  } = useSelector((state: RootState) => state.app);
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  // Local state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    if (ui.sidebarCollapsed) return 72;
    
    if (isTV) return 270; // TV screens (>= 2560px)
    if (isLargeMonitor) return 250; // Large monitors (>= 1920px)
    if (isDesktop) return 230; // Desktop (1280px - 1920px)
    if (isTablet) return 210; // Tablet (960px - 1280px)
    return 230; // Default width
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
    setExpandedItems(prev =>
      prev.includes(itemText)
        ? prev.filter(item => item !== itemText)
        : [...prev, itemText]
    );
  };

  const handleNotificationClose = (notificationId: string) => {
    dispatch(removeNotification(notificationId));
  };

  const renderNavigationItem = (item: any, level = 0) => (
    <motion.div
      key={item.text}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: level * 0.1 }}
    >
      <ListItem disablePadding sx={{ mb: 0.5, pl: level * 2 }}>
        <ListItemButton
          onClick={() => {
            if (item.children && item.children.length > 0) {
              handleExpandClick(item.text);
            } else {
              router.push(item.href);
              if (isMobile) {
                dispatch(setSidebarOpen(false));
              }
            }
          }}
          sx={{
            borderRadius: 2,
            minHeight: ui.sidebarCollapsed && level === 0 ? 56 : 48,
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white',
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
          }}
        >
          {item.icon && (
            <ListItemIcon sx={{ 
              minWidth: ui.sidebarCollapsed ? 0 : 40,
              justifyContent: 'center',
              color: 'inherit' 
            }}>
              {item.icon}
            </ListItemIcon>
          )}
          
                        {(!ui.sidebarCollapsed || isMobile) && (
                <>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: {
                        xs: '0.875rem', // Mobile
                        sm: '0.9rem',   // Large phones
                        md: '1rem',     // Tablets
                        lg: '1.1rem',   // Desktop
                        xl: '1.2rem',   // Large monitors
                      }
                    }}
                  />
                  {item.children && item.children.length > 0 && (
                    <IconButton size="small">
                      {expandedItems.includes(item.text) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                </>
              )}
        </ListItemButton>
      </ListItem>

      {item.children && item.children.length > 0 && (!ui.sidebarCollapsed || isMobile) && (
        <Collapse in={expandedItems.includes(item.text)} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child: any) => renderNavigationItem(child, level + 1))}
          </List>
        </Collapse>
      )}
    </motion.div>
  );

  const navigationItems = getNavigationItems(user?.role || 'event-admin', responsive.deviceType, identifier);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', pt: '64px' }}>
      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: ui.sidebarCollapsed ? 1 : 2, pt: 2 }}>
        <List>
          {navigationItems.map(item => renderNavigationItem(item))}
        </List>
      </Box>

      {/* Collapse button for desktop */}
      {!isMobile && (
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Tooltip title={ui.sidebarCollapsed ? 'Expand' : 'Collapse'}>
            <IconButton 
              onClick={handleDrawerToggle}
              sx={{ 
                width: '100%', 
                justifyContent: 'center',
                color: 'text.primary'
              }}
            >
              {ui.sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }} {...swipeHandlers}>
      {/* Unified Header Bar - spans full width */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: 'calc(100% - 16px)' },
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: theme.zIndex.drawer + 1,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          borderRadius: { md: '0 0 16px 16px' },
          margin: { md: '0 8px' },
        }}
      >
        <Toolbar variant={isMobile ? 'dense' : 'regular'} sx={{ px: 0, minHeight: '64px !important' }}>
          {/* Left Section - Sidebar Brand (Desktop) / Mobile Menu */}
          <Box sx={{ 
            width: { 
              xs: 'auto', 
              md: forceHideSidebar ? '0px' : ui.sidebarCollapsed ? '72px' : `${drawerWidth}px` 
            },
            display: { 
              xs: 'flex', 
              md: forceHideSidebar ? 'none' : 'flex' 
            },
            alignItems: 'center',
            px: { xs: 2, md: ui.sidebarCollapsed ? 1 : 3 },
            borderRight: { md: forceHideSidebar ? 'none' : '1px solid rgba(255,255,255,0.1)' },
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
              mr: 2, 
                display: { xs: 'block', md: 'none' }
            }}
          >
            <MenuIcon />
          </IconButton>

            {/* Desktop Brand */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', width: '100%' }}>
              {!ui.sidebarCollapsed ? (
                <Box>
                  <Typography variant="h6" fontWeight="bold" noWrap sx={{ color: 'white' }}>
                    {isMobile ? 'AI Match' : 'AI Matchmaking'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }} noWrap>
                    {user?.role === 'it-admin' ? 'IT Administrator' : 'Event Administrator'}
                  </Typography>
                </Box>
              ) : (
                <Avatar sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.2)' }}>
                  {user?.name?.[0] || 'U'}
                </Avatar>
              )}
            </Box>

            {/* Mobile Brand */}
            <Typography 
              variant="h6" 
              noWrap 
              sx={{
                display: { xs: 'block', md: 'none' },
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              AI Matchmaking
            </Typography>
          </Box>

          {/* Right Section - Page Title and Actions */}
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            px: { xs: 1, md: 3 },
            minWidth: 0, // Allow content to shrink
            overflow: 'hidden' // Prevent overflow
          }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant="h5"
                noWrap 
                component="div"
                sx={{
                  fontSize: {
                    xs: '1rem',
                    sm: '1.125rem',
                    md: '1.25rem',
                    lg: '1.5rem',
                    xl: '1.75rem',
                  },
                  color: 'white',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {title}
            </Typography>
            
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
            gap: { xs: 0.5, md: 1 },
            flexShrink: 0, // Prevent buttons from shrinking
            pl: { xs: 1, md: 2 }
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

            <Tooltip title="Notifications">
                <IconButton sx={{ color: 'white', p: 1 }}>
                <Badge badgeContent={ui.notifications.length} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {user?.name?.[0] || user?.email?.[0] || 'U'}
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
            <MenuItem>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Profile Settings
            </MenuItem>
            <Divider />
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
              backgroundColor: 'background.paper',
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
          mt: { xs: 8, md: 8 },
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
              xs: 2,      // Mobile
              sm: 2.5,    // Large phones
              md: 3,      // Tablets
              lg: 3.5,    // Desktop
              xl: 4,      // Large monitors
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
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: theme.zIndex.speedDial,
              }}
            >
              <KeyboardArrowUp />
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
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
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
} 