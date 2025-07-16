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
  const params = useParams();
  const identifier = params.identifier as string;
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
      // For demo purposes, accept any email and access code
      if (data.email && data.accessCode) {
        // Store visitor session (in real app, handle JWT tokens)
        sessionStorage.setItem('userRole', 'visitor');
        sessionStorage.setItem('userEmail', data.email);
        
        // Redirect to visitor dashboard
        router.push(`/${identifier}/event-admin/exhibitors`);
      } else {
        setError('Please enter valid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // return (
  //   <Box
  //     sx={{
  //       minHeight: '100vh',
  //       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  //       display: 'flex',
  //       alignItems: 'center',
  //       justifyContent: 'center',
  //       py: { xs: 2, sm: 3, md: 4 },
  //       px: { xs: 1, sm: 2 },
  //     }}
  //   >
  //     <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
  //       <Card
  //         sx={{
  //           boxShadow: { xs: 3, sm: '0 10px 40px rgba(0,0,0,0.1)' },
  //           borderRadius: { xs: 2, sm: 4 },
  //           maxWidth: { xs: '100%', sm: 'auto' },
  //         }}
  //       >
  //         <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
  //           <Box textAlign="center" mb={{ xs: 3, sm: 4 }}>
  //             <Box
  //               sx={{
  //                 display: 'inline-flex',
  //                 alignItems: 'center',
  //                 justifyContent: 'center',
  //                 width: { xs: 56, sm: 64 },
  //                 height: { xs: 56, sm: 64 },
  //                 borderRadius: '50%',
  //                 bgcolor: 'primary.main',
  //                 color: 'white',
  //                 mb: { xs: 1.5, sm: 2 },
  //               }}
  //             >
  //               <Person sx={{ fontSize: { xs: 28, sm: 32 } }} />
  //             </Box>
  //             <Typography 
  //               variant="h4" 
  //               component="h1" 
  //               gutterBottom 
  //               fontWeight="600"
  //               sx={{
  //                 fontSize: { 
  //                   xs: '1.5rem', 
  //                   sm: '2rem',
  //                   md: '2.125rem'
  //                 },
  //                 lineHeight: { xs: 1.2, sm: 1.3 },
  //                 mb: { xs: 1, sm: 2 }
  //               }}
  //             >
  //               Visitor Login
  //             </Typography>
  //             <Typography 
  //               variant="body1" 
  //               color="text.secondary"
  //               sx={{
  //                 fontSize: { 
  //                   xs: '0.875rem', 
  //                   sm: '1rem' 
  //                 },
  //                 lineHeight: { xs: 1.4, sm: 1.5 },
  //                 px: { xs: 1, sm: 0 },
  //               }}
  //             >
  //               Access your event dashboard and discover exhibitors
  //             </Typography>
  //           </Box>

  //           {error && (
  //             <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }}>
  //               {error}
  //             </Alert>
  //           )}

  //           <form onSubmit={handleSubmit(onSubmit)}>
  //             <TextField
  //               fullWidth
  //               label="Email Address"
  //               type="email"
  //               margin="normal"
  //               InputProps={{
  //                 startAdornment: (
  //                   <InputAdornment position="start">
  //                     <Email />
  //                   </InputAdornment>
  //                 ),
  //               }}
  //               {...register('email', {
  //                 required: 'Email is required',
  //                 pattern: {
  //                   value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  //                   message: 'Invalid email address',
  //                 },
  //               })}
  //               error={!!errors.email}
  //               helperText={errors.email?.message}
  //               sx={{
  //                 '& .MuiInputBase-input': {
  //                   fontSize: { xs: '1rem', sm: '1.125rem' },
  //                 },
  //                 '& .MuiInputLabel-root': {
  //                   fontSize: { xs: '1rem', sm: '1.125rem' },
  //                 },
  //               }}
  //             />

  //             <TextField
  //               fullWidth
  //               label="Event Access Code"
  //               type={showAccessCode ? 'text' : 'password'}
  //               margin="normal"
  //               InputProps={{
  //                 endAdornment: (
  //                   <InputAdornment position="end">
  //                     <IconButton
  //                       aria-label="toggle access code visibility"
  //                       onClick={() => setShowAccessCode(!showAccessCode)}
  //                       edge="end"
  //                       size={showAccessCode ? 'small' : 'medium'}
  //                     >
  //                       {showAccessCode ? <VisibilityOff /> : <Visibility />}
  //                     </IconButton>
  //                   </InputAdornment>
  //                 ),
  //               }}
  //               {...register('accessCode', {
  //                 required: 'Access code is required',
  //                 minLength: {
  //                   value: 3,
  //                   message: 'Access code must be at least 3 characters',
  //                 },
  //               })}
  //               error={!!errors.accessCode}
  //               helperText={errors.accessCode?.message || 'Enter the access code provided with your invitation'}
  //               sx={{
  //                 '& .MuiInputBase-input': {
  //                   fontSize: { xs: '1rem', sm: '1.125rem' },
  //                 },
  //                 '& .MuiInputLabel-root': {
  //                   fontSize: { xs: '1rem', sm: '1.125rem' },
  //                 },
  //               }}
  //             />

  //             <Button
  //               type="submit"
  //               fullWidth
  //               variant="contained"
  //               sx={{
  //                 mt: { xs: 2, sm: 3 },
  //                 mb: 2,
  //                 py: { xs: 1.5, sm: 2 },
  //                 fontSize: { xs: '1rem', sm: '1.125rem' },
  //                 fontWeight: 600,
  //                 textTransform: 'none',
  //               }}
  //               disabled={isLoading}
  //             >
  //               {isLoading ? 'Signing In...' : 'Sign In'}
  //             </Button>

  //             <Box textAlign="center" mt={{ xs: 2, sm: 3 }}>
  //               <Typography 
  //                 variant="body2" 
  //                 color="text.secondary"
  //                 sx={{
  //                   fontSize: { xs: '0.875rem', sm: '1rem' },
  //                   lineHeight: { xs: 1.4, sm: 1.5 },
  //                 }}
  //               >
  //                 Don't have an access code?{' '}
  //                 <Link 
  //                   href="/contact" 
  //                   sx={{ 
  //                     textDecoration: 'none', 
  //                     fontWeight: 500,
  //                     fontSize: { xs: '0.875rem', sm: '1rem' },
  //                   }}
  //                 >
  //                   Contact Event Admin
  //                 </Link>
  //               </Typography>
  //             </Box>

  //             <Box textAlign="center" mt={2}>
  //               <Typography 
  //                 variant="body2" 
  //                 color="text.secondary"
  //                 sx={{
  //                   fontSize: { xs: '0.875rem', sm: '1rem' },
  //                   lineHeight: { xs: 1.4, sm: 1.5 },
  //                 }}
  //               >
  //                 Are you an exhibitor?{' '}
  //                 <Link 
  //                   href="/auth/exhibitor/login" 
  //                   sx={{ 
  //                     textDecoration: 'none', 
  //                     fontWeight: 500,
  //                     fontSize: { xs: '0.875rem', sm: '1rem' },
  //                   }}
  //                 >
  //                   Login Here
  //                 </Link>
  //               </Typography>
  //             </Box>

  //             <Box textAlign="center" mt={2}>
  //               <Typography 
  //                 variant="body2" 
  //                 color="text.secondary"
  //                 sx={{
  //                   fontSize: { xs: '0.875rem', sm: '1rem' },
  //                   lineHeight: { xs: 1.4, sm: 1.5 },
  //                 }}
  //               >
  //                 <Link 
  //                   href="/" 
  //                   sx={{ 
  //                     textDecoration: 'none', 
  //                     fontWeight: 500,
  //                     fontSize: { xs: '0.875rem', sm: '1rem' },
  //                   }}
  //                 >
  //                   ← Back to Home
  //                 </Link>
  //               </Typography>
  //             </Box>
  //           </form>
  //         </CardContent>
  //       </Card>
  //     </Container>
  //   </Box>
  // );
} 