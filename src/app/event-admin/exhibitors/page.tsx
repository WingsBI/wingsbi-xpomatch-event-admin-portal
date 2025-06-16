'use client';

import { Box, Container } from '@mui/material';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function ExhibitorsPage() {
  return (
    <DashboardLayout title="Exhibitors" userRole="event-admin">
      <Box sx={{ display: 'flex' }}>
        {/* Left Side Navigation */}
        <Box
          sx={{
            width: 240,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            left: 0,
            top: 64,
          }}
        >
          {/* Navigation items will be handled by DashboardLayout */}
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            // ml: '240px',
            p: 3,
            height: 'calc(100vh - 64px)',
            overflow: 'hidden',
          }}
        >
          <Container maxWidth="xl" sx={{ height: '100%' }}>
            <Box 
              sx={{ 
                height: '100%',
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
                src="/iframe/exhibitors"
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
        </Box>
      </Box>
    </DashboardLayout>
  );
} 