'use client';

import { Suspense, useState } from 'react';
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
  FiberManualRecord as InterestPoint
} from '@mui/icons-material';

import { mockVisitors, mockExhibitors } from '@/lib/mockData';

interface VisitorCardProps {
  visitor: {
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
    };
  };
  exhibitorCompany: string;
  exhibitorServices: string[];
}

function VisitorCard({ visitor, exhibitorCompany, exhibitorServices }: VisitorCardProps) {
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

  let matchScore = 60; // Base score
  matchScore += relevantInterests.length * 8;
  matchScore += relevantLookingFor.length * 12;
  if (companyInterest) matchScore += 15;
  matchScore = Math.min(98, matchScore + Math.floor(Math.random() * 10));

  const totalRelevantItems = relevantInterests.length + relevantLookingFor.length;

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
        {/* Header with Visitor Info and Match Score */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{
                bgcolor: '#4285f4',
                width: 52,
                height: 52,
                mr: 2,
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              {getInitials(visitor.firstName, visitor.lastName)}
            </Avatar>
            <Box>
              <Typography variant="h6" component="div" fontWeight="600" sx={{ mb: 0.5 }}>
                {visitor.firstName} {visitor.lastName}
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
        <Box mb={2}>
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
          <Box mb={2}>
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
          <Box mb={3}>
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
        <Box mb={2}>
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

function ExhibitorVisitorsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('All Experience');

  // Get a sample exhibitor (you can make this dynamic based on URL params or login)
  const currentExhibitor = mockExhibitors[0]; // Sample: AI Technologies Inc
  const exhibitorCompany = currentExhibitor.company || '';
  const exhibitorServices = currentExhibitor.customData?.products || [];

  const visitors = mockVisitors;

  // Get unique experience levels for filter
  const uniqueExperiences = Array.from(new Set(visitors.map(v => v.customData?.experience).filter(Boolean)));
  const experienceLevels = ['All Experience', ...uniqueExperiences];

  // Filter and sort visitors by relevance to exhibitor
  const filteredVisitors = visitors
    .filter(visitor => {
      const matchesSearch = searchTerm === '' ||
        `${visitor.firstName} ${visitor.lastName} ${visitor.company} ${visitor.jobTitle}`
          .toLowerCase().includes(searchTerm.toLowerCase());

      const matchesExperience = experienceFilter === 'All Experience' ||
        visitor.customData?.experience === experienceFilter;

      return matchesSearch && matchesExperience;
    })
    .sort((a, b) => {
      // Sort by relevance to exhibitor (more relevant interests first)
      const aRelevant = (a.interests?.filter(interest =>
        exhibitorServices.some(service => service.toLowerCase().includes(interest.toLowerCase()))
      ).length || 0) + (a.customData?.lookingFor?.filter(lookingFor =>
        exhibitorServices.some(service => service.toLowerCase().includes(lookingFor.toLowerCase()))
      ).length || 0);

      const bRelevant = (b.interests?.filter(interest =>
        exhibitorServices.some(service => service.toLowerCase().includes(interest.toLowerCase()))
      ).length || 0) + (b.customData?.lookingFor?.filter(lookingFor =>
        exhibitorServices.some(service => service.toLowerCase().includes(lookingFor.toLowerCase()))
      ).length || 0);

      return bRelevant - aRelevant;
    });

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="600" sx={{ mb: 1, color: '#202124' }}>
          Interested Visitors
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {exhibitorCompany}: Discover visitors interested in your services ({visitors.length} total available)
        </Typography>
        <Box display="flex" gap={1} mt={2} flexWrap="wrap">
          {exhibitorServices.slice(0, 4).map((service, index) => (
            <Chip
              key={index}
              label={service}
              size="small"
              sx={{ bgcolor: '#fff3e0', color: '#e65100' }}
            />
          ))}
          {exhibitorServices.length > 4 && (
            <Chip
              label={`+${exhibitorServices.length - 4} more services`}
              size="small"
              sx={{ bgcolor: '#f5f5f5', color: '#757575' }}
            />
          )}
        </Box>
      </Box>

      {/* Search and Filter Bar */}
      <Box display="flex" gap={2} mb={4} alignItems="center">
        <TextField
          fullWidth
          placeholder="Search visitors by name, company, or interests..."
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
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
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
            {experienceLevels.map((experience) => (
              <MenuItem key={experience} value={experience}>
                {experience}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Stats */}
        <Box display="flex" gap={2} alignItems="center">
          <Box display="flex" alignItems="center" gap={0.5}>
            <Groups sx={{ color: '#4caf50', fontSize: 18 }} />
            <Typography variant="body2" color="text.secondary">
              {filteredVisitors.filter(v => {
                const relevant = (v.interests?.filter(interest =>
                  exhibitorServices.some(service => service.toLowerCase().includes(interest.toLowerCase()))
                ).length || 0) + (v.customData?.lookingFor?.filter(lookingFor =>
                  exhibitorServices.some(service => service.toLowerCase().includes(lookingFor.toLowerCase()))
                ).length || 0);
                return relevant > 0;
              }).length} Interested
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredVisitors.map((visitor) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={visitor.id}>
            <VisitorCard
              visitor={visitor}
              exhibitorCompany={exhibitorCompany}
              exhibitorServices={exhibitorServices}
            />
          </Grid>
        ))}
      </Grid>

      {filteredVisitors.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No visitors found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}
    </Container>
  );
}

// This is the main page component for exhibitors viewing interested visitors
export default function ExhibitorVisitorsPage() {
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
            <h1>Loading...</h1>
          </Container>
        }
      >
        <ExhibitorVisitorsView />
      </Suspense>
    </Box>
  );
} 