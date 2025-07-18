'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import ThemeWrapper from '@/components/providers/ThemeWrapper';
import ExhibitorsMatchingPage from '@/app/[identifier]/event-admin/exhibitors/matching/page';
import { getCurrentUserId, isEventAdmin } from '@/utils/authUtils';
import { FavoritesManager } from '@/utils/favoritesManager';

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
      companyType?: string;
    };
  };
  visitorInterests: string[];
  isClient: boolean;
  identifier: string;
  isFavorite: boolean;
  onFavoriteToggle: (exhibitorId: string, newStatus: boolean) => void;
}

// Transform API exhibitor data to UI format - only use actual API data
const transformExhibitorData = (apiExhibitor: Exhibitor, identifier: string, index: number) => {
  // Debug logging for website field
  console.log('🔍 Transform exhibitor data:', {
    id: apiExhibitor.id,
    companyName: apiExhibitor.companyName,
    webSite: (apiExhibitor as any).webSite,
    webSiteType: typeof (apiExhibitor as any).webSite,
    webSiteLength: (apiExhibitor as any).webSite?.length,
    // Check for alternative website field names
    website: apiExhibitor.website,
    companyWebsite: (apiExhibitor as any).companyWebsite,
    // Log all available fields for debugging
    allFields: Object.keys(apiExhibitor)
  });

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
      website: (apiExhibitor as any).webSite || null,
      companyType: apiExhibitor.companyType || null,
    }
  };
};

