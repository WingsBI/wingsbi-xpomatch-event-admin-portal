# Notification Hub Setup Guide

This guide explains how to set up and configure the notification hub in your XpoMatch Event Admin Portal.

## Overview

The notification system provides:
- Push notifications for web browsers
- Real-time notifications for events like meetings, likes, and system updates
- Azure Notification Hub integration
- Service worker for offline support
- React context for state management

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Notification Hub Configuration
NEXT_PUBLIC_NOTIFICATION_HUB_URL=https://localhost:7184
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BM6UE9HJ2xVJllkCSKNjuMXf7CxgPad1EMfTXQFM4m-Aeib5VocRKPg21-RMt1_fjvgDhzI9i9IiI-sxpUbfRpg
NEXT_PUBLIC_APP_VERSION=1.0.0

# For production deployment
# NEXT_PUBLIC_NOTIFICATION_HUB_URL=https://your-deployed-notification-service.azurewebsites.net

# Optional: Development overrides
NODE_ENV=development
```

Your notification service configuration (from appsettings.json):
- **Development HTTPS**: https://localhost:7184
- **Development HTTP**: http://localhost:5008
- **Azure Notification Hub**: xpomatch-hub
- **Service Bus**: xpomatch-notification-hub.servicebus.windows.net

### Getting VAPID Keys

Your service uses Azure Notification Hub with this configuration:
- **Hub Name**: `xpomatch-hub`
- **Service Bus Namespace**: `xpomatch-notification-hub.servicebus.windows.net`

✅ **VAPID Key Configured**: Your VAPID public key is already configured in the environment variables above.

To get VAPID keys for other projects:
1. Go to Azure Portal → Notification Hubs → xpomatch-hub
2. Navigate to Settings → Access Policies
3. Generate VAPID keys for web push notifications
4. Copy the public key for `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

Alternatively, you can generate VAPID keys using:
```bash
npx web-push generate-vapid-keys
```

## Backend Integration

Your C# notification service should be running at the URL specified in `NEXT_PUBLIC_NOTIFICATION_HUB_URL`.

### Required Endpoints

The frontend expects these endpoints to be available:

- `POST /api/Notifications/devices/register` - Register device for push notifications
- `POST /api/Notifications/send` - Legacy notification endpoint
- `POST /api/Notifications/user-like` - Send like notifications
- `POST /api/Notifications/meeting` - Send meeting notifications
- `POST /api/Notifications/dashboard` - Send dashboard notifications
- `POST /api/Notifications/bulk` - Send bulk notifications
- `POST /api/Notifications/tagged` - Send tag-based notifications
- `POST /api/Notifications/template` - Send template notifications

## Usage Examples

### Basic Usage in Components

```tsx
import { useNotifications } from '@/context/NotificationContext';

function MyComponent() {
  const { addNotification, sendUserLike } = useNotifications();

  const handleLike = async (userId: string) => {
    await sendUserLike(userId, 'John Doe');
  };

  const showLocalNotification = () => {
    addNotification({
      title: 'Success!',
      message: 'Operation completed successfully',
      type: 'success',
      priority: 'medium',
      userId: 'current-user-id',
      isRead: false,
    });
  };

  return (
    // Your component JSX
  );
}
```

### Using Notification Hooks

```tsx
import { useNotificationActions, useNotificationStats } from '@/hooks/useNotificationHooks';

function DashboardComponent() {
  const { sendMeetingUpdate } = useNotificationActions();
  const stats = useNotificationStats();

  const handleMeetingCreated = async (meetingData: any) => {
    await sendMeetingUpdate(meetingData, { showLocal: true });
  };

  return (
    <div>
      <p>Total notifications: {stats.total}</p>
      <p>Unread: {stats.unread}</p>
    </div>
  );
}
```

### Manual API Calls

```tsx
import { notificationService } from '@/services/notificationService';

// Send a custom notification
await notificationService.sendDashboardNotification({
  userId: 'user123',
  title: 'Welcome!',
  message: 'Welcome to the event portal',
  type: 'info',
  priority: 'low',
});

// Register device for push notifications
await notificationService.registerDevice({
  userId: 'user123',
  deviceToken: 'device-token-here',
  deviceType: 'web',
  deviceName: 'Chrome Browser',
});
```

## Components Available

### NotificationPanel
Sidebar panel with notification list and settings:
```tsx
import NotificationPanel from '@/components/notifications/NotificationPanel';

<NotificationPanel anchor="right" width={400} />
```

### NotificationBadge
Badge component for showing notification count:
```tsx
import NotificationBadge from '@/components/notifications/NotificationBadge';

<NotificationBadge>
  <IconButton>
    <NotificationsIcon />
  </IconButton>
</NotificationBadge>
```

### NotificationList
Standalone notification list:
```tsx
import NotificationList from '@/components/notifications/NotificationList';

<NotificationList maxHeight={400} showActions={true} />
```

### NotificationToast
Global toast notifications (automatically included in layout):
```tsx
import NotificationToast from '@/components/notifications/NotificationToast';

<NotificationToast autoHideDuration={6000} maxVisible={3} />
```

## Push Notification Setup

1. **Service Worker**: Already registered in `layout.tsx`
2. **VAPID Keys**: Configure in environment variables
3. **Permission**: Automatically requested when user interacts with notifications
4. **Registration**: Device automatically registered when permissions granted

## Notification Types

- `info` - General information (blue)
- `success` - Success messages (green)
- `warning` - Warning messages (orange)
- `error` - Error messages (red)
- `meeting` - Meeting-related notifications (blue)
- `like` - User interaction notifications (pink)
- `system` - System notifications (gray)

## Priority Levels

- `low` - Auto-dismiss, less prominent
- `medium` - Standard notifications
- `high` - Persistent, requires user action

## Troubleshooting

### Notifications Not Appearing

1. Check browser permissions: `window.Notification.permission`
2. Verify service worker is registered: Check browser dev tools > Application > Service Workers
3. Check network requests to notification hub
4. Verify environment variables are set correctly

### Service Worker Issues

1. Clear browser cache and service worker
2. Check console for service worker errors
3. Ensure `sw.js` is accessible at `/sw.js`
4. Verify VAPID public key is correctly formatted

### Backend Connection Issues

1. Check CORS settings on notification hub
2. Verify authentication tokens are being sent
3. Check network tab for failed requests
4. Ensure notification hub URL is correct

## Testing

You can test notifications using the browser console:

```javascript
// Test local notification
window.Notification && new Notification('Test', { body: 'This is a test notification' });

// Test service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service workers:', registrations);
});

// Test notification permission
console.log('Permission:', Notification.permission);
```

## Production Considerations

1. **HTTPS Required**: Push notifications only work over HTTPS
2. **Service Worker Caching**: Update cache version when deploying
3. **Rate Limiting**: Implement rate limiting on notification endpoints
4. **User Preferences**: Respect user notification settings
5. **Analytics**: Track notification delivery and engagement

## Security Notes

- Never expose VAPID private keys in frontend code
- Validate all notification payloads on the backend
- Implement proper authentication for notification endpoints
- Consider implementing notification quotas per user
