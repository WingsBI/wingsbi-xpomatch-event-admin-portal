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
  TrendingUp,
  GetApp,
  Person
} from '@mui/icons-material';

import { apiService } from '@/services/apiService';
import { ApiVisitorData, TransformedVisitor, VisitorsApiResponse } from '@/types';

interface VisitorCardProps {
  visitor: TransformedVisitor;
  exhibitorCompany: string;
  exhibitorServices: string[];
  isClient: boolean;
}

// Transform API visitor data to UI format
const transformVisitorData = (apiVisitor: ApiVisitorData): TransformedVisitor => {
  return {
    id: apiVisitor.id.toString(),
    firstName: apiVisitor.firstName,
    lastName: apiVisitor.lastName,
    email: apiVisitor.email,
    company: 'Unknown Company', // Default since API doesn't provide company
    jobTitle: 'Professional', // Default since API doesn't provide job title
    country: 'Unknown', // Default since API doesn't provide country
    status: apiVisitor.userStatusId === 1 ? 'registered' : 'invited',
    interests: [], // Default empty array since API doesn't provide interests
    type: 'visitor',
    customData: {
      salutation: apiVisitor.salutation,
      middleName: apiVisitor.mIddleName,
      location: 'Unknown Location',
      experience: '1-3 years', // Default experience
      matchScore: 0,
      industry: 'Technology',
      lookingFor: ['Networking', 'Business Solutions'],
    },
  };
};

function VisitorCard({ visitor, exhibitorCompany, exhibitorServices, isClient }: VisitorCardProps) {
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
      <CardContent sx={{ p: 1.5, pb: 1 }}>
        {/* Header with Visitor Info and Match Score */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{
                bgcolor: '#4285f4',
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
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Chip
                  label="Visitor"
                  size="small"
                  sx={{
                    bgcolor: '#e3f2fd',
                    color: '#1565c0',
                    fontWeight: 500
                  }}
                />
               
              </Box>
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
            <Star sx={{ color: getMatchScoreColor(matchScore), mr: 0.5, fontSize: 18 }} />
            <Typography variant="body2" fontWeight="600" color={getMatchScoreColor(matchScore)}>
              {matchScore}%
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

          {visitor.customData?.experience && (
            <Box display="flex" alignItems="center">
              <Work sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {visitor.customData.experience}
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

        {/* Show interest level */}
        <Box mb={1}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 12 }} />
            Interest Level: {matchScore >= 90 ? 'Very High' : matchScore >= 80 ? 'High' : matchScore >= 70 ? 'Medium' : 'Low'}
          </Typography>
        </Box>

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
  }, []);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get identifier from URL path (e.g., /iframe/visitors would be accessed via /AIFF2026/iframe/visitors)
      const pathParts = window.location.pathname.split('/');
      const identifier = pathParts.find(part => part.startsWith('AIFF')) || 'AIFF2026';
      console.log('Using identifier:', identifier);
      const response = await apiService.getAllVisitors(identifier, true);
      
      if (response.success && response.data?.result) {
        const transformedVisitors = response.data.result.map(transformVisitorData);
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

  // Sample exhibitor data for match calculation
  const sampleExhibitorCompany = "AI Technologies Inc";
  const sampleExhibitorServices = ["AI Chatbots", "ML Analytics", "Computer Vision"];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" fontWeight="600" sx={{ mb: 1 }}>
          Visitors Directory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and connect with visitors interested in your solutions
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                sx={{ 
                  bgcolor: '#4285f4',
                  '&:hover': { bgcolor: '#1976d2' }
                }}
              >
                View Analytics
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                sx={{ 
                  borderColor: '#4285f4',
                  color: '#4285f4',
                  '&:hover': { 
                    borderColor: '#1976d2',
                    backgroundColor: '#f5f9ff'
                  }
                }}
              >
                Export
              </Button>
            </Box>
          </Grid>
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <VisitorListView />
    </Box>
  );
} 