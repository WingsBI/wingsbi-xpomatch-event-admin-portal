'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { authApi } from '@/services/authApi';
import { 
  setAuthToken, 
  setRefreshToken, 
  setUserData, 
  setEventIdentifier,
  setUserRole,
  setUserEmail
} from '@/utils/cookieManager';

interface ExhibitorLoginForm {
  email: string;
  accessCode: string;
}

export default function ExhibitorLoginPage() {
  const router = useRouter();
  const params = useParams();
  const identifier = params.identifier as string;
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
      // Call Azure auth API
      const result = await authApi.login({
        email: data.email,
        password: data.accessCode,
        identifier,
        role: 'exhibitor'
      });

      if (!result.success || !result.data) {
        setError(result.message || result.error || 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      // Persist session via cookies
      setAuthToken(result.data.token);
      if (result.data.refreshToken) setRefreshToken(result.data.refreshToken);
      setUserData(result.data.user);
      setEventIdentifier(identifier);
      setUserRole(result.data.user.role);
      setUserEmail(result.data.user.email);

      // Redirect to exhibitor dashboard
      router.push(`/${identifier}/dashboard/exhibitor_dashboard`);
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
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
        <Card
          sx={{
            boxShadow: { xs: 3, sm: '0 10px 40px rgba(0,0,0,0.1)' },
            borderRadius: { xs: 2, sm: 4 },
            maxWidth: { xs: '100%', sm: 'auto' },
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 56, sm: 64 },
                  height: { xs: 56, sm: 64 },
                  borderRadius: '50%',
                  bgcolor: '#ff6f00',
                  color: 'white',
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                <Business sx={{ fontSize: { xs: 28, sm: 32 } }} />
              </Box>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                fontWeight="600"
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
                Exhibitor Login
              </Typography>
              <Typography 
                variant="body1" 
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
                Access your booth dashboard and connect with visitors
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
                        size={showAccessCode ? 'small' : 'medium'}
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
                sx={{
                  mt: { xs: 2, sm: 3 },
                  mb: 2,
                  py: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1rem', sm: '1.125rem' },
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

              <Box textAlign="center" mt={{ xs: 2, sm: 3 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: { xs: 1.4, sm: 1.5 },
                  }}
                >
                  Need help with your exhibitor account?{' '}
                  <Link 
                    href="/contact" 
                    sx={{ 
                      textDecoration: 'none', 
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    Contact Support
                  </Link>
                </Typography>
              </Box>

              <Box textAlign="center" mt={2}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: { xs: 1.4, sm: 1.5 },
                  }}
                >
                  Are you a visitor?{' '}
                  <Link 
                    href="/auth/visitor/login" 
                    sx={{ 
                      textDecoration: 'none', 
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    Login Here
                  </Link>
                </Typography>
              </Box>

              <Box textAlign="center" mt={2}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: { xs: 1.4, sm: 1.5 },
                  }}
                >
                  <Link 
                    href="/" 
                    sx={{ 
                      textDecoration: 'none', 
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
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