function ExhibitorCard({ exhibitor, visitorInterests, isClient, identifier, isFavorite, onFavoriteToggle }: ExhibitorCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  // Debug website data
  useEffect(() => {
    console.log('🔍 Website icon check:', {
      hasWebsite: !!exhibitor.customData?.website,
      websiteValue: exhibitor.customData?.website,
      websiteTrimmed: exhibitor.customData?.website?.trim(),
      exhibitorId: exhibitor.id,
      companyName: exhibitor.company
    });
  }, [exhibitor.customData?.website, exhibitor.id, exhibitor.company]);
  
  const handleExhibitorNameClick = () => {
    console.log('🔍 Exhibitor name clicked:', {
      exhibitorId: exhibitor.id,
      exhibitorIdType: typeof exhibitor.id,
      identifier,
      identifierType: typeof identifier,
      fullUrl: `/${identifier}/event-admin/exhibitors/details?exhibitorId=${exhibitor.id}`,
      exhibitorData: {
        id: exhibitor.id,
        firstName: exhibitor.firstName,
        lastName: exhibitor.lastName,
        company: exhibitor.company
      },
      // Debug: Check if this exhibitor exists in the current list
      availableExhibitorIds: window.location.pathname.includes('iframe') ? 'Check console for loaded exhibitors' : 'Not in iframe context'
    });
    
    router.push(`/${identifier}/event-admin/exhibitors/details?exhibitorId=${exhibitor.id}`);
  };

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
    onFavoriteToggle(exhibitor.id, newFavoriteState);
    
    if (isFavorite) {
      console.log('❤️➡️🤍 REMOVING from favorites (red heart clicked)');
      console.log('🚀 New state will be:', newFavoriteState, '(false = removing)');
    } else {
      console.log('🤍➡️❤️ ADDING to favorites (outline heart clicked)');
      console.log('🚀 New state will be:', newFavoriteState, '(true = adding)');
    }

    console.log('Using identifier:', identifier);
    setIsLoadingFavorite(true);

    try {
      // Use FavoritesManager to toggle favorite status
      const finalStatus = await FavoritesManager.toggleExhibitorFavorite(identifier, exhibitor.id, isFavorite);
      
      // Update UI with the final status from API
      onFavoriteToggle(exhibitor.id, finalStatus);
      
      if (finalStatus !== newFavoriteState) {
        console.log('⚠️ API returned different status than expected, UI updated to match API');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      // Revert the UI state if error occurred
      onFavoriteToggle(exhibitor.id, !newFavoriteState);
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
      <CardContent sx={{ p: 1, pb: 0.5, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        {/* Header with Company Info and Match Score */}
        <Box display="flex" alignItems="center" mb={1} sx={{ minHeight: '60px', width: '100%' }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 36,
              height: 36,
              mr: 1.5,
              fontSize: '0.9rem',
              fontWeight: 'bold',
              flexShrink: 0,
              color: 'white',
              alignSelf: 'center',
              mt: 2,
            }}
          >
            {exhibitor.company ? exhibitor.company.charAt(0).toUpperCase() : getInitials(exhibitor.firstName, exhibitor.lastName)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0, mt: 2 }}>
            <Typography 
              variant="body2" 
              component="div" 
              fontWeight="600" 
              onClick={handleExhibitorNameClick}
              sx={{ 
                ml: 0, 
                minHeight: '1.2rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                lineHeight: 1.2, 
                wordBreak: 'break-word',
                cursor: 'pointer',
                color: 'primary.main',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: 'primary.dark',
                  textDecorationColor: 'currentColor',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {exhibitor.company}
            </Typography>
            {exhibitor.jobTitle && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0, wordBreak: 'break-word', lineHeight: 1.3 }}>
                {exhibitor.jobTitle}
              </Typography>
            )}
            {exhibitor.customData?.companyType && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0, wordBreak: 'break-word', lineHeight: 1.3 }}>
                {exhibitor.customData.companyType}
              </Typography>
            )}
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
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
              
            </Box>
          </Box>
        </Box>
        {/* Only show heart icon if user is NOT an event-admin */}
        {!isEventAdmin() && (
          <IconButton
            onClick={(e) => {
              handleFavoriteClick(e);
            }}
            disabled={isLoadingFavorite}
            size="large"
            sx={{
              position: 'absolute',
              top: 0,
              right: 8,
              p: 0.5,
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
          >
            {(isLoadingFavorite) ? (
              <CircularProgress size={20} sx={{ color: '#b0bec5' }} />
            ) : isFavorite ? (
              <Favorite
                sx={{
                  fontSize: 20,
                  color: '#ef4444',
                  filter: 'drop-shadow(0 0 3px rgba(78, 12, 17, 0.15))',
                  transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  animation: isFavorite ? 'heartBeat 0.8s ease-in-out' : 'none',
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
              <FavoriteBorder  sx={{
                fontSize: 20,
                color: '#b0bec5',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#ff6b9d',
                }
              }}  />
            )}
          </IconButton>
        )}
            
        {/* Content Section - Takes up available space */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Location and Industry - only show if data exists */}
          {(exhibitor.customData?.location || exhibitor.customData?.industry) && (
            <Box mb={1}>
              {exhibitor.customData?.location && (
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="subtitle2" color="text.secondary">
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
           
            {exhibitor.customData?.website && exhibitor.customData.website.trim() !== '' && (
              <IconButton 
                size="small" 
                sx={{ 
                  color:'hsla(0, 0.00%, 2.00%, 0.57)',
                  '&:hover': {
                    bgcolor: 'rgba(26, 24, 24, 0.1)'
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

function ExhibitorListView({ identifier }: { identifier: string }) {
  const theme = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');
  const [exhibitors, setExhibitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitorInterests, setVisitorInterests] = useState<string[]>([]);
  const [favoriteExhibitors, setFavoriteExhibitors] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetchExhibitors();
  }, []);

  // Load all favorite statuses in one API call
  const loadFavoriteStatuses = async (eventIdentifier: string) => {
    if (!eventIdentifier) return;

    try {
      console.log('🔍 Loading all exhibitor favorite statuses');
      
      // Get current visitor ID
      let currentUserId = getCurrentUserId();
      if (!currentUserId) {
        console.log('🔍 No user ID found, using default ID 1 for favorites check');
        currentUserId = 1;
      }

      const response = await fieldMappingApi.getVisitorFavorites(eventIdentifier, currentUserId);
      
      if (response.statusCode === 200 && response.result?.exhibitors) {
        const favoriteIds = new Set(
          response.result.exhibitors.map((exhibitor: any) => exhibitor.id.toString())
        );
        setFavoriteExhibitors(favoriteIds);
        console.log('✅ Loaded favorite statuses for', favoriteIds.size, 'exhibitors');
      } else {
        console.log('📦 No favorites found in API or API error');
        setFavoriteExhibitors(new Set());
      }
    } catch (error) {
      console.error('Error loading favorite statuses:', error);
      setFavoriteExhibitors(new Set());
    }
  };

  const fetchExhibitors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Extract identifier from URL path only - no static fallbacks
      let eventIdentifier: string | null = null;

      // Method 1: Extract from URL path (e.g., /STYLE2025/iframe/exhibitors)
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
        throw new Error('No event identifier found in URL. Please access this page through a valid event URL (e.g., /STYLE2025/iframe/exhibitors)');
      }

      console.log('Using identifier for API call:', eventIdentifier);
      const response = await fieldMappingApi.getAllExhibitors(eventIdentifier);

      if (response.statusCode === 200 && response.result) {
        const transformedExhibitors = response.result.map((exhibitor: Exhibitor, index: number) => transformExhibitorData(exhibitor, eventIdentifier, index));
        setExhibitors(transformedExhibitors);

        // Load favorite statuses after exhibitors are loaded
        await loadFavoriteStatuses(eventIdentifier);
      } else {
        setError('Failed to fetch exhibitors data');
      }
    } catch (err: any) {
      console.error('Error fetching exhibitors:', err);
      setError(err.message || 'Failed to fetch exhibitors data');
    } finally {
      setLoading(false);
    }
  };

  // Memoize filtered exhibitors for better performance
  const filteredExhibitors = useMemo(() => {
    return exhibitors.filter(exhibitor => {
    const matchesSearch = 
      exhibitor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibitor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibitor.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || exhibitor.status === filterStatus;
    const matchesExperience = filterExperience === 'all' || exhibitor.customData?.experience === filterExperience;

    return matchesSearch && matchesStatus && matchesExperience;
  });
  }, [exhibitors, searchTerm, filterStatus, filterExperience]);

  // Memoize unique experiences for filter
  const experiences = useMemo(() => {
    return Array.from(new Set(
      exhibitors
        .map(exhibitor => exhibitor.customData?.experience)
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
        <Grid container spacing={1.5}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={index}>
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
      <Box mb={1}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h5" component="h1" fontWeight="600" sx={{ mb: 0 }}>
              Exhibitors Directory
            </Typography>

          </Box>
          
          {/* Status Filter on the right */}
          <FormControl sx={{ minWidth: 150 }}>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              displayEmpty
              sx={{ bgcolor: 'background.paper', height: 32, fontSize: '0.92rem', '.MuiSelect-select': { py: '6px !important', minHeight: 'unset !important' } }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 200,
                    '& .MuiMenuItem-root': {
                      minHeight: '32px',
                      fontSize: '0.92rem',
                      py: '4px',
                    },
                  },
                },
              }}
            >
              <MenuItem value="all" sx={{ minHeight: '32px', fontSize: '0.92rem', py: '4px' }}>All Status</MenuItem>
              <MenuItem value="registered" sx={{ minHeight: '32px', fontSize: '0.92rem', py: '4px' }}>Registered</MenuItem>
              <MenuItem value="invited" sx={{ minHeight: '32px', fontSize: '0.92rem', py: '4px' }}>Invited</MenuItem>
              <MenuItem value="checked-in" sx={{ minHeight: '32px', fontSize: '0.92rem', py: '4px' }}>Checked In</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Industry Filter */}
      {experiences.length > 0 && (
        <Box mb={2}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <Select
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
                  displayEmpty
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <MenuItem value="all">All Experiences</MenuItem>
                  {experiences.map((experience) => (
                    <MenuItem key={experience} value={experience}>
                      {experience}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress size={48} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading Exhibitors...
          </Typography>
        </Box>
      )}

      {/* Results Count */}
      {!loading && !error && (
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading exhibitors...' : `Showing ${filteredExhibitors.length} of ${exhibitors.length} exhibitors`}
          {exhibitors.length > 0 }
        </Typography>
      </Box>
      )}

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
      <Grid container spacing={1.5}>
        {filteredExhibitors.map((exhibitor) => (
          <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={exhibitor.id}>
            <Suspense fallback={<ExhibitorCardSkeleton />}>
              <ExhibitorCard
                exhibitor={exhibitor}
                visitorInterests={sampleVisitorInterests}
                isClient={isClient}
                identifier={identifier || ''}
                isFavorite={favoriteExhibitors.has(exhibitor.id)}
                onFavoriteToggle={(id, newStatus) => {
                  setFavoriteExhibitors(prev => {
                    const newSet = new Set(prev);
                    if (newStatus) {
                      newSet.add(id);
                    } else {
                      newSet.delete(id);
                    }
                    return newSet;
                  });
                }}
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
  // We need to extract the identifier using the same logic as ExhibitorListView
  // But since ExhibitorListView already computes currentIdentifier, we can lift this logic up
  // Instead, let's move the identifier extraction to the top-level page and pass it to ThemeWrapper

  // Extract identifier from URL with comprehensive fallback logic
  let identifier: string | null = null;
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && pathParts[0] !== 'iframe') {
      identifier = pathParts[0];
    } else {
      try {
        if (window.parent && window.parent !== window) {
          const parentUrl = window.parent.location.pathname;
          const parentParts = parentUrl.split('/').filter(Boolean);
          if (parentParts.length > 0) {
            identifier = parentParts[0];
          }
        }
      } catch (e) {}
      if (!identifier) {
        const urlParams = new URLSearchParams(window.location.search);
        identifier = urlParams.get('eventId') || urlParams.get('identifier');
      }
      if (!identifier) {
        identifier = localStorage.getItem('currentEventIdentifier');
      }
      if (!identifier) {
        identifier = sessionStorage.getItem('currentEventIdentifier');
      }
      if (!identifier) {
        const commonIdentifiers = ['DEMO2024', 'STYLE2025', 'WIBI'];
        identifier = commonIdentifiers[0];
      }
    }
  }

  return (
    <ThemeWrapper identifier={identifier || undefined}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <ExhibitorListView identifier={identifier || ''} />
      </Box>
    </ThemeWrapper>
  );
} 