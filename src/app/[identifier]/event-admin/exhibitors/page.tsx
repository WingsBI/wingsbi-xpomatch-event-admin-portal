'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Box, Container } from '@mui/material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
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
    <ResponsiveDashboardLayout title="Exhibitors" breadcrumbs={[
      { label: 'Dashboard', href: `/${identifier}/event-admin/dashboard` },
      { label: 'Exhibitors' }
    ]}>
      <Container maxWidth="xl" sx={{ height: '100%' }}>
        <Box 
          sx={{ 
            height: 'calc(100vh - 120px)',
            width: '100%',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
              '&:hover': {
                background: '#555',
              },
            },
          }}
        >
          <iframe
            src={`/iframe/exhibitors?identifier=${identifier}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
            }}
            title="Exhibitors List"
          />
        </Box>
      </Container>
    </ResponsiveDashboardLayout>
  );
} 