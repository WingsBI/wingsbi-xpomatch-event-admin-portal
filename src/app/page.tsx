import { Box, Container, Typography, Card, CardContent, Button, Grid } from '@mui/material';
import Link from 'next/link';
import { AdminPanelSettings, Event, People, Business } from '@mui/icons-material';

export default function HomePage() {
  const portals = [
    {
      title: 'IT Admin Portal',
      description: 'Manage events, create event administrators, and oversee the entire platform.',
      icon: <AdminPanelSettings fontSize="large" color="primary" />,
      href: '/auth/it-admin/login',
      color: '#1976d2',
    },
    {
      title: 'Event Admin Portal',
      description: 'Manage event details, participants, and send invitations.',
      icon: <Event fontSize="large" color="secondary" />,
      href: '/auth/event-admin/login',
      color: '#dc004e',
    },
    {
      title: 'Visitor Portal',
      description: 'Register for events and connect with exhibitors.',
      icon: <People fontSize="large" sx={{ color: '#2e7d32' }} />,
      href: '/auth/visitor/login',
      color: '#2e7d32',
    },
    {
      title: 'Exhibitor Portal',
      description: 'Showcase your business and connect with potential customers.',
      icon: <Business fontSize="large" sx={{ color: '#ed6c02' }} />,
      href: '/auth/exhibitor/login',
      color: '#ed6c02',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            AI Matchmaking Platform
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 300,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Connect the right people at the right time with AI-powered event management
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {portals.map((portal) => (
            <Grid item xs={12} sm={6} md={3} key={portal.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 3,
                  }}
                >
                  <Box mb={2}>{portal.icon}</Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {portal.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, flexGrow: 1 }}
                  >
                    {portal.description}
                  </Typography>
                  <Button
                    component={Link}
                    href={portal.href}
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: portal.color,
                      '&:hover': {
                        bgcolor: portal.color,
                        filter: 'brightness(1.1)',
                      },
                    }}
                  >
                    Access Portal
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center" mt={6}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            © 2024 AI Matchmaking Platform. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 