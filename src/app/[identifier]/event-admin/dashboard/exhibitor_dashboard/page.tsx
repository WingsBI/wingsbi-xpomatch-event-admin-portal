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
  Email,
  Language,
  Work,
  Star,
  Favorite,
  FavoriteBorder,
  LinkedIn,
  Language as LanguageIcon
} from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi, type Visitor } from '@/services/fieldMappingApi';
import { useAuth } from '@/context/AuthContext';
import { ExhibitormatchmakingApi } from '@/services/apiService';
import { getCurrentExhibitorId } from '@/utils/authUtils';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ConnectIcon from '@mui/icons-material/ConnectWithoutContact';
import { FavoritesManager } from '@/utils/favoritesManager';


export default function ExhibitorDashboard() {
  const searchParams = useSearchParams();
  const visitorId = searchParams.get('visitorId');
  const { user } = useAuth();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);


  // Pagination hooks must be at the top level
  const [page, setPage] = useState(1);
  const cardsPerPage = 5;
  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  const paginatedRecs = recommendations.slice((page - 1) * cardsPerPage, page * cardsPerPage);
  const totalPages = Math.ceil(recommendations.length / cardsPerPage);

  const [favoriteVisitorIds, setFavoriteVisitorIds] = useState(new Set());
  const [loadingFavoriteId, setLoadingFavoriteId] = useState<string | null>(null);

  // Load favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      const pathParts = window.location.pathname.split('/');
      const identifier = pathParts[1];
      const favorites = await FavoritesManager.getExhibitorFavoriteVisitors(identifier);
      setFavoriteVisitorIds(new Set(favorites.map(fav => fav.visitorId)));
    };
    loadFavorites();
  }, []);

  // Toggle handler
  const handleFavoriteToggle = async (visitorId: string) => {
    setLoadingFavoriteId(visitorId);
    const pathParts = window.location.pathname.split('/');
    const identifier = pathParts[1];
    const isCurrentlyFavorite = favoriteVisitorIds.has(visitorId);
    const finalStatus = await FavoritesManager.toggleVisitorFavorite(identifier, visitorId, isCurrentlyFavorite);
    setFavoriteVisitorIds(prev => {
      const newSet = new Set(prev);
      if (finalStatus) {
        newSet.add(visitorId);
      } else {
        newSet.delete(visitorId);
      }
      return newSet;
    });
    setLoadingFavoriteId(null);
  };

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

  // // Show loading skeleton when fetching exhibitor details
  // if (loading) {
  //   return (
  //     <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
  //       <ResponsiveDashboardLayout title="Exhibitor Dashboard">
  //         <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
  //           <Grid container spacing={3}>
  //             <Grid item xs={12}>
  //               <Card>
  //                 <CardContent>
  //                   <Box display="flex" alignItems="center" gap={2}>
  //                     <Skeleton variant="circular" width={80} height={80} />
  //                     <Box flex={1}>
  //                       <Skeleton variant="text" width="60%" height={32} />
  //                       <Skeleton variant="text" width="40%" height={24} />
  //                     </Box>
  //                   </Box>
  //                   <Box mt={3}>
  //                     <Skeleton variant="text" width="100%" height={20} />
  //                     <Skeleton variant="text" width="80%" height={20} />
  //                     <Skeleton variant="text" width="90%" height={20} />
  //                   </Box>
  //                 </CardContent>
  //               </Card>
  //             </Grid>
  //           </Grid>
  //         </Container>
  //       </ResponsiveDashboardLayout>
  //     </RoleBasedRoute>
  //   );
  // }

  // // Show error if there was an issue fetching exhibitor details
  // if (error) {
  //   return (
  //     <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
  //       <ResponsiveDashboardLayout title="Exhibitor Dashboard">
  //         <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
  //           <Alert severity="error" sx={{ mb: 2 }}>
  //             {error}
  //           </Alert>
  //         </Container>
  //       </ResponsiveDashboardLayout>
  //     </RoleBasedRoute>
  //   );
  // }

  // // If visitor ID is provided and visitor data is available, show visitor details
  // if (visitorId && visitor) {
  //   return (
  //     <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
  //       <ResponsiveDashboardLayout title={`Exhibitor Details - ${visitor.companyName || `${visitor.firstName} ${visitor.lastName}`}`}>
  //         <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
  //         <Grid container spacing={3}>
  //           {/* Main Visitor Card */}
  //           <Grid item xs={12}>
  //             <Card>
  //               <CardContent>
  //                 <Box display="flex" alignItems="flex-start" gap={3}>
  //                   <Avatar
  //                     sx={{
  //                       width: 80,
  //                       height: 80,
  //                       fontSize: '1.5rem',
  //                       fontWeight: 'bold',
  //                       bgcolor: 'primary.main',
  //                       color: 'white'
  //                     }}
  //                   >
  //                     {visitor.companyName ? 
  //                       visitor.companyName.charAt(0).toUpperCase() : 
  //                       getInitials(visitor.firstName, visitor.lastName)
  //                     }
  //                   </Avatar>
                    
  //                   <Box flex={1}>
  //                     <Typography variant="h4" component="h1" gutterBottom>
  //                       {visitor.companyName || `${visitor.firstName} ${visitor.lastName}`}
  //                     </Typography>
                      
  //                     {visitor.jobTitle && (
  //                       <Typography variant="h6" color="text.secondary" gutterBottom>
  //                         {visitor.jobTitle}
  //                       </Typography>
  //                     )}
  //                     <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                        
  //                       {visitor.industry && (
  //                         <Chip
  //                           icon={<Work />}
  //                           label={visitor.industry}
  //                           variant="outlined"
  //                         />
  //                       )}
  //                       {visitor.location && (
  //                         <Chip
  //                           icon={<LocationOn />}
  //                           label={visitor.location}
  //                           variant="outlined"
  //                         />
  //                       )}
  //                     </Box>
  //                   </Box>
  //                 </Box>
  //               </CardContent>
  //             </Card>
  //           </Grid>

  //           {/* Contact Information */}
  //           <Grid item xs={12} md={6}>
  //             <Card>
  //               <CardContent>
  //                 <Typography variant="h6" gutterBottom>
  //                   Contact Information
  //                 </Typography>
  //                 <Divider sx={{ mb: 2 }} />
                  
  //                 <Box display="flex" flexDirection="column" gap={2}>
  //                   <Box display="flex" alignItems="center" gap={2}>
  //                     <Email color="action" />
  //                     <Typography>{visitor.email}</Typography>
  //                   </Box>
                    
  //                   {visitor.phoneNumber && (
  //                     <Box display="flex" alignItems="center" gap={2}>
  //                       <Phone color="action" />
  //                       <Typography>{visitor.phoneNumber}</Typography>
  //                     </Box>
  //                   )}
                    
  //                   {visitor.website && (
  //                     <Box display="flex" alignItems="center" gap={2}>
  //                       <Language color="action" />
  //                       <Typography 
  //                         component="a" 
  //                         href={visitor.website}
  //                         target="_blank"
  //                         rel="noopener noreferrer"
  //                         sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
  //                       >
  //                         {visitor.website}
  //                       </Typography>
  //                     </Box>
  //                   )}
  //                 </Box>
  //               </CardContent>
  //             </Card>
  //           </Grid>

  //           {/* Company Details */}
  //           <Grid item xs={12} md={6}>
  //             <Card>
  //               <CardContent>
  //                 <Typography variant="h6" gutterBottom>
  //                   Company Details
  //                 </Typography>
  //                 <Divider sx={{ mb: 2 }} />
                  
  //                 <Box display="flex" flexDirection="column" gap={2}>
  //                   {visitor.companyDescription && (
  //                     <Typography variant="body2" color="text.secondary">
  //                       {visitor.companyDescription}
  //                     </Typography>
  //                   )}
                    
  //                   {visitor.products && visitor.products.length > 0 && (
  //                     <Box>
  //                       <Typography variant="subtitle2" gutterBottom>
  //                         Products & Services:
  //                       </Typography>
  //                       <Box display="flex" flexWrap="wrap" gap={0.5}>
  //                         {visitor.products.slice(0, 5).map((product: string, index: number) => (
  //                           <Chip
  //                             key={index}
  //                             label={product}
  //                             size="small"
  //                             variant="outlined"
  //                           />
  //                         ))}
  //                         {visitor.products.length > 5 && (
  //                           <Chip
  //                             label={`+${visitor.products.length - 5} more`}
  //                             size="small"
  //                             variant="outlined"
  //                           />
  //                         )}
  //                       </Box>
  //                     </Box>
  //                   )}
  //                 </Box>
  //               </CardContent>
  //             </Card>
  //           </Grid>

  //           {/* Additional Information */}
  //           <Grid item xs={12}>
  //             <Card>
  //               <CardContent>
  //                 <Typography variant="h6" gutterBottom>
  //                   Additional Information
  //                 </Typography>
  //                 <Divider sx={{ mb: 2 }} />
                  
  //                 <Grid container spacing={2}>
  //                   {visitor.status && (
  //                     <Grid item xs={12} sm={6} md={3}>
  //                       <Typography variant="subtitle2" color="text.secondary">
  //                         Status
  //                       </Typography>
  //                       <Typography variant="body1">
  //                         {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
  //                       </Typography>
  //                     </Grid>
  //                   )}
                    
  //                   {visitor.registrationDate && (
  //                     <Grid item xs={12} sm={6} md={3}>
  //                       <Typography variant="subtitle2" color="text.secondary">
  //                         Registration Date
  //                       </Typography>
  //                       <Typography variant="body1">
  //                         {new Date(visitor.registrationDate).toLocaleDateString()}
  //                       </Typography>
  //                     </Grid>
  //                   )}
                    
  //                   {visitor.boothSize && (
  //                     <Grid item xs={12} sm={6} md={3}>
  //                       <Typography variant="subtitle2" color="text.secondary">
  //                         Booth Size
  //                       </Typography>
  //                       <Typography variant="body1">
  //                         {visitor.boothSize}
  //                       </Typography>
  //                     </Grid>
  //                   )}
                    
  //                   {visitor.companyType && (
  //                     <Grid item xs={12} sm={6} md={3}>
  //                       <Typography variant="subtitle2" color="text.secondary">
  //                         Company Type
  //                       </Typography>
  //                       <Typography variant="body1">
  //                         {visitor.companyType}
  //                       </Typography>
  //                     </Grid>
  //                   )}
  //                 </Grid>
  //               </CardContent>
  //             </Card>
  //           </Grid>
  //                     </Grid>
  //         </Container>
  //       </ResponsiveDashboardLayout>
  //     </RoleBasedRoute>
  //   );
  // }

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
              {paginatedRecs.map((rec) => (
                <Grid item xs={12} sm={6} md={2.4} key={rec.id}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      boxShadow: 1,
                      bgcolor: 'white',
                      p: 2,
                      minHeight: 185,
                      maxHeight: 185,
                      height: 185,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      position: 'relative',
                      overflow: 'hidden',
                      wordWrap: 'break-word',
                    }}
                  >
                    {/* Match Percentage Top Right with Favorite Button */}
                    <Box sx={{ position: 'absolute', top: 10, right: 18, zIndex: 2, display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        sx={{ mr: 0, p: 0.5 ,mt:-1  ,ml:-3,
                          position: 'absolute',
                          cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                            },
                            '&:active': {
                              transform: 'scale(0.95)',
                            },
                            '&:disabled': {
                              opacity: 0.6
                            }

                        }}
                        onClick={() => handleFavoriteToggle(rec.id)}
                        disabled={loadingFavoriteId === rec.id}
                        
                      >
                        {favoriteVisitorIds.has(rec.id) ? (
                          <Favorite 
                          sx={{
                            fontSize: 20,
                            color: '#ef4444',
                            filter: 'drop-shadow(0 0 3px rgba(78, 12, 17, 0.15))',
                            transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                            animation: favoriteVisitorIds.has(rec.id) ? 'heartBeat 0.8s ease-in-out' : 'none',
                            '@keyframes heartBeat': {
                              '0%': { transform: 'scale(1)' },
                              '25%': { transform: 'scale(1.3)' },
                              '50%': { transform: 'scale(1.1)' },
                              '75%': { transform: 'scale(1.2)' },
                              '100%': { transform: 'scale(1.1)' },
                            },
                          }}
                          />
                        ) : (
                          <FavoriteBorder 
                          sx={{
                            fontSize: 20,
                            color: '#b0bec5',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              color: '#ff6b9d',
                            }
                          }}
                           />
                        )}
                      </IconButton>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontStyle: 'italic',
                          color: '#222',
                          fontWeight: 600,
                          fontSize: 16,
                          letterSpacing: 0.5,
                          mt: -1,
                        }}
                      >
                        {rec.matchPercentage?.toFixed(0)}%
                      </Typography>
                    </Box>
                    {/* Avatar and Name */}
                    <Box display="flex" alignItems="flex-start" gap={0.5} mb={0} mt={1} sx={{ position: 'relative', zIndex: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 36, height: 36, fontWeight: 'bold', fontSize: 16 }}>
                        {getInitials(rec.firstName, rec.lastName)}
                      </Avatar>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, wordBreak: 'break-word', color: '#222', fontSize: 15, lineHeight: 1.2, m: 0, p: 0 }}>
                          {rec.salutation} {rec.firstName} {rec.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 13, m: 0, p: 0, lineHeight: 1.2, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                          {rec.userProfile?.jobTitle || 'No job title'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 13, whiteSpace: 'normal', m: 0, p: 0 , lineHeight: 1.2, wordBreak: 'break-word'}}>
                          {rec.userProfile?.companyName || 'No company'}
                        </Typography>
                      </Box>
                    </Box>
                    {/* Divider above button row */}
                    <Divider sx={{ position: 'absolute', left: 16, right: 16, bottom: 60 }} />
                    {/* Button Row */}
                    <Box display="flex" alignItems="center" gap={1} sx={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
                      {/* {rec.userProfile?.linkedInProfile && (
                        <IconButton size="small" sx={{ color: '#0077b5' }} onClick={() => window.open(rec.userProfile.linkedInProfile, '_blank')}>
                          <LinkedIn fontSize="small" />
                        </IconButton>
                      )}
                      {rec.userProfile?.companyWebsite && (
                        <IconButton size="small" sx={{ color: '#555' }} onClick={() => window.open(rec.userProfile.companyWebsite, '_blank')}>
                          <LanguageIcon fontSize="small" />
                        </IconButton>
                      )} */}
                      <Box flex={1} />
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<ConnectIcon />}
                        sx={{
                          fontWeight: 'bold',
                          borderRadius: 2,
                          textTransform: 'none',
                          px: 2,
                          minWidth: 100,
                          boxShadow: 'none',
                        }}
                      >
                        Connect
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {/* Pagination controls below cards */}
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handleChange}
                color="primary"
              />
            </Box>
            {/* Leave the rest of the area blank */}
          </Container>
           <Container maxWidth="lg" sx={{ mt: 0, mb: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, mt: 0 }}>
              Based On Category
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={3}>
                   
           
              <Typography sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, mt: 0,paddingBottom:3,paddingTop:3 }}>
                Comming Soon...
                </Typography>
              </Box>
              </CardContent>
              </Card>
              </Grid>
              </Grid>
           </Container>

            <Container maxWidth="lg" sx={{ mt: 2, mb: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, mt: 0 }}>
              Based on Category
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={3}>
                   
           
              <Typography sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, mt: 0,paddingBottom:3,paddingTop:3 }}>
                Comming Soon...
                </Typography>
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
}
