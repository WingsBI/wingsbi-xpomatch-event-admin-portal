'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { 
  Box, 
  Container, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Link as MuiLink 
} from '@mui/material';
import Link from 'next/link';
import { Event } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { setIdentifier } from '@/store/slices/appSlice';
import { AppDispatch } from '@/store';
import { authApi } from '@/services/authApi';
import { setAuthToken, setRefreshToken, setUserData } from '@/utils/cookieManager';

interface LoginForm {
  email: string;
  password: string;
}

export default function EventAdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
        identifier: identifier,
        role: 'event-admin'
      });

      if (response.success && response.data) {
        // Store authentication data in cookies
        setAuthToken(response.data.token);
        if (response.data.refreshToken) {
          setRefreshToken(response.data.refreshToken);
        }
        setUserData(response.data.user);
        
        // Decode JWT token to get role information
        try {
          const token = response.data.token;
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const tokenData = JSON.parse(jsonPayload);
          console.log('Decoded token data:', tokenData);
          
          const roleName = tokenData.roleName;
          const roleId = tokenData.roleid;
          const userRole = tokenData.role; // Also check the role field
          
          console.log('Role information:', { roleName, roleId, userRole });
          
          // Role-based routing - check multiple possible role fields
          if ((roleName === 'Exhibitor' && roleId === '4') || userRole === 'exhibitor') {
            // Exhibitor goes to exhibitor dashboard
            console.log('Redirecting to exhibitor dashboard');
            router.push(`/${identifier}/event-admin/dashboard/exhibitor_dashboard`);
          } else if ((roleName === 'Visitor' && roleId === '3') || userRole === 'visitor') {
            // Visitor goes to visitor dashboard
            console.log('Redirecting to visitor dashboard');
            router.push(`/${identifier}/event-admin/dashboard/visitor_dashboard`);
          } else {
            // Default: Event admin or organizer goes to main dashboard
            console.log('Redirecting to main dashboard');
            router.push(`/${identifier}/event-admin/dashboard`);
          }
        } catch (jwtError) {
          console.error('Error decoding JWT:', jwtError);
          // Fallback to default dashboard
          router.push(`/${identifier}/event-admin/dashboard`);
        }
      } else {
        setError(response.error || response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #dc004e 0%, #9a0036 100%)',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
        <Card 
          sx={{ 
            maxWidth: { xs: '100%', sm: 450 }, 
            mx: 'auto',
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: { xs: 3, sm: 6 },
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box textAlign="center" mb={{ xs: 2, sm: 3 }}>
              <Event 
                sx={{ 
                  fontSize: { xs: 40, sm: 48 }, 
                  color: 'secondary.main', 
                  mb: { xs: 1, sm: 2 } 
                }} 
              />
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{
                  fontSize: { 
                    xs: '1.5rem', 
                    sm: '2rem',
                    md: '2.125rem'
                  },
                  lineHeight: { xs: 1.2, sm: 1.3 },
                  mb: { xs: 1, sm: 2 }
                }}
              >
                Event Admin Login
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontSize: { 
                    xs: '0.875rem', 
                    sm: '1rem' 
                  },
                  lineHeight: { xs: 1.4, sm: 1.5 },
                  px: { xs: 1, sm: 0 },
                }}
              >
                Access your event management dashboard for {identifier}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                }}
              />
              
              <TextField
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  mt: { xs: 2, sm: 3 }, 
                  mb: 2, 
                  py: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  fontWeight: 'bold',
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Box textAlign="center" mt={{ xs: 2, sm: 3 }}>
              <MuiLink
                component={Link}
                href={`/${identifier}`}
                variant="body2"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: { xs: 1.4, sm: 1.5 },
                }}
              >
                ← Back to Main Login
              </MuiLink>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
} 