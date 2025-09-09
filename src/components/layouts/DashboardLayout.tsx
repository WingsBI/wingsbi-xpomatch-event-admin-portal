'use client';

import { ReactNode, useState } from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Event,
  Person,
  Business,
  Settings,
  Logout,
  AdminPanelSettings,
  Notifications,
  
  
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import ProfileSettingsPage from '@/app/[identifier]/event-admin/profile/page';
import NotificationProvider from '../providers/NotificationProvider';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  userRole: 'event-admin';
}

export default function DashboardLayout({ children, title, userRole }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();

  const drawerWidth = 280;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Check if we're in an identifier-specific route
    const pathParts = pathname.split('/');
    const potentialIdentifier = pathParts[1]; // e.g., /AIE987654/event-admin/dashboard -> AIE987654
    
    // If the first path segment looks like an identifier (not a standard route)
    if (potentialIdentifier && !['auth', 'dashboard', 'event-admin', 'exhibitor'].includes(potentialIdentifier)) {
      // Redirect to the identifier login page
      router.push(`/${potentialIdentifier}`);
    } else {
      // Redirect to root for standard routes
      router.push('/');
    }
  };

  const getNavigationItems = () => {
      return [
        { text: 'Dashboard', icon: <Dashboard />, href: '/event-admin/dashboard' },
        { text: 'Event Details', icon: <Event />, href: '/event-admin/event' },
        { text: 'Visitors', icon: <Person />, href: '/event-admin/visitors' },
        { text: 'Exhibitors', icon: <Business />, href: '/event-admin/exhibitors' },
        { text: 'Settings', icon: <Settings />, href: '/event-admin/attributes' },
      ];
  };

  const getUserInitials = () => {
    return userRole ==  'event-admin';
  };

  const getRoleTitle = () => {
    return userRole == 'event-admin';
  };

  const drawer = (
    <Box>
      <Box
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: 'white',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Xpo Match
        </Typography>
        
      </Box>
      
      <Divider />
      
      <List sx={{ px: 2, py: 1 }}>
        {getNavigationItems().map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'secondary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&.Mui-selected': {
                  backgroundColor: 'secondary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>

          <IconButton onClick={handleProfileMenuOpen}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {getUserInitials()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
              },
            }}
          >
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile Settings
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, md: 8 },
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );

}


