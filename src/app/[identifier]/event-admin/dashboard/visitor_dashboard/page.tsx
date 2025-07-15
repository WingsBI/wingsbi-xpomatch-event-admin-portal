"use client";

import { Box, Container, Typography } from '@mui/material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';

export default function VisitorDashboard() {
  return (
    <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
      <ResponsiveDashboardLayout title="Visitor Dashboard">
        <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            textAlign: 'center'
          }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
             Visitors Dashboard! 
            </Typography>
          </Box>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
