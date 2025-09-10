import { 
  NotificationRequestDto, 
  DeviceRegistrationDto, 
  UserLikeNotificationDto,
  MeetingNotificationDto,
  DashboardNotificationDto,
  BulkNotificationDto,
  TaggedNotificationRequestDto,
  TemplateNotificationRequestDto,
  NotificationResponse,
  DeviceRegistrationResponse
} from '@/types';
import { getAuthToken } from '@/utils/cookieManager';

class NotificationService {
  private baseURL: string;

  constructor() {
    // Use your actual notification hub service URL
    this.baseURL = process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL || 'https://localhost:7184';
    console.log('Notification Service initialized with URL:', this.baseURL);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Legacy notification endpoint
  async sendNotification(notification: NotificationRequestDto): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/Notifications/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(notification),
      });

      return this.handleResponse<NotificationResponse>(response);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Device registration
  async registerDevice(deviceData: DeviceRegistrationDto): Promise<DeviceRegistrationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/Notifications/devices/register`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(deviceData),
      });

      return this.handleResponse<DeviceRegistrationResponse>(response);
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  async unregisterDevice(userId: string, deviceToken: string): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/Notifications/devices/unregister?userId=${encodeURIComponent(userId)}&deviceToken=${encodeURIComponent(deviceToken)}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        }
      );

      return this.handleResponse<{ message: string }>(response);
    } catch (error) {
      console.error('Error unregistering device:', error);
      throw error;
    }
  }

  // User like notifications
  async sendUserLikeNotification(likeData: UserLikeNotificationDto): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/Notifications/user-like`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(likeData),
      });

      return this.handleResponse<NotificationResponse>(response);
    } catch (error) {
      console.error('Error sending user like notification:', error);
      throw error;
    }
  }

  // Meeting notifications
  async sendMeetingNotification(meetingData: MeetingNotificationDto): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/Notifications/meeting`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(meetingData),
      });

      return this.handleResponse<NotificationResponse>(response);
    } catch (error) {
      console.error('Error sending meeting notification:', error);
      throw error;
    }
  }

  // Dashboard notifications
  async sendDashboardNotification(dashboardData: DashboardNotificationDto): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/Notifications/dashboard`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(dashboardData),
      });

      return this.handleResponse<NotificationResponse>(response);
    } catch (error) {
      console.error('Error sending dashboard notification:', error);
      throw error;
    }
  }

  // Bulk notifications
  async sendBulkNotification(bulkData: BulkNotificationDto): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/Notifications/bulk`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(bulkData),
      });

      return this.handleResponse<NotificationResponse>(response);
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  // Tag-based notifications
  async sendTaggedNotification(taggedData: TaggedNotificationRequestDto): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/Notifications/tagged`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(taggedData),
      });

      return this.handleResponse<NotificationResponse>(response);
    } catch (error) {
      console.error('Error sending tagged notification:', error);
      throw error;
    }
  }

  // Template notifications
  async sendTemplateNotification(templateData: TemplateNotificationRequestDto): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/Notifications/template`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      return this.handleResponse<NotificationResponse>(response);
    } catch (error) {
      console.error('Error sending template notification:', error);
      throw error;
    }
  }

  // Web Push subscription management
  async subscribeToWebPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BM6UE9HJ2xVJllkCSKNjuMXf7CxgPad1EMfTXQFM4m-Aeib5VocRKPg21-RMt1_fjvgDhzI9i9IiI-sxpUbfRpg';
        
        console.log('Using VAPID public key:', vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      return subscription;
    } catch (error) {
      console.error('Error subscribing to web push:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Show local notification
  async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    const permission = await this.requestNotificationPermission();
    
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
