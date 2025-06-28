'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Container, Typography, Card, CardContent, Grid } from '@mui/material';
import { Business, People, Event, TrendingUp } from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import { setIdentifier } from '@/store/slices/appSlice';
import { AppDispatch, RootState } from '@/store';

export default function ExhibitorDashboard() {
  const params = useParams();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  const dashboardCards = [
    {
      title: 'My Booth',
      value: 'A-123',
      icon: <Business />,
      color: '#1976d2',
    },
    {
      title: 'Visitor Meetings',
      value: '24',
      icon: <People />,
      color: '#2e7d32',
    },
    {
      title: 'Event Sessions',
      value: '8',
      icon: <Event />,
      color: '#ed6c02',
    },
    {
      title: 'Engagement Score',
      value: '87%',
      icon: <TrendingUp />,
      color: '#9c27b0',
    },
  ];

  return (
    <ResponsiveDashboardLayout title="Exhibitor Dashboard">
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.firstName} {user?.lastName}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your booth and connect with visitors at {identifier}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {dashboardCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}25 100%)`,
                  border: `1px solid ${card.color}30`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        backgroundColor: card.color,
                        color: 'white',
                        mr: 2,
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Typography variant="h6" component="div">
                      {card.title}
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: card.color, fontWeight: 'bold' }}>
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Visitor Meetings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Schedule and manage meetings with event visitors
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Booth Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update your booth details and showcase materials
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ResponsiveDashboardLayout>
  );
} 