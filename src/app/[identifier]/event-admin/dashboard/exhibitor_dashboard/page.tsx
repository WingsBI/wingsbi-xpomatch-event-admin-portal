"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
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
  alpha,
  Tooltip
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
  BusinessCenter,
  Refresh
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
import dynamic from 'next/dynamic';

export default function ExhibitorDashboard() {
  const searchParams = useSearchParams();
  const params = useParams();
  const identifier = params.identifier as string;
  const visitorId = searchParams.get('visitorId');
  const { user } = useAuth();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [exhibitorRecommendations, setExhibitorRecommendations] = useState<any[]>([]);
  const [exhibitorId, setExhibitorId] = useState<number | null>(null);

  // Fetch exhibitor recommendations
  useEffect(() => {
    const fetchExhibitorRecommendations = async () => {
      try {
        const currentExhibitorId = await getCurrentExhibitorId();
        setExhibitorId(currentExhibitorId);
        
        if (currentExhibitorId && identifier) {
          console.log('Calling getExhibitortoExhibitorMatch API');
          const response = await ExhibitormatchmakingApi.getExhibitortoExhibitorMatch(identifier, currentExhibitorId);
          
          if (response && response.result) {
            // Handle different response structures
            let exhibitorData;
            if (Array.isArray(response.result)) {
              // API returns array directly
              exhibitorData = response.result;
              console.log('Using direct array response for exhibitors, count:', exhibitorData.length);
            } else {
              // API returns object with exhibitorDetails array
              exhibitorData = response.result.exhibitorDetails || [];
              console.log('Using exhibitorDetails from response, count:', exhibitorData.length);
            }
            const sorted = exhibitorData.sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);
            setExhibitorRecommendations(sorted);
          }
          
          // Also fetch favorited exhibitors to update favorite state
          const favorites = await FavoritesManager.getExhibitorFavoriteExhibitors(identifier);
          setFavoriteExhibitorIds(new Set(favorites.map(fav => fav.id)));
        }
      } catch (error) {
        console.error('Error fetching exhibitor recommendations:', error);
        setError('Failed to fetch exhibitor recommendations');
      }
    };

    if (identifier) {
      fetchExhibitorRecommendations();
    }
  }, [identifier]);

  // Pagination hooks must be at the top level
  // Pagination for visitor recommendations
  const [visitorPage, setVisitorPage] = useState(1);
  const [exhibitorPage, setExhibitorPage] = useState(1);
  const cardsPerPage = 5;
  const [pageDirection, setPageDirection] = useState<'left' | 'right'>('left');
  
  const handleVisitorPageChange = (_: any, value: number) => {
    setPageDirection(value > visitorPage ? 'left' : 'right');
    setVisitorPage(value);
  };

  const handleExhibitorPageChange = (_: any, value: number) => {
    setPageDirection(value > exhibitorPage ? 'left' : 'right');
    setExhibitorPage(value);
  };

  const paginatedVisitorRecs = recommendations.slice((visitorPage - 1) * cardsPerPage, visitorPage * cardsPerPage);
  const paginatedExhibitorRecs = exhibitorRecommendations.slice((exhibitorPage - 1) * cardsPerPage, exhibitorPage * cardsPerPage);
  
  const totalVisitorPages = Math.ceil(recommendations.length / cardsPerPage);
  const totalExhibitorPages = Math.ceil(exhibitorRecommendations.length / cardsPerPage);

  const [favoriteVisitorIds, setFavoriteVisitorIds] = useState(new Set());
  const [favoriteExhibitorIds, setFavoriteExhibitorIds] = useState(new Set());
  const [loadingFavoriteId, setLoadingFavoriteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog state for visitor details
  const [selectedVisitorId, setSelectedVisitorId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleNameClick = (visitorId: number) => {
    setSelectedVisitorId(visitorId);
    setDialogOpen(true);
  };

  // Refresh recommendations function
  const handleRefreshRecommendations = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setLoading(true);
    setError(null);
    
    try {
      const currentExhibitorId = await getCurrentExhibitorId();
      if (!currentExhibitorId || !identifier) {
        setError('Unable to refresh recommendations');
        return;
      }

      console.log('Refreshing recommendations - calling matchmaking APIs');
      
      // Call both matchmaking APIs to get fresh recommendations
      const [exhibitorResponse, visitorResponse] = await Promise.all([
        ExhibitormatchmakingApi.getExhibitortoExhibitorMatch(identifier, currentExhibitorId),
        ExhibitormatchmakingApi.getExhibitorMatch(identifier, currentExhibitorId, null)
      ]);

      // Handle exhibitor recommendations
      if (exhibitorResponse && exhibitorResponse.result) {
        const exhibitorData = Array.isArray(exhibitorResponse.result) 
          ? exhibitorResponse.result 
          : exhibitorResponse.result.exhibitorDetails || [];
        const sortedExhibitors = exhibitorData.sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);
        setExhibitorRecommendations(sortedExhibitors);
        console.log('Refreshed exhibitor recommendations count:', sortedExhibitors.length);
      }

      // Handle visitor recommendations  
      if (visitorResponse && !visitorResponse.isError && visitorResponse.result) {
        const visitorData = Array.isArray(visitorResponse.result)
          ? visitorResponse.result
          : visitorResponse.result.visitorDetails || [];
        const sortedVisitors = visitorData.sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);
        setRecommendations(sortedVisitors);
        console.log('Refreshed visitor recommendations count:', sortedVisitors.length);
      }
      
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      setError('Failed to refresh recommendations');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Toggle handler for visitor-to-exhibitor favorites (recommended visitors section)
  const handleVisitorFavoriteToggle = async (visitorId: string) => {
    setLoadingFavoriteId(visitorId);
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

  // Toggle handler for exhibitor-to-exhibitor favorites (recommended exhibitors section)
  const handleExhibitorFavoriteToggle = async (exhibitorId: string) => {
    setLoadingFavoriteId(exhibitorId);
    const isCurrentlyFavorite = favoriteExhibitorIds.has(exhibitorId);
    const finalStatus = await FavoritesManager.toggleExhibitorToExhibitorFavorite(identifier, exhibitorId, isCurrentlyFavorite);
    setFavoriteExhibitorIds(prev => {
      const newSet = new Set(prev);
      if (finalStatus) {
        newSet.add(exhibitorId);
      } else {
        newSet.delete(exhibitorId);
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
          const exhibitorId = getCurrentExhibitorId();
          if (!exhibitorId) throw new Error('Exhibitor ID not found');
          
          console.log('Calling getExhibitorMatch API');
          const response = await ExhibitormatchmakingApi.getExhibitorMatch(identifier, exhibitorId, null);
          
          console.log("responseee", response);
          if (response.isError) {
            setError(response.message || 'Failed to fetch recommendations');
            setRecommendations([]);
          } else {
            // Handle different response structures
            let visitorData;
            if (Array.isArray(response.result)) {
              // API returns array directly
              visitorData = response.result;
              console.log('Using direct array response for visitors, count:', visitorData.length);
            } else {
              // API returns object with visitorDetails array
              visitorData = response.result.visitorDetails || [];
              console.log('Using visitorDetails from response, count:', visitorData.length);
            }
            // Sort by matchPercentage descending
            const sorted = visitorData.sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);
            setRecommendations(sorted);
            
            // Also fetch favorited visitors to update favorite state
            const favoriteVisitors = await FavoritesManager.getExhibitorFavoriteVisitors(identifier);
            const favoriteVisitorIds = favoriteVisitors.map((favorite: any) => favorite.visitorId.toString());
            setFavoriteVisitorIds(new Set(favoriteVisitorIds));
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
            <LazyVisitorDetailsDialog
             open={dialogOpen}
             onClose={() => setDialogOpen(false)}
             visitorId={selectedVisitorId}
             identifier={identifier}
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
            <LazyVisitorDetailsDialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              visitorId={selectedVisitorId}
              identifier={identifier}
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
                              key={visitorPage}
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
                {paginatedVisitorRecs.map((rec) => (
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
                              color: favoriteVisitorIds.has(rec.id.toString()) ? '#ef4444' : '#b0bec5',
                              transition: 'all 0.2s ease',
                              '&:hover': { color: '#ff6b9d' },
                            }}
                            onClick={() => handleVisitorFavoriteToggle(rec.id.toString())}
                            disabled={loadingFavoriteId === rec.id.toString()}
                          >
                            {loadingFavoriteId === rec.id.toString() ? (
                              <Skeleton variant="circular" width={20} height={20} />
                            ) : favoriteVisitorIds.has(rec.id.toString()) ? (
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
                                <Typography
                                  variant="body2"
                                  component="div"
                                  fontWeight="600"
                                  sx={{
                                    ml: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    lineHeight: 1.2,
                                    // wordBreak: 'break-word',
                                    // cursor: 'pointer',
                                    // color: 'primary.main', // link color
                                    // textDecoration: 'none', // no underline by default
                                    // transition: 'text-decoration 0.2s',
                                    // '&:hover': {
                                    //   textDecoration: 'underline', // underline only on hover
                                    // },
                                  }}
                                 // onClick={() => handleNameClick(rec.id)}
                                >
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
                            {/* <Box display="flex" gap={1}>
                              {rec.userProfile?.linkedInProfile && (
                                <IconButton size="small" sx={{ color: '#0077b5', '&:hover': { backgroundColor: 'rgba(0, 119, 181, 0.1)', transform: 'scale(1.1)' } }} onClick={() => window.open(rec.userProfile.linkedInProfile, '_blank')} title="View LinkedIn Profile">
                            <LinkedIn fontSize="small" />
                          </IconButton>
                        )}
                            </Box> */}
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ConnectIcon />}
                              onClick={() => {
                                console.log('Connect button clicked for exhibitor:', rec.id, 'Type:', typeof rec.id);
                                router.push(`/${identifier}/event-admin/meetings/schedule-meeting?exhibitorId=${rec.id}`);
                              }}
                          sx={{
                                bgcolor: theme.palette.primary.main,
                            borderRadius: 2,
                            textTransform: 'none',
                                fontWeight: 500,
                                px: 1,
                                ml:10,
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
            {totalVisitorPages > 1 && (
              <Box display="flex" justifyContent="center" alignItems="center" mt={1} mb={0.5} gap={1}>
                <IconButton
                  onClick={() => handleVisitorPageChange(null, Math.max(1, visitorPage - 1))}
                  disabled={visitorPage === 1}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <ArrowBackIos fontSize="small" />
                </IconButton>
                {Array.from({ length: totalVisitorPages }).map((_, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      mx: 0.5,
                      backgroundColor:
                        visitorPage === idx + 1
                          ? theme.palette.primary.main
                          : alpha(theme.palette.primary.main, 0.25),
                      opacity: 1,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      border: visitorPage === idx + 1 ? `2px solid ${theme.palette.primary.dark}` : 'none'
                    }}
                    onClick={() => handleVisitorPageChange(null, idx + 1)}
                  />
                ))}
                <IconButton
                  onClick={() => handleVisitorPageChange(null, Math.min(totalVisitorPages, visitorPage + 1))}
                  disabled={visitorPage === totalVisitorPages}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <ArrowForwardIos fontSize="small" />
                </IconButton>
            </Box>
            )}
            {/* Leave the rest of the area blank */}
          </Container>
          
                    {/* Section 2: Recommended Exhibitors */}
          <Divider sx={{ my: 0.5 }} />

          <Typography variant="h5" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary', ml: 3 }}>
              Recommended Exhibitors for You
            </Typography>

          <AnimatePresence mode="wait" custom={pageDirection}>
            <motion.div
              key={exhibitorPage}
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
              <Grid container spacing={2} sx={{ mb: -1  , mt: 0,ml: 1}}>
                {paginatedExhibitorRecs.map((rec) => (
                  <Grid item xs={12} sm={6} md={2.3} key={rec.id}>
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
                            color: favoriteExhibitorIds.has(rec.id) ? '#ef4444' : '#b0bec5',
                            transition: 'all 0.2s ease',
                            '&:hover': { color: '#ff6b9d' },
                          }}
                          onClick={() => handleExhibitorFavoriteToggle(rec.id)}
                          disabled={loadingFavoriteId === rec.id}
                        >
                          {loadingFavoriteId === rec.id ? (
                            <Skeleton variant="circular" width={20} height={20} />
                          ) : favoriteExhibitorIds.has(rec.id) ? (
                            <Favorite sx={{ fontSize: 20, color: '#ef4444', filter: 'drop-shadow(0 0 3px rgba(78, 12, 17, 0.15))', transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)', animation: 'heartBeat 0.8s ease-in-out' }} />
                          ) : (
                            <FavoriteBorder sx={{ fontSize: 20, color: '#b0bec5' }} />
                          )}
                        </IconButton>
                      </Box>
                      <CardContent sx={{ p: 0.5 , pb: 0.5, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
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
                            {rec.companyName ? rec.companyName.charAt(0).toUpperCase() : 'E'}
                          </Avatar>

                          <Box sx={{ flex: 1, minWidth: 0, mt: 3}}>
                            <Box>
                              <Typography
                                variant="body2"
                                component="div"
                                fontWeight="600"
                                sx={{
                                  ml: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  lineHeight: 1.2,
                                  wordBreak: 'break-word',
                                  // cursor: 'pointer',
                                  // color: 'primary.main',
                                  // textDecoration: 'none',
                                  // transition: 'text-decoration 0.2s',
                                  // '&:hover': {
                                  //   textDecoration: 'underline',
                                  // },
                                }}
                               // onClick={() => handleNameClick(rec.id)}
                              >
                                {rec.companyName}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}>
                                {rec.companyType}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {rec.exhibitorAddress && rec.exhibitorAddress[0] && (
                          <Box display="flex" alignItems="center" mb={1}>
                            <LocationOn sx={{ alignSelf: 'start', fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="subtitle2" color="text.secondary">
                              {`${rec.exhibitorAddress[0].city}, ${rec.exhibitorAddress[0].stateProvince}, ${rec.country}`}
                            </Typography>
                          </Box>
                        )}

                        <Divider sx={{ mb: 1, mt: 'auto' }} />
                        
                        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 0, mb: -2 }}>
                          <Box display="flex" gap={1}>
                            {rec.exhibitorProfile && rec.exhibitorProfile[0]?.linkedInLink && (
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  color: '#0077b5', 
                                  '&:hover': { 
                                    backgroundColor: 'rgba(0, 119, 181, 0.1)', 
                                    transform: 'scale(1.1)' 
                                  } 
                                }} 
                                onClick={() => window.open(rec.exhibitorProfile[0].linkedInLink, '_blank')} 
                                title="View LinkedIn Profile"
                              >
                                <LinkedIn fontSize="small" />
                              </IconButton>
                            )}
                            {rec.webSite && (
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  color: 'gray', 
                                  '&:hover': { 
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1), 
                                    transform: 'scale(1.1)' 
                                  } 
                                }} 
                                onClick={() => window.open(rec.webSite, '_blank')} 
                                title="Visit Website"
                              >
                                <Language fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ConnectIcon />}
                            onClick={() => {
                              router.push(`/${identifier}/event-admin/meetings/schedule-meeting?exhibitorId=${rec.id}`);
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
          
          {totalExhibitorPages > 1 && (
            <Box display="flex" justifyContent="center" alignItems="center" mt={3} mb={0.5} gap={1}>
              <IconButton
                onClick={() => handleExhibitorPageChange(null, Math.max(1, exhibitorPage - 1))}
                disabled={exhibitorPage === 1}
                sx={{ color: theme.palette.primary.main }}
              >
                <ArrowBackIos fontSize="small" />
              </IconButton>
              {Array.from({ length: totalExhibitorPages }).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    mx: 0.5,
                    backgroundColor:
                      exhibitorPage === idx + 1
                        ? theme.palette.primary.main
                        : alpha(theme.palette.primary.main, 0.25),
                    opacity: 1,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    border: exhibitorPage === idx + 1 ? `2px solid ${theme.palette.primary.dark}` : 'none'
                  }}
                  onClick={() => handleExhibitorPageChange(null, idx + 1)}
                />
              ))}
              <IconButton
                onClick={() => handleExhibitorPageChange(null, Math.min(totalExhibitorPages, exhibitorPage + 1))}
                disabled={exhibitorPage === totalExhibitorPages}
                sx={{ color: theme.palette.primary.main }}
              >
                <ArrowForwardIos fontSize="small" />
              </IconButton>
            </Box>
          )}
            
          <Divider sx={{ mb: 0.5, mt: 0.5 }} />

          <Typography variant="h6" sx={{fontWeight: 600, color: 'text.secondary', mb: -1, mt: 1 }}>
              Because you clicked
            </Typography>

                  <Box display="flex" alignItems="flex-start" gap={3}>
                   
           
            <Typography sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary', mb: 1, mt: 0, paddingBottom: 3, paddingTop: 4, paddingLeft: 50 }}>
              Coming Soon...
                </Typography>
              </Box>
          <Divider sx={{ mt: 2 }} />
           <LazyVisitorDetailsDialog
             open={dialogOpen}
             onClose={() => setDialogOpen(false)}
             visitorId={selectedVisitorId}
             identifier={identifier}
           />
           </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }
}

const LazyVisitorDetailsDialog = dynamic(
  () => import('@/components/common/VisitorDetailsDialog'),
  { ssr: false }
);

      
