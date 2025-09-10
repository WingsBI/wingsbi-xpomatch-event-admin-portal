// Service Worker for Push Notifications
const CACHE_NAME = 'xpomatch-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received', event);

  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('Error parsing push data:', error);
    data = {
      title: 'New Notification',
      body: event.data.text() || 'You have a new notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    };
  }

  const options = {
    body: data.body || data.message,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    image: data.image,
    data: data.data || {},
    tag: data.tag || 'default',
    requireInteraction: data.priority === 'high',
    silent: data.priority === 'low',
    actions: data.actions || [],
    timestamp: Date.now(),
    ...data.options,
  };

  // Show notification
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);

  event.notification.close();

  const data = event.notification.data || {};
  const actionUrl = data.actionUrl || data.url || '/';

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'view':
        event.waitUntil(
          clients.openWindow(actionUrl)
        );
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        event.waitUntil(
          clients.openWindow(actionUrl)
        );
    }
    return;
  }

  // Default click action - open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing tab/window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Background sync event', event);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications when back online
async function syncNotifications() {
  try {
    // Get stored notifications from IndexedDB or localStorage
    const notifications = await getStoredNotifications();
    
    for (const notification of notifications) {
      if (!notification.sent) {
        // Attempt to send notification
        await sendNotificationToServer(notification);
        notification.sent = true;
      }
    }
    
    // Update stored notifications
    await updateStoredNotifications(notifications);
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

// Helper functions for notification storage
async function getStoredNotifications() {
  // Simple implementation using postMessage to main thread
  return [];
}

async function updateStoredNotifications(notifications) {
  // Update notifications in storage
}

async function sendNotificationToServer(notification) {
  // Send notification via fetch API
  const response = await fetch('/api/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notification),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send notification');
  }
  
  return response.json();
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker script loaded');
