'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Event as EventIcon,
  People,
  AdminPanelSettings,
  Email 
} from '@mui/icons-material';
import { Event, DashboardStats } from '@/types';
import CreateEventDialog from '@/components/it-admin/CreateEventDialog';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { mockEvent, mockStats } from '@/lib/mockData';

export default function ITAdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Using mock data for demonstration
      setEvents([mockEvent]);
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setCreateEventOpen(true);
  };

  const handleEventCreated = () => {
    setCreateEventOpen(false);
    fetchDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statCards = [
    {
      title: 'Total Events',
      value: stats?.totalEvents || 0,
      icon: <EventIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Active Events',
      value: stats?.activeEvents || 0,
      icon: <EventIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Total Participants',
      value: stats?.totalParticipants || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Event Admins',
      value: events.filter(e => e.eventAdminId).length,
      icon: <AdminPanelSettings sx={{ fontSize: 40 }} />,
      color: '#dc004e',
    },
  ];

  return (
    <DashboardLayout title="IT Admin Dashboard" userRole="it-admin">
      <Container maxWidth="xl" sx={{ py: 3 }}>
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

        {/* Events Management */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" component="h2">
                Events Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateEvent}
              >
                Create Event
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Event ID</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Event Admin</TableCell>
                    <TableCell>Participants</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {event.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {event.eventId}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(event.startDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.status}
                          color={getStatusColor(event.status) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        {event.eventAdminId ? (
                          <Chip
                            label="Assigned"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            label="Not Assigned"
                            color="warning"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          V: 6 | E: 4
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="info">
                          <Email />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No events created yet. Create your first event to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Create Event Dialog */}
        <CreateEventDialog
          open={createEventOpen}
          onClose={() => setCreateEventOpen(false)}
          onEventCreated={handleEventCreated}
        />
      </Container>
    </DashboardLayout>
  );
} 