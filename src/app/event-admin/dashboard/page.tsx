'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
} from '@mui/material';
import {
  People, 
  Business,
  Upload,
  Settings,
  Email,
  Dashboard as DashboardIcon,
  Add,
} from '@mui/icons-material';
import { Event, Participant, DashboardStats } from '@/types';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import EventDetailsCard from '@/components/event-admin/EventDetailsCard';
import { mockVisitors, mockExhibitors, mockEvent, mockStats } from '@/lib/mockData';

export default function EventAdminDashboard() {
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Using mock data for demonstration
      setEvent(mockEvent);
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVisitors = () => {
    // Handle visitor upload
    console.log('Upload visitors');
  };

  const handleUploadExhibitors = () => {
    // Handle exhibitor upload
    console.log('Upload exhibitors');
  };

  const handleSendInvitations = () => {
    // Handle sending invitations
    console.log('Send invitations');
  };

  const statCards = [
    {
      title: 'Total Visitors',
      value: stats?.registeredVisitors || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      subtitle: `${mockVisitors.filter(v => v.status === 'registered').length} registered`,
      action: {
        label: 'Add Visitors',
        icon: <Add />,
        onClick: handleUploadVisitors,
      }
    },
    {
      title: 'Total Exhibitors',
      value: stats?.registeredExhibitors || 0,
      icon: <Business sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      subtitle: `${mockExhibitors.filter(e => e.status === 'registered').length} registered`,
      action: {
        label: 'Add Exhibitors',
        icon: <Add />,
        onClick: handleUploadExhibitors,
      }
    },
    {
      title: 'Pending Invitations',
      value: stats?.pendingInvitations || 0,
      icon: <Email sx={{ fontSize: 40 }} />,
      color: '#dc004e',
      subtitle: 'Awaiting response',
      action: {
        label: 'Send Invitations',
        icon: <Email />,
        onClick: handleSendInvitations,
      }
    },
  ];

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, href: '/event-admin/dashboard' },
    { text: 'Visitors', icon: <People />, href: '/event-admin/visitors' },
    { text: 'Exhibitors', icon: <Business />, href: '/event-admin/exhibitors' },
  ];

  return (
    <DashboardLayout title="Event Admin Dashboard" userRole="event-admin">
      <Box sx={{ display: 'flex' }}>
        {/* Left Side Navigation */}
        <Box
          sx={{
            width: 240,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            left: 0,
            top: 64,
          }}
        >
          <List>
            {navItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component="a"
                  href={item.href}
                  selected={item.href === '/event-admin/dashboard'}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            // ml: '240px',
            p: 3,
          }}
        >
          <Container maxWidth="xl">
            {/* Event Details */}
            {event && (
              <Box mb={4}>
                <EventDetailsCard event={event} onEventUpdate={fetchDashboardData} />
              </Box>
            )}

            {/* Stats Cards with Actions */}
            <Grid container spacing={3}>
              {statCards.map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            {stat.title}
                          </Typography>
                          <Typography variant="h4" component="div">
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stat.subtitle}
                          </Typography>
                        </Box>
                        <Box sx={{ color: stat.color }}>
                          {stat.icon}
                        </Box>
                      </Box>
                      <Box mt={2}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={stat.action.icon}
                          onClick={stat.action.onClick}
                          sx={{
                            borderColor: stat.color,
                            color: stat.color,
                            '&:hover': {
                              borderColor: stat.color,
                              bgcolor: `${stat.color}10`,
                            },
                          }}
                        >
                          {stat.action.label}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </Box>
    </DashboardLayout>
  );
} 