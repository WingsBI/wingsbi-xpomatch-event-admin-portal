"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
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
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  IconButton as MuiIconButton,
  PaginationItem,
  Fade,
  Slide,
  useTheme,
  alpha
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
  Language as LanguageIcon,
  Close,
  ArrowBackIos,
  ArrowForwardIos,
  BusinessCenter
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
import { TransformedVisitor } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';


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
  const [pageDirection, setPageDirection] = useState<'left' | 'right'>('left');
  const handlePageChange = (_: any, value: number) => {
    setPageDirection(value > page ? 'left' : 'right');
    setPage(value);
  };
  const paginatedRecs = recommendations.slice((page - 1) * cardsPerPage, page * cardsPerPage);
  const totalPages = Math.ceil(recommendations.length / cardsPerPage);

  const [favoriteVisitorIds, setFavoriteVisitorIds] = useState(new Set());
  const [loadingFavoriteId, setLoadingFavoriteId] = useState<string | null>(null);

  // Dialog state for visitor details
  const [selectedVisitor, setSelectedVisitor] = useState<TransformedVisitor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleNameClick = (visitor: TransformedVisitor) => {
    console.log('Clicked visitor:', visitor);
    setSelectedVisitor(visitor);
    setDialogOpen(true);
  };

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
          console.log("responseee", response);
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

  const theme = useTheme();
  const router = useRouter();

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
           <VisitorDetailsDialog
             open={dialogOpen}
             onClose={() => setDialogOpen(false)}
             visitor={selectedVisitor}
           />
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
            <VisitorDetailsDialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              visitor={selectedVisitor}
            />
          </ResponsiveDashboardLayout>
        </RoleBasedRoute>
      );
    }
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'exhibitor']}>
        <ResponsiveDashboardLayout title="exhibitor Dashboard">
          <Container maxWidth="lg" sx={{ mt: -2, mb: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 0 }}>
              <Typography variant="h5" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary' }}>
              Recommended Visitors for You
            </Typography>
            </Box>
            <AnimatePresence mode="wait" custom={pageDirection}>
              <motion.div
                key={page}
                custom={pageDirection}
                variants={{
                  enter: (direction: 'left' | 'right') => ({ opacity: 0, x: direction === 'left' ? 40 : -40 }),
                  center: { opacity: 1, x: 0 },
                  exit: (direction: 'left' | 'right') => ({ opacity: 0, x: direction === 'left' ? -40 : 40 })
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
              <Grid container spacing={2} sx={{ mb: -1 }}>
                {paginatedRecs.map((rec) => (
                  <Grid item xs={12} sm={6} md={2.4} key={rec.id}>
                    <Card
                      sx={{
                          mt: 0,
                          borderRadius: 3,
                          height: '100%',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                          border: '1px solid #e8eaed',
                          bgcolor: 'background.paper',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px) scale(1.02)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          },
                          
                          width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                      }}
                        elevation={1}
                    >
                        {/* Match Percentage and Favorite Icon (top right) */}
                        <Box sx={{ position: 'absolute', top: 2, right: 10, zIndex: 2, display: 'flex', alignItems: 'center', gap: 0 }}>
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
                          <IconButton
                            size="small"
                            sx={{

                              ml: 0.5,
                              color: favoriteVisitorIds.has(rec.id) ? '#ef4444' : '#b0bec5',
                              transition: 'all 0.2s ease',
                              '&:hover': { color: '#ff6b9d' },
                            }}
                            onClick={() => handleFavoriteToggle(rec.id)}
                            disabled={loadingFavoriteId === rec.id}
                          >
                            {loadingFavoriteId === rec.id ? (
                              <Skeleton variant="circular" width={20} height={20} />
                            ) : favoriteVisitorIds.has(rec.id) ? (
                              <Favorite sx={{ fontSize: 20, color: '#ef4444', filter: 'drop-shadow(0 0 3px rgba(78, 12, 17, 0.15))', transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)', animation: 'heartBeat 0.8s ease-in-out' }} />
                            ) : (
                              <FavoriteBorder sx={{ fontSize: 20, color: '#b0bec5' }} />
                            )}
                          </IconButton>
                        </Box>
                        <CardContent sx={{ p: 1, pb: 0.5, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                          {/* Header with Avatar, Name, Job Title, Company, Location */}
                          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1} sx={{ minHeight: '60px' }}>
                            <Avatar sx={{
                              bgcolor: 'success.main',
                              width: 36,
                              height: 36,
                              mr: 1.5,
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              flexShrink: 0,
                              color: 'white',
                              alignSelf: 'top',
                              mt: 2,
                            }}>
                            {getInitials(rec.firstName, rec.lastName)}
                          </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0, mt: 3}}>
                              <Box>
                                <Typography variant="body2" component="div" fontWeight="600" sx={{ ml: 0, display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.2, wordBreak: 'break-word' }}>
                            {rec.salutation} {rec.firstName} {rec.lastName}
                                </Typography>
                          </Box>

                              <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}>
                                  {rec.userProfile?.jobTitle}
                          </Typography>
                              </Box>
                            </Box>

                          </Box>


                          <Box display="flex" alignItems="center" mb={1}>
                            <BusinessCenter sx={{ alignSelf: 'start', fontSize: 15, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
                            {rec.userProfile?.companyName || 'No company'}
                          </Typography>
                        </Box>
                          {rec.customData?.location && (
                            <Box display="flex" alignItems="center" mb={1}>
                              <LocationOn sx={{ alignSelf: 'start', fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="subtitle2" color="text.secondary">
                                {rec.customData.location}
                              </Typography>
                      </Box>
                          )}
                          {/* Divider fixed above the action row at the bottom */}
                          <Divider sx={{ mb: 1, mt: 'auto' }} />
                          {/* Action Buttons Row at the bottom */}
                          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 0, mb: -2 }}>
                            <Box display="flex" gap={1}>
                              {rec.userProfile?.linkedInProfile && (
                                <IconButton size="small" sx={{ color: '#0077b5', '&:hover': { backgroundColor: 'rgba(0, 119, 181, 0.1)', transform: 'scale(1.1)' } }} onClick={() => window.open(rec.userProfile.linkedInProfile, '_blank')} title="View LinkedIn Profile">
                            <LinkedIn fontSize="small" />
                          </IconButton>
                        )}
                            </Box>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ConnectIcon />}
                              onClick={() => {
                                const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
                                const identifier = pathParts[1] || '';
                                router.push(`/${identifier}/event-admin/meetings?view=list`);
                              }}
                          sx={{
                                bgcolor: theme.palette.primary.main,
                            borderRadius: 2,
                            textTransform: 'none',
                                fontWeight: 500,
                                px: 1,
                                '&:hover': {
                                  bgcolor: theme.palette.primary.dark,
                                  transform: 'scale(1.02)'
                                }
                          }}
                        >
                          Connect
                        </Button>
                      </Box>
                        </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              </motion.div>
            </AnimatePresence>
            {/* Pagination UI same as visitor dashboard */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" alignItems="center" mt={1} mb={0.5} gap={1}>
                <IconButton
                  onClick={() => handlePageChange(null, Math.max(1, page - 1))}
                  disabled={page === 1}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <ArrowBackIos fontSize="small" />
                </IconButton>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      mx: 0.5,
                      backgroundColor:
                        page === idx + 1
                          ? theme.palette.primary.main
                          : alpha(theme.palette.primary.main, 0.25),
                      opacity: 1,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      border: page === idx + 1 ? `2px solid ${theme.palette.primary.dark}` : 'none'
                    }}
                    onClick={() => handlePageChange(null, idx + 1)}
                  />
                ))}
                <IconButton
                  onClick={() => handlePageChange(null, Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <ArrowForwardIos fontSize="small" />
                </IconButton>
            </Box>
            )}
            {/* Leave the rest of the area blank */}
          </Container>
          
          {/* Section 2: Based On Category */}
          <Divider sx={{ my: 0.5 }} />

          <Typography variant="h6" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Based On Category
            </Typography>

              <Box display="flex" alignItems="flex-start" gap={3}>
            <Typography sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary', mb: 1, mt: 0, paddingBottom: 3, paddingTop: 3, paddingLeft: 50 }}>
                
              Coming Soon...
            </Typography>
            </Box>
              
            
          <Divider sx={{ mb: 0.5, mt: 0.5 }} />

          <Typography variant="h6" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary', mb: -1, mt: 1 }}>
              Because you clicked
            </Typography>

                  <Box display="flex" alignItems="flex-start" gap={3}>
                   
           
            <Typography sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary', mb: 1, mt: 0, paddingBottom: 3, paddingTop: 4, paddingLeft: 50 }}>
              Coming Soon...
                </Typography>
              </Box>
          <Divider sx={{ mt: 2 }} />
           <VisitorDetailsDialog
             open={dialogOpen}
             onClose={() => setDialogOpen(false)}
             visitor={selectedVisitor}
           />
           </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }
}

{/* Add VisitorDetailsDialog component */ }
function VisitorDetailsDialog({ open, onClose, visitor }: { open: boolean; onClose: () => void; visitor: TransformedVisitor | null }) {
  if (!visitor) return null;
  const getInitials = (firstName: string, lastName: string) => `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  const isMobile = useMediaQuery('(max-width:600px)');
  return (
    <Dialog open={open} maxWidth="lg" fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: 3, width: '100%', height: isMobile ? '100vh' : '100%' } }}
      onClose={(_event: object, reason: string) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
        Visitor Details
        <MuiIconButton aria-label="close" onClick={onClose} size={isMobile ? 'medium' : 'small'}>
          <Close />
        </MuiIconButton>
      </DialogTitle>
      <DialogContent sx={{ p: isMobile ? 1 : 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ width: 50, height: 50, fontSize: '1.5rem', fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
            {getInitials(visitor.firstName, visitor.lastName)}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{visitor.firstName} {visitor.lastName}</Typography>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{visitor.jobTitle}</Typography>
            <Typography variant="body2" color="text.secondary">{visitor.company}</Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {/* Column 1: Personal Info */}
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Email:</Typography>
              <Typography variant="body2">{visitor.email}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Phone:</Typography>
              <Typography variant="body2">{visitor.phone || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Country:</Typography>
              <Typography variant="body2">{visitor.country || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Status:</Typography>
              <Typography variant="body2">{visitor.status}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Registration Date:</Typography>
              <Typography variant="body2">{visitor.registrationDate?.toLocaleString?.() || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Salutation:</Typography>
              <Typography variant="body2">{visitor.customData?.salutation || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Middle Name:</Typography>
              <Typography variant="body2">{visitor.customData?.middleName || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Gender:</Typography>
              <Typography variant="body2">{visitor.customData?.gender || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Date of Birth:</Typography>
              <Typography variant="body2">{visitor.customData?.dateOfBirth || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Nationality:</Typography>
              <Typography variant="body2">{visitor.customData?.nationality || '-'}</Typography>
            </Box>
          </Grid>
          {/* Column 2: Social/Contact */}
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>LinkedIn:</Typography>
              <Typography variant="body2">
                {visitor.customData?.linkedInProfile ? (
                  <a href={visitor.customData.linkedInProfile} target="_blank" rel="noopener noreferrer">{visitor.customData.linkedInProfile}</a>
                ) : '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Instagram:</Typography>
              <Typography variant="body2">
                {visitor.customData?.instagramProfile ? (
                  <a href={visitor.customData.instagramProfile} target="_blank" rel="noopener noreferrer">{visitor.customData.instagramProfile}</a>
                ) : '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>GitHub:</Typography>
              <Typography variant="body2">
                {visitor.customData?.gitHubProfile ? (
                  <a href={visitor.customData.gitHubProfile} target="_blank" rel="noopener noreferrer">{visitor.customData.gitHubProfile}</a>
                ) : '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Twitter:</Typography>
              <Typography variant="body2">
                {visitor.customData?.twitterProfile ? (
                  <a href={visitor.customData.twitterProfile} target="_blank" rel="noopener noreferrer">{visitor.customData.twitterProfile}</a>
                ) : '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Decision Maker:</Typography>
              <Typography variant="body2">{visitor.customData?.decisionmaker ? 'Yes' : 'No'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Experience:</Typography>
              <Typography variant="body2">{visitor.customData?.experience || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Interests:</Typography>
              <Typography variant="body2">{visitor.interests && visitor.interests.length > 0 ? visitor.interests.join(', ') : '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Looking For:</Typography>
              <Typography variant="body2">{visitor.customData?.lookingFor && visitor.customData.lookingFor.length > 0 ? visitor.customData.lookingFor.join(', ') : '-'}</Typography>
            </Box>
          </Grid>
          {/* Column 3: Address/Other */}
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Address:</Typography>
              <Typography variant="body2">{visitor.customData?.addressLine1 || '-'} {visitor.customData?.addressLine2 || ''}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>City:</Typography>
              <Typography variant="body2">{visitor.customData?.cityName || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>State:</Typography>
              <Typography variant="body2">{visitor.customData?.stateName || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Postal Code:</Typography>
              <Typography variant="body2">{visitor.customData?.postalCode || '-'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={0.5}>
              <Typography variant="body2" fontWeight={600} mr={1}>Location:</Typography>
              <Typography variant="body2">{visitor.customData?.location || '-'}</Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

      
