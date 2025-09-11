'use client';

import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Typography,
  Box,
  Divider,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItem {
  id: number;
  notification: string;
  isRead: boolean;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string | null;
  isActive: boolean;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onNotificationClick?: (notification: NotificationItem) => void;
  onMarkAsRead?: (notificationId: number) => void;
  onRefresh?: () => void;
  onIconClick?: () => void;
  onClearNotification?: (notificationId: number) => void;
  onClearAllNotifications?: () => void;
}

export default function NotificationDropdown({
  notifications = [],
  onNotificationClick,
  onMarkAsRead,
  onRefresh,
  onIconClick,
  onClearNotification,
  onClearAllNotifications,
}: NotificationDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const unreadCount = notifications.filter(n => !n.isRead && n.isActive).length;
  
  // Debug logging to help verify badge count calculation
  console.log('Notification badge calculation:', {
    totalNotifications: notifications.length,
    activeNotifications: notifications.filter(n => n.isActive).length,
    unreadNotifications: unreadCount,
    notifications: notifications.map(n => ({ id: n.id, isRead: n.isRead, isActive: n.isActive }))
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    
    // Call the update read status API when icon is clicked
    if (onIconClick) {
      onIconClick();
    }
    
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const truncateText = (text: string, maxLength: number = 65) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton 
          onClick={handleClick}
          sx={{ 
            color: 'text.secondary', 
            fontWeight: 700, 
            p: 1,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            maxWidth: 380,
            minWidth: 320,
            maxHeight: 480,
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
         {/* Header */}
         <Box sx={{ 
           px: 3, 
           py: 2, 
           borderBottom: '1px solid', 
           borderColor: 'divider',
           background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
         }}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>
               Notifications
             </Typography>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               {unreadCount > 0 && (
                 <Chip 
                   label={`${unreadCount} new`} 
                   size="small" 
                   color="primary"
                   sx={{ 
                     fontSize: '0.75rem', 
                     height: '24px',
                     fontWeight: 600
                   }}
                 />
               )}
               {notifications.length > 0 && onClearAllNotifications && (
                 <Tooltip title="Clear all notifications">
                   <IconButton
                     size="small"
                     onClick={(e) => {
                       e.stopPropagation();
                       onClearAllNotifications();
                     }}
                     sx={{
                       p: 0.75,
                       color: 'text.secondary',
                       borderRadius: 2,
                       '&:hover': {
                         color: 'error.main',
                         backgroundColor: 'rgba(244, 67, 54, 0.08)'
                       }
                     }}
                   >
                     <ClearAllIcon sx={{ fontSize: '1.1rem' }} />
                   </IconButton>
                 </Tooltip>
               )}
             </Box>
           </Box>
         </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                No notifications yet
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                You're all caught up!
              </Typography>
            </Box>
          ) : (
            notifications
              .filter(n => n.isActive)
              .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
              .map((notification, index) => (
                 <React.Fragment key={notification.id}>
                   <Box sx={{ position: 'relative' }}>
                     <MenuItem
                       onClick={() => handleNotificationClick(notification)}
                       sx={{
                         px: 2.5,
                         py: 1.5,
                         minHeight: 'auto',
                         backgroundColor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                         borderRadius: 0,
                         '&:hover': {
                           backgroundColor: notification.isRead ? 'rgba(0, 0, 0, 0.04)' : 'rgba(25, 118, 210, 0.08)',
                           transform: 'translateX(2px)',
                           transition: 'all 0.2s ease'
                         },
                         borderLeft: notification.isRead ? 'none' : '4px solid',
                         borderLeftColor: notification.isRead ? 'transparent' : 'primary.main',
                         pr: 6, // Add padding for close button
                         position: 'relative',
                         transition: 'all 0.2s ease'
                       }}
                     >
                       <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 0.8 }}>
                         <Box sx={{ mt: 0.3 }}>
                           {notification.isRead ? (
                             <CheckCircleIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                           ) : (
                             <CircleIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                           )}
                         </Box>
                         <Box sx={{ flex: 1, minWidth: 0 }}>
                           <Typography
                             variant="body2"
                             sx={{
                               fontWeight: notification.isRead ? 400 : 600,
                               color: notification.isRead ? 'text.secondary' : 'text.primary',
                               lineHeight: 1.4,
                               mb: 0.5,
                               fontSize: '0.875rem',
                             }}
                           >
                             {truncateText(notification.notification, 65)}
                           </Typography>
                           <Typography
                             variant="caption"
                             sx={{
                               color: 'text.secondary',
                               fontSize: '0.75rem',
                               fontWeight: 500
                             }}
                           >
                             {formatNotificationTime(notification.createdDate)}
                           </Typography>
                         </Box>
                       </Box>
                     </MenuItem>
                     
                     {/* Individual Close Button */}
                     {onClearNotification && (
                       <IconButton
                         size="small"
                         onClick={(e) => {
                           e.stopPropagation();
                           onClearNotification(notification.id);
                         }}
                         sx={{
                           position: 'absolute',
                           top: '50%',
                           right: 12,
                           transform: 'translateY(-50%)',
                           p: 0.5,
                           color: 'text.disabled',
                           opacity: 0.6,
                           borderRadius: 1.5,
                           transition: 'all 0.2s ease',
                           '&:hover': {
                             color: 'error.main',
                             backgroundColor: 'rgba(244, 67, 54, 0.08)',
                             opacity: 1,
                             transform: 'translateY(-50%) scale(1.1)',
                           }
                         }}
                       >
                         <CloseIcon sx={{ fontSize: '1rem' }} />
                       </IconButton>
                     )}
                   </Box>
                  {index < notifications.filter(n => n.isActive).length - 1 && (
                    <Divider sx={{ mx: 1.5 }} />
                  )}
                </React.Fragment>
              ))
          )}
        </Box>

      </Menu>
    </>
  );
}
