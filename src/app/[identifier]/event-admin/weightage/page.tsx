'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CardActionArea,
  CardActions,
} from '@mui/material';
import {
  Business,
  Person,
  Settings,
  ArrowForward,
} from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';

export default function WeightagePage() {
  const params = useParams();
  const identifier = params?.identifier as string;
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <RoleBasedRoute allowedRoles={['event_admin', 'event-admin']}>
      <ResponsiveDashboardLayout
        title="Content Score Weightage"
        breadcrumbs={[
          { label: 'Event Admin', href: `/${identifier}/event-admin` },
          { label: 'Weightage' }
        ]}
      >
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="600" sx={{ mb: 4 }}>
            Content Score Weightage Configuration
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Configure the weightage for different fields used in content scoring for exhibitors and visitors.
          </Typography>

          <Grid container spacing={3}>
            {/* Exhibitor Weightage Card */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e8eaed',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardActionArea 
                  onClick={() => handleNavigate(`/${identifier}/weightage/exhibitor`)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Business sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                      <Typography variant="h5" component="h2" fontWeight="600">
                        Exhibitor Weightage
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flex: 1 }}>
                      Configure content score weightage for exhibitor fields such as Last Reviewed Date, 
                      Used Count, Last Updated Date, and Last Used Date.
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="primary.main" fontWeight="500">
                        Configure weightage settings
                      </Typography>
                      <ArrowForward sx={{ color: 'primary.main' }} />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {/* Visitor Weightage Card */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e8eaed',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardActionArea 
                  onClick={() => handleNavigate(`/${identifier}/weightage/visitor`)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Person sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                      <Typography variant="h5" component="h2" fontWeight="600">
                        Visitor Weightage
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flex: 1 }}>
                      Configure content score weightage for visitor fields to optimize 
                      matchmaking algorithms and improve visitor-exhibitor connections.
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="primary.main" fontWeight="500">
                        Configure weightage settings
                      </Typography>
                      <ArrowForward sx={{ color: 'primary.main' }} />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #e8eaed' }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Business />}
                onClick={() => handleNavigate(`/${identifier}/weightage/exhibitor`)}
                sx={{ borderRadius: 2 }}
              >
                Configure Exhibitor Weightage
              </Button>
              <Button
                variant="outlined"
                startIcon={<Person />}
                onClick={() => handleNavigate(`/${identifier}/weightage/visitor`)}
                sx={{ borderRadius: 2 }}
              >
                Configure Visitor Weightage
              </Button>
            </Box>
          </Box>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
