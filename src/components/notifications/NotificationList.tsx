'use client';

import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Event as EventIcon,
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/context/NotificationContext';
import { PushNotification } from '@/types';

interface NotificationListProps {
  maxHeight?: number;
  showActions?: boolean;
  compact?: boolean;
}

function getNotificationIcon(type: PushNotification['type']) {
  switch (type) {
    case 'success':
      return <CheckCircleIcon color="success" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'error':
      return <ErrorIcon color="error" />;
    case 'meeting':
      return <EventIcon color="primary" />;
    case 'like':
      return <FavoriteIcon color="secondary" />;
    case 'system':
      return <SettingsIcon color="action" />;
    default:
      return <InfoIcon color="info" />;
  }
}

function getNotificationColor(type: PushNotification['type']) {
  switch (type) {
    case 'success':
      return '#4caf50';
    case 'warning':
      return '#ff9800';
    case 'error':
      return '#f44336';
    case 'meeting':
      return '#2196f3';
    case 'like':
      return '#e91e63';
    case 'system':
      return '#9e9e9e';
    default:
      return '#2196f3';
  }
}

function getPriorityColor(priority: PushNotification['priority']) {
  switch (priority) {
    case 'high':
      return '#f44336';
    case 'medium':
      return '#ff9800';
    case 'low':
      return '#4caf50';
    default:
      return '#9e9e9e';
  }
}

export function NotificationList({ 
  maxHeight = 400, 
  showActions = true,
  compact = false 
}: NotificationListProps) {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notificationId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notificationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleNotificationClick = (notification: PushNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl && typeof window !== 'undefined') {
      window.open(notification.actionUrl, '_blank');
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    handleMenuClose();
  };

  const handleRemove = (notificationId: string) => {
    removeNotification(notificationId);
    handleMenuClose();
  };

  if (notifications.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">
          No notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You're all caught up!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={1}>
      {showActions && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Notifications ({notifications.filter(n => !n.isRead).length} unread)
            </Typography>
            <Box>
              <Button size="small" onClick={markAllAsRead} sx={{ mr: 1 }}>
                Mark All Read
              </Button>
              <Button size="small" color="error" onClick={clearAllNotifications}>
                Clear All
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <List 
        sx={{ 
          maxHeight, 
          overflow: 'auto',
          p: 0,
        }}
      >
        {notifications.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem
              onClick={() => handleNotificationClick(notification)}
              sx={{
                cursor: notification.actionUrl ? 'pointer' : 'default',
                backgroundColor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                py: compact ? 1 : 2,
              }}
            >
              <Avatar
                sx={{
                  mr: 2,
                  width: compact ? 32 : 40,
                  height: compact ? 32 : 40,
                  bgcolor: 'transparent',
                }}
              >
                {getNotificationIcon(notification.type)}
              </Avatar>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant={compact ? 'body2' : 'subtitle2'}
                      sx={{
                        fontWeight: notification.isRead ? 'normal' : 'bold',
                        color: notification.isRead ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {notification.title}
                    </Typography>
                    
                    <Chip
                      label={notification.priority}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.625rem',
                        bgcolor: getPriorityColor(notification.priority),
                        color: 'white',
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      variant={compact ? 'caption' : 'body2'}
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {notification.message}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </Typography>
                      
                      {notification.actionLabel && (
                        <Chip
                          label={notification.actionLabel}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.625rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                <Tooltip title="Actions">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleMenuOpen(e, notification.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
            
            {index < notifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedNotification && notifications.find(n => n.id === selectedNotification) && (
          <>
            {!notifications.find(n => n.id === selectedNotification)?.isRead && (
              <MenuItem onClick={() => handleMarkAsRead(selectedNotification)}>
                Mark as Read
              </MenuItem>
            )}
            <MenuItem onClick={() => handleRemove(selectedNotification)} sx={{ color: 'error.main' }}>
              Remove
            </MenuItem>
          </>
        )}
      </Menu>
    </Paper>
  );
}

export default NotificationList;
