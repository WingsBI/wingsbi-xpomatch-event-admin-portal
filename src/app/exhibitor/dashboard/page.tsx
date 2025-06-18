'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function ExhibitorDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login');
        // router.push('/dashboard');
      }
       else if (user.role !== 'exhibitor') {
        // Redirect to appropriate dashboard based on role
        router.push('/dashboard');
      } else {
        // Exhibitor is in the right place, redirect to main dashboard
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}
    >
      <CircularProgress />
    </Box>
  );
} 