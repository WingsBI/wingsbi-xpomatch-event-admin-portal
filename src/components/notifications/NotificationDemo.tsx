'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  Science as TestIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotifications } from '@/context/NotificationContext';
import { useNotificationActions, useNotificationStats, useNotificationPermissions } from '@/hooks/useNotificationHooks';
import { PushNotification } from '@/types';

export default function NotificationDemo() {
  const { 
    addNotification, 
    notifications, 
    clearAllNotifications,
    registerDevice 
  } = useNotifications();
  
  const { sendLikeNotification, sendMeetingUpdate } = useNotificationActions();
  const stats = useNotificationStats();
  const { 
    permission, 
    isSupported, 
    canRequest, 
    requestPermission 
  } = useNotificationPermissions();

  const [testNotification, setTestNotification] = useState({
    title: 'Test Notification',
    message: 'This is a test notification message',
    type: 'info' as PushNotification['type'],
    priority: 'medium' as PushNotification['priority'],
  });

  const [likeTest, setLikeTest] = useState({
    likedUserId: '123',
    likerName: 'John Doe',
  });

  const [meetingTest, setMeetingTest] = useState({
    id: '1',
    agenda: 'Project Kickoff Meeting',
    organizerId: '1',
    organizerName: 'Jane Smith',
    attendiesId: [2, 3, 4],
    meetingDate: '2024-01-15',
    startTime: '10:00',
    location: 'Conference Room A',
    description: 'Discuss project goals and timeline',
  });

  const handleSendTestNotification = () => {
    addNotification({
      ...testNotification,
      userId: '1',
      isRead: false,
    });
  };

  const handleSendLikeTest = async () => {
    try {
      await sendLikeNotification(likeTest.likedUserId, likeTest.likerName, { showLocal: true });
    } catch (error) {
      console.error('Failed to send like notification:', error);
    }
  };

  const handleSendMeetingTest = async () => {
    try {
      await sendMeetingUpdate(meetingTest, { showLocal: true });
    } catch (error) {
      console.error('Failed to send meeting notification:', error);
    }
  };

  const handleRequestPermission = async () => {
    try {
      await requestPermission();
    } catch (error) {
      console.error('Failed to request permission:', error);
    }
  };

  const handleRegisterDevice = async () => {
    try {
      await registerDevice();
      addNotification({
        title: 'Device Registered',
        message: 'Device successfully registered for push notifications',
        type: 'success',
        priority: 'medium',
        userId: '1',
        isRead: false,
      });
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  };

  const getPermissionColor = (perm: NotificationPermission) => {
    switch (perm) {
      case 'granted':
        return 'success';
      case 'denied':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Notification System Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test and explore the notification system features
      </Typography>

      <Grid container spacing={3}>
        {/* System Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Browser Support:</Typography>
                  <Chip 
                    label={isSupported ? 'Supported' : 'Not Supported'} 
                    color={isSupported ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Permission:</Typography>
                  <Chip 
                    label={permission} 
                    color={getPermissionColor(permission)}
                    size="small"
                  />
                </Box>
                
                {canRequest && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleRequestPermission}
                    sx={{ mt: 1 }}
                  >
                    Request Permission
                  </Button>
                )}
                
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleRegisterDevice}
                  disabled={permission !== 'granted'}
                  sx={{ mt: 1 }}
                >
                  Register Device
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h3" color="primary">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h3" color="error">{stats.unread}</Typography>
                  <Typography variant="body2" color="text.secondary">Unread</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h3" color="info">{stats.recent}</Typography>
                  <Typography variant="body2" color="text.secondary">Last Hour</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h3" color="success">{stats.todayCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Today</Typography>
                </Grid>
              </Grid>
              
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                onClick={clearAllNotifications}
                sx={{ mt: 2 }}
                disabled={stats.total === 0}
              >
                Clear All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Local Notification */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Local Notification
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Title"
                  value={testNotification.title}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                  size="small"
                />
                
                <TextField
                  label="Message"
                  value={testNotification.message}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
                  multiline
                  rows={2}
                  size="small"
                />
                
                <FormControl size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={testNotification.type}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, type: e.target.value as PushNotification['type'] }))}
                  >
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="meeting">Meeting</MenuItem>
                    <MenuItem value="like">Like</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={testNotification.priority}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, priority: e.target.value as PushNotification['priority'] }))}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSendTestNotification}
                >
                  Send Test Notification
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Like Notification */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Like Notification
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Liked User ID"
                  value={likeTest.likedUserId}
                  onChange={(e) => setLikeTest(prev => ({ ...prev, likedUserId: e.target.value }))}
                  size="small"
                />
                
                <TextField
                  label="Liker Name"
                  value={likeTest.likerName}
                  onChange={(e) => setLikeTest(prev => ({ ...prev, likerName: e.target.value }))}
                  size="small"
                />
                
                <Button
                  variant="contained"
                  startIcon={<TestIcon />}
                  onClick={handleSendLikeTest}
                  color="secondary"
                >
                  Send Like Notification
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Meeting Notification */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Meeting Notification
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Meeting Agenda"
                    value={meetingTest.agenda}
                    onChange={(e) => setMeetingTest(prev => ({ ...prev, agenda: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Organizer Name"
                    value={meetingTest.organizerName}
                    onChange={(e) => setMeetingTest(prev => ({ ...prev, organizerName: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Meeting Date"
                    type="date"
                    value={meetingTest.meetingDate}
                    onChange={(e) => setMeetingTest(prev => ({ ...prev, meetingDate: e.target.value }))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Start Time"
                    type="time"
                    value={meetingTest.startTime}
                    onChange={(e) => setMeetingTest(prev => ({ ...prev, startTime: e.target.value }))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Location"
                    value={meetingTest.location}
                    onChange={(e) => setMeetingTest(prev => ({ ...prev, location: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<TestIcon />}
                    onClick={handleSendMeetingTest}
                    color="primary"
                  >
                    Send Meeting Notification
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {!isSupported && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
        </Alert>
      )}
    </Box>
  );
}
