'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Grid,
  Container,
  Skeleton,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Button,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Person,
  LocationOn,
  Work,
  Search,
  LinkedIn,
  Twitter,
  Language,
  Star,
  ConnectWithoutContact as ConnectIcon,
  TrendingUp,
  Groups,
  Business,
  FiberManualRecord as InterestPoint,
  GetApp,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';

import { fieldMappingApi, type Exhibitor, type FavoritesRequest, type GetFavoritesResponse } from '@/services/fieldMappingApi';
import { SimpleThemeProvider, useSimpleTheme } from '@/context/SimpleThemeContext';
import ExhibitorsMatchingPage from '@/app/[identifier]/event-admin/exhibitors/matching/page';
import { getCurrentUserId } from '@/utils/authUtils';

interface ExhibitorCardProps {
  exhibitor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    jobTitle?: string;
    country?: string;
    status: string;
    interests?: string[];
    type: 'visitor' | 'exhibitor';
    customData?: {
      location?: string;
      experience?: string;
      matchScore?: number;
      industry?: string;
      lookingFor?: string[];
      companyDescription?: string;
      products?: string[];
      boothNumber?: string;
      boothSize?: string;
      website?: string;
      linkedInProfile?: string;
    };
  };
  visitorInterests: string[];
  isClient: boolean;
  identifier: string;
}

// Transform API exhibitor data to UI format - only use actual API data
const transformExhibitorData = (apiExhibitor: Exhibitor, identifier: string, index: number) => {
  return {
    // API fields - only use actual data from API
    id: apiExhibitor.id.toString(),
    firstName: apiExhibitor.firstName || '',
    lastName: apiExhibitor.lastName || '',
    email: apiExhibitor.email || '',
    company: apiExhibitor.companyName || '',
    jobTitle: apiExhibitor.jobTitle || '',
    phone: apiExhibitor.phoneNumber || null,
    country: apiExhibitor.country || null,
    
    
    // Only use API data, no fallbacks to generated data
    interests: apiExhibitor.interests || [],
    status: apiExhibitor.status || 'registered',
    type: 'exhibitor' as const,
    eventId: identifier,
    registrationDate: apiExhibitor.registrationDate ? new Date(apiExhibitor.registrationDate) : new Date(),
    invitationSent: apiExhibitor.invitationSent ?? false,
    invitationDate: apiExhibitor.invitationDate ? new Date(apiExhibitor.invitationDate) : null,
    checkedIn: apiExhibitor.checkedIn ?? false,
    lastActivity: apiExhibitor.lastActivity ? new Date(apiExhibitor.lastActivity) : null,
    createdAt: apiExhibitor.createdAt ? new Date(apiExhibitor.createdAt) : new Date(apiExhibitor.registrationDate || new Date()),
    updatedAt: apiExhibitor.updatedAt ? new Date(apiExhibitor.updatedAt) : new Date(),
    
    customData: {
      // Only API-based fields
      location: [apiExhibitor.city, apiExhibitor.country].filter(Boolean).join(', ') || null,
      avatar: apiExhibitor.avatar || (apiExhibitor.companyName?.charAt(0).toUpperCase()) || `${apiExhibitor.firstName?.charAt(0) || ''}${apiExhibitor.lastName?.charAt(0) || ''}`,
      
      // Only use API data when available
      matchScore: apiExhibitor.matchScore || null,
      industry: apiExhibitor.industry || null,
      experience: apiExhibitor.experience || null,
      lookingFor: apiExhibitor.lookingFor || [],
      companyDescription: apiExhibitor.companyDescription || null,
      products: apiExhibitor.products || [],
      boothNumber: apiExhibitor.boothNumber || null,
      boothSize: apiExhibitor.boothSize || null,
      website: apiExhibitor.website || null,
    }
  };
};

function ExhibitorCard({ exhibitor, visitorInterests, isClient, identifier }: ExhibitorCardProps) {
  const theme = useTheme();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isCheckingInitialState, setIsCheckingInitialState] = useState(true);

  // Check if this exhibitor is already favorited when component loads
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!identifier || !isClient) {
        setIsCheckingInitialState(false);
        return;
      }

      let currentUserId = getCurrentUserId();
      if (!currentUserId) {
        console.log('🔍 No user ID found, using default ID 1 for favorites check');
        currentUserId = 1; // Use same default as in handleFavoriteClick
      }

      try {
        // For now, skip API call and use localStorage only since API returns 404
        const storageKey = `favorites_${currentUserId}_${identifier}`;
        console.log('🔍 Checking localStorage for favorites (API not ready)');
        console.log('🔍 Storage key:', storageKey);
        console.log('🔍 Exhibitor ID:', exhibitor.id);
        console.log('🔍 All localStorage keys:', Object.keys(localStorage));
        
        const localFavorites = localStorage.getItem(storageKey);
        console.log('🔍 Raw localStorage value:', localFavorites);
        
        if (localFavorites) {
          const favoritesArray = JSON.parse(localFavorites);
          console.log('🔍 Parsed favorites array:', favoritesArray);
          
          const exhibitorId = parseInt(exhibitor.id, 10);
          console.log('🔍 Looking for exhibitor ID:', exhibitorId);
          
          const isFavorited = favoritesArray.includes(exhibitorId);
          console.log('🔍 Is favorited:', isFavorited);
          
          setIsFavorite(isFavorited);
          console.log(`📦 Found in localStorage: ${isFavorited ? 'favorited ❤️' : 'not favorited 🤍'}`);
        } else {
          console.log('📦 No favorites found in localStorage');
          setIsFavorite(false);
        }
      } catch (error) {
        console.error('Error checking localStorage favorites:', error);
        setIsFavorite(false);
      } finally {
        setIsCheckingInitialState(false);
      }
    };

    checkFavoriteStatus();
  }, [exhibitor.id, identifier, isClient]);
  
  const handleFavoriteClick = async (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    
    console.log('🚀 Heart icon clicked! Current state:', isFavorite);
    console.log('🚀 Exhibitor data:', exhibitor);
    console.log('🚀 Event identifier:', identifier);
    
    // Check if identifier is available
    if (!identifier || identifier.trim() === '') {
      console.error('❌ No identifier available, cannot call API');
      return;
    }
    
    // Immediately update UI for instant feedback
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    if (isFavorite) {
      console.log('❤️➡️🤍 REMOVING from favorites (red heart clicked)');
      console.log('🚀 New state will be:', newFavoriteState, '(false = removing)');
    } else {
      console.log('🤍➡️❤️ ADDING to favorites (outline heart clicked)');
      console.log('🚀 New state will be:', newFavoriteState, '(true = adding)');
    }
    
    // Get current user ID
    let currentUserId = getCurrentUserId();
    console.log('Current user ID from auth:', currentUserId);
    
    // For testing purposes, use a default user ID if none found
    if (!currentUserId) {
      console.log('No user ID found, using default ID 1 for testing');
      currentUserId = 1; // Use default for testing
    }

    // Get exhibitor ID as number
    const exhibitorId = parseInt(exhibitor.id, 10);
    console.log('Exhibitor ID:', exhibitorId, 'from string:', exhibitor.id);
    
    if (isNaN(exhibitorId)) {
      console.error('Invalid exhibitor ID:', exhibitor.id);
      // Revert the UI state if invalid ID
      setIsFavorite(!newFavoriteState);
      return;
    }

    console.log('Using identifier:', identifier);
    setIsLoadingFavorite(true);

    try {
      const payload: FavoritesRequest = {
        visitorId: currentUserId,
        exhibitorId: exhibitorId,
        isFavorite: newFavoriteState
      };

      console.log('🔥 CALLING API with payload:', payload);
      console.log('🔥 API URL will be:', `api/${identifier}/Event/addFavorites`);
      
      const response = await fieldMappingApi.addFavorites(identifier, payload);
      
      console.log('✅ API RESPONSE RECEIVED:', response);

      if (response.statusCode === 200 && response.result) {
        if (newFavoriteState) {
          console.log('✅ Successfully ADDED to favorites ❤️');
        } else {
          console.log('✅ Successfully REMOVED from favorites 🤍');
        }
        
        // Update localStorage as backup
        try {
          const storageKey = `favorites_${currentUserId}_${identifier}`;
          const localFavorites = localStorage.getItem(storageKey);
          let favoritesArray = localFavorites ? JSON.parse(localFavorites) : [];
          
          console.log('📦 Before update - localStorage favorites:', favoritesArray);
          
          if (newFavoriteState) {
            // Add to favorites
            if (!favoritesArray.includes(exhibitorId)) {
              favoritesArray.push(exhibitorId);
              console.log(`📦 ADDED ${exhibitorId} to localStorage favorites`);
            }
          } else {
            // Remove from favorites
            const beforeLength = favoritesArray.length;
            favoritesArray = favoritesArray.filter((id: number) => id !== exhibitorId);
            console.log(`📦 REMOVED ${exhibitorId} from localStorage favorites (${beforeLength} → ${favoritesArray.length})`);
          }
          
          localStorage.setItem(storageKey, JSON.stringify(favoritesArray));
          console.log('📦 After update - localStorage favorites:', favoritesArray);
        } catch (localError) {
          console.error('Error updating localStorage backup:', localError);
        }
      } else {
        console.error('Failed to update favorites:', response.message);
        // Revert the UI state if API failed
        setIsFavorite(!newFavoriteState);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      // Revert the UI state if error occurred
      setIsFavorite(!newFavoriteState);
    } finally {
      setIsLoadingFavorite(false);
    }
  };
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 95) return '#4caf50';
    if (score >= 90) return '#2196f3';
    if (score >= 85) return '#ff9800';
    return '#757575';
  };

  // Calculate match based on common interests - memoized for performance
  const commonInterests = useMemo(() => {
    return exhibitor.interests?.filter((interest: string) => 
      visitorInterests.some((visitorInterest: string) => 
        visitorInterest.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(visitorInterest.toLowerCase())
      )
    ) || [];
  }, [exhibitor.interests, visitorInterests]);

  // Calculate match score only on client side - memoized to prevent setState warnings
  const matchScore = useMemo(() => {
    if (!isClient) return 0;
    
    let score = 60; // Base score
    score += commonInterests.length * 8;
    
    // Safe check for commonInterests[0] to prevent undefined errors
    if (exhibitor.company && commonInterests.length > 0 && 
        exhibitor.company.toLowerCase().includes(commonInterests[0].toLowerCase())) {
      score += 15;
    }
    
    return Math.min(98, score + Math.floor(Math.random() * 10));
  }, [isClient, commonInterests, exhibitor.company]);

  return (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e8eaed',
        bgcolor: 'background.paper',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 2, pb: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header with Company Info and Match Score */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2} sx={{ minHeight: '90px' }}>
          <Box display="flex" alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 52,
                height: 52,
                mr: 1,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}
            >
              {exhibitor.company ? exhibitor.company.charAt(0).toUpperCase() : getInitials(exhibitor.firstName, exhibitor.lastName)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" component="div" fontWeight="600" sx={{ mb: 0.5, minHeight: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Business sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0, mt: 0.25 }} />
                <Box sx={{ wordBreak: 'break-word', lineHeight: 1.2, flex: 1 }}>
                  {exhibitor.company || `${exhibitor.firstName} ${exhibitor.lastName}`}
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}>
                {exhibitor.jobTitle}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {exhibitor.customData?.boothNumber && (
                  <Chip
                    label={exhibitor.customData.boothNumber}
                    size="small"
                    sx={{ 
                      bgcolor: '#e3f2fd',
                      color: '#1565c0',
                      fontWeight: 500
                    }}
                  />
                )}
                {commonInterests.length > 0 && (
                  <Chip
                    label={`${commonInterests.length} Match`}
                    size="small"
                    sx={{ 
                      bgcolor: '#e8f5e8',
                      color: '#2e7d32',
                      fontWeight: 500,
                      fontSize: '0.7rem'
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
          
          
          <Box display="flex" alignItems="center">
            <IconButton 
              onClick={(e) => {
                console.log('🎯 IconButton clicked!');
                handleFavoriteClick(e);
              }}
              disabled={isLoadingFavorite || isCheckingInitialState}
              size="large"
              sx={{ 
                p: 0.5,
                mr: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  color: '#b0bec5',
                  filter: 'drop-shadow(0 0 2px rgba(255, 0, 0, 0.1))',
                  backgroundColor: 'rgba(0,0,0,0.04)'
                },
                '&:disabled': {
                  opacity: 0.6
                }
              }}
            >
              {(isLoadingFavorite || isCheckingInitialState) ? (
                <CircularProgress size={20} sx={{ color: '#b0bec5' }} />
              ) : isFavorite ? (
                
                <Favorite
                sx={{
                  color: '#f44336',
                  fontSize: 30,
                  filter: 'drop-shadow(0 0 3px rgba(255, 0, 0, 0.3))',
                  textShadow: '0 -1px 1px rgba(255, 255, 255, 0.5)', // adds "highlight"
                  WebkitTextStroke: '0.3px #b71c1c', // subtle stroke
                  transform: 'scale(1.05)',
                }}
              />
              ) : (
                <FavoriteBorder sx={{
                  fontSize: 25,
                  color: '#b0bec5',
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))',
                }} />
              )}
            </IconButton>
            
          </Box>
          
        </Box>

        {/* Content Section - Takes up available space */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Location and Industry - only show if data exists */}
          {(exhibitor.customData?.location || exhibitor.customData?.industry) && (
            <Box mb={1}>
              {exhibitor.customData?.location && (
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {exhibitor.customData.location}
                  </Typography>
                </Box>
              )}
              
              {exhibitor.customData?.industry && (
                <Box display="flex" alignItems="center">
                  <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {exhibitor.customData.industry}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Products/Services Offered - only show if data exists */}
          {exhibitor.customData?.products && exhibitor.customData.products.length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                Products & Services:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {exhibitor.customData.products.slice(0, 3).map((service: any, index: number) => (
                  <Chip
                    key={index}
                    label={service}
                    size="small"
                    sx={{ 
                      fontSize: '0.75rem',
                      bgcolor: '#f1f3f4',
                      color: '#5f6368',
                      border: 'none'
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
                      border: 'none'
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Company Description - only show if data exists */}
          {exhibitor.customData?.companyDescription && (
            <Box mb={1}>
              <Typography variant="body2" color="text.secondary" sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4
              }}>
                {exhibitor.customData.companyDescription}
              </Typography>
            </Box>
          )}

          {/* Common Interests - only show if data exists */}
          {commonInterests.length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                Common Interests:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {commonInterests.slice(0, 3).map((interest: any, index: number) => (
                  <Chip
                    key={index}
                    label={interest}
                    size="small"
                    icon={<InterestPoint sx={{ fontSize: 12 }} />}
                    sx={{ 
                      fontSize: '0.75rem',
                      bgcolor: '#e8f5e8',
                      color: '#2e7d32',
                      border: 'none'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />  

        {/* Action Buttons */}
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 'auto' }}>
          <Box display="flex" gap={1}>
            {exhibitor.customData?.linkedInProfile && (
              <IconButton size="small" sx={{ color: '#0077b5' }} onClick={() => window.open(exhibitor.customData?.linkedInProfile, '_blank')}>
                <LinkedIn fontSize="small" />
              </IconButton>
            )}
           
            {exhibitor.customData?.website && (
              <IconButton size="small" sx={{ color: '#757575' }} onClick={() => window.open(exhibitor.customData?.website, '_blank')}>
                <Language fontSize="small" />
              </IconButton>
            )}
            
           
            
          </Box>

          <Button
            variant="contained"
            size="small"
            startIcon={<ConnectIcon />}
            sx={{ 
              bgcolor: theme.palette.primary.main,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              }
            }}
          >
            Connect
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function ExhibitorCardSkeleton() {
  return (
    <Card sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent sx={{ p: 1.5 }}>
        <Box display="flex" alignItems="flex-start" mb={2}>
          <Skeleton variant="circular" width={52} height={52} sx={{ mr: 1 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="80%" height={16} sx={{ mb: 0.5 }} />
            <Box display="flex" gap={1}>
              <Skeleton variant="rounded" width={60} height={20} />
              <Skeleton variant="rounded" width={80} height={20} />
            </Box>
          </Box>
        </Box>
        <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="70%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={32} sx={{ mb: 2 }} />
        <Box display="flex" gap={1}>
          <Skeleton variant="rounded" width="100%" height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </CardContent>
    </Card>
  );
}

function ExhibitorListView() {
  const theme = useTheme();
  const { currentThemeName, setTheme: setSimpleTheme, setFontFamily: setSimpleFontFamily } = useSimpleTheme();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [exhibitors, setExhibitors] = useState<any[]>([]);
  const [realExhibitors, setRealExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdentifier, setCurrentIdentifier] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    loadExhibitors();

    // Listen for theme changes from localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        setSimpleTheme(e.newValue);
      }
      if (e.key === 'fontFamily' && e.newValue) {
        setSimpleFontFamily(e.newValue);
      }
    };

    // Listen for theme changes from parent window (if iframe is embedded)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'THEME_CHANGE' && event.data.theme) {
        setSimpleTheme(event.data.theme);
      }
      if (event.data.type === 'FONT_CHANGE' && event.data.fontFamily) {
        setSimpleFontFamily(event.data.fontFamily);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
    };
  }, [setSimpleTheme, setSimpleFontFamily]);

  const loadExhibitors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Extract identifier from URL with fallback logic
      let identifier: string | null = null;
      
      // Method 1: Check URL search params first (e.g., ?identifier=DEMO2024)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('identifier')) {
        identifier = urlParams.get('identifier');
      } else {
        // Method 2: Extract from URL path (e.g., /DEMO2024/iframe/exhibitors)
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0 && pathParts[0] !== 'iframe') {
          identifier = pathParts[0];
        }
      }
      
      // Method 3: Use common identifiers as fallback
      if (!identifier) {
        // Try common identifiers in order of likelihood
        const commonIdentifiers = ['DEMO2024', 'STYLE2025', 'WIBI'];
        identifier = commonIdentifiers[0]; // Default to DEMO2024
      }

      console.log('Loading exhibitors with identifier:', identifier);
      setCurrentIdentifier(identifier); // Store identifier in state
      const response = await fieldMappingApi.getAllExhibitors(identifier);
      
      if (response.statusCode === 200) {
        if (response.result && response.result.length > 0) {
          const convertedExhibitors = response.result.map((exhibitor, index) => transformExhibitorData(exhibitor, identifier!, index));
          setExhibitors(convertedExhibitors);
          setRealExhibitors(response.result);
        } else {
          setExhibitors([]);
          setError('No exhibitors found for this event');
        }
      } else {
        setExhibitors([]);
        setError(response.message || 'Failed to load exhibitors');
      }
    } catch (err: any) {
      console.error('Error loading exhibitors:', err);
      setError(err.message || 'Failed to load exhibitors');
      setExhibitors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize filtered exhibitors for better performance
  const filteredExhibitors = useMemo(() => {
    return exhibitors.filter(exhibitor => {
    const matchesSearch = 
      exhibitor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibitor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibitor.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || exhibitor.status === filterStatus;
    const matchesIndustry = filterIndustry === 'all' || exhibitor.customData?.industry === filterIndustry;

    return matchesSearch && matchesStatus && matchesIndustry;
  });
  }, [exhibitors, searchTerm, filterStatus, filterIndustry]);

  // Memoize unique industries for filter
  const industries = useMemo(() => {
    return Array.from(new Set(
      exhibitors
        .map(exhibitor => exhibitor.customData?.industry)
        .filter(Boolean)
    ));
  }, [exhibitors]);

  // Sample visitor interests for match calculation
  const sampleVisitorInterests: string[] = [];

  // Show skeleton loading immediately
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 1, p: 0 }}>
        <Box mb={2}>
          <Typography variant="h5" component="h1" fontWeight="600" sx={{ mb: 1 }}>
            Exhibitors Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Loading exhibitors...
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <ExhibitorCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 1, p: 0 }}>
      {/* Header */}
      <Box mb={2}>
        <Typography variant="h5" component="h1" fontWeight="600" sx={{ mb: 1 }}>
          Exhibitors Directory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and connect with exhibitors showcasing innovative solutions
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search exhibitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                displayEmpty
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="registered">Registered</MenuItem>
                <MenuItem value="invited">Invited</MenuItem>
                <MenuItem value="checked-in">Checked In</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {industries.length > 0 && (
            <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <Select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                displayEmpty
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="all">All Industries</MenuItem>
                {industries.map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          )}
        </Grid>
      </Box>

      {/* Results Count */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading exhibitors...' : `Showing ${filteredExhibitors.length} of ${exhibitors.length} exhibitors`}
          {realExhibitors.length > 0 }
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && !loading && (
        <Box mb={2} textAlign="center" py={8}>
          <Business sx={{ fontSize: 64, color:"Grey", mb: 2 }} />
          <Typography variant="h6" sx={{color:"Grey"}} mb={1}>
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please check your connection or try again later
          </Typography>
        </Box>
      )}

      {/* Exhibitors Grid */}
      {!loading && !error && (
      <Grid container spacing={3}>
        {filteredExhibitors.map((exhibitor) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={exhibitor.id}>
            <Suspense fallback={<ExhibitorCardSkeleton />}>
              <ExhibitorCard
                exhibitor={exhibitor}
                visitorInterests={sampleVisitorInterests}
                isClient={isClient}
                identifier={currentIdentifier}
              />
            </Suspense>
          </Grid>
        ))}
      </Grid>
      )}

      {/* Empty State */}
      {!loading && !error && filteredExhibitors.length === 0 && exhibitors.length === 0 && (
        <Box textAlign="center" py={8}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            No exhibitors available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No exhibitors have been registered for this event yet
          </Typography>
        </Box>
      )}

      {/* No Search Results */}
      {!loading && !error && filteredExhibitors.length === 0 && exhibitors.length > 0 && (
        <Box textAlign="center" py={8}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            No exhibitors found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default function ExhibitorListPage() {
  return (
    <SimpleThemeProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <ExhibitorListView />
    </Box>
    </SimpleThemeProvider>
  );
} 