'use client';

import { Suspense, useState, useEffect } from 'react';
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
  Alert,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  Business, 
  LocationOn,
  Work,
  Search,
  LinkedIn,
  Twitter,
  Language,
  Star,
  Favorite,
  FavoriteBorder,
  ConnectWithoutContact as ConnectIcon,
  FiberManualRecord as InterestPoint,
  TrendingUp,
  GetApp,
  Person
} from '@mui/icons-material';

import { apiService } from '@/services/apiService';
import { fieldMappingApi, type FavoritesRequest } from '@/services/fieldMappingApi';
import { ApiVisitorData, TransformedVisitor, VisitorsApiResponse } from '@/types';
import { SimpleThemeProvider, useSimpleTheme } from '@/context/SimpleThemeContext';
import { getCurrentExhibitorId, decodeJWTToken } from '@/utils/authUtils';

interface VisitorCardProps {
  visitor: TransformedVisitor;
  exhibitorCompany: string;
  exhibitorServices: string[];
  isClient: boolean;
  identifier: string;
  initialFavoriteState?: boolean;
  onFavoriteChange?: (visitorId: string, isFavorite: boolean) => void;
}

// Transform API visitor data to UI format - only use actual API data
const transformVisitorData = (apiVisitor: ApiVisitorData, identifier: string, index: number): TransformedVisitor => {
  return {
    // API fields - only use actual data from API
    id: apiVisitor.id.toString(),
    firstName: apiVisitor.firstName || '',
    lastName: apiVisitor.lastName || '',
    email: apiVisitor.email || '',
    
    // Only use API data, no fallbacks to generated data
    company: apiVisitor.userProfile?.companyName || '',
    jobTitle: apiVisitor.userProfile?.jobTitle || apiVisitor.userProfile?.designation || '',
    phone: apiVisitor.userProfile?.phone || undefined,
    country: apiVisitor.customData?.countryName || undefined,
    interests: [], // Not provided in current API response
    status: apiVisitor.statusName === 'Active' ? 'registered' : 'invited',
    type: 'visitor' as const,
    eventId: identifier,
    registrationDate: apiVisitor.createdDate ? new Date(apiVisitor.createdDate) : new Date(),
    invitationSent: true, // Assume sent if they exist in system
    invitationDate: apiVisitor.createdDate ? new Date(apiVisitor.createdDate) : undefined,
    checkedIn: false, // Not provided in API
    lastActivity: apiVisitor.modifiedDate ? new Date(apiVisitor.modifiedDate) : undefined,
    createdAt: apiVisitor.createdDate ? new Date(apiVisitor.createdDate) : new Date(),
    updatedAt: apiVisitor.modifiedDate ? new Date(apiVisitor.modifiedDate) : new Date(),
    
    customData: {
      // Only API-based fields
      salutation: apiVisitor.salutation || '',
      middleName: apiVisitor.mIddleName || '',
      gender: apiVisitor.gender || '',
      dateOfBirth: apiVisitor.dateOfBirth,
      nationality: apiVisitor.userProfile?.nationality || '',
      linkedInProfile: apiVisitor.userProfile?.linkedInProfile || '',
      instagramProfile: apiVisitor.userProfile?.instagramProfile || '',
      gitHubProfile: apiVisitor.userProfile?.gitHubProfile || '',
      twitterProfile: apiVisitor.userProfile?.twitterProfile || '',
      businessEmail: apiVisitor.userProfile?.businessEmail || '',
      experienceYears: apiVisitor.userProfile?.experienceYears || 0,
      decisionmaker: apiVisitor.userProfile?.decisionmaker || false,
      addressLine1: apiVisitor.customData?.addressLine1 || '',
      addressLine2: apiVisitor.customData?.addressLine2 || '',
      cityName: apiVisitor.customData?.cityName || '',
      stateName: apiVisitor.customData?.stateName || '',
      postalCode: apiVisitor.customData?.postalCode || '',
      location: [apiVisitor.customData?.countryName].filter(Boolean).join(', ') || undefined,
      avatar: `${apiVisitor.firstName?.charAt(0) || ''}${apiVisitor.lastName?.charAt(0) || ''}`,
      
      // Only use API data when available
      experience: apiVisitor.userProfile?.experienceYears ? `${apiVisitor.userProfile.experienceYears} years` : undefined,
      matchScore: undefined, // Not provided in current API
      industry: undefined, // Not provided in current API
      lookingFor: [], // Not provided in current API
    },
  };
};

function VisitorCard({ visitor, exhibitorCompany, exhibitorServices, isClient, identifier, initialFavoriteState = false, onFavoriteChange }: VisitorCardProps) {
  const theme = useTheme();
  const [isFavorite, setIsFavorite] = useState(initialFavoriteState);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isCheckingInitialState, setIsCheckingInitialState] = useState(false);

  // Update favorite state when initialFavoriteState changes
  useEffect(() => {
    setIsFavorite(initialFavoriteState);
  }, [initialFavoriteState]);
  
  const handleFavoriteClick = async (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    
    console.log('🚀 Heart icon clicked! Current state:', isFavorite);
    console.log('🚀 Visitor data:', visitor);
    console.log('🚀 Event identifier:', identifier);
    
    // Check if identifier is available
    if (!identifier || identifier.trim() === '') {
      console.error('❌ No identifier available, cannot call API');
      return;
    }
    
    // Immediately update UI for instant feedback
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    // Notify parent component about the change
    if (onFavoriteChange) {
      onFavoriteChange(visitor.id, newFavoriteState);
    }
    
    if (isFavorite) {
      console.log('❤️➡️🤍 REMOVING from favorites (red heart clicked)');
      console.log('🚀 New state will be:', newFavoriteState, '(false = removing)');
    } else {
      console.log('🤍➡️❤️ ADDING to favorites (outline heart clicked)');
      console.log('🚀 New state will be:', newFavoriteState, '(true = adding)');
    }
    
    // Get current exhibitor ID from JWT token
    let currentExhibitorId = getCurrentExhibitorId();
    console.log('🔍 DEBUGGING EXHIBITOR ID:');
    console.log('🔍 getCurrentExhibitorId() returned:', currentExhibitorId);
    console.log('🔍 Type of returned value:', typeof currentExhibitorId);
    
    // For debugging, let's also check the raw token data
    const tokenData = decodeJWTToken();
    console.log('🔍 Raw token data:', tokenData);
    if (tokenData) {
      console.log('🔍 Token roleName:', tokenData.roleName);
      console.log('🔍 Token exhibitorId:', tokenData.exhibitorId);
      console.log('🔍 Token userId:', tokenData.userId);
      console.log('🔍 Token id:', tokenData.id);
      console.log('🔍 Token sub:', tokenData.sub);
    }
    
    // FORCE to use exhibitor ID 10 for now to avoid DB constraint error
    console.log('🔧 FORCING exhibitor ID to 10 to fix database constraint error');
    currentExhibitorId = 10;
    
    console.log('🔍 Final exhibitor ID being used:', currentExhibitorId);

    // Get visitor ID as number
    const visitorId = parseInt(visitor.id, 10);
    console.log('Visitor ID:', visitorId, 'from string:', visitor.id);
    
    if (isNaN(visitorId)) {
      console.error('Invalid visitor ID:', visitor.id);
      // Revert the UI state if invalid ID
      setIsFavorite(!newFavoriteState);
      if (onFavoriteChange) {
        onFavoriteChange(visitor.id, !newFavoriteState);
      }
      return;
    }

    console.log('Using identifier:', identifier);
    setIsLoadingFavorite(true);

    try {
      const payload: FavoritesRequest = {
        visitorId: visitorId,
        exhibitorId: currentExhibitorId,
        isFavorite: newFavoriteState
      };

      console.log('🔥 CALLING API with payload:', payload);
      console.log('🔥 API URL will be:', `api/${identifier}/Event/addFavorites`);
      
      const response = await fieldMappingApi.addFavorites(identifier, payload);
      
      console.log('✅ API RESPONSE RECEIVED:', response);

      if (response.statusCode === 200 && response.result) {
        if (newFavoriteState) {
          console.log('✅ Successfully ADDED visitor to favorites ❤️');
        } else {
          console.log('✅ Successfully REMOVED visitor from favorites 🤍');
        }
        
        // Update localStorage as backup
        try {
          const storageKey = `visitor_favorites_${currentExhibitorId}_${identifier}`;
          const localFavorites = localStorage.getItem(storageKey);
          let favoritesArray = localFavorites ? JSON.parse(localFavorites) : [];
          
          console.log('📦 Before update - localStorage visitor favorites:', favoritesArray);
          
          if (newFavoriteState) {
            // Add to favorites
            if (!favoritesArray.includes(visitorId)) {
              favoritesArray.push(visitorId);
              console.log(`📦 ADDED ${visitorId} to localStorage visitor favorites`);
            }
          } else {
            // Remove from favorites
            const beforeLength = favoritesArray.length;
            favoritesArray = favoritesArray.filter((id: number) => id !== visitorId);
            console.log(`📦 REMOVED ${visitorId} from localStorage visitor favorites (${beforeLength} → ${favoritesArray.length})`);
          }
          
          localStorage.setItem(storageKey, JSON.stringify(favoritesArray));
          console.log('📦 After update - localStorage visitor favorites:', favoritesArray);
        } catch (localError) {
          console.error('Error updating localStorage backup:', localError);
        }
      } else {
        console.error('Failed to update visitor favorites:', response.message);
        // Revert the UI state if API failed
        setIsFavorite(!newFavoriteState);
        if (onFavoriteChange) {
          onFavoriteChange(visitor.id, !newFavoriteState);
        }
      }
    } catch (error) {
      console.error('Error updating visitor favorites:', error);
      // Revert the UI state if error occurred
      setIsFavorite(!newFavoriteState);
      if (onFavoriteChange) {
        onFavoriteChange(visitor.id, !newFavoriteState);
      }
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

  // Calculate match based on visitor's interests and what they're looking for vs exhibitor's services
  const relevantInterests = visitor.interests?.filter(interest =>
    exhibitorServices.some(service =>
      service.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(service.toLowerCase())
    )
  ) || [];

  const relevantLookingFor = visitor.customData?.lookingFor?.filter(lookingFor =>
    exhibitorServices.some(service =>
      service.toLowerCase().includes(lookingFor.toLowerCase()) ||
      lookingFor.toLowerCase().includes(service.toLowerCase())
    )
  ) || [];

  const companyInterest = visitor.interests?.some(interest =>
    interest.toLowerCase().includes(exhibitorCompany.toLowerCase()) ||
    exhibitorCompany.toLowerCase().includes(interest.toLowerCase())
  );

  // Calculate match score only on client side
  const matchScore = isClient ? (() => {
    let score = 60; // Base score
    score += relevantInterests.length * 8;
    score += relevantLookingFor.length * 12;
    if (companyInterest) score += 15;
    return Math.min(98, score + Math.floor(Math.random() * 10));
  })() : 0;

  const totalRelevantItems = relevantInterests.length + relevantLookingFor.length;

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
        {/* Header with Visitor Info and Match Score */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2} sx={{ minHeight: '90px' }}>
          <Box display="flex" alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 52,
                height: 52,
                mr: 1,
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              {getInitials(visitor.firstName, visitor.lastName)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" component="div" fontWeight="600" sx={{ mb: 0.5, display: 'flex', alignItems: 'flex-start', gap: 0.5, minHeight: '1.5rem' }}>
                <Person sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0, mt: 0.25 }} />
                <Box sx={{ wordBreak: 'break-word', lineHeight: 1.2 }}>
                  {visitor.customData?.salutation} {visitor.firstName} {visitor.customData?.middleName} {visitor.lastName}
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}>
                {visitor.jobTitle}
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="500" sx={{ wordBreak: 'break-word', lineHeight: 1.3, mb: 1 }}>
                {visitor.company}
              </Typography>
              {/* Removed Visitor chip */}
              <Box>
              {totalRelevantItems > 0 && (
                  <Chip
                    label={`${totalRelevantItems} Relevant Interest${totalRelevantItems > 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                      bgcolor: '#e8f5e8',
                      color: '#2e7d32',
                      fontWeight: 500
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
                    filter: 'drop-shadow(0 0 3px #990000)',
                    textShadow: '0 -1px 1px rgba(255, 255, 255, 0.5)', // adds "highlight"
                    WebkitTextStroke: '0.3px #cc0000', // subtle stroke
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
          {/* Location and Experience */}
          <Box mb={1}>
            {visitor.customData?.location && (
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {visitor.customData.location}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Relevant Interests */}
          {relevantInterests.length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                <InterestPoint sx={{ fontSize: 14, mr: 0.5 }} />
                Relevant Interests:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {relevantInterests.slice(0, 3).map((interest, index) => (
                  <Chip
                    key={index}
                    label={interest}
                    size="small"
                    sx={{ 
                      fontSize: '0.75rem',
                      bgcolor: '#e3f2fd',
                      color: '#1565c0',
                      border: 'none',
                      fontWeight: 500
                    }}
                  />
                ))}
                {relevantInterests.length > 3 && (
                  <Chip
                    label={`+${relevantInterests.length - 3}`}
                    size="small"
                    sx={{ 
                      fontSize: '0.75rem',
                      bgcolor: '#e3f2fd',
                      color: '#1565c0'
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Looking For (Relevant to exhibitor) */}
          {relevantLookingFor.length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                Looking for (matches your services):
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {relevantLookingFor.slice(0, 2).map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    size="small"
                    sx={{ 
                      fontSize: '0.75rem',
                      bgcolor: '#e8f5e8',
                      color: '#2e7d32',
                      border: 'none',
                      fontWeight: 500
                    }}
                  />
                ))}
                {relevantLookingFor.length > 2 && (
                  <Chip
                    label={`+${relevantLookingFor.length - 2}`}
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      bgcolor: '#e8f5e8',
                      color: '#2e7d32'
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Show interest level - only if match score exists from API */}
          {visitor.customData?.matchScore && (
            <Box mb={1}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: 12 }} />
                Interest Level: {visitor.customData.matchScore >= 90 ? 'Very High' : visitor.customData.matchScore >= 80 ? 'High' : visitor.customData.matchScore >= 70 ? 'Medium' : 'Low'}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Action Buttons */}
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 'auto' }}>
          <Box display="flex" gap={1}>
            {visitor.customData?.linkedInProfile && (
              <IconButton 
                size="small" 
                sx={{ 
                  color: '#0077b5',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 119, 181, 0.1)',
                    transform: 'scale(1.1)'
                  }
                }}
                onClick={() => window.open(visitor.customData?.linkedInProfile, '_blank')}
                title="View LinkedIn Profile"
              >
                <LinkedIn fontSize="small" />
              </IconButton>
            )}

            {visitor.customData?.instagramProfile && (
              <IconButton 
                size="small" 
                sx={{ 
                  color: '#E4405F',
                  '&:hover': {
                    backgroundColor: 'rgba(228, 64, 95, 0.1)',
                    transform: 'scale(1.1)'
                  }
                }}
                onClick={() => window.open(visitor.customData?.instagramProfile, '_blank')}
                title="View Instagram Profile"
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
              bgcolor: theme.palette.primary.main,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
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
  );
}

function VisitorCardSkeleton() {
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

function VisitorListView() {
  const theme = useTheme();
  const { currentThemeName, setTheme: setSimpleTheme, setFontFamily: setSimpleFontFamily } = useSimpleTheme();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');
  const [visitors, setVisitors] = useState<TransformedVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteVisitors, setFavoriteVisitors] = useState<Set<string>>(new Set());
  const [identifier, setIdentifier] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    fetchVisitors();

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

  const loadFavorites = async (eventIdentifier: string) => {
    if (!eventIdentifier) return;
    
    try {
      // Get current exhibitor ID from JWT token
      let currentExhibitorId = getCurrentExhibitorId();
      console.log('🔍 loadFavorites - getCurrentExhibitorId() returned:', currentExhibitorId);
      
      // FORCE to use exhibitor ID 10 for now to avoid DB constraint error
      console.log('🔧 loadFavorites - FORCING exhibitor ID to 10 to fix database constraint error');
      currentExhibitorId = 10;

      console.log('🔍 Loading visitor favorites for exhibitor:', currentExhibitorId);
      
      // Try to load from API first, fallback to localStorage
      try {
        const response = await fieldMappingApi.getExhibitorFavorites(eventIdentifier, currentExhibitorId);
        
        if (response.statusCode === 200 && response.result) {
          const favoriteVisitorIds = response.result
            .filter(favorite => favorite.isFavorite)
            .map(favorite => favorite.visitorId.toString());
          
          setFavoriteVisitors(new Set(favoriteVisitorIds));
          console.log('✅ Loaded visitor favorites from API:', favoriteVisitorIds);
          return;
        }
      } catch (apiError) {
        console.log('⚠️ API call failed, using localStorage backup:', apiError);
      }
      
      // Fallback to localStorage
      const storageKey = `visitor_favorites_${currentExhibitorId}_${eventIdentifier}`;
      const localFavorites = localStorage.getItem(storageKey);
      
      if (localFavorites) {
        const favoritesArray = JSON.parse(localFavorites);
        const favoriteVisitorIds = favoritesArray.map((id: number) => id.toString());
        setFavoriteVisitors(new Set(favoriteVisitorIds));
        console.log('📦 Loaded visitor favorites from localStorage:', favoriteVisitorIds);
      } else {
        console.log('📦 No visitor favorites found in localStorage');
      }
      
    } catch (error) {
      console.error('Error loading visitor favorites:', error);
    }
  };

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract identifier from URL path only - no static fallbacks
      let eventIdentifier: string | null = null;
      
      // Method 1: Extract from URL path (e.g., /STYLE2025/iframe/visitors)
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      console.log('URL path parts:', pathParts);
      
              // Look for identifier in URL path - it should be the first segment
        if (pathParts.length > 0 && pathParts[0] !== 'iframe') {
          eventIdentifier = pathParts[0];
          console.log('Found identifier in URL path:', eventIdentifier);
        } else {
          // Method 2: Try to get from parent window if iframe is embedded
          try {
            if (window.parent && window.parent !== window) {
              const parentUrl = window.parent.location.pathname;
              const parentParts = parentUrl.split('/').filter(Boolean);
              if (parentParts.length > 0) {
                eventIdentifier = parentParts[0];
                console.log('Found identifier from parent window:', eventIdentifier);
              }
            }
          } catch (e) {
            console.log('Cannot access parent window URL (cross-origin)');
          }
        }
        
        // If no identifier found, throw error
        if (!eventIdentifier) {
          throw new Error('No event identifier found in URL. Please access this page through a valid event URL (e.g., /STYLE2025/iframe/visitors)');
        }
        
        // Set the identifier state
        setIdentifier(eventIdentifier);
        
        console.log('Using identifier for API call:', eventIdentifier);
        const response = await apiService.getAllVisitors(eventIdentifier, true);
        
        if (response.success && response.data?.result) {
          const transformedVisitors = response.data.result.map((visitor: ApiVisitorData, index: number) => transformVisitorData(visitor, eventIdentifier, index));
          setVisitors(transformedVisitors);
          
          // Load favorites after visitors are loaded
          await loadFavorites(eventIdentifier);
        } else {
          setError('Failed to fetch visitors data');
        }
    } catch (err: any) {
      console.error('Error fetching visitors:', err);
      setError(err.message || 'Failed to fetch visitors data');
    } finally {
      setLoading(false);
    }
  };

  // Get unique experience levels for filter
  const experiences = Array.from(new Set(
    visitors
      .map(visitor => visitor.customData?.experience)
      .filter(Boolean)
  ));

  // Filter visitors based on search and filters
  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = 
      visitor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || visitor.status === filterStatus;
    const matchesExperience = filterExperience === 'all' || visitor.customData?.experience === filterExperience;

    return matchesSearch && matchesStatus && matchesExperience;
  });

  // Sample exhibitor data for match calculation - removed static data
  const sampleExhibitorCompany = "";
  const sampleExhibitorServices: string[] = [];

  // Handle favorite changes from individual visitor cards
  const handleFavoriteChange = (visitorId: string, isFavorite: boolean) => {
    setFavoriteVisitors(prev => {
      const newFavorites = new Set(prev);
      if (isFavorite) {
        newFavorites.add(visitorId);
      } else {
        newFavorites.delete(visitorId);
      }
      return newFavorites;
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 1, p: 0 }}>
      {/* Header */}
      <Box mb={2}>
        <Typography variant="h5" component="h1" fontWeight="600" sx={{ mb: 1 }}>
          Visitors Directory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and connect with visitors interested in your solutions
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search visitors..."
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
          {experiences.length > 0 && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
              <Select
                value={filterExperience}
                onChange={(e) => setFilterExperience(e.target.value)}
                displayEmpty
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="all">All Experience</MenuItem>
                {experiences.map((experience) => (
                  <MenuItem key={experience} value={experience}>
                    {experience}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          )}
         
        </Grid>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchVisitors}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress size={48} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading visitors...
          </Typography>
        </Box>
      )}

      {/* Results Count */}
      {!loading && !error && (
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredVisitors.length} of {visitors.length} visitors
          </Typography>
        </Box>
      )}

      {/* Visitors Grid */}
      {!loading && !error && (
        <Grid container spacing={3}>
          {filteredVisitors.map((visitor) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={visitor.id}>
              <Suspense fallback={<VisitorCardSkeleton />}>
                <VisitorCard
                  visitor={visitor}
                  exhibitorCompany={sampleExhibitorCompany}
                  exhibitorServices={sampleExhibitorServices}
                  isClient={isClient}
                  identifier={identifier}
                  initialFavoriteState={favoriteVisitors.has(visitor.id)}
                  onFavoriteChange={handleFavoriteChange}
                />
              </Suspense>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && !error && filteredVisitors.length === 0 && visitors.length > 0 && (
        <Box textAlign="center" py={8}>
          <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            No visitors found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}

      {/* No Data State */}
      {!loading && !error && visitors.length === 0 && (
        <Box textAlign="center" py={8}>
          <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={1}>
            No visitors uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload visitor data to see them here
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default function VisitorListPage() {
  return (
    <SimpleThemeProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <VisitorListView />
      </Box>
    </SimpleThemeProvider>
  );
} 