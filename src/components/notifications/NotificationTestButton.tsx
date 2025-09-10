'use client';

import React, { useState } from 'react';
import { Button, Box, Alert, Typography } from '@mui/material';
import { useNotifications } from '@/context/NotificationContext';
import { notificationApi } from '@/services/apiService';

/**
 * Simple test button to verify notification system is working
 * Add this component to any page to test notifications
 */
export default function NotificationTestButton() {
  const { addNotification } = useNotifications();
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testLocalNotification = () => {
    addNotification({
      title: '🎉 Test Notification!',
      message: 'This is a test notification from your app',
      type: 'success',
      priority: 'medium',
      userId: '1',
      isRead: false,
    });
    setStatus('✅ Local notification sent! Check the notification panel.');
  };

  const testLikeNotification = async () => {
    setLoading(true);
    setStatus('Sending like notification...');
    
    try {
      await notificationApi.notifyUserLike('456', '123', 'Test User');
      setStatus('✅ Like notification sent to your service!');
    } catch (error) {
      setStatus('❌ Failed to send like notification');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testMeetingNotification = async () => {
    setLoading(true);
    setStatus('Sending meeting notification...');
    
    try {
      const meetingData = {
        id: 999,
        agenda: 'Test Meeting',
        organizerId: 123,
        organizerName: 'Test Organizer',
        attendiesId: [456, 789],
        meetingDate: '2024-01-15',
        startTime: '14:30',
        location: 'Test Location',
        description: 'This is a test meeting notification',
      };
      
      await notificationApi.notifyMeetingCreated(meetingData);
      setStatus('✅ Meeting notification sent to your service!');
    } catch (error) {
      setStatus('❌ Failed to send meeting notification');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🔔 Notification System Test
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Test your notification system integration
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={testLocalNotification}
          size="small"
        >
          Test Local Notification
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={testLikeNotification}
          disabled={loading}
          size="small"
        >
          Test Like Notification
        </Button>
        
        <Button 
          variant="contained" 
          color="success" 
          onClick={testMeetingNotification}
          disabled={loading}
          size="small"
        >
          Test Meeting Notification
        </Button>
      </Box>

      {status && (
        <Alert severity={status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : 'info'}>
          {status}
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        💡 Check browser console for detailed logs. Make sure your notification service is running on https://localhost:7184
      </Typography>
    </Box>
  );
}
