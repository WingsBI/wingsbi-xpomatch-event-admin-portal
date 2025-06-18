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
  DeviceType 
} from '@/store/slices/appSlice';
import { logoutUser } from '@/store/slices/authSlice';

interface ResponsiveDashboardLayoutProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const getNavigationItems = (userRole: string, deviceType: DeviceType) => {
  const baseItems = userRole === 'it-admin' ? [
    { text: 'Dashboard', icon: <Dashboard />, href: '/it-admin/dashboard', children: [] },
    { text: 'Events', icon: <Event />, href: '/it-admin/events', children: [] },
    { text: 'Event Admins', icon: <AdminPanelSettings />, href: '/it-admin/admins', children: [] },
    { text: 'Settings', icon: <Settings />, href: '/it-admin/settings', children: [
      { text: 'General', href: '/it-admin/settings/general' },
      { text: 'Security', href: '/it-admin/settings/security' },
    ] },
  ] : [
    { text: 'Dashboard', icon: <Dashboard />, href: '/event-admin/dashboard', children: [] },
    { text: 'Event Details', icon: <Event />, href: '/event-admin/event', children: [] },
    { text: 'Visitors', icon: <People />, href: '/event-admin/visitors', children: [] },
    { text: 'Exhibitors', icon: <Business />, href: '/event-admin/exhibitors', children: [] },
    { text: 'Attributes', icon: <Settings />, href: '/event-admin/attributes', children: [] },
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
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

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
  // This catches zoom scenarios better
  const shouldHideSidebar = useMediaQuery('(max-width: 1400px)') || 
                           responsive.screenWidth < 1400 || 
                           isMobile || 
                           isTablet;

  // Force hide for very narrow viewports with better zoom detection
  const [currentViewport, setCurrentViewport] = useState({ width: 0, height: 0 });
  const forceHideSidebar = currentViewport.width < 1400 || shouldHideSidebar;

  // Dynamic drawer width based on device
  const getDrawerWidth = () => {
    if (forceHideSidebar) return 0; // Return 0 when hidden
    if (isTV) return 320; // TV screens (>= 2560px)
    if (isLargeMonitor) return 300; // Large monitors (>= 1920px)
    if (isDesktop) return 280; // Desktop (1280px - 1920px)
    if (isTablet) return 260; // Tablet (960px - 1280px)
    return ui.sidebarCollapsed ? 72 : 280;
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
      isMobile 
    });
    
