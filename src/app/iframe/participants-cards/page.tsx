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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { 
  Person, 
  Business, 
  Email, 
  Phone,
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
  Close,
} from '@mui/icons-material';

// This would typically fetch from your database
const getEventData = (eventId: string) => {
  // In a real app, this would fetch from your API based on eventId
  return {
    visitors: [],
    exhibitors: [],
  };
};

interface ParticipantCardProps {
  participant: {
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
}

function ParticipantCard({ participant }: ParticipantCardProps) {
  const getTypeColor = (type: string) => {
    return type === 'visitor' ? '#4285f4' : '#ff6f00';
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
      <CardContent sx={{ p: 1.5, pb: 1 }}>
        {/* Header with Avatar and Match Score */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{
                bgcolor: getTypeColor(participant.type),
                width: 36,
                height: 36,
                mr: 1,
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              {getInitials(participant.firstName, participant.lastName)}
            </Avatar>
            <Box>
              <Typography variant="body1" component="div" fontWeight="600" sx={{ mb: 0.5 }}>
                {participant.firstName} {participant.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {participant.jobTitle}
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="500" sx={{ mb: 0.5 }}>
                {participant.company}
              </Typography>
              <Chip
                label={participant.type === 'visitor' ? 'Visitor' : 'Exhibitor'}
                size="small"
                sx={{
                  bgcolor: participant.type === 'visitor' ? '#e3f2fd' : '#fff3e0',
                  color: participant.type === 'visitor' ? '#1565c0' : '#e65100',
                  fontWeight: 500,
                  textTransform: 'capitalize'
                }}
              />
            </Box>
          </Box>
          
          {participant.customData?.matchScore && (
            <Box display="flex" alignItems="center">
              <Star sx={{ color: getMatchScoreColor(participant.customData.matchScore), mr: 0.5, fontSize: 18 }} />
              <Typography variant="body2" fontWeight="600" color={getMatchScoreColor(participant.customData.matchScore)}>
                {participant.customData.matchScore}%
              </Typography>
            </Box>
          )}
        </Box>

        {/* Location and Experience */}
        <Box mb={2}>
          {participant.customData?.location && (
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {participant.customData.location}
              </Typography>
            </Box>
          )}
          
          {participant.customData?.experience && (
            <Box display="flex" alignItems="center">
              <Work sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {participant.customData.experience}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Interests */}
        {participant.interests && participant.interests.length > 0 && (
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
              Interests:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {participant.interests.slice(0, 3).map((interest, index) => (
                <Chip
                  key={index}
                  label={interest}
                  size="small"
                  sx={{ 
                    fontSize: '0.75rem',
                    bgcolor: '#f1f3f4',
                    color: '#5f6368',
                    border: 'none'
                  }}
                />
              ))}
              {participant.interests.length > 3 && (
                <Chip
                  label={`+${participant.interests.length - 3}`}
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

        {/* Looking For */}
        {participant.customData?.lookingFor && (
          <Box mb={3}>
            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
              Looking for:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {participant.customData.lookingFor.slice(0, 2).map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  size="small"
                  sx={{ 
                    fontSize: '0.75rem',
                    bgcolor: '#e8f5e8',
                    color: '#2e7d32',
                    border: 'none'
                  }}
                />
              ))}
              {participant.customData.lookingFor.length > 2 && (
                <Chip
                  label={`+${participant.customData.lookingFor.length - 2}`}
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

function ParticipantCardSkeleton() {
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

function ParticipantCards() {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All Industries');
  
  // Get data synchronously for client-side filtering
  const data: {
    visitors: ParticipantCardProps['participant'][];
    exhibitors: ParticipantCardProps['participant'][];
  } = {
    visitors: [],
    exhibitors: [],
  };
  const allParticipants = [...data.visitors, ...data.exhibitors];

  // Get unique industries for filter
  const uniqueIndustries = Array.from(new Set(allParticipants.map(p => p.customData?.industry).filter(Boolean)));
  const industries = ['All Industries', ...uniqueIndustries];

  // Filter participants based on search and industry
  const filteredParticipants = allParticipants.filter(participant => {
    const matchesSearch = searchTerm === '' || 
      `${participant.firstName} ${participant.lastName} ${participant.company} ${participant.jobTitle}`
        .toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = industryFilter === 'All Industries' || 
      participant.customData?.industry === industryFilter;
    
    return matchesSearch && matchesIndustry;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="600" sx={{ mb: 1, color: '#202124' }}>
          All Event Participants
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect with {allParticipants.length} total participants ({filteredParticipants.length} shown)
        </Typography>
      </Box>

      {/* Search and Filter Bar */}
      <Box display="flex" gap={2} mb={4} alignItems="center">
        <TextField
          fullWidth
          placeholder="Search participants by name, company, or interests..."
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

        {/* View Toggle Buttons */}
        <Box display="flex" gap={1}>
          <IconButton 
            sx={{ 
              bgcolor: '#1a73e8', 
              color: 'white',
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.3} sx={{ width: 12, height: 12 }}>
              <Box sx={{ bgcolor: 'currentColor', borderRadius: 0.3 }} />
              <Box sx={{ bgcolor: 'currentColor', borderRadius: 0.3 }} />
              <Box sx={{ bgcolor: 'currentColor', borderRadius: 0.3 }} />
              <Box sx={{ bgcolor: 'currentColor', borderRadius: 0.3 }} />
            </Box>
          </IconButton>
          <IconButton sx={{ color: 'text.secondary' }}>
            <Box display="flex" flexDirection="column" gap={0.3} sx={{ width: 12, height: 12 }}>
              <Box sx={{ bgcolor: 'currentColor', height: 2, borderRadius: 0.3 }} />
              <Box sx={{ bgcolor: 'currentColor', height: 2, borderRadius: 0.3 }} />
              <Box sx={{ bgcolor: 'currentColor', height: 2, borderRadius: 0.3 }} />
            </Box>
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={1.5}>
        {filteredParticipants.map((participant) => (
          <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={participant.id}>
            <ParticipantCard participant={participant} />
          </Grid>
        ))}
      </Grid>

      {filteredParticipants.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No participants found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}
    </Container>
  );
}

// This is the main page component that will be server-side rendered
export default function ParticipantCardsPage() {
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
            <Grid container spacing={1.5}>
              {Array.from({ length: 8 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={index}>
                  <ParticipantCardSkeleton />
                </Grid>
              ))}
            </Grid>
          </Container>
        }
      >
        <ParticipantCards />
      </Suspense>
    </Box>
  );
}