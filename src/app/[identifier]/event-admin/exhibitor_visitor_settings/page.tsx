'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
} from '@mui/material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';

export default function ExhibitorVisitorSettingsPage() {
  const params = useParams();
  const identifier = params?.identifier as string;

  return (
    <RoleBasedRoute allowedRoles={['event_admin', 'event-admin']}>
      <ResponsiveDashboardLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="600">
              Exhibitor Visitor Settings
            </Typography>
          </Box>
        }
      >
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gap: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Settings page coming soon...
            </Typography>
          </Box>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
