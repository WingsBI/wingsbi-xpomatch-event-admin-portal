'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Box, Container } from '@mui/material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { setIdentifier } from '@/store/slices/appSlice';
import { AppDispatch } from '@/store';

export default function ExhibitorsPage() {
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
      <ResponsiveDashboardLayout title="Exhibitors" 
      
      >
        <Container maxWidth={false} disableGutters sx={{ px: 0, height: '100%' }}>
          <Box sx={{
              height: 'calc(100vh - 120px)',
              width: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            m: 0,
            p: 0,
            // Hide scrollbar but allow scroll
            '&::-webkit-scrollbar': { display: 'none' },
            '-ms-overflow-style': 'none', // IE and Edge
            'scrollbarWidth': 'none', // Firefox
          }}>
            <iframe
              src={`/iframe/exhibitors?identifier=${identifier}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 0,
                left: 0,
                position: 'relative',
                overflow: 'hidden',
              }}
              title="Exhibitors List"
            />
          </Box>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
} 