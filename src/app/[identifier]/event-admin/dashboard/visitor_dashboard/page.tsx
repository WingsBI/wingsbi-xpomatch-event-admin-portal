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
  IconButton,
  Button,
  Pagination
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  ConnectWithoutContact as ConnectIcon,
  Email,
  Language,
  Work,
  Star,
  Favorite,
  FavoriteBorder,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi, type Exhibitor } from '@/services/fieldMappingApi';
import { useAuth } from '@/context/AuthContext';
import { matchmakingApi } from '@/services/apiService';
import { theme } from '@/lib/theme';
import { getCurrentVisitorId } from '@/utils/authUtils';

export default function VisitorDashboard() {
  const searchParams = useSearchParams();
  const exhibitorId = searchParams.get('exhibitorId');
  const { user, token, isLoading: authLoading } = useAuth();
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const exhibitorsPerPage = 5;
  const totalPages = Math.ceil(recommendations.length / exhibitorsPerPage);
  const paginatedRecommendations = recommendations.slice(
    (currentPage - 1) * exhibitorsPerPage,
    currentPage * exhibitorsPerPage
  );

  useEffect(() => {
    // Reset hasFetched when user, exhibitorId, or token changes
    setHasFetched(false);
  }, [user?.id, exhibitorId, token]);

  useEffect(() => {
    if (authLoading || hasFetched) return;

    // Always get visitorId from current JWT token to avoid cached/stale data
    const visitorId = getCurrentVisitorId();
    console.log('Visitor Dashboard - Current visitor ID from token:', visitorId);
    if (!visitorId) {
      console.log('No visitor ID found in current token');
      return;
    }

    const fetchExhibitorDetails = async () => {
      setHasFetched(true);
      if (!exhibitorId) {
        setLoading(true);
        setError(null);
        try {
          // Extract identifier from URL path
          const pathParts = window.location.pathname.split('/');
          const identifier = pathParts[1];
          console.log('Visitor Dashboard - Calling API with visitorId:', visitorId, 'for identifier:', identifier);
          const response = await matchmakingApi.getVisitorMatch(identifier, visitorId, null);
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

        const response = await fieldMappingApi.getExhibitorById(identifier, parseInt(exhibitorId, 10));

        if (response.isError) {
          setError(response.message || 'Failed to fetch exhibitor details');
        } else {
          setExhibitor(response.result);
        }
      } catch (err) {
        setError('An error occurred while fetching exhibitor details');
        console.error('Error fetching exhibitor details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExhibitorDetails();
  }, [exhibitorId, user, authLoading, hasFetched]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Show loading skeleton when fetching exhibitor details
  if (loading) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
        <ResponsiveDashboardLayout title="Visitor Dashboard">
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
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
        <ResponsiveDashboardLayout title="Visitor Dashboard">
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
  if (exhibitorId && exhibitor) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
        <ResponsiveDashboardLayout title={`Exhibitor Details - ${exhibitor.companyName || `${exhibitor.firstName} ${exhibitor.lastName}`}`}>
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
                        <Typography variant="h4" component="h1" gutterBottom
                          sx={{
                            fontWeight: 600,
                            color: 'primary.main',
                            mb: 1,
                            mt: 0
                          }}>
                          {exhibitor.companyName}
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
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  // Default visitor dashboard view (when no exhibitor ID is provided)
  if (!exhibitorId) {
    if (loading) {
      return (
        <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
          <ResponsiveDashboardLayout title="Visitor Dashboard">
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
        <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
          <ResponsiveDashboardLayout title="Visitor Dashboard">
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Alert severity="error">{error}</Alert>
            </Container>
          </ResponsiveDashboardLayout>
        </RoleBasedRoute>
      );
    }
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
        <ResponsiveDashboardLayout title="Visitor Dashboard">
          <Container maxWidth="lg" sx={{ mt: 0, mb: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Recommended Exhibitors for You
              </Typography>
              <Typography sx={{ fontStyle: 'italic', fontSize: 15, color: 'text.secondary' }}>
                AI based on your interests and event activity
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {paginatedRecommendations.map((rec) => (
                <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={rec.id}>
                  <Card
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      height: '100%',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      border: '1px solid #e8eaed',
                      bgcolor: 'background.paper',
                      position: 'relative',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
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
                          fontSize: 16,
                          letterSpacing: 0.5,
                        }}
                      >
                        {rec.matchPercentage?.toFixed(0)}%
                      </Typography>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 0.5, pb: '8px!important' }}>
                      <Box display="flex" alignItems="Start" gap={1} mb={1} mt={0.5}>
                        <Avatar src={rec.companyLogoPath || undefined} sx={{ ml: 0, bgcolor: 'success.main', color: 'white', width: 36, height: 36, fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {!rec.companyLogoPath && rec.companyName?.charAt(0)}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography 
                          variant="body2" sx={{ fontWeight: 600,color: 'primary.main', fontSize: 14, wordBreak: 'break-word', mt: 1 }}>
                            {rec.companyName}
                          </Typography>
                          
                        </Box>
                      </Box>

                      <Box flex={1} alignItems="center" gap={0.5} mb={0} mt={2}>

                      <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{
                              fontWeight: 500,
                              mb: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'block',
                              lineHeight: 1.2,
                              pl: 0,
                              textAlign: 'left',
                              ml: 2,
                            }}
                          >
                            {rec.companyType}
                          </Typography>
                        <LocationOn sx={{  fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 13 }}>
                          {rec.country}
                        </Typography>
                      </Box>
                    </CardContent>
                    {/* Divider fixed above the Connect button at the bottom */}
                    <Divider sx={{ mb: 1 }} />

                    <Box sx={{ px: 1, pb: 0.4, pt: 0, mt: 0, mb: 0 }}>
                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ConnectIcon />}
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 1,
                            '&:hover': {
                              bgcolor: theme.palette.primary.dark,
                            }
                          }}
                        >
                          Connect
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {/* Simple Pagination Below Cards */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, value) => setCurrentPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </Container>

          {/* Section 2: Based On Category */}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Based On Category
            </Typography>
            {/* Placeholder for category-based recommendations */}
            <Box sx={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', fontStyle: 'italic' }}>
              Coming soon
            </Box>
          </Box>

          {/* Section 3: Because you click */}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Because you click
            </Typography>
            <Box sx={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', fontStyle: 'italic' }}>
              Coming soon
            </Box>
          </Box>
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }
}
