"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Grid, 
  Skeleton, 
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  Work,
  Star,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi, type Exhibitor } from '@/services/fieldMappingApi';

export default function VisitorDashboard() {
  // Default visitor dashboard view (when no exhibitor ID is provided)
  return (
    <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
      <ResponsiveDashboardLayout title="Visitor Dashboard">
        <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            textAlign: 'center'
          }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Visitor Dashboard
            </Typography>
          </Box>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
