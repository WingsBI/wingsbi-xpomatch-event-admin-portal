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
import { fieldMappingApi, type VisitorFavoritesResponse, type VisitorFavoriteExhibitor, type ExhibitorFavoriteVisitorsResponse, type ExhibitorFavoriteVisitor, type FavoritesRequest, type AddExhibitorFavouriteRequest, type Exhibitor } from '@/services/fieldMappingApi';
import { getCurrentExhibitorId, getCurrentVisitorId, decodeJWTToken, isEventAdmin } from '@/utils/authUtils';
import { FavoritesManager } from '@/utils/favoritesManager';
import { useRouter } from 'next/navigation';

interface TransformedExhibitor {
  id: string;
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  type: 'exhibitor';
  avatar: string;
  companyLogoPath?: string; // <-- add this
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

// Transform API exhibitor data to UI format (for visitor favorites)
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
    companyLogoPath: apiExhibitor.companyLogoPath, // <-- add this
    phone: apiExhibitor.telephone || apiExhibitor.mobileNumber,
    location: [address?.city,  apiExhibitor.country].filter(Boolean).join(', '),
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

// Transform basic Exhibitor data to UI format (for exhibitor favorites)
const transformBasicExhibitorData = (apiExhibitor: Exhibitor): TransformedExhibitor => {
  const userMap = apiExhibitor.exhibitorToUserMaps?.[0];
  const profile = apiExhibitor.exhibitorProfile?.[0];
  const address = apiExhibitor.exhibitorAddress?.[0];
  
  // Get contact name from user map
  const getContactName = () => {
    if (!userMap) return '';
    const firstName = userMap.firstName || '';
    const lastName = userMap.lastName || '';
    return `${firstName} ${lastName}`.trim();
  };
  
  // Get job title from user map
  const getJobTitle = () => {
    if (!userMap) return '';
    return userMap.jobTitle || userMap.designation || '';
  };
  
  // Get location from address and country
  const getLocation = () => {
    const locationParts = [
      address?.city,
      address?.stateProvince, 
      apiExhibitor.country
    ].filter(part => part && part !== 'null' && part !== 'undefined' && part.trim() !== '');
    
    return locationParts.length > 0 ? locationParts.join(', ') : '';
  };
  
  // Get company type/industry
  const getCompanyType = () => {
    return apiExhibitor.companyType || profile?.listingAs || '';
  };
  
  // Get products from product array
  const getProducts = () => {
    if (!apiExhibitor.product || !Array.isArray(apiExhibitor.product)) return [];
    return apiExhibitor.product
      .map((p: { title: string }) => p.title)
      .filter((title: string) => title && title !== 'null' && title !== 'undefined' && title.trim() !== '');
  };
  
  return {
    id: apiExhibitor.id.toString(),
    name: getContactName(),
    email: userMap?.email || '',
    company: apiExhibitor.companyName || 'Unknown Company',
    jobTitle: getJobTitle(),
    type: 'exhibitor' as const,
    avatar: apiExhibitor.companyName?.charAt(0).toUpperCase() || 'E',
    companyLogoPath: apiExhibitor.companyLogoPath,
    phone: apiExhibitor.telephone || apiExhibitor.mobileNumber || userMap?.phone,
    location: getLocation(),
    interests: userMap?.interest ? userMap.interest.split(', ') : [],
    customData: {
      industry: getCompanyType(),
      boothNumber: apiExhibitor.hall && apiExhibitor.stand ? `${apiExhibitor.hall}-${apiExhibitor.stand}` : '',
      products: getProducts(),
      website: apiExhibitor.webSite,
      companyProfile: profile?.companyProfile,
      listingAs: getCompanyType(),
      experience: userMap?.experienceYears ? `${userMap.experienceYears}+ years` : undefined,
      linkedInProfile: userMap?.linkedInProfile,
    }
  };
};

export default function FavouritesPage() {
  const params = useParams();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  
  const [exhibitorFavourites, setExhibitorFavourites] = useState<TransformedExhibitor[]>([]);
  const [visitorFavourites, setVisitorFavourites] = useState<TransformedVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0); // For exhibitors: 0 = Visitors, 1 = Exhibitors; For visitors: 0 = Exhibitors
  const [searchTerm, setSearchTerm] = useState('');
  const [removingFavorite, setRemovingFavorite] = useState<string | null>(null);
  const [isVisitor, setIsVisitor] = useState(false);
  // Add this state to track favorite exhibitor IDs for visitors
  const [favoriteExhibitorIds, setFavoriteExhibitorIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if user is a visitor
    const tokenData = decodeJWTToken();
    if (tokenData && (tokenData.roleName === 'Visitor' || tokenData.role === 'visitor' || tokenData.roleId === 4 || tokenData.roleid === 4)) {
      setIsVisitor(true);
      setTabValue(0); // For visitors, always start with Exhibitors tab (index 0)
    } else {
      setIsVisitor(false);
      setTabValue(0); // For exhibitors, start with Visitors tab (index 0)
    }
  }, []);

  useEffect(() => {
    if (identifier) {
      loadFavorites();
    }
  }, [identifier, isVisitor]);

  // Update favoriteExhibitorIds when exhibitorFavourites changes (for visitors)
  useEffect(() => {
    if (isVisitor) {
      setFavoriteExhibitorIds(new Set(exhibitorFavourites.map(e => e.id)));
    }
  }, [exhibitorFavourites, isVisitor]);

  // Handler to toggle favorite for an exhibitor (for visitors)
  const handleToggleExhibitorFavorite = async (exhibitorId: string) => {
    if (!identifier || !isVisitor) return;
    
    setRemovingFavorite(exhibitorId);
    const isCurrentlyFavorite = favoriteExhibitorIds.has(exhibitorId);
    
    try {
      const finalStatus = await FavoritesManager.toggleExhibitorFavorite(identifier, exhibitorId, isCurrentlyFavorite);
      
      // Update UI
      setFavoriteExhibitorIds(prev => {
        const newSet = new Set(prev);
        if (finalStatus) {
          newSet.add(exhibitorId);
        } else {
          newSet.delete(exhibitorId);
        }
        return newSet;
      });
      
      // Reload favorites from API to ensure UI is in sync
      await loadFavorites();
    } catch (err: any) {
      setError(err.message || 'Failed to update favorite');
    } finally {
      setRemovingFavorite(null);
    }
  };

  const loadFavorites = async () => {
    if (!identifier) return;
    setLoading(true);
    setError(null);
    try {
      if (isVisitor) {
        // Only Exhibitor tab, only call getVisitorFavorites
        const visitorId = getCurrentVisitorId();
        if (!visitorId) throw new Error('No visitor ID found in token');
        
        console.log('🔍 Loading visitor favorites for visitor ID:', visitorId);
        const exhibitorResponse = await fieldMappingApi.getVisitorFavorites(identifier, visitorId);
        
        if (exhibitorResponse.statusCode === 200 && exhibitorResponse.result?.exhibitors) {
          console.log('✅ Loaded exhibitor favorites:', exhibitorResponse.result.exhibitors.length, 'exhibitors');
          const transformedExhibitors = exhibitorResponse.result.exhibitors.map(transformExhibitorData);
          setExhibitorFavourites(transformedExhibitors);
          
          // Update favoriteExhibitorIds for UI state
          const favoriteIds = new Set(transformedExhibitors.map(e => e.id));
          setFavoriteExhibitorIds(favoriteIds);
        } else {
          console.log('📦 No exhibitor favorites found or API error');
          setExhibitorFavourites([]);
          setFavoriteExhibitorIds(new Set());
          if (exhibitorResponse.message) {
            setError(exhibitorResponse.message || 'Failed to load favorite exhibitors');
          }
        }
        setVisitorFavourites([]); // No visitors tab for visitor
      } else {
        // For exhibitors: load visitor favorites and exhibitor favorites
        const currentExhibitorId = getCurrentExhibitorId();
        if (!currentExhibitorId) {
          throw new Error('No exhibitor ID found in token');
        }
        
        console.log('🔍 Loading exhibitor favorites for exhibitor ID:', currentExhibitorId);
        console.log('🔍 Token data:', decodeJWTToken());
        
        // Load visitor favorites
        const visitorResponse = await fieldMappingApi.getAllExhibitorFavorites(identifier, currentExhibitorId);
        
        if (visitorResponse.statusCode === 200 && visitorResponse.result) {
          console.log('✅ Loaded visitor favorites:', visitorResponse.result.length, 'visitors');
          const transformedVisitors = visitorResponse.result.map(transformVisitorData);
          setVisitorFavourites(transformedVisitors);
        } else {
          console.log('📦 No visitor favorites found or API error');
          setVisitorFavourites([]);
          if (visitorResponse.message) {
            setError(visitorResponse.message || 'Failed to load favorite visitors');
          }
        }

        // Load exhibitor favorites using getFavouritedExhibitors
        const exhibitorResponse = await fieldMappingApi.getFavouritedExhibitors(identifier, currentExhibitorId);
        
        if (exhibitorResponse.statusCode === 200 && exhibitorResponse.result) {
          console.log('✅ Loaded exhibitor favorites:', exhibitorResponse.result.length, 'exhibitors');
          const transformedExhibitors = exhibitorResponse.result.map(transformBasicExhibitorData);
          setExhibitorFavourites(transformedExhibitors);
        } else {
          console.log('📦 No exhibitor favorites found or API error');
          setExhibitorFavourites([]);
          if (exhibitorResponse.message) {
            setError(exhibitorResponse.message || 'Failed to load favorite exhibitors');
          }
        }
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
    if (!identifier) return;

    try {
      setRemovingFavorite(exhibitorId);
      
      // Get current exhibitor ID from token
      const currentExhibitorId = getCurrentExhibitorId();
      if (!currentExhibitorId) {
        throw new Error('No exhibitor ID found in token');
      }

      const payload: AddExhibitorFavouriteRequest = {
        likedByExhibitorId: currentExhibitorId,
        likedExhibitorId: parseInt(exhibitorId),
        isFavourite: false // Set to false to remove from favorites
      };

      console.log('🔥 Removing exhibitor from favorites:', payload);
      const response = await fieldMappingApi.addExhibitorFavorite(identifier, payload);

      if (response.statusCode === 200 && response.result) {
        console.log('✅ Successfully removed exhibitor from favorites');
        
        // Update the UI by removing the exhibitor from the list
        setExhibitorFavourites(prev => prev.filter(exhibitor => exhibitor.id !== exhibitorId));
        
        // No need to update localStorage - API is the source of truth
        console.log('✅ Exhibitor removed from favorites via API');
      } else {
        console.error('Failed to remove exhibitor from favorites:', response.message);
        setError(response.message || 'Failed to remove exhibitor from favorites');
      }
    } catch (err: any) {
      console.error('Error removing exhibitor from favorites:', err);
      setError(err.message || 'Failed to remove exhibitor from favorites');
    } finally {
      setRemovingFavorite(null);
    }
  };

  const handleRemoveVisitorFavourite = async (visitorId: string) => {
    if (!identifier) return;

    try {
      setRemovingFavorite(visitorId);
      // Get current exhibitor ID from token
      const currentExhibitorId = getCurrentExhibitorId();
      if (!currentExhibitorId) {
        throw new Error('No exhibitor ID found in token');
      }

      const payload: FavoritesRequest = {
        visitorId: parseInt(visitorId),
        exhibitorId: currentExhibitorId,
        isFavorite: false // Set to false to remove from favorites
      };

      console.log('🔥 Removing visitor from favorites:', payload);
      const response = await fieldMappingApi.addFavorites(identifier, payload);

      if (response.statusCode === 200 && response.result) {
        console.log('✅ Successfully removed visitor from favorites');
        
        // Update the UI by removing the visitor from the list
        setVisitorFavourites(prev => prev.filter(visitor => visitor.id !== visitorId));
        
        // No need to update localStorage - API is the source of truth
        console.log('✅ Visitor removed from favorites via API');
      } else {
        console.error('Failed to remove visitor from favorites:', response.message);
        setError(response.message || 'Failed to remove visitor from favorites');
      }
    } catch (err: any) {
      console.error('Error removing visitor from favorites:', err);
      setError(err.message || 'Failed to remove visitor from favorites');
    } finally {
      setRemovingFavorite(null);
    }
  };

  if (loading) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin' , 'visitor' , 'exhibitor']}>
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
    <RoleBasedRoute allowedRoles={['event-admin' , 'visitor' , 'exhibitor']}>
      <ResponsiveDashboardLayout title="My Favourites">
        <Container maxWidth="xl" sx={{ mt: 1, mb: 1 }}>
          
          

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

          <Paper sx={{ mb: 2, mt:-2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              {/* Show Visitors tab only for exhibitors */}
              {!isVisitor && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">Visitors</Typography>
                  </Box>
                } 
              />
              )}
              {/* Show Exhibitors tab for both visitors and exhibitors */}
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">Exhibitors</Typography>
                  </Box>
                } 
              />
            </Tabs>
          </Paper>

          {/* Content based on selected tab */}
          {/* For exhibitors: tabValue 0 = Visitors, tabValue 1 = Exhibitors */}
          {/* For visitors: only tabValue 0 = Exhibitors */}
          {(!isVisitor && tabValue === 0) && (
            // Visitors Tab (only for exhibitors)
            <>
              <Grid container spacing={1.5}>
                {getFilteredVisitors().map((visitor) => (
                  <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={visitor.id}>
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
                        p: 1, 
                        pb: 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        position: 'relative' // <-- for absolute heart
                      }}>
                        {/* Heart icon absolute top-right */}
                        {!isEventAdmin() && (
                          <IconButton 
                            onClick={() => handleRemoveVisitorFavourite(visitor.id)}
                            size="large"
                            disabled={removingFavorite === visitor.id}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 8,
                              p: 0.5,
                              cursor: 'pointer',
                              fontSize: 20,
                              transition: 'all 0.2s ease',
                              '&:hover': { transform: 'scale(1.1)' },
                              '&:active': { transform: 'scale(0.95)' },
                              '&:disabled': { opacity: 0.6 }
                            }}
                          >
                            {removingFavorite === visitor.id ? (
                              <CircularProgress size={20} sx={{ color: '#b0bec5' }} />
                            ) : (
                              <Favorite sx={{
                                fontSize: 20,
                                color: '#ef4444',
                                filter: 'drop-shadow(0 0 3px rgba(78, 12, 17, 0.3))',
                                transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                animation: 'heartBeat 0.8s ease-in-out',
                              }} />
                            )}
                          </IconButton>
                        )}
                        {/* Header with Visitor Info */}
                        <Box display="flex" alignItems="flex-start" mb={1.5}>
                          <Avatar
                            sx={{
                              bgcolor: 'secondary.main',
                              width: 36,
                              height: 36,
                              mr: 1.5,
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              flexShrink: 0,
                              color: 'white',
                              alignSelf: 'top',
                              mt: 2,
                            }}
                          >
                            {visitor.avatar}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0, mt: 2 }}>
                            <Typography 
                              variant="body2" 
                              component="div" 
                              fontWeight="600" 
                              sx={{ 
                                ml: 0,
                                minHeight: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                lineHeight: 1.2,
                                wordBreak: 'break-word'
                              }}
                            >
                              <Box sx={{ wordBreak: 'break-word', lineHeight: 1.2 }}>
                                {visitor.customData?.salutation} {visitor.firstName} {visitor.lastName}
                              </Box>
                            </Typography>
                            <Typography 
                              variant="subtitle2" 
                              color="text.secondary" 
                              sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}
                            >
                              {visitor.jobTitle}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="secondary" 
                              fontWeight="500"
                              sx={{ mb: 1, lineHeight: 1.4 }}
                            >
                              {visitor.company}
                            </Typography>
                          </Box>
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

                        <Divider sx={{ mb: 1, mt: 'auto' }} />

                        {/* Action Buttons */}
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={-2}>
                          {/* <Box display="flex" gap={1}>
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
                          </Box> */}

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ConnectIcon />}
                            onClick={() => {
                              const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
                              const identifier = pathParts[1] || '';
                              router.push(`/${identifier}/event-admin/meetings/schedule-meeting?visitorId=${visitor.id}`);
                            }}
                            sx={{ 
                              bgcolor: 'secondary.main',
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 500,
                              px: 1,
                              py: 0.75,
                              ml : 10,
                              '&:hover': {
                                bgcolor: 'secondary.dark',
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

          {((isVisitor && tabValue === 0) || (!isVisitor && tabValue === 1)) && (
            // Exhibitors Tab (for visitors: index 0, for exhibitors: index 1)
            <>
              <Grid container spacing={1.5}>
                {getFilteredExhibitors().map((exhibitor) => (
                  <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={exhibitor.id}>
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
                        p: 1, 
                        pb: 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        position: 'relative' // <-- for absolute heart
                      }}>
                        {/* Heart icon absolute top-right (for visitors only) */}
                        {isVisitor && !isEventAdmin() && (
                          <IconButton 
                            onClick={() => handleToggleExhibitorFavorite(exhibitor.id)}
                            size="large"
                            disabled={removingFavorite === exhibitor.id}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 8,
                              p: 0.5,
                              cursor: 'pointer',
                              fontSize: 20,
                              transition: 'all 0.2s ease',
                              '&:hover': { transform: 'scale(1.1)' },
                              '&:active': { transform: 'scale(0.95)' },
                              '&:disabled': { opacity: 0.6 }
                            }}
                          >
                            {removingFavorite === exhibitor.id ? (
                              <CircularProgress size={20} sx={{ color: '#b0bec5' }} />
                            ) : favoriteExhibitorIds.has(exhibitor.id) ? (
                              <Favorite sx={{
                                fontSize: 20,
                                color: '#ef4444',
                                filter: 'drop-shadow(0 0 3px rgba(78, 12, 17, 0.3))',
                                transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                animation: 'heartBeat 0.8s ease-in-out',
                              }} />
                            ) : (
                              <FavoriteBorder sx={{
                                fontSize: 20,
                                color: '#b0bec5',
                                transition: 'all 0.2s ease',
                                '&:hover': { color: '#ff6b9d' }
                              }} />
                            )}
                          </IconButton>
                        )}
                        {/* Heart icon for non-visitors (remove logic) */}
                        {!isVisitor && !isEventAdmin() && (
                          <IconButton 
                            onClick={() => handleRemoveFavourite(exhibitor.id)}
                            size="large"
                            disabled={removingFavorite === exhibitor.id}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 8,
                              p: 0.5,
                              cursor: 'pointer',
                              fontSize: 20,
                              transition: 'all 0.2s ease',
                              '&:hover': { transform: 'scale(1.1)' },
                              '&:active': { transform: 'scale(0.95)' },
                              '&:disabled': { opacity: 0.6 }
                            }}
                          >
                            {removingFavorite === exhibitor.id ? (
                              <CircularProgress size={20} sx={{ color: '#b0bec5' }} />
                            ) : (
                              <Favorite sx={{
                                fontSize: 20,
                                color: '#ef4444',
                                filter: 'drop-shadow(0 0 3px rgba(78, 12, 17, 0.3))',
                                transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                animation: 'heartBeat 0.8s ease-in-out',
                              }} />
                            )}
                          </IconButton>
                        )}
                        {/* Header with Company Info */}
                        <Box display="flex" alignItems="flex-start" mb={1}>
                          <Avatar
                            src={exhibitor.companyLogoPath || undefined}
                            sx={{
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
                            }}
                          >
                            {!exhibitor.companyLogoPath && exhibitor.avatar}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0, mt: 2 }}>
                            <Typography 
                              variant="body2" 
                              component="div" 
                              fontWeight="600" 
                              sx={{ 
                                ml: 0,
                                minHeight: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                lineHeight: 1.2,
                                wordBreak: 'break-word'
                              }}
                            >
                              <Box sx={{ wordBreak: 'break-word', lineHeight: 1.2 }}>
                                {exhibitor.company}
                              </Box>
                            </Typography>
                            {exhibitor.name && exhibitor.name !== exhibitor.company && (
                              <Typography 
                                variant="subtitle2" 
                                color="text.secondary" 
                                sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}
                              >
                                {exhibitor.name}
                              </Typography>
                            )}
                            
                          </Box>
                        </Box>

                        {/* Location and Industry */}
                        {(exhibitor.location || exhibitor.customData?.industry) && (
                          <Box sx={{ flex: 1, minWidth: 0, mt: 0.5 , mb:1 , ml:1, textAlign: 'left'}}>
                            {exhibitor.jobTitle && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ mb: 1, lineHeight: 1.4 }}
                              >
                                {exhibitor.jobTitle}
                              </Typography>
                            )}

                            {exhibitor.location && (
                              <Box display="flex" alignItems="left" mb={1}>
                                <LocationOn sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {exhibitor.location}
                                </Typography>
                              </Box>
                            )}
                            
                            {exhibitor.customData?.industry && (
                              <Box display="flex" alignItems="center">
                                <Business sx={{ fontSize: 18, mr: 1.5, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {exhibitor.customData.industry}
                                </Typography>
                              </Box>
                            )}
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

                        <Divider sx={{ mb: 1, mt: 'auto' }} />

                        {/* Action Buttons */}
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={-2}>
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
                            onClick={() => {
                              const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
                              const identifier = pathParts[1] || '';
                              router.push(`/${identifier}/event-admin/meetings/schedule-meeting?exhibitorId=${exhibitor.id}`);
                            }}
                            sx={{ 
                              bgcolor: 'secondary.main',
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 500,
                              px: 1,
                              py: 0.75,
                              '&:hover': {
                                bgcolor: 'secondary.dark',
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
