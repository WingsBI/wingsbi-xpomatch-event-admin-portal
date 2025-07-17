"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Grid, 
  Skeleton, 
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  Work,
  Star,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi, type Exhibitor } from '@/services/fieldMappingApi';

export default function ExhibitorDetails() {
  const searchParams = useSearchParams();
  const exhibitorId = searchParams.get('exhibitorId');
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExhibitorDetails = async () => {
      if (!exhibitorId) {
        setError('No exhibitor ID provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Extract identifier from URL path
        const pathParts = window.location.pathname.split('/');
        const identifier = pathParts[1]; // Assuming URL pattern: /[identifier]/event-admin/exhibitors/details

        console.log('🔍 Fetching exhibitor details:', {
          identifier,
          exhibitorId,
          url: window.location.pathname
        });

        const response = await fieldMappingApi.getExhibitorById(identifier, parseInt(exhibitorId, 10));
        
        console.log('🔍 Exhibitor details response:', {
          isError: response.isError,
          statusCode: response.statusCode,
          message: response.message,
          hasResult: !!response.result,
          resultKeys: response.result ? Object.keys(response.result) : []
        });
        
        if (response.isError) {
          // Provide user-friendly error messages
          let errorMessage = response.message || 'Failed to fetch exhibitor details';
          
          if (response.statusCode === 404) {
            errorMessage = `Exhibitor with ID ${exhibitorId} not found. Please check the exhibitor ID and try again.`;
          } else if (response.statusCode === 401) {
            errorMessage = 'Authentication required. Please log in again.';
          } else if (response.statusCode === 403) {
            errorMessage = 'Access denied. You do not have permission to view this exhibitor.';
          } else if (response.statusCode >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          setError(errorMessage);
        } else {
          setExhibitor(response.result);
        }
      } catch (err) {
        console.error('❌ Error fetching exhibitor details:', err);
        setError('An error occurred while fetching exhibitor details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExhibitorDetails();
  }, [exhibitorId]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
        <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Skeleton variant="circular" width={80} height={80} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" height={32} />
                      <Skeleton variant="text" width="40%" height={24} />
                    </Box>
                  </Box>
                  <Box mt={3}>
                    <Skeleton variant="text" width="100%" height={20} />
                    <Skeleton variant="text" width="80%" height={20} />
                    <Skeleton variant="text" width="90%" height={20} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </RoleBasedRoute>
    );
  }

  if (error) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
        <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Container>
      </RoleBasedRoute>
    );
  }

  if (!exhibitor) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
        <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
          <Alert severity="info">
            No exhibitor details found
          </Alert>
        </Container>
      </RoleBasedRoute>
    );
  }

  return (
    <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
        <Grid container spacing={3}>
          {/* Main Exhibitor Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={3}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      bgcolor: 'primary.main',
                      color: 'white'
                    }}
                  >
                    {exhibitor.companyName ? 
                      exhibitor.companyName.charAt(0).toUpperCase() : 
                      getInitials(exhibitor.firstName, exhibitor.lastName)
                    }
                  </Avatar>
                  
                  <Box flex={1}>
                    <Typography variant="h4" component="h1" gutterBottom>
                      {exhibitor.companyName || `${exhibitor.firstName} ${exhibitor.lastName}`}
                    </Typography>
                    
                    {exhibitor.jobTitle && (
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {exhibitor.jobTitle}
                      </Typography>
                    )}

                    <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                      {exhibitor.boothNumber && (
                        <Chip
                          icon={<Business />}
                          label={`Booth: ${exhibitor.boothNumber}`}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {exhibitor.industry && (
                        <Chip
                          icon={<Work />}
                          label={exhibitor.industry}
                          variant="outlined"
                        />
                      )}
                      {exhibitor.location && (
                        <Chip
                          icon={<LocationOn />}
                          label={exhibitor.location}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Email color="action" />
                    <Typography>{exhibitor.email}</Typography>
                  </Box>
                  
                  {exhibitor.phoneNumber && (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Phone color="action" />
                      <Typography>{exhibitor.phoneNumber}</Typography>
                    </Box>
                  )}
                  
                  {exhibitor.website && (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Language color="action" />
                      <Typography 
                        component="a" 
                        href={exhibitor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {exhibitor.website}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Company Details */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Company Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box display="flex" flexDirection="column" gap={2}>
                  {exhibitor.companyDescription && (
                    <Typography variant="body2" color="text.secondary">
                      {exhibitor.companyDescription}
                    </Typography>
                  )}
                  
                  {exhibitor.products && exhibitor.products.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Products & Services:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {exhibitor.products.slice(0, 5).map((product: string, index: number) => (
                          <Chip
                            key={index}
                            label={product}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {exhibitor.products.length > 5 && (
                          <Chip
                            label={`+${exhibitor.products.length - 5} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {exhibitor.status && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body1">
                        {exhibitor.status.charAt(0).toUpperCase() + exhibitor.status.slice(1)}
                      </Typography>
                    </Grid>
                  )}
                  
                  {exhibitor.registrationDate && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Registration Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(exhibitor.registrationDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                  
                  {exhibitor.boothSize && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Booth Size
                      </Typography>
                      <Typography variant="body1">
                        {exhibitor.boothSize}
                      </Typography>
                    </Grid>
                  )}
                  
                  {exhibitor.companyType && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Company Type
                      </Typography>
                      <Typography variant="body1">
                        {exhibitor.companyType}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </RoleBasedRoute>
  );
}
