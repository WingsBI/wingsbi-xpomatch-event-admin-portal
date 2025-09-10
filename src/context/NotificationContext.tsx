'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  PushNotification, 
  NotificationSettings, 
  NotificationState,
  DeviceRegistrationDto
} from '@/types';
import { notificationService } from '@/services/notificationService';
import { getCurrentUserId } from '@/utils/authUtils';

interface NotificationContextType extends NotificationState {
  addNotification: (notification: Omit<PushNotification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  sendUserLike: (likedUserId: string, likerName: string) => Promise<void>;
  sendMeetingNotification: (meetingData: any) => Promise<void>;
  registerDevice: () => Promise<void>;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: PushNotification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_NOTIFICATIONS'; payload: PushNotification[] }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationSettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  settings: null,
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.isRead).length,
      };
    }
    
    case 'MARK_AS_READ': {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload
          ? { ...notification, isRead: true }
          : notification
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      };
    }
    
    case 'MARK_ALL_AS_READ': {
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true,
      }));
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: 0,
      };
    }
    
    case 'REMOVE_NOTIFICATION': {
      const filteredNotifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.isRead).length,
      };
    }
    
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    
    case 'SET_NOTIFICATIONS': {
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length,
      };
    }
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: state.settings ? { ...state.settings, ...action.payload } : null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    default:
      return state;
  }
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Initialize notification settings and load existing notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          return;
        }

        // Initialize default settings
        const defaultSettings: NotificationSettings = {
          userId: userId.toString(),
          pushEnabled: true,
          emailEnabled: true,
          meetingReminders: true,
          likeNotifications: true,
          systemNotifications: true,
          marketingNotifications: false,
        };

        // Load settings from localStorage if available
        const savedSettings = localStorage.getItem(`notification-settings-${userId}`);
        const settings = savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
        
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });

        // Load saved notifications from localStorage
        const savedNotifications = localStorage.getItem(`notifications-${userId}`);
        if (savedNotifications) {
          const notifications = JSON.parse(savedNotifications).map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
            expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
          }));
          
          // Filter out expired notifications
          const validNotifications = notifications.filter((n: PushNotification) => 
            !n.expiresAt || n.expiresAt > new Date()
          );
          
          dispatch({ type: 'SET_NOTIFICATIONS', payload: validNotifications });
        }

        // Request notification permission and register device
        await registerDevice();

      } catch (error) {
        console.error('Error initializing notifications:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize notifications' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeNotifications();
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId && state.notifications.length > 0) {
      localStorage.setItem(`notifications-${userId}`, JSON.stringify(state.notifications));
    }
  }, [state.notifications]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (state.settings) {
      localStorage.setItem(`notification-settings-${state.settings.userId}`, JSON.stringify(state.settings));
    }
  }, [state.settings]);

  const addNotification = (notification: Omit<PushNotification, 'id' | 'createdAt'>) => {
    const newNotification: PushNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

    // Show browser notification if enabled
    if (state.settings?.pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      notificationService.showLocalNotification(notification.title, {
        body: notification.message,
        tag: newNotification.id,
        data: notification.data,
      });
    }

    // Auto-remove low priority notifications after 30 seconds
    if (notification.priority === 'low') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 30000);
    }
  };

  const markAsRead = (notificationId: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: notificationId });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const removeNotification = (notificationId: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL' });
    const userId = getCurrentUserId();
    if (userId) {
      localStorage.removeItem(`notifications-${userId}`);
    }
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  };

  const sendUserLike = async (likedUserId: string, likerName: string) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await notificationService.sendUserLikeNotification({
        likedUserId,
        likerUserId: userId.toString(),
        likerName,
      });

      // Add a local notification for feedback
      addNotification({
        title: 'Like Sent',
        message: `You liked ${likerName}`,
        type: 'success',
        priority: 'low',
        userId: userId.toString(),
        isRead: false,
      });

    } catch (error) {
      console.error('Error sending user like:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send like notification' });
    }
  };

  const sendMeetingNotification = async (meetingData: any) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Convert separate date and time to DateTime string
      const meetingDateTime = new Date(`${meetingData.meetingDate}T${meetingData.startTime || '00:00'}`).toISOString();
      
      await notificationService.sendMeetingNotification({
        meetingId: meetingData.id.toString(),
        meetingTitle: meetingData.title || meetingData.agenda,
        meetingDateTime: meetingDateTime,
        meetingLocation: meetingData.location || 'To be determined',
        organizerUserId: userId.toString(),
        organizerName: meetingData.organizerName || 'Event Organizer',
        attendeeUserIds: (meetingData.participantIds || []).map((id: number) => id.toString()),
        meetingDescription: meetingData.description || meetingData.agenda,
        meetingType: 'created',
      });

      // Add a local notification for feedback
      addNotification({
        title: 'Meeting Notification Sent',
        message: `Meeting "${meetingData.title || meetingData.agenda}" notification sent to participants`,
        type: 'success',
        priority: 'medium',
        userId: userId.toString(),
        isRead: false,
      });

    } catch (error) {
      console.error('Error sending meeting notification:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send meeting notification' });
    }
  };

  const registerDevice = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return;
      }

      // Request notification permission
      const permission = await notificationService.requestNotificationPermission();
      console.log('🔔 Notification permission status:', permission);
      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return;
      }

      // Subscribe to web push
      const subscription = await notificationService.subscribeToWebPush();
      if (!subscription) {
        console.warn('Could not subscribe to web push');
        return;
      }

      // Register device with notification service
      const deviceData: DeviceRegistrationDto = {
        userId: userId.toString(),
        deviceToken: JSON.stringify(subscription),
        platform: 'web',
        deviceId: `web-${Date.now()}`,
        tags: {
          platform: 'web',
          userAgent: navigator.userAgent.substring(0, 100), // Limit length
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        },
      };

      const response = await notificationService.registerDevice(deviceData);
      console.log('✅ Device registered successfully for push notifications:', response);

    } catch (error) {
      console.error('Error registering device:', error);
    }
  };

  const value: NotificationContextType = {
    ...state,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    updateSettings,
    sendUserLike,
    sendMeetingNotification,
    registerDevice,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
