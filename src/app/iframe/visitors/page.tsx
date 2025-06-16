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
  Divider
} from '@mui/material';
import { 
  Business, 
  LocationOn,
  Work,
  Search,
  LinkedIn,
  Twitter,
  Language,
  Star,
  ConnectWithoutContact as ConnectIcon,
  FiberManualRecord as InterestPoint,
  TrendingUp
} from '@mui/icons-material';

import { mockVisitors, mockExhibitors } from '@/lib/mockData';

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
    };
  };
  visitorInterests: string[];
  isClient: boolean;
}

function ExhibitorCard({ exhibitor, visitorInterests, isClient }: ExhibitorCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 95) return '#4caf50';
    if (score >= 90) return '#2196f3';
    if (score >= 85) return '#ff9800';
    return '#757575';
  };

  // Calculate match based on common interests
  const commonInterests = exhibitor.interests?.filter(interest => 
    visitorInterests.some(visitorInterest => 
      visitorInterest.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(visitorInterest.toLowerCase())
    )
  ) || [];

  // Calculate match score only on client side
  const matchScore = isClient ? (() => {
    return Math.min(95, 60 + (commonInterests.length * 10) + Math.floor(Math.random() * 15));
  })() : 0;

  return (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e8eaed',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 3, pb: 2 }}>
        {/* Header with Company Info and Match Score */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{
                bgcolor: '#ff6f00',
                width: 52,
                height: 52,
                mr: 2,
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              {exhibitor.company ? exhibitor.company.charAt(0).toUpperCase() : getInitials(exhibitor.firstName, exhibitor.lastName)}
            </Avatar>
            <Box>
              <Typography variant="h6" component="div" fontWeight="600" sx={{ mb: 0.5 }}>
                {exhibitor.company || `${exhibitor.firstName} ${exhibitor.lastName}`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {exhibitor.firstName} {exhibitor.lastName} • {exhibitor.jobTitle}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label="Exhibitor"
                  size="small"
                  sx={{ 
                    bgcolor: '#fff3e0',
                    color: '#e65100',
                    fontWeight: 500
                  }}
                />
                {commonInterests.length > 0 && (
                  <Chip
                    label={`${commonInterests.length} Common Interests`}
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
            <Star sx={{ color: getMatchScoreColor(matchScore), mr: 0.5, fontSize: 18 }} />
            <Typography variant="body2" fontWeight="600" color={getMatchScoreColor(matchScore)}>
              {matchScore}%
            </Typography>
          </Box>
        </Box>

        {/* Location and Industry */}
        <Box mb={2}>
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

        {/* Products/Services Offered */}
        {exhibitor.customData?.products && exhibitor.customData.products.length > 0 && (
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
                    border: 'none'
                  }}
                />
              ))}
              {exhibitor.customData.products.length > 3 && (
                <Chip
                  label={`+${exhibitor.customData.products.length - 3}`}
                  size="small"
                  sx={{ 
                    fontSize: '0.75rem',
                    bgcolor: '#e8f0fe',
                    color: '#1a73e8'
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Common Interests */}
        {commonInterests.length > 0 && (
          <Box mb={3}>
            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
              <InterestPoint sx={{ fontSize: 14, mr: 0.5 }} />
              Common Interests:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {commonInterests.slice(0, 3).map((interest, index) => (
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
              {commonInterests.length > 3 && (
                <Chip
                  label={`+${commonInterests.length - 3}`}
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
              bgcolor: '#1a73e8',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              '&:hover': {
                bgcolor: '#1565c0',
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
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
          <Box flex={1}>
            <Skeleton variant="text" width="60%" height={24} />
            <Box display="flex" gap={1} mt={0.5}>
              <Skeleton variant="rounded" width={60} height={20} />
              <Skeleton variant="rounded" width={80} height={20} />
            </Box>
          </Box>
        </Box>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="90%" />
        <Box display="flex" gap={0.5} mt={1}>
          <Skeleton variant="rounded" width={50} height={20} />
          <Skeleton variant="rounded" width={60} height={20} />
          <Skeleton variant="rounded" width={45} height={20} />
        </Box>
      </CardContent>
    </Card>
  );
}

function VisitorExhibitorsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All Industries');
  const [isClient, setIsClient] = useState(false);
  
  // Add useEffect to handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get a sample visitor (you can make this dynamic based on URL params or login)
  const currentVisitor = mockVisitors[0]; // Sample: Rahul Sharma
  const visitorInterests = currentVisitor.interests || [];

  const exhibitors = mockExhibitors;

  // Get unique industries for filter
  const uniqueIndustries = Array.from(new Set(exhibitors.map(e => e.customData?.industry).filter(Boolean)));
  const industries = ['All Industries', ...uniqueIndustries];

  // Filter and sort exhibitors by match score
  const filteredExhibitors = exhibitors
    .filter(exhibitor => {
      const matchesSearch = searchTerm === '' || 
        `${exhibitor.firstName} ${exhibitor.lastName} ${exhibitor.company} ${exhibitor.jobTitle}`
          .toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesIndustry = industryFilter === 'All Industries' || 
        exhibitor.customData?.industry === industryFilter;
      
      return matchesSearch && matchesIndustry;
    })
    .sort((a, b) => {
      // Sort by number of common interests (higher first)
      const aCommon = a.interests?.filter(interest => 
        visitorInterests.some(vi => vi.toLowerCase().includes(interest.toLowerCase()))
      ).length || 0;
      const bCommon = b.interests?.filter(interest => 
        visitorInterests.some(vi => vi.toLowerCase().includes(interest.toLowerCase()))
      ).length || 0;
      return bCommon - aCommon;
    });

  return (
    <Container maxWidth="xl" sx={{ py: 2, height: '90vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header - Sticky */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        bgcolor: '#fafbfc',
        // pt: 2,
        // pb: 2,
        zIndex: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Typography variant="h4" component="h1" fontWeight="600" sx={{ mb: 1, color: '#202124' }}>
          Recommended Exhibitors
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Hi {currentVisitor.firstName}! Discover exhibitors that match your interests ({exhibitors.length} total available)
        </Typography>
        <Box display="flex" gap={1} mt={2}>
          <Chip 
            label={`Your Interests: ${visitorInterests.join(', ')}`}
            size="small"
            sx={{ bgcolor: '#e8f0fe', color: '#1a73e8' }}
          />
        </Box>

        {/* Search and Filter Bar */}
        <Box display="flex" gap={2} mt={3} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search exhibitors by company, services, or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: '#e8eaed',
                },
                '&:hover fieldset': {
                  borderColor: '#dadce0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1a73e8',
                },
              },
            }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <Select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e8eaed',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#dadce0',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1a73e8',
                },
              }}
            >
              {industries.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Stats */}
          <Box display="flex" gap={2} alignItems="center">
            <Box display="flex" alignItems="center" gap={0.5}>
              <TrendingUp sx={{ color: '#4caf50', fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary">
                {filteredExhibitors.filter(e => {
                  const common = e.interests?.filter(interest => 
                    visitorInterests.some(vi => vi.toLowerCase().includes(interest.toLowerCase()))
                  ).length || 0;
                  return common > 0;
                }).length} Matches
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Cards List with invisible scrollbar */}
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        mt: 3,
        // Hide scrollbar for Chrome, Safari and Opera
        '&::-webkit-scrollbar': {
          width: 0,
          background: 'transparent',
        },
        // Hide scrollbar for IE, Edge and Firefox
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <Grid container spacing={3}>
          {filteredExhibitors.map((exhibitor) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={exhibitor.id}>
              <ExhibitorCard exhibitor={exhibitor} visitorInterests={visitorInterests} isClient={isClient} />
            </Grid>
          ))}
        </Grid>

        {filteredExhibitors.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No exhibitors found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filter criteria
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}

// This is the main page component for visitors viewing exhibitors
export default function VisitorExhibitorsPage() {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: '#fafbfc',
        py: 2 
      }}
    >
      <Suspense 
        fallback={
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <Grid container spacing={3}>
              {Array.from({ length: 8 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <ExhibitorCardSkeleton />
                </Grid>
              ))}
            </Grid>
          </Container>
        }
      >
        <VisitorExhibitorsView />
      </Suspense>
    </Box>
  );
} 