import { Box, Container, Typography, Card, CardContent, Button } from '@mui/material';
import Link from 'next/link';
import { Event } from '@mui/icons-material';

export default function HomePage() {
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
            Event Management Portal
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
            Manage your events and connect participants
          </Typography>
        </Box>

        <Card
          sx={{
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            borderRadius: 4,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'secondary.main',
                  color: 'white',
                  mb: 2,
                }}
              >
                <Event sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
                Event Admin Login
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Access your event management dashboard
              </Typography>
            </Box>

            <Button
              component={Link}
              href="/auth/event-admin/login"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: 'secondary.main',
                '&:hover': {
                  bgcolor: 'secondary.dark',
                },
              }}
            >
              Login to Dashboard
            </Button>
          </CardContent>
        </Card>

        <Box textAlign="center" mt={6}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            © 2024 Event Management Portal. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 