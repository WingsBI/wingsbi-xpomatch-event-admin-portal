'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { useNotifications } from '@/context/NotificationContext';
import { notificationApi } from '@/services/apiService';
import { notificationService } from '@/services/notificationService';

/**
 * Complete integration example showing how to use the notification system
 * with your actual Xpo.NotificationHubService
 */
export default function NotificationIntegrationExample() {
  const { addNotification } = useNotifications();
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Example 1: Send like notification using your service structure
  const handleSendLikeNotification = async () => {
    setLoading(true);
    setStatus('Sending like notification...');
    
    try {
      // Using the exact structure your service expects
      await notificationService.sendUserLikeNotification({
        likedUserId: '456',
        likerUserId: '123',
        likerName: 'John Doe',
        likerProfileImageUrl: 'https://example.com/profile.jpg',
        customMessage: 'John Doe liked your profile at the XpoMatch event!',
      });
      
      setStatus('✅ Like notification sent successfully!');
      
      // Show local feedback
      addNotification({
        title: 'Like Sent',
        message: 'Your like notification was sent successfully',
        type: 'success',
        priority: 'medium',
        userId: '123',
        isRead: false,
      });
      
    } catch (error) {
      setStatus('❌ Failed to send like notification');
      console.error('Like notification error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Example 2: Send meeting notification using your service structure
  const handleSendMeetingNotification = async () => {
    setLoading(true);
    setStatus('Sending meeting notification...');
    
    try {
      // Using the exact structure your service expects
      await notificationService.sendMeetingNotification({
        meetingId: 'meeting-12345',
        meetingTitle: 'Product Demo & Partnership Discussion',
        meetingDateTime: new Date('2024-01-15T14:30:00Z').toISOString(),
        meetingLocation: 'Conference Room A, Building 2',
        organizerUserId: '123',
        organizerName: 'Jane Smith',
        attendeeUserIds: ['456', '789', '101'],
        meetingDescription: 'Discuss potential partnership opportunities and product demonstration',
        meetingType: 'created',
      });
      
      setStatus('✅ Meeting notification sent successfully!');
      
      // Show local feedback
      addNotification({
        title: 'Meeting Scheduled',
        message: 'Meeting notification sent to all attendees',
        type: 'meeting',
        priority: 'high',
        userId: '123',
        isRead: false,
        actionUrl: '/meetings/12345',
        actionLabel: 'View Meeting',
      });
      
    } catch (error) {
      setStatus('❌ Failed to send meeting notification');
      console.error('Meeting notification error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Send dashboard notification using your service structure
  const handleSendDashboardNotification = async () => {
    setLoading(true);
    setStatus('Sending dashboard notification...');
    
    try {
      // Using the exact structure your service expects
      await notificationService.sendDashboardNotification({
        userId: '123',
        notificationType: 'system',
        title: 'Welcome to XpoMatch!',
        message: 'Your event profile has been approved and is now live.',
        actionUrl: '/profile',
        data: {
          eventId: 'xpo2024',
          profileStatus: 'approved',
          approvalDate: new Date().toISOString(),
        },
        showToast: true,
        updateCount: true,
        countType: 'notifications',
        countIncrement: 1,
      });
      
      setStatus('✅ Dashboard notification sent successfully!');
      
      // Show local feedback
      addNotification({
        title: 'System Notification',
        message: 'Dashboard notification sent successfully',
        type: 'system',
        priority: 'medium',
        userId: '123',
        isRead: false,
      });
      
    } catch (error) {
      setStatus('❌ Failed to send dashboard notification');
      console.error('Dashboard notification error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Example 4: Register device for push notifications
  const handleRegisterDevice = async () => {
    setLoading(true);
    setStatus('Registering device...');
    
    try {
      // Using the exact structure your service expects
      const response = await notificationService.registerDevice({
        userId: '123',
        deviceToken: `web-token-${Date.now()}`,
        platform: 'web', // Your service uses 'platform' not 'deviceType'
        deviceId: `web-device-${Date.now()}`,
        tags: {
          browser: 'Chrome',
          os: 'Windows',
          eventId: 'xpo2024',
          userRole: 'exhibitor',
        },
      });
      
      setStatus(`✅ Device registered! Registration ID: ${response.registrationId}`);
      
      addNotification({
        title: 'Device Registered',
        message: 'Your device is now registered for push notifications',
        type: 'success',
        priority: 'low',
        userId: '123',
        isRead: false,
      });
      
    } catch (error) {
      setStatus('❌ Failed to register device');
      console.error('Device registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Example 5: Integration with existing meeting creation flow
  const handleMeetingCreatedIntegration = async () => {
    setLoading(true);
    setStatus('Simulating meeting creation with notification...');
    
    try {
      // Simulate your existing meeting creation API call
      const meetingData = {
        id: 12345,
        agenda: 'Partnership Discussion',
        organizerId: 123,
        organizerName: 'Event Organizer',
        attendiesId: [456, 789], // Note: your API uses 'attendiesId'
        meetingDate: '2024-01-15',
        startTime: '14:30',
        location: 'Booth #42',
        description: 'Discuss collaboration opportunities',
      };
      
      // 1. Create meeting via your existing API (simulated)
      console.log('Creating meeting via existing API...', meetingData);
      
      // 2. Send notification via notification hub
      await notificationApi.notifyMeetingCreated(meetingData);
      
      setStatus('✅ Meeting created and notifications sent!');
      
      addNotification({
        title: 'Integration Success',
        message: 'Meeting created with automatic notifications',
        type: 'success',
        priority: 'medium',
        userId: '123',
        isRead: false,
      });
      
    } catch (error) {
      setStatus('❌ Integration failed');
      console.error('Integration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Notification Service Integration Examples
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Real examples showing how to integrate with your Xpo.NotificationHubService
      </Typography>

      {/* Service Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Service Configuration
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Development URL" 
                    secondary="https://localhost:7184" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Azure Hub Name" 
                    secondary="xpomatch-hub" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Service Bus" 
                    secondary="xpomatch-notification-hub.servicebus.windows.net" 
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Available Endpoints:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Chip label="POST /api/Notifications/user-like" size="small" />
                <Chip label="POST /api/Notifications/meeting" size="small" />
                <Chip label="POST /api/Notifications/dashboard" size="small" />
                <Chip label="POST /api/Notifications/devices/register" size="small" />
                <Chip label="POST /api/Notifications/bulk" size="small" />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Status */}
      {status && (
        <Alert 
          severity={status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : 'info'} 
          sx={{ mb: 3 }}
        >
          {status}
        </Alert>
      )}

      {/* Examples */}
      <Grid container spacing={3}>
        {/* Like Notification */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                1. User Like Notification
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send like notification using UserLikeNotificationDto
              </Typography>
              
              <Button
                variant="contained"
                onClick={handleSendLikeNotification}
                disabled={loading}
                fullWidth
              >
                Send Like Notification
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Meeting Notification */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                2. Meeting Notification
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send meeting notification using MeetingNotificationDto
              </Typography>
              
              <Button
                variant="contained"
                onClick={handleSendMeetingNotification}
                disabled={loading}
                fullWidth
                color="primary"
              >
                Send Meeting Notification
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Dashboard Notification */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                3. Dashboard Notification
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send dashboard notification using DashboardNotificationDto
              </Typography>
              
              <Button
                variant="contained"
                onClick={handleSendDashboardNotification}
                disabled={loading}
                fullWidth
                color="secondary"
              >
                Send Dashboard Notification
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Device Registration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                4. Device Registration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Register device using DeviceRegistrationDto
              </Typography>
              
              <Button
                variant="contained"
                onClick={handleRegisterDevice}
                disabled={loading}
                fullWidth
                color="info"
              >
                Register Device
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Integration Example */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                5. Complete Integration Example
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Shows how to integrate notifications with your existing meeting creation flow
              </Typography>
              
              <Button
                variant="contained"
                onClick={handleMeetingCreatedIntegration}
                disabled={loading}
                fullWidth
                color="success"
                size="large"
              >
                Simulate Meeting Creation + Notification
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Code Examples */}
      <Typography variant="h6" gutterBottom>
        Integration Code Examples
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            How to use in your components:
          </Typography>
          
          <TextField
            multiline
            rows={10}
            fullWidth
            value={`import { notificationApi } from '@/services/apiService';
import { useNotifications } from '@/context/NotificationContext';

// In your meeting creation component
const handleCreateMeeting = async (meetingData) => {
  try {
    // 1. Create meeting via your existing API
    const meeting = await apiService.createMeeting(identifier, meetingData);
    
    // 2. Send notification automatically
    await notificationApi.notifyMeetingCreated(meetingData);
    
    // 3. Show local success message
    addNotification({
      title: 'Meeting Created',
      message: 'Meeting created and participants notified',
      type: 'success',
      priority: 'medium',
      userId: currentUserId,
      isRead: false,
    });
  } catch (error) {
    console.error('Failed to create meeting:', error);
  }
};`}
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
