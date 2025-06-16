'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  People, 
  Business,
  Upload,
  Settings,
  Email,
  Visibility
} from '@mui/icons-material';
import { Event, Participant, DashboardStats } from '@/types';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import EventDetailsCard from '@/components/event-admin/EventDetailsCard';
import { mockVisitors, mockExhibitors, mockEvent, mockStats } from '@/lib/mockData';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EventAdminDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [event, setEvent] = useState<Event | null>(null);
  const [visitors, setVisitors] = useState<Participant[]>([]);
  const [exhibitors, setExhibitors] = useState<Participant[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Using mock data for demonstration
      setEvent(mockEvent);
      setVisitors(mockVisitors);
      setExhibitors(mockExhibitors);
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const quickActions = [
    {
      title: 'Upload Visitors',
      description: 'Import visitor data from Excel',
      icon: <Upload />,
      color: '#2e7d32',
      action: () => {/* Handle upload */ },
    },
    {
      title: 'Upload Exhibitors',
      description: 'Import exhibitor data from Excel',
      icon: <Upload />,
      color: '#ed6c02',
      action: () => {/* Handle upload */ },
    },
    {
      title: 'Custom Attributes',
      description: 'Manage custom fields',
      icon: <Settings />,
      color: '#1976d2',
      action: () => {/* Handle attributes */ },
    },
    {
      title: 'Send Invitations',
      description: 'Send invites to participants',
      icon: <Email />,
      color: '#dc004e',
      action: () => {/* Handle invitations */ },
    },
  ];

  const statCards = [
    {
      title: 'Total Visitors',
      value: stats?.registeredVisitors || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      subtitle: `${visitors.filter(v => v.status === 'registered').length} registered`,
    },
    {
      title: 'Total Exhibitors',
      value: stats?.registeredExhibitors || 0,
      icon: <Business sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      subtitle: `${exhibitors.filter(e => e.status === 'registered').length} registered`,
    },
    {
      title: 'Pending Invitations',
      value: stats?.pendingInvitations || 0,
      icon: <Email sx={{ fontSize: 40 }} />,
      color: '#dc004e',
      subtitle: 'Awaiting response',
    },
    {
      title: 'Event Status',
      value: event?.status || 'N/A',
      icon: <Visibility sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      subtitle: event ? `${event.name}` : 'No event assigned',
    },
  ];

  return (
    <DashboardLayout title="Event Admin Dashboard" userRole="event-admin">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Event Details */}
        {event && (
          <Box mb={4}>
            <EventDetailsCard event={event} onEventUpdate={fetchDashboardData} />
          </Box>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
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
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                    onClick={action.action}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Box sx={{ color: action.color, mb: 1 }}>
                        {action.icon}
                      </Box>
                      <Typography variant="subtitle2" component="div">
                        {action.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Participants Management Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <People />
                    All Participants ({visitors.length + exhibitors.length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <People />
                    Visitors ({visitors.length})
                  </Box>
                }
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Business />
                    Exhibitors ({exhibitors.length})
                  </Box>
                }
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ height: '900px', width: '100%' }}>
              <iframe
                src="/iframe/participants-cards"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                }}
                title="All Participants Cards"
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ height: '800px', width: '100%' }}>
              <iframe
                src="/iframe/visitors"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                }}
                title="Visitors with Matching Exhibitors"
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ height: '800px', width: '100%' }}>
              <iframe
                src="/iframe/exhibitors"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                }}
                title="Exhibitors with Interested Visitors"
              />
            </Box>
          </TabPanel>
        </Card>
      </Container>
    </DashboardLayout>
  );
} 