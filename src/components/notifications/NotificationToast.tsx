'use client';

import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Slide,
  SlideProps,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useNotifications } from '@/context/NotificationContext';
import { PushNotification } from '@/types';

interface TransitionProps extends Omit<SlideProps, 'children'> {
  children: React.ReactElement<any, any>;
}

function SlideTransition(props: TransitionProps) {
  return <Slide {...props} direction="up" />;
}

interface NotificationToastProps {
  autoHideDuration?: number;
  maxVisible?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

export function NotificationToast({
  autoHideDuration = 6000,
  maxVisible = 3,
  position = { vertical: 'bottom', horizontal: 'right' },
}: NotificationToastProps) {
  const { notifications, markAsRead, removeNotification } = useNotifications();
  const [displayedNotifications, setDisplayedNotifications] = useState<string[]>([]);

  // Get unread notifications that should be displayed as toasts
  const toastNotifications = notifications
    .filter(n => !n.isRead && n.priority !== 'low') // Don't show low priority as toasts
    .slice(0, maxVisible);

  useEffect(() => {
    // Update displayed notifications
    const newNotificationIds = toastNotifications.map(n => n.id);
    setDisplayedNotifications(prev => {
      const uniqueIds = Array.from(new Set([...prev, ...newNotificationIds]));
      return uniqueIds.filter(id => newNotificationIds.includes(id));
    });
  }, [toastNotifications]);

  const handleClose = (notificationId: string, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setDisplayedNotifications(prev => prev.filter(id => id !== notificationId));
    markAsRead(notificationId);
  };

  const handleAction = (notification: PushNotification) => {
    if (notification.actionUrl && typeof window !== 'undefined') {
      window.open(notification.actionUrl, '_blank');
    }
    handleClose(notification.id);
  };

  const getSeverity = (type: PushNotification['type']) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const getAutoHideDuration = (notification: PushNotification) => {
    switch (notification.priority) {
      case 'high':
        return autoHideDuration * 2; // Show longer for high priority
      case 'medium':
        return autoHideDuration;
      case 'low':
        return autoHideDuration / 2; // Show shorter for low priority
      default:
        return autoHideDuration;
    }
  };

  return (
    <>
      {toastNotifications.map((notification, index) => {
        if (!displayedNotifications.includes(notification.id)) {
          return null;
        }

        return (
          <Snackbar
            key={notification.id}
            open={true}
            autoHideDuration={getAutoHideDuration(notification)}
            onClose={(_, reason) => handleClose(notification.id, reason)}
            anchorOrigin={position}
            TransitionComponent={SlideTransition}
            sx={{
              position: 'fixed',
              zIndex: (theme) => theme.zIndex.snackbar + index,
              transform: `translateY(${-index * 80}px)`, // Stack notifications
            }}
          >
            <Alert
              severity={getSeverity(notification.type)}
              variant="filled"
              sx={{
                minWidth: 300,
                maxWidth: 500,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {notification.actionLabel && notification.actionUrl && (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => handleAction(notification)}
                    >
                      {notification.actionLabel}
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() => handleClose(notification.id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
              }
            >
              <AlertTitle sx={{ mb: 0.5 }}>
                {notification.title}
              </AlertTitle>
              {notification.message}
            </Alert>
          </Snackbar>
        );
      })}
    </>
  );
}

export default NotificationToast;
