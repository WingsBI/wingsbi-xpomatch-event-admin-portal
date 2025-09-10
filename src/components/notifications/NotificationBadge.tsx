'use client';

import React from 'react';
import { Badge } from '@mui/material';
import { useNotifications } from '@/context/NotificationContext';

interface NotificationBadgeProps {
  children: React.ReactNode;
  showZero?: boolean;
  max?: number;
  className?: string;
}

export function NotificationBadge({ 
  children, 
  showZero = false, 
  max = 99,
  className = ''
}: NotificationBadgeProps) {
  const { unreadCount } = useNotifications();

  return (
    <Badge
      badgeContent={unreadCount}
      color="error"
      showZero={showZero}
      max={max}
      className={className}
      sx={{
        '& .MuiBadge-badge': {
          fontSize: '0.75rem',
          height: '18px',
          minWidth: '18px',
          animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
        },
        '@keyframes pulse': {
          '0%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.1)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
      }}
    >
      {children}
    </Badge>
  );
}

export default NotificationBadge;
