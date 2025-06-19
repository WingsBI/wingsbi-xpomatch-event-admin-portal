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
  Person,
  Email,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';

interface VisitorLoginForm {
  email: string;
  accessCode: string;
}

export default function VisitorLoginPage() {
  const router = useRouter();
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VisitorLoginForm>();

  const onSubmit = async (data: VisitorLoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any email and access code
      if (data.email && data.accessCode) {
        // Store visitor session (in real app, handle JWT tokens)
        sessionStorage.setItem('userRole', 'visitor');
        sessionStorage.setItem('userEmail', data.email);
        
        // Redirect to visitor dashboard or iframe view
        router.push('/iframe/visitors');
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  bgcolor: 'primary.main',
                  color: 'white',
                  mb: 2,
                }}
              >
                <Person sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
                Visitor Login
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Access your event dashboard and discover exhibitors
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
                label="Email Address"
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
                label="Event Access Code"
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
                helperText={errors.accessCode?.message || 'Enter the access code provided with your invitation'}
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
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box textAlign="center" mt={3}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an access code?{' '}
                  <Link href="/contact" sx={{ textDecoration: 'none', fontWeight: 500 }}>
                    Contact Event Admin
                  </Link>
                </Typography>
              </Box>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Are you an exhibitor?{' '}
                  <Link href="/auth/exhibitor/login" sx={{ textDecoration: 'none', fontWeight: 500 }}>
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