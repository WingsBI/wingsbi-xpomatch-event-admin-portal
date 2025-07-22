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
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi, type Visitor } from '@/services/fieldMappingApi';
import { useAuth } from '@/context/AuthContext';
import { ExhibitormatchmakingApi } from '@/services/apiService';
import { getCurrentExhibitorId } from '@/utils/authUtils';

export default function ExhibitorDashboard() {
  const searchParams = useSearchParams();
  const visitorId = searchParams.get('visitorId');
  const { user } = useAuth();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const fetchVisitorDetails = async () => {
      if (!visitorId) {
        setLoading(true);
        setError(null);
        // Fetch recommendations for the logged-in visitor
        try {
          // Extract identifier from URL path
          const pathParts = window.location.pathname.split('/');
          const identifier = pathParts[1];
          const exhibitorId = getCurrentExhibitorId();
          if (!exhibitorId) throw new Error('Exhibitor ID not found');
          const response = await ExhibitormatchmakingApi.getExhibitorMatch(identifier, exhibitorId, null);
          console.log("responseee",response);
          if (response.isError) {
            setError(response.message || 'Failed to fetch recommendations');
            setRecommendations([]);
          } else {
            // Sort by matchPercentage descending
            const sorted = (response.result || []).sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);
            setRecommendations(sorted);
          }
        } catch (err: any) {
          setError(err.message || 'An error occurred while fetching recommendations');
          setRecommendations([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Extract identifier from URL path
        const pathParts = window.location.pathname.split('/');
        const identifier = pathParts[1]; // Assuming URL pattern: /[identifier]/event-admin/dashboard/visitor_dashboard

        const response = await fieldMappingApi.getVisitorById(identifier, parseInt(visitorId, 10));
        
        if (response.isError) {
          setError(response.message || 'Failed to fetch exhibitor details');
        } else {
          setVisitor(response.result);
        }
      } catch (err) {
        setError('An error occurred while fetching Visitor details');
        console.error('Error fetching visitor details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorDetails();
  }, [visitorId, user]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Show loading skeleton when fetching exhibitor details
  if (loading) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
        <ResponsiveDashboardLayout title="Exhibitor Dashboard">
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
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  // Show error if there was an issue fetching exhibitor details
  if (error) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
        <ResponsiveDashboardLayout title="Exhibitor Dashboard">
          <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Container>
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  // If exhibitor ID is provided and exhibitor data is available, show exhibitor details
  if (visitorId && visitor) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
        <ResponsiveDashboardLayout title={`Exhibitor Details - ${visitor.companyName || `${visitor.firstName} ${visitor.lastName}`}`}>
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
                      {visitor.companyName ? 
                        visitor.companyName.charAt(0).toUpperCase() : 
                        getInitials(visitor.firstName, visitor.lastName)
                      }
                    </Avatar>
                    
                    <Box flex={1}>
                      <Typography variant="h4" component="h1" gutterBottom>
                        {visitor.companyName || `${visitor.firstName} ${visitor.lastName}`}
                      </Typography>
                      
                      {visitor.jobTitle && (
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          {visitor.jobTitle}
                        </Typography>
                      )}

                      <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                        
                        {visitor.industry && (
                          <Chip
                            icon={<Work />}
                            label={visitor.industry}
                            variant="outlined"
                          />
                        )}
                        {visitor.location && (
                          <Chip
                            icon={<LocationOn />}
                            label={visitor.location}
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
                      <Typography>{visitor.email}</Typography>
                    </Box>
                    
                    {visitor.phoneNumber && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Phone color="action" />
                        <Typography>{visitor.phoneNumber}</Typography>
                      </Box>
                    )}
                    
                    {visitor.website && (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Language color="action" />
                        <Typography 
                          component="a" 
                          href={visitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {visitor.website}
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
                    {visitor.companyDescription && (
                      <Typography variant="body2" color="text.secondary">
                        {visitor.companyDescription}
                      </Typography>
                    )}
                    
                    {visitor.products && visitor.products.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Products & Services:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {visitor.products.slice(0, 5).map((product: string, index: number) => (
                            <Chip
                              key={index}
                              label={product}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {visitor.products.length > 5 && (
                            <Chip
                              label={`+${visitor.products.length - 5} more`}
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
                    {visitor.status && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Status
                        </Typography>
                        <Typography variant="body1">
                          {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
                        </Typography>
                      </Grid>
                    )}
                    
                    {visitor.registrationDate && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Registration Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(visitor.registrationDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                    
                    {visitor.boothSize && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Booth Size
                        </Typography>
                        <Typography variant="body1">
                          {visitor.boothSize}
                        </Typography>
                      </Grid>
                    )}
                    
                    {visitor.companyType && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Company Type
                        </Typography>
                        <Typography variant="body1">
                          {visitor.companyType}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
                      </Grid>
          </Container>
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  // Default visitor dashboard view (when no exhibitor ID is provided)
  if (!visitorId) {
    if (loading) {
      return (
        <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
          <ResponsiveDashboardLayout title="Exhibitor Dashboard">
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <Skeleton variant="rectangular" width="100%" height={120} />
              </Box>
            </Container>
          </ResponsiveDashboardLayout>
        </RoleBasedRoute>
      );
    }
    if (error) {
      return (
        <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
          <ResponsiveDashboardLayout title="exhibitor Dashboard">
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Alert severity="error">{error}</Alert>
            </Container>
          </ResponsiveDashboardLayout>
        </RoleBasedRoute>
      );
    }
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
        <ResponsiveDashboardLayout title="exhibitor Dashboard">
          <Container maxWidth="lg" sx={{ mt: 0, mb: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, mt: 0 }}>
              Recommended Visitors for You
            </Typography>
        
            <Grid container spacing={2}>
              {recommendations.map((rec) => (
                <Grid item xs={12} sm={6} md={3} key={rec.id}>
                  <Card
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      boxShadow: 1,
                      position: 'relative',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: 4,
                      },
                      p: 1,
                      width: '100%',
                    }}
                    elevation={1}
                  >
                    {/* Match Percentage Top Right */}
                    <Box sx={{ position: 'absolute', top: 0, right: 14, zIndex: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontStyle: 'italic',
                          color: '#222',
                          fontWeight: 600,
                          fontSize: 18,
                          letterSpacing: 0.5,
                        }}
                      >
                        {rec.matchPercentage?.toFixed(0)}%
                      </Typography>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 1, pb: '8px!important' }}>
                      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                        <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 36, height: 36, fontWeight: 'bold', fontSize: 16 }}>
                          {getInitials(rec.firstName, rec.lastName)}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#222', fontSize: 15, wordBreak: 'break-word' ,mt: 1}}>
                            {rec.salutation} {rec.firstName} {rec.middleName} {rec.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>
                            {rec.userProfile?.jobTitle || 'No job title'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 13, display: 'block' }}>
                            {rec.userProfile?.companyName || 'No company'}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                    </CardContent>
                    <Box sx={{ px: 1, pb: 1, pt: 0, mt: 1, mb: 1 }}>
                      <Box display="flex" justifyContent="flex-end">
                        <Chip
                          label="View Details"
                          color="primary"
                          clickable
                          size="small"
                          sx={{ fontWeight: 'bold', height: 24 }}
                          // onClick handler can be added to navigate to visitor details
                        />
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }
}
