'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { PushNotification } from '@/types';

// Hook for handling notification interactions (like, meeting, etc.)
export function useNotificationActions() {
  const { sendUserLike, sendMeetingNotification, addNotification } = useNotifications();

  const sendLikeNotification = useCallback(async (
    likedUserId: string, 
    likerName: string,
    options?: { showLocal?: boolean }
  ) => {
    try {
      await sendUserLike(likedUserId, likerName);
      
      if (options?.showLocal) {
        addNotification({
          title: 'Like Sent!',
          message: `You liked ${likerName}`,
          type: 'success',
          priority: 'low',
          userId: likedUserId,
          isRead: false,
        });
      }
    } catch (error) {
      console.error('Failed to send like notification:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to send like notification',
        type: 'error',
        priority: 'medium',
        userId: likedUserId,
        isRead: false,
      });
    }
  }, [sendUserLike, addNotification]);

  const sendMeetingUpdate = useCallback(async (
    meetingData: any,
    options?: { showLocal?: boolean }
  ) => {
    try {
      await sendMeetingNotification(meetingData);
      
      if (options?.showLocal) {
        addNotification({
          title: 'Meeting Notification Sent',
          message: `Participants notified about "${meetingData.title || meetingData.agenda}"`,
          type: 'success',
          priority: 'medium',
          userId: meetingData.organizerId,
          isRead: false,
        });
      }
    } catch (error) {
      console.error('Failed to send meeting notification:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to send meeting notification',
        type: 'error',
        priority: 'medium',
        userId: meetingData.organizerId,
        isRead: false,
      });
    }
  }, [sendMeetingNotification, addNotification]);

  return {
    sendLikeNotification,
    sendMeetingUpdate,
  };
}

// Hook for managing notification filters and search
export function useNotificationFilters() {
  const { notifications } = useNotifications();
  const [filters, setFilters] = useState({
    type: 'all' as PushNotification['type'] | 'all',
    priority: 'all' as PushNotification['priority'] | 'all',
    isRead: 'all' as 'read' | 'unread' | 'all',
    search: '',
  });

  const filteredNotifications = notifications.filter(notification => {
    // Type filter
    if (filters.type !== 'all' && notification.type !== filters.type) {
      return false;
    }

    // Priority filter
    if (filters.priority !== 'all' && notification.priority !== filters.priority) {
      return false;
    }

    // Read status filter
    if (filters.isRead === 'read' && !notification.isRead) {
      return false;
    }
    if (filters.isRead === 'unread' && notification.isRead) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const updateFilter = useCallback((key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      priority: 'all',
      isRead: 'all',
      search: '',
    });
  }, []);

  return {
    filters,
    filteredNotifications,
    updateFilter,
    clearFilters,
  };
}

// Hook for notification statistics and analytics
export function useNotificationStats() {
  const { notifications } = useNotifications();

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    byType: notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<PushNotification['type'], number>),
    byPriority: notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<PushNotification['priority'], number>),
    recent: notifications.filter(n => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return n.createdAt > hourAgo;
    }).length,
    todayCount: notifications.filter(n => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return n.createdAt >= today;
    }).length,
  };

  return stats;
}

// Hook for managing notification permissions and service worker
export function useNotificationPermissions() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const { registerDevice } = useNotifications();

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsServiceWorkerReady(true);
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await registerDevice();
    }

    return result;
  }, [registerDevice]);

  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const canRequest = permission === 'default';
  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  return {
    permission,
    isServiceWorkerReady,
    isSupported,
    canRequest,
    isGranted,
    isDenied,
    requestPermission,
  };
}

// Hook for notification queue management (for offline support)
export function useNotificationQueue() {
  const [queue, setQueue] = useState<PushNotification[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = useCallback((notification: PushNotification) => {
    setQueue(prev => [...prev, notification]);
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0) {
      return;
    }

    // Process queued notifications
    for (const notification of queue) {
      try {
        // Send notification to server
        console.log('Processing queued notification:', notification);
        // Add your API call here
      } catch (error) {
        console.error('Failed to process queued notification:', error);
      }
    }

    setQueue([]);
  }, [isOnline, queue]);

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return {
    queue,
    isOnline,
    addToQueue,
    processQueue,
  };
}

// Hook for real-time notification updates (WebSocket/SignalR integration)
export function useRealTimeNotifications() {
  const { addNotification } = useNotifications();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    // Initialize SignalR connection if available
    if (typeof window !== 'undefined' && 'signalR' in window) {
      // Add SignalR integration here
      console.log('Setting up real-time notifications with SignalR');
    }

    // Listen for service worker messages (push notifications)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          const notification = event.data.notification;
          addNotification(notification);
        }
      });
    }
  }, [addNotification]);

  return {
    connectionStatus,
  };
}

export default {
  useNotificationActions,
  useNotificationFilters,
  useNotificationStats,
  useNotificationPermissions,
  useNotificationQueue,
  useRealTimeNotifications,
};
