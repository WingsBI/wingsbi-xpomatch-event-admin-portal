'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business,
  Email,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';

interface ExhibitorLoginForm {
  email: string;
  accessCode: string;
}

export default function ExhibitorLoginPage() {
  const router = useRouter();
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExhibitorLoginForm>();

  const onSubmit = async (data: ExhibitorLoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any email and access code
      if (data.email && data.accessCode) {
        // Store exhibitor session (in real app, handle JWT tokens)
        sessionStorage.setItem('userRole', 'exhibitor');
        sessionStorage.setItem('userEmail', data.email);
        
        // Redirect to exhibitor dashboard or iframe view
        router.push('/iframe/exhibitors');
      } else {
        setError('Please enter valid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
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
                  bgcolor: '#ff6f00',
                  color: 'white',
                  mb: 2,
                }}
              >
                <Business sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
                Exhibitor Login
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Access your booth dashboard and connect with visitors
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Company Email Address"
                type="email"
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <TextField
                fullWidth
                label="Exhibitor Access Code"
                type={showAccessCode ? 'text' : 'password'}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle access code visibility"
                        onClick={() => setShowAccessCode(!showAccessCode)}
                        edge="end"
                      >
                        {showAccessCode ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                {...register('accessCode', {
                  required: 'Access code is required',
                  minLength: {
                    value: 3,
                    message: 'Access code must be at least 3 characters',
                  },
                })}
                error={!!errors.accessCode}
                helperText={errors.accessCode?.message || 'Enter your exhibitor access code'}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  bgcolor: '#ff6f00',
                  '&:hover': {
                    bgcolor: '#e65100',
                  },
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box textAlign="center" mt={3}>
                <Typography variant="body2" color="text.secondary">
                  Need help with your exhibitor account?{' '}
                  <Link href="/contact" sx={{ textDecoration: 'none', fontWeight: 500 }}>
                    Contact Support
                  </Link>
                </Typography>
              </Box>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Are you a visitor?{' '}
                  <Link href="/auth/visitor/login" sx={{ textDecoration: 'none', fontWeight: 500 }}>
                    Login Here
                  </Link>
                </Typography>
              </Box>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  <Link href="/" sx={{ textDecoration: 'none', fontWeight: 500 }}>
                    ← Back to Home
                  </Link>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
} 