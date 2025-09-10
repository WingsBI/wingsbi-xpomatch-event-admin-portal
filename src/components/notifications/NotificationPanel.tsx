'use client';

import React, { useState } from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotifications } from '@/context/NotificationContext';
import NotificationBadge from './NotificationBadge';
import NotificationList from './NotificationList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface NotificationPanelProps {
  anchor?: 'left' | 'right';
  width?: number;
}

export function NotificationPanel({ 
  anchor = 'right', 
  width = 400 
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  const {
    notifications,
    unreadCount,
    settings,
    updateSettings,
    registerDevice,
    clearAllNotifications,
  } = useNotifications();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({
      [setting]: event.target.checked,
    });
  };

  const handleRefresh = async () => {
    await registerDevice();
  };

  const recentNotifications = notifications.slice(0, 10);
  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <>
      {/* Trigger Button */}
      <Tooltip title="Notifications">
        <IconButton
          onClick={() => setIsOpen(true)}
          color="inherit"
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          <NotificationBadge>
            <NotificationsIcon />
          </NotificationBadge>
        </IconButton>
      </Tooltip>

      {/* Notification Drawer */}
      <Drawer
        anchor={anchor}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">
            Notifications
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <IconButton size="small" onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: 48,
          }}
        >
          <Tab 
            label={`All (${notifications.length})`} 
            sx={{ minHeight: 48 }}
          />
          <Tab 
            label={`Unread (${unreadCount})`}
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<SettingsIcon />} 
            sx={{ minHeight: 48 }}
          />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TabPanel value={tabValue} index={0}>
            <NotificationList 
              maxHeight={window.innerHeight - 200}
              showActions={false}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {unreadNotifications.length > 0 ? (
              <NotificationList 
                maxHeight={window.innerHeight - 200}
                showActions={false}
              />
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No unread notifications
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Notification Settings
              </Typography>
              
              {settings && (
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.pushEnabled}
                        onChange={handleSettingChange('pushEnabled')}
                      />
                    }
                    label="Push Notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailEnabled}
                        onChange={handleSettingChange('emailEnabled')}
                      />
                    }
                    label="Email Notifications"
                  />
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.meetingReminders}
                        onChange={handleSettingChange('meetingReminders')}
                      />
                    }
                    label="Meeting Reminders"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.likeNotifications}
                        onChange={handleSettingChange('likeNotifications')}
                      />
                    }
                    label="Like Notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.systemNotifications}
                        onChange={handleSettingChange('systemNotifications')}
                      />
                    }
                    label="System Notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.marketingNotifications}
                        onChange={handleSettingChange('marketingNotifications')}
                      />
                    }
                    label="Marketing Notifications"
                  />
                </FormGroup>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={clearAllNotifications}
                disabled={notifications.length === 0}
              >
                Clear All Notifications
              </Button>
            </Box>
          </TabPanel>
        </Box>
      </Drawer>
    </>
  );
}

export default NotificationPanel;
