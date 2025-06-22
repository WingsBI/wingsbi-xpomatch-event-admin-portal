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
  GetApp
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
      boothNumber?: string;
      boothSize?: string;
      website?: string;
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
        bgcolor: 'background.paper',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 1.5, pb: 1}}>
        {/* Header with Company Info and Match Score */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{
                bgcolor: '#ff6f00',
                width: 52,
                height: 52,
                mr: 1,
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
                {exhibitor.customData?.boothNumber && (
                  <Chip
                    label={`Booth ${exhibitor.customData.boothNumber}`}
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

        {/* Products/Services Offered */}
        {exhibitor.customData?.products && exhibitor.customData.products.length > 0 && (
          <Box mb={1}>
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

        {/* Company Description */}
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

        {/* Common Interests */}
        {commonInterests.length > 0 && (
          <Box mb={1}>
            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
              Common Interests:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {commonInterests.slice(0, 3).map((interest, index) => (
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

        {/* Action Buttons */}
        <Box display="flex" gap={1} mt={2}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ConnectIcon />}
            sx={{ 
              flex: 1,
              borderColor: '#4285f4',
              color: '#4285f4',
              '&:hover': {
                borderColor: '#1976d2',
                backgroundColor: '#f5f9ff'
              }
            }}
          >
            Connect
          </Button>
          <IconButton size="small" sx={{ color: '#4285f4' }}>
            <LinkedIn />
          </IconButton>
          {exhibitor.customData?.website && (
            <IconButton size="small" sx={{ color: '#4285f4' }}>
              <Language />
            </IconButton>
          )}
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
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [exhibitors, setExhibitors] = useState(mockExhibitors);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get unique industries for filter
  const industries = Array.from(new Set(
    mockExhibitors
      .map(exhibitor => exhibitor.customData?.industry)
      .filter(Boolean)
  ));

  // Filter exhibitors based on search and filters
  const filteredExhibitors = exhibitors.filter(exhibitor => {
    const matchesSearch = 
      exhibitor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibitor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exhibitor.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || exhibitor.status === filterStatus;
    const matchesIndustry = filterIndustry === 'all' || exhibitor.customData?.industry === filterIndustry;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  // Sample visitor interests for match calculation
  const sampleVisitorInterests = ['AI/ML', 'Web Development', 'Cloud Computing', 'Product Strategy'];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" fontWeight="600" sx={{ mb: 1 }}>
          Exhibitors Directory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and connect with exhibitors showcasing innovative solutions
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
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

      {/* Results Count */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredExhibitors.length} of {exhibitors.length} exhibitors
        </Typography>
      </Box>

      {/* Exhibitors Grid */}
      <Grid container spacing={3}>
        {filteredExhibitors.map((exhibitor) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={exhibitor.id}>
            <Suspense fallback={<ExhibitorCardSkeleton />}>
              <ExhibitorCard
                exhibitor={exhibitor}
                visitorInterests={sampleVisitorInterests}
                isClient={isClient}
              />
            </Suspense>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredExhibitors.length === 0 && (
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <ExhibitorListView />
    </Box>
  );
} 