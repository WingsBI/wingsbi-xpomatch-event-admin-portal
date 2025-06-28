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
  ConnectWithoutContact as ConnectIcon,
  FiberManualRecord as InterestPoint,
  TrendingUp,
  GetApp,
  Person
} from '@mui/icons-material';

import { apiService } from '@/services/apiService';
import { ApiVisitorData, TransformedVisitor, VisitorsApiResponse } from '@/types';
import { SimpleThemeProvider, useSimpleTheme } from '@/context/SimpleThemeContext';

interface VisitorCardProps {
  visitor: TransformedVisitor;
  exhibitorCompany: string;
  exhibitorServices: string[];
  isClient: boolean;
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
      location: [apiVisitor.customData?.cityName, apiVisitor.customData?.stateName, apiVisitor.customData?.countryName].filter(Boolean).join(', ') || undefined,
      avatar: `${apiVisitor.firstName?.charAt(0) || ''}${apiVisitor.lastName?.charAt(0) || ''}`,
      
      // Only use API data when available
      experience: apiVisitor.userProfile?.experienceYears ? `${apiVisitor.userProfile.experienceYears} years` : undefined,
      matchScore: undefined, // Not provided in current API
      industry: undefined, // Not provided in current API
      lookingFor: [], // Not provided in current API
    },
  };
};

function VisitorCard({ visitor, exhibitorCompany, exhibitorServices, isClient }: VisitorCardProps) {
  const theme = useTheme();
  
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
      <CardContent sx={{ p: 2, pb: 1 }}>
        {/* Header with Visitor Info and Match Score */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
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
            <Box>
              <Typography variant="h6" component="div" fontWeight="600" sx={{ mb: 0.5 }}>
                {visitor.customData?.salutation} {visitor.firstName} {visitor.customData?.middleName} {visitor.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {visitor.jobTitle}
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="500">
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
          <Favorite sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Typography variant="body2" fontWeight="600" color={getMatchScoreColor(matchScore)}>
              {matchScore}
            </Typography>
          </Box>
        </Box>

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

          {/* Removed experience display */}
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

        <Divider sx={{ mb: 2 }} />

        {/* Action Buttons */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" gap={1}>
            <IconButton size="small" sx={{ color: '#0077b5' }}>
              <LinkedIn fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ color: '#1da1f2' }}>
              <Twitter fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ color: '#757575' }}>
              <Language fontSize="small" />
            </IconButton>
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

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract identifier from URL path only - no static fallbacks
      let identifier: string | null = null;
      
      // Method 1: Extract from URL path (e.g., /STYLE2025/iframe/visitors)
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      console.log('URL path parts:', pathParts);
      
      // Look for identifier in URL path - it should be the first segment
      if (pathParts.length > 0 && pathParts[0] !== 'iframe') {
        identifier = pathParts[0];
        console.log('Found identifier in URL path:', identifier);
      } else {
        // Method 2: Try to get from parent window if iframe is embedded
        try {
          if (window.parent && window.parent !== window) {
            const parentUrl = window.parent.location.pathname;
            const parentParts = parentUrl.split('/').filter(Boolean);
            if (parentParts.length > 0) {
              identifier = parentParts[0];
              console.log('Found identifier from parent window:', identifier);
            }
          }
        } catch (e) {
          console.log('Cannot access parent window URL (cross-origin)');
        }
      }
      
      // If no identifier found, throw error
      if (!identifier) {
        throw new Error('No event identifier found in URL. Please access this page through a valid event URL (e.g., /STYLE2025/iframe/visitors)');
      }
      
      console.log('Using identifier for API call:', identifier);
      const response = await apiService.getAllVisitors(identifier, true);
      
      if (response.success && response.data?.result) {
        const transformedVisitors = response.data.result.map((visitor: ApiVisitorData, index: number) => transformVisitorData(visitor, identifier, index));
        setVisitors(transformedVisitors);
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