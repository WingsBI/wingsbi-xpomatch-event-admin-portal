"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Badge,
  IconButton,
  TextField,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Business,
  LocationOn,
  Search,
  LinkedIn,
  Language,
  ConnectWithoutContact as ConnectIcon,
  FilterList,
  Person,
  Work,
} from '@mui/icons-material';

import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { RootState, AppDispatch } from "@/store";
import { setIdentifier } from "@/store/slices/appSlice";
import { fieldMappingApi, type VisitorFavoritesResponse, type VisitorFavoriteExhibitor, type ExhibitorFavoriteVisitorsResponse, type ExhibitorFavoriteVisitor } from '@/services/fieldMappingApi';
import { getCurrentExhibitorId } from '@/utils/authUtils';

interface TransformedExhibitor {
  id: string;
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  type: 'exhibitor';
  avatar: string;
  phone?: string;
  location?: string;
  interests: string[];
  customData: {
    industry?: string;
    boothNumber?: string;
    products?: string[];
    website?: string;
    companyProfile?: string;
    listingAs?: string;
    experience?: string;
    linkedInProfile?: string;
  };
}

interface TransformedVisitor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  type: 'visitor';
  avatar: string;
  phone?: string;
  location?: string;
  interests: string[];
  status: string;
  customData: {
    salutation?: string;
    middleName?: string;
    gender?: string;
    nationality?: string;
    linkedInProfile?: string;
    instagramProfile?: string;
    gitHubProfile?: string;
    twitterProfile?: string;
    businessEmail?: string;
    experienceYears?: number;
    decisionMaker?: boolean;
    experience?: string;
  };
}

// Transform API visitor data to UI format  
const transformVisitorData = (apiVisitor: ExhibitorFavoriteVisitor): TransformedVisitor => {
  return {
    id: apiVisitor.visitorId.toString(),
    firstName: apiVisitor.firstName || '',
    lastName: apiVisitor.lastName || '',
    email: apiVisitor.email || '',
    company: apiVisitor.companyName || '',
    jobTitle: apiVisitor.jobTitle || apiVisitor.designation || '',
    type: 'visitor' as const,
    avatar: `${apiVisitor.firstName?.charAt(0) || ''}${apiVisitor.lastName?.charAt(0) || ''}`,
    phone: apiVisitor.phone || undefined,
    location: [apiVisitor.countryName].filter(Boolean).join(', ') || undefined,
    interests: apiVisitor.interest ? [apiVisitor.interest] : [],
    status: apiVisitor.userStatusName === 'Active' ? 'registered' : 'invited',
    customData: {
      salutation: apiVisitor.salutation || '',
      middleName: apiVisitor.middleName || '',
      gender: apiVisitor.gender || '',
      nationality: apiVisitor.nationality || '',
      linkedInProfile: apiVisitor.linkedInProfile || '',
      instagramProfile: apiVisitor.instagramProfile || '',
      gitHubProfile: apiVisitor.gitHubProfile || '',
      twitterProfile: apiVisitor.twitterProfile || '',
      businessEmail: apiVisitor.businessEmail || '',
      experienceYears: apiVisitor.experienceYears || 0,
      decisionMaker: apiVisitor.decisionMaker || false,
      experience: apiVisitor.experienceYears ? `${apiVisitor.experienceYears} years` : undefined,
    }
  };
};

// Transform API exhibitor data to UI format
const transformExhibitorData = (apiExhibitor: VisitorFavoriteExhibitor): TransformedExhibitor => {
  const userMap = apiExhibitor.exhibitorToUserMaps?.[0];
  const profile = apiExhibitor.exhibitorProfile?.[0];
  const address = apiExhibitor.exhibitorAddress?.[0];
  
  // Helper function to safely get name parts
  const getFirstName = () => {
    if (!userMap?.firstName || userMap.firstName === 'null' || userMap.firstName === 'undefined') return '';
    return userMap.firstName.trim();
  };
  
  const getLastName = () => {
    if (!userMap?.lastName || userMap.lastName === 'null' || userMap.lastName === 'undefined') return '';
    return userMap.lastName.trim();
  };
  
  const getCompanyName = () => {
    if (!apiExhibitor.companyName || apiExhibitor.companyName === 'null' || apiExhibitor.companyName === 'undefined') return 'Unknown Company';
    return apiExhibitor.companyName.trim();
  };
  
  const getJobTitle = () => {
    const title = userMap?.jobTitle || userMap?.designation;
    if (!title || title === 'null' || title === 'undefined') return '';
    return title.trim();
  };
  
  const getLocation = () => {
    const locationParts = [
      address?.city,
      address?.stateProvince, 
      apiExhibitor.country
    ].filter(part => part && part !== 'null' && part !== 'undefined' && part.trim() !== '');
    
    return locationParts.length > 0 ? locationParts.join(', ') : '';
  };
  
  const getInterests = () => {
    if (!userMap?.interest || userMap.interest === 'null' || userMap.interest === 'undefined') return [];
    return userMap.interest.split(', ').filter(interest => 
      interest && interest !== 'null' && interest !== 'undefined' && interest.trim() !== ''
    );
  };
  
  const getBoothNumber = () => {
    const hall = apiExhibitor.hall;
    const stand = apiExhibitor.stand;
    
    if (!hall || hall === 'null' || hall === 'undefined') return '';
    if (!stand || stand === 'null' || stand === 'undefined') return hall;
    
    return `${hall}-${stand}`;
  };
  
  const getProducts = () => {
    if (!apiExhibitor.product || !Array.isArray(apiExhibitor.product)) return [];
    return apiExhibitor.product
      .map(p => p.title)
      .filter(title => title && title !== 'null' && title !== 'undefined' && title.trim() !== '');
  };
  
  const companyName = getCompanyName();
  const firstName = getFirstName();
  const lastName = getLastName();
  
  return {
    id: apiExhibitor.id.toString(),
    name: userMap ? `${userMap.firstName} ${userMap.lastName}` : apiExhibitor.companyName,
    email: userMap?.email || '',
    company: apiExhibitor.companyName,
    jobTitle: userMap?.jobTitle || userMap?.designation || '',
    type: 'exhibitor' as const,
    avatar: apiExhibitor.companyName?.charAt(0).toUpperCase() || 'E',
    phone: apiExhibitor.telephone || apiExhibitor.mobileNumber,
    location: [address?.city, address?.stateProvince, apiExhibitor.country].filter(Boolean).join(', '),
    interests: userMap?.interest ? userMap.interest.split(', ') : [],
    customData: {
      industry: profile?.listingAs,
      boothNumber: `${apiExhibitor.hall}-${apiExhibitor.stand}`,
      products: apiExhibitor.product?.map(p => p.title) || [],
      website: apiExhibitor.webSite,
      companyProfile: profile?.companyProfile,
      listingAs: profile?.listingAs,
      experience: userMap?.experienceYears ? `${userMap.experienceYears}+ years` : undefined,
    }
  };
};

export default function FavouritesPage() {
  const params = useParams();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [exhibitorFavourites, setExhibitorFavourites] = useState<TransformedExhibitor[]>([]);
  const [visitorFavourites, setVisitorFavourites] = useState<TransformedVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0); // 0 = Visitors, 1 = Exhibitors
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  useEffect(() => {
    loadFavorites();
  }, [identifier]);

  const loadFavorites = async () => {
    if (!identifier) return;
    
    try {
      setLoading(true);
      setError(null);

      // Get current exhibitor ID (defaulting to 10 for now)
      let currentExhibitorId = getCurrentExhibitorId();
      if (!currentExhibitorId) {
        console.log('🔍 No exhibitor ID found, using default ID 10 for favorites');
        currentExhibitorId = 10;
      }

      console.log('🔍 Loading favorites for exhibitor:', currentExhibitorId);
      
      // Load both visitor favorites and exhibitor favorites in parallel
      const [visitorResponse, exhibitorResponse] = await Promise.all([
        fieldMappingApi.getAllExhibitorFavorites(identifier, currentExhibitorId),
        fieldMappingApi.getVisitorFavorites(identifier, 1) // Using visitor ID 1 for exhibitor favorites
      ]);
      
      // Process visitor favorites
      if (visitorResponse.statusCode === 200 && visitorResponse.result) {
        const transformedVisitors = visitorResponse.result.map(transformVisitorData);
        setVisitorFavourites(transformedVisitors);
        console.log('✅ Loaded', transformedVisitors.length, 'favorite visitors');
      } else {
        console.error('Failed to load visitor favorites:', visitorResponse.message);
        setVisitorFavourites([]);
      }
      
      // Process exhibitor favorites  
      if (exhibitorResponse.statusCode === 200 && exhibitorResponse.result?.exhibitors) {
        const transformedExhibitors = exhibitorResponse.result.exhibitors.map(transformExhibitorData);
        setExhibitorFavourites(transformedExhibitors);
        console.log('✅ Loaded', transformedExhibitors.length, 'favorite exhibitors');
      } else {
        console.error('Failed to load exhibitor favorites:', exhibitorResponse.message);
        setExhibitorFavourites([]);
      }
      
    } catch (err: any) {
      console.error('Error loading favorites:', err);
      setError(err.message || 'Failed to load favorites');
      setVisitorFavourites([]);
      setExhibitorFavourites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getFilteredExhibitors = () => {
    if (!searchTerm) return exhibitorFavourites;
    
    return exhibitorFavourites.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredVisitors = () => {
    if (!searchTerm) return visitorFavourites;
    
    return visitorFavourites.filter(item => 
      item.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleRemoveFavourite = async (exhibitorId: string) => {
    // TODO: Implement remove favorite functionality when API is available
    console.log('Remove favorite exhibitor:', exhibitorId);
  };

  const handleRemoveVisitorFavourite = async (visitorId: string) => {
    // TODO: Implement remove visitor favorite functionality when API is available
    console.log('Remove favorite visitor:', visitorId);
  };

  if (loading) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin']}>
        <ResponsiveDashboardLayout title="My Favourites">
          <Container maxWidth="xl" sx={{ mt: 1, mb: 1 }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress size={48} />
            </Box>
          </Container>
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  return (
    <RoleBasedRoute allowedRoles={['event-admin']}>
      <ResponsiveDashboardLayout title="My Favourites">
        <Container maxWidth="xl" sx={{ mt: 1, mb: 1 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Header with action buttons and stats */}
{/*           
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search favourites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterList />}
              >
                Filter
              </Button>
            </Box>

          
          </Box> */}

          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">Visitors</Typography>
                    <Chip 
                      label={`${visitorFavourites.length}`}
                      variant="outlined"
                      color="primary"
                      size="small"
                      sx={{ fontSize: '0.75rem', height: 20, minWidth: 20 }}
                    />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">Exhibitors</Typography>
                    <Chip 
                      label={`${exhibitorFavourites.length}`}
                      variant="outlined"
                      color="success"
                      size="small"
                      sx={{ fontSize: '0.75rem', height: 20, minWidth: 20 }}
                    />
                  </Box>
                } 
              />
            </Tabs>
          </Paper>

          {/* Content based on selected tab */}
          {tabValue === 0 && (
            // Visitors Tab
            <>
              <Grid container spacing={3}>
                {getFilteredVisitors().map((visitor) => (
                  <Grid item xs={12} sm={6} lg={4} key={visitor.id}>
                    <Card sx={{
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      border: '1px solid #e8eaed',
                      bgcolor: 'background.paper',
                      transition: 'all 0.3s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      },
                    }}>
                      <CardContent sx={{ 
                        p: 3, 
                        pb: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                      }}>
                        {/* Header with Visitor Info */}
                        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
                          <Box display="flex" alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                            <Avatar
                              sx={{
                                bgcolor: 'primary.main',
                                width: 56,
                                height: 56,
                                mr: 2,
                                fontSize: '1.3rem',
                                fontWeight: 'bold',
                                flexShrink: 0
                              }}
                            >
                              {visitor.avatar}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="h6" 
                                component="div" 
                                fontWeight="600" 
                                sx={{ 
                                  mb: 0.5,
                                  lineHeight: 1.3,
                                  wordBreak: 'break-word'
                                }}
                              >
                                {visitor.customData?.salutation} {visitor.firstName} {visitor.customData?.middleName} {visitor.lastName}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  mb: 0.5,
                                  lineHeight: 1.4
                                }}
                              >
                                {visitor.jobTitle}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="primary" 
                                fontWeight="500"
                                sx={{ 
                                  mb: 1,
                                  lineHeight: 1.4
                                }}
                              >
                                {visitor.company}
                              </Typography>
                            
                            </Box>
                          </Box>
                          
                          <IconButton 
                            onClick={() => handleRemoveVisitorFavourite(visitor.id)}
                            size="small"
                            sx={{
                              
                              fontSize: 30,
                              color: '#ef4444',
                              
                            }}
                          >
                            <Favorite sx={{
                              fontSize: 30,
                              color: '#ef4444',
                              filter: 'drop-shadow(0 0 3px rgba(78, 12, 17, 0.3))',
                              transform: 'scale(1.1)',
                              transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                             animation: 'heartBeat 0.8s ease-in-out',
                            }} />
                          </IconButton>
                        </Box>

                        {/* Location and Contact */}
                        {/* {(visitor.location || visitor.customData?.experience) && (
                          <Box mb={2}>
                            {visitor.location && (
                              <Box display="flex" alignItems="center" mb={1}>
                                <LocationOn sx={{ fontSize: 18, mr: 1.5, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {visitor.location}
                                </Typography>
                              </Box>
                            )}
                            
                            {visitor.customData?.experience && (
                              <Box display="flex" alignItems="center">
                                <Work sx={{ fontSize: 18, mr: 1.5, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {visitor.customData.experience}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )} */}

                        {/* Interests */}
                        {/* {visitor.interests.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                              Interests:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {visitor.interests.slice(0, 3).map((interest, index) => (
                                <Chip
                                  key={index}
                                  label={interest}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    bgcolor: '#e3f2fd',
                                    color: '#1565c0',
                                    border: 'none',
                                    fontWeight: 500,
                                    height: 24
                                  }}
                                />
                              ))}
                              {visitor.interests.length > 3 && (
                                <Chip
                                  label={`+${visitor.interests.length - 3}`}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    bgcolor: '#e3f2fd',
                                    color: '#1565c0',
                                    height: 24
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        )} */}

                        <Divider sx={{ mb: 2, mt: 'auto' }} />

                        {/* Action Buttons */}
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" gap={1}>
                            {visitor.customData?.linkedInProfile && visitor.customData.linkedInProfile.trim() !== '' && (
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  color: '#0077b5',
                                  '&:hover': {
                                    bgcolor: 'rgba(0, 119, 181, 0.1)'
                                  }
                                }}
                                onClick={() => window.open(visitor.customData?.linkedInProfile, '_blank')}
                              >
                                <LinkedIn fontSize="small" />
                              </IconButton>
                            )}
                          </Box>

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ConnectIcon />}
                            sx={{ 
                              bgcolor: 'primary.main',
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 500,
                              px: 2,
                              py: 0.75,
                              '&:hover': {
                                bgcolor: 'primary.dark',
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

              {getFilteredVisitors().length === 0 && !loading && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                    No favorite visitors found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                    {searchTerm 
                      ? "Try adjusting your search criteria"
                      : "Add visitors to your favourites list to see them here"
                    }
              </Typography>
            </Paper>
              )}
            </>
          )}

          {tabValue === 1 && (
            // Exhibitors Tab
            <>
              <Grid container spacing={3}>
                {getFilteredExhibitors().map((exhibitor) => (
                  <Grid item xs={12} sm={6} lg={4} key={exhibitor.id}>
                    <Card sx={{
                      height: '100%',
                      borderRadius: 3,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      border: '1px solid #e8eaed',
                      bgcolor: 'background.paper',
                      transition: 'all 0.3s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      },
                    }}>
                      <CardContent sx={{ 
                        p: 3, 
                        pb: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                      }}>
                        {/* Header with Company Info */}
                        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
                          <Box display="flex" alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                            <Avatar
                              sx={{
                                bgcolor: 'primary.main',
                                width: 56,
                                height: 56,
                                mr: 2,
                                fontSize: '1.3rem',
                                fontWeight: 'bold',
                                flexShrink: 0
                              }}
                            >
                              {exhibitor.avatar}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="h6" 
                                component="div" 
                                fontWeight="600" 
                                sx={{ 
                                  mb: 0.5,
                                  lineHeight: 1.3,
                                  wordBreak: 'break-word'
                                }}
                              >
                                {exhibitor.company}
                              </Typography>
                              {exhibitor.name && exhibitor.name !== exhibitor.company && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    mb: 0.5,
                                    lineHeight: 1.4
                                  }}
                                >
                                  {exhibitor.name}
                                </Typography>
                              )}
                              {exhibitor.jobTitle && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    mb: 1,
                                    lineHeight: 1.4
                                  }}
                                >
                                  {exhibitor.jobTitle}
                                </Typography>
                              )}
                              {/* <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                {exhibitor.customData?.boothNumber && (
                                  <Chip
                                    label={exhibitor.customData.boothNumber}
                                    size="small"
                                    sx={{ 
                                      bgcolor: '#e3f2fd',
                                      color: '#1565c0',
                                      fontWeight: 500,
                                      fontSize: '0.75rem',
                                      height: 24
                                    }}
                                  />
                                )}
                                {exhibitor.interests.length > 0 && (
                                  <Chip
                                    label={`${exhibitor.interests.length} Interest${exhibitor.interests.length > 1 ? 's' : ''}`}
                                    size="small"
                                    sx={{ 
                                      bgcolor: '#e8f5e8',
                                      color: '#2e7d32',
                                      fontWeight: 500,
                                      fontSize: '0.7rem',
                                      height: 24
                                    }}
                                  />
                                )}
                              </Box> */}
                            </Box>
                          </Box>
                          
                          <IconButton 
                            onClick={() => handleRemoveFavourite(exhibitor.id)}
                            size="small"
                            sx={{
                              color: '#f44336',
                              fontSize: 30,
                             
                            }}
                          >
                            <Favorite sx={{
                              fontSize: 30,
                              color: '#ef4444',
                              filter: 'drop-shadow(0 0 3px rgba(78, 12, 17, 0.3))',
                              transform: 'scale(1.1)',
                              transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                              animation: 'heartBeat 0.8s ease-in-out',

                            }} />
                          </IconButton>
                        </Box>

                        {/* Location and Industry */}
                        {(exhibitor.location || exhibitor.customData?.industry) && (
                          <Box mb={2}>
                            {exhibitor.location && (
                              <Box display="flex" alignItems="center" mb={1}>
                                <LocationOn sx={{ fontSize: 18, mr: 1.5, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {exhibitor.location}
                                </Typography>
                              </Box>
                            )}
                            
                            {/* {exhibitor.customData?.industry && (
                              <Box display="flex" alignItems="center">
                                <Business sx={{ fontSize: 18, mr: 1.5, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {exhibitor.customData.industry}
                                </Typography>
                              </Box>
                            )} */}
                          </Box>
                        )}

                        {/* Products/Services Offered */}
                        {/* {exhibitor.customData?.products && exhibitor.customData.products.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                              Products & Services:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {exhibitor.customData.products.slice(0, 3).map((service, index) => (
                                <Chip
                                  key={index}
                                  label={service}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    bgcolor: '#f1f3f4',
                                    color: '#5f6368',
                                    border: 'none',
                                    height: 24
                                  }}
                                />
                              ))}
                              {exhibitor.customData.products.length > 3 && (
                                <Chip
                                  label={`+${exhibitor.customData.products.length - 3} more`}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    bgcolor: '#f1f3f4',
                                    color: '#5f6368',
                                    height: 24
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        )} */}

                        {/* Company Description */}
                        {/* {exhibitor.customData?.companyProfile && (
                          <Box mb={2}>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.4
                            }}>
                              {exhibitor.customData.companyProfile}
                            </Typography>
                          </Box>
                        )} */}

                        <Divider sx={{ mb: 2, mt: 'auto' }} />

                        {/* Action Buttons */}
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" gap={1}>
                            {exhibitor.customData?.linkedInProfile && exhibitor.customData.linkedInProfile.trim() !== '' && (
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  color: '#0077b5',
                                  '&:hover': {
                                    bgcolor: 'rgba(0, 119, 181, 0.1)'
                                  }
                                }}
                                onClick={() => window.open(exhibitor.customData?.linkedInProfile, '_blank')}
                              >
                                <LinkedIn fontSize="small" />
                              </IconButton>
                            )}
                            {exhibitor.customData?.website && exhibitor.customData.website.trim() !== '' && (
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  color: '#757575',
                                  '&:hover': {
                                    bgcolor: 'rgba(117, 117, 117, 0.1)'
                                  }
                                }}
                                onClick={() => window.open(exhibitor.customData?.website, '_blank')}
                              >
                                <Language fontSize="small" />
                              </IconButton>
                            )}
                          </Box>

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ConnectIcon />}
                            sx={{ 
                              bgcolor: 'primary.main',
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 500,
                              px: 2,
                              py: 0.75,
                              '&:hover': {
                                bgcolor: 'primary.dark',
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

              {getFilteredExhibitors().length === 0 && !loading && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Favorite sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No favorite exhibitors found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm 
                      ? "Try adjusting your search criteria"
                      : "Add exhibitors to your favourites list to see them here"
                    }
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