    if (forceHideSidebar && ui.sidebarOpen) {
      console.log('Hiding sidebar due to narrow viewport');
      dispatch(setSidebarOpen(false));
    }
  }, [shouldHideSidebar, forceHideSidebar, ui.sidebarOpen, responsive.screenWidth, currentViewport.width, dispatch]);

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
      if (responsive.isMobile && ui.sidebarOpen) {
        dispatch(setSidebarOpen(false));
      }
    },
    onSwipedRight: () => {
      if (responsive.isMobile && !ui.sidebarOpen) {
        dispatch(setSidebarOpen(true));
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  const handleDrawerToggle = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser({ identifier, token: user?.token }));
    router.push('/');
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
            if (item.children.length > 0) {
              handleExpandClick(item.text);
            } else {
              router.push(item.href);
              if (responsive.isMobile) {
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
          
          {(!ui.sidebarCollapsed || responsive.isMobile) && (
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
              {item.children.length > 0 && (
                <IconButton size="small">
                  {expandedItems.includes(item.text) ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </>
          )}
        </ListItemButton>
      </ListItem>

      {item.children.length > 0 && (!ui.sidebarCollapsed || responsive.isMobile) && (
        <Collapse in={expandedItems.includes(item.text)} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child: any) => renderNavigationItem(child, level + 1))}
          </List>
        </Collapse>
      )}
    </motion.div>
  );

  const navigationItems = getNavigationItems(user?.role || 'event-admin', responsive.deviceType);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: ui.sidebarCollapsed ? 1 : 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          textAlign: ui.sidebarCollapsed ? 'center' : 'left',
          minHeight: { 
            xs: 80,   // Mobile
            sm: 85,   // Large phones
            md: 90,   // Tablets
            lg: 100,  // Desktop
            xl: 110,  // Large monitors
          },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {!ui.sidebarCollapsed && (
          <>
            <Typography 
              variant="h6" 
              fontWeight="bold" 
              noWrap
              sx={{
                fontSize: {
                  xs: '1rem',     // Mobile
                  sm: '1.125rem', // Large phones
                  md: '1.25rem',  // Tablets
                  lg: '1.375rem', // Desktop
                  xl: '1.5rem',   // Large monitors
                }
              }}
            >
              {isMobile ? 'AI Match' : 'AI Matchmaking'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
              {user?.role === 'it-admin' ? 'IT Administrator' : 'Event Administrator'}
            </Typography>
          </>
        )}
        {ui.sidebarCollapsed && (
          <Avatar sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.2)' }}>
            {user?.name?.[0] || 'U'}
          </Avatar>
        )}
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: ui.sidebarCollapsed ? 1 : 2 }}>
        <List>
          {navigationItems.map(item => renderNavigationItem(item))}
        </List>
      </Box>

      {/* Collapse button for desktop */}
      {!responsive.isMobile && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Tooltip title={ui.sidebarCollapsed ? 'Expand' : 'Collapse'}>
            <IconButton 
              onClick={handleDrawerToggle}
              sx={{ width: '100%', justifyContent: 'center' }}
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
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { 
            md: forceHideSidebar ? '100%' : `calc(100% - ${drawerWidth}px)` 
          },
          ml: { md: forceHideSidebar ? 0 : `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: responsive.deviceType === 'mobile' ? 2 : 1,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar variant={isMobile ? 'dense' : 'regular'}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: forceHideSidebar ? 'block' : 'none' } 
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h5"
              noWrap 
              component="div"
              sx={{
                fontSize: {
                  xs: '1.125rem', // Mobile (h6 equivalent)
                  sm: '1.25rem',  // Large phones
                  md: '1.5rem',   // Tablets (h5 equivalent)
                  lg: '1.75rem',  // Desktop
                  xl: '2rem',     // Large monitors
                }
              }}
            >
              {title}
            </Typography>
            
            {breadcrumbs.length > 0 && !responsive.isMobile && (
              <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
                <Link color="inherit" href="/">
                  <Home sx={{ mr: 0.5 }} fontSize="inherit" />
                  Home
                </Link>
                {breadcrumbs.map((crumb, index) => (
                  <Typography key={index} color="text.primary">
                    {crumb.label}
                  </Typography>
                ))}
              </Breadcrumbs>
            )}
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!responsive.isMobile && (
              <>
                <Tooltip title="Toggle theme">
                  <IconButton onClick={handleThemeToggle} color="inherit">
                    {ui.theme === 'dark' ? <Brightness7 /> : <Brightness4 />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Toggle fullscreen">
                  <IconButton onClick={toggleFullscreen} color="inherit">
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Tooltip>
              </>
            )}

            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={ui.notifications.length} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton onClick={handleProfileMenuOpen}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.name?.[0] || user?.email?.[0] || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
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
          width: { md: forceHideSidebar ? 0 : drawerWidth }, 
          flexShrink: { md: 0 },
          display: forceHideSidebar ? 'none' : 'block'
        }}
      >
        <Drawer
          variant={forceHideSidebar ? 'temporary' : 'permanent'}
          open={forceHideSidebar ? ui.sidebarOpen : !ui.sidebarCollapsed}
          onClose={() => dispatch(setSidebarOpen(false))}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
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
          width: { md: forceHideSidebar ? '100%' : `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, md: 8 },
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'background.default',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
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