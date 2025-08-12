'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Box, Container } from '@mui/material';
import dynamic from 'next/dynamic';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { setIdentifier } from '@/store/slices/appSlice';
import { AppDispatch } from '@/store';

export default function VisitorsPage() {
  const params = useParams();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  return (
    <RoleBasedRoute allowedRoles={['event-admin', 'visitor', 'exhibitor']}>
      <ResponsiveDashboardLayout title="Visitors" >
        <Container maxWidth={false} disableGutters sx={{ px: 0, height: '100%' }}>
          <Box sx={{ height: 'calc(100vh - 120px)', width: '100%', overflowY: 'auto', overflowX: 'hidden', m: 0, p: 0 }}>
            <LazyVisitorListView identifier={identifier} />
          </Box>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
} 

const LazyVisitorListView = dynamic(
  () => import('@/components/participants/VisitorsListView').then(m => m.VisitorListView),
  { ssr: false, loading: () => null }
);