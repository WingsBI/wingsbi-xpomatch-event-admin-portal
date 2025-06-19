"use client";

import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
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
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import EventDetailsCard from '@/components/event-admin/EventDetailsCard';
import { SimpleThemeSelector } from '@/components/theme/SimpleThemeSelector';
import { mockVisitors, mockExhibitors, mockEvent, mockStats } from '@/lib/mockData';
import { RootState, AppDispatch } from "@/store";
import { setIdentifier } from "@/store/slices/appSlice";

export default function EventAdminDashboard() {
  const params = useParams();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Set identifier in Redux store when component mounts
  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  useEffect(() => {
    fetchDashboardData();
  }, [identifier]);

  const fetchDashboardData = async () => {
    try {
      // Using mock data for demonstration, but customize for identifier
      const customEvent = {
        ...mockEvent,
        eventId: identifier,
        name: `${identifier} Event`,
        description: `Event management dashboard for ${identifier}`
      };
      setEvent(customEvent);
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



  return (
    <ResponsiveDashboardLayout 
      title={`${identifier} Event Dashboard`}
      breadcrumbs={[
        { label: 'Event Admin', href: `/${identifier}/event-admin` },
        { label: 'Dashboard' }
      ]}
    >
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          p: 3,
        }}
      >
          <Container maxWidth="xl">
            {/* Header with Welcome Message */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Welcome back, {user?.name || 'Ritesh Amilkanthwar'}!
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Manage your event and track participant engagement
                </Typography>
              </Box>
              <SimpleThemeSelector />
            </Box>

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
    </ResponsiveDashboardLayout>
  );
}