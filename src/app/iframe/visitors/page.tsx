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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent
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
import Link from 'next/link';

import { apiService } from '@/services/apiService';
import { fieldMappingApi, type FavoritesRequest } from '@/services/fieldMappingApi';
import { ApiVisitorData, TransformedVisitor, VisitorsApiResponse } from '@/types';
// REMOVE: import { SimpleThemeProvider, useSimpleTheme } from '@/context/SimpleThemeContext';
import { getCurrentExhibitorId, decodeJWTToken, isEventAdmin } from '@/utils/authUtils';
import { AnimatePresence, motion } from 'framer-motion';
import ThemeWrapper from '@/components/providers/ThemeWrapper';
import { FavoritesManager } from '@/utils/favoritesManager';

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

function VisitorCard({ visitor, exhibitorCompany, exhibitorServices, isClient, identifier, initialFavoriteState = false, onFavoriteChange, onNameClick }: VisitorCardProps & { onNameClick?: (visitor: TransformedVisitor) => void }) {
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
      // Use FavoritesManager to toggle favorite status
      const finalStatus = await FavoritesManager.toggleVisitorFavorite(identifier, visitor.id, isFavorite);
      
      // Update UI with the final status from API
      setIsFavorite(finalStatus);
      
      // Notify parent component about the change
      if (onFavoriteChange) {
        onFavoriteChange(visitor.id, finalStatus);
      }
      
      if (finalStatus !== newFavoriteState) {
        console.log('⚠️ API returned different status than expected, UI updated to match API');
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
      <CardContent sx={{ p: 1, pb: 0.5, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        {/* Header with Visitor Info and Match Score */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1} sx={{ minHeight: '60px' }}>
          
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
              {getInitials(visitor.firstName, visitor.lastName)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0, mt: 2 }}>
              <Typography variant="body2" component="div" fontWeight="600" sx={{ ml: 0, minHeight: '1.2rem', display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.2, wordBreak: 'break-word' }}>

                <Box sx={{ wordBreak: 'break-word', lineHeight: 1.2 }}>
                  <span
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={() => onNameClick && onNameClick(visitor)}
                    onMouseOver={e => {
                      (e.currentTarget as HTMLElement).style.textDecoration = 'underline';
                      (e.currentTarget as HTMLElement).style.color = '#1976d2';
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLElement).style.textDecoration = 'none';
                      (e.currentTarget as HTMLElement).style.color = 'inherit';
                    }}
                  >
                    {visitor.customData?.salutation} {visitor.firstName} {visitor.customData?.middleName} {visitor.lastName}
                  </span>
                </Box>
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, wordBreak: 'break-word', lineHeight: 1.3 }}>
                {visitor.jobTitle}
              </Typography>


            </Box>
          

          {/* Only show heart icon if user is NOT an event-admin */}
          {!isEventAdmin() && (
            <IconButton
              onClick={(e) => {
                console.log('🎯 IconButton clicked!');
                handleFavoriteClick(e);
              }}
              disabled={isLoadingFavorite || isCheckingInitialState}
              size="large"
              sx={{
                position: 'absolute',
                top: 0,
                right: 8,
                p: 0.5,
                mr: 0.5,
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
              {(isLoadingFavorite || isCheckingInitialState) ? (
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
                <FavoriteBorder
                  sx={{
                    fontSize: 20,
                    color: '#b0bec5',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: '#ff6b9d',
                    }
                  }}
                />
              )}
            </IconButton>
          )}
          
        </Box>

        {/* Content Section - Takes up available space */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" alignItems="center" mb={1}>
            <LocationOn sx={{ fontSize: 15, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ wordBreak: 'break-word', lineHeight: 1.3}}>
              {visitor.company}
            </Typography>
          </Box>
          {/* Location and Experience */}
          <Box >
            {visitor.customData?.location && (
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
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
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: -1, mb: -1 }}>
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
                  color: 'hsla(0, 0.00%, 2.00%, 0.57)',
                  '&:hover': {
                    backgroundColor: 'rgba(26, 24, 24, 0.1)',
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

// Add VisitorDetailsDialog component
function VisitorDetailsDialog({ open, onClose, visitor }: { open: boolean; onClose: () => void; visitor: TransformedVisitor | null }) {
  if (!visitor) return null;
  const getInitials = (firstName: string, lastName: string) => `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
    PaperProps={{ sx: { borderRadius: 3 } }} >
      <DialogTitle>Visitor Details</DialogTitle>
      <DialogContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ width: 50, height: 50, fontSize: '1.5rem', fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
            {getInitials(visitor.firstName, visitor.lastName)}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{visitor.firstName} {visitor.lastName}</Typography>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{visitor.jobTitle}</Typography>
            <Typography variant="body2" color="text.secondary">{visitor.company}</Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={700}>Email:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.email}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Phone:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.phone || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Country:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.country || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Status:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.status}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Registration Date:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.registrationDate?.toLocaleString?.() || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={700}>Salutation:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.salutation || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Middle Name:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.middleName || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Gender:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.gender || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Date of Birth:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.dateOfBirth || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Nationality:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.nationality || '-'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700}>LinkedIn:</Typography>
            <Typography variant="body2" gutterBottom>
              {visitor.customData?.linkedInProfile ? (
                <a href={visitor.customData.linkedInProfile} target="_blank" rel="noopener noreferrer">{visitor.customData.linkedInProfile}</a>
              ) : '-'}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>Instagram:</Typography>
            <Typography variant="body2" gutterBottom>
              {visitor.customData?.instagramProfile ? (
                <a href={visitor.customData.instagramProfile} target="_blank" rel="noopener noreferrer">{visitor.customData.instagramProfile}</a>
              ) : '-'}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>GitHub:</Typography>
            <Typography variant="body2" gutterBottom>
              {visitor.customData?.gitHubProfile ? (
                <a href={visitor.customData.gitHubProfile} target="_blank" rel="noopener noreferrer">{visitor.customData.gitHubProfile}</a>
              ) : '-'}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>Twitter:</Typography>
            <Typography variant="body2" gutterBottom>
              {visitor.customData?.twitterProfile ? (
                <a href={visitor.customData.twitterProfile} target="_blank" rel="noopener noreferrer">{visitor.customData.twitterProfile}</a>
              ) : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700}>Address:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.addressLine1 || '-'} {visitor.customData?.addressLine2 || ''}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>City:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.cityName || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>State:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.stateName || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Postal Code:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.postalCode || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Location:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.location || '-'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700}>Experience:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.experience || '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Decision Maker:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.decisionmaker ? 'Yes' : 'No'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Interests:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.interests && visitor.interests.length > 0 ? visitor.interests.join(', ') : '-'}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>Looking For:</Typography>
            <Typography variant="body2" gutterBottom>{visitor.customData?.lookingFor && visitor.customData.lookingFor.length > 0 ? visitor.customData.lookingFor.join(', ') : '-'}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

function VisitorListView({ identifier }: { identifier: string }) {
  const theme = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');
  const [visitors, setVisitors] = useState<TransformedVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteVisitors, setFavoriteVisitors] = useState<Set<string>>(new Set());
  const [selectedVisitor, setSelectedVisitor] = useState<TransformedVisitor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchVisitors(identifier);

    // Listen for theme changes from localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        // setSimpleTheme(e.newValue); // REMOVED
      }
      if (e.key === 'fontFamily' && e.newValue) {
        // setSimpleFontFamily(e.newValue); // REMOVED
      }
    };

    // Listen for theme changes from parent window (if iframe is embedded)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'THEME_CHANGE' && event.data.theme) {
        // setSimpleTheme(event.data.theme); // REMOVED
      }
      if (event.data.type === 'FONT_CHANGE' && event.data.fontFamily) {
        // setSimpleFontFamily(event.data.fontFamily); // REMOVED
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
    };
  }, [identifier]); // REMOVED setSimpleTheme, setSimpleFontFamily

  const loadFavorites = async (eventIdentifier: string) => {
    if (!eventIdentifier) return;

    try {
      console.log('🔍 Loading visitor favorites for exhibitor');
      
      // Use FavoritesManager to load favorites
      const favoriteVisitors = await FavoritesManager.getExhibitorFavoriteVisitors(eventIdentifier);
      
      const favoriteVisitorIds = favoriteVisitors.map((favorite: any) => favorite.visitorId.toString());
      setFavoriteVisitors(new Set(favoriteVisitorIds));
      console.log('✅ Loaded visitor favorites from API:', favoriteVisitorIds);

    } catch (error) {
      console.error('Error loading visitor favorites:', error);
      setFavoriteVisitors(new Set());
    }
  };

  const fetchVisitors = async (eventIdentifier: string) => {
    try {
      setLoading(true);
      setError(null);

      // Extract identifier from URL path only - no static fallbacks
      // let eventIdentifier: string | null = null; // REMOVED

      // Method 1: Extract from URL path (e.g., /STYLE2025/iframe/visitors)
      // const pathParts = window.location.pathname.split('/').filter(Boolean); // REMOVED
      // console.log('URL path parts:', pathParts); // REMOVED

      // Look for identifier in URL path - it should be the first segment
      // if (pathParts.length > 0 && pathParts[0] !== 'iframe') { // REMOVED
      //   eventIdentifier = pathParts[0]; // REMOVED
      //   console.log('Found identifier in URL path:', eventIdentifier); // REMOVED
      // } else { // REMOVED
        // Method 2: Try to get from parent window if iframe is embedded
        // try { // REMOVED
        //   if (window.parent && window.parent !== window) { // REMOVED
        //     const parentUrl = window.parent.location.pathname; // REMOVED
        //     const parentParts = parentUrl.split('/').filter(Boolean); // REMOVED
        //     if (parentParts.length > 0) { // REMOVED
        //       eventIdentifier = parentParts[0]; // REMOVED
        //       console.log('Found identifier from parent window:', eventIdentifier); // REMOVED
        //     } // REMOVED
        //   } // REMOVED
        // } catch (e) { // REMOVED
        //   console.log('Cannot access parent window URL (cross-origin)'); // REMOVED
        // } // REMOVED
        
        // Method 3: Try to get from URL search parameters
        // if (!eventIdentifier) { // REMOVED
        //   const urlParams = new URLSearchParams(window.location.search); // REMOVED
        //   eventIdentifier = urlParams.get('eventId') || urlParams.get('identifier'); // REMOVED
        //   if (eventIdentifier) { // REMOVED
        //     console.log('Found identifier in URL parameters:', eventIdentifier); // REMOVED
        //   } // REMOVED
        // } // REMOVED
        
        // Method 4: Try to get from localStorage (if set by parent)
        // if (!eventIdentifier) { // REMOVED
        //   eventIdentifier = localStorage.getItem('currentEventIdentifier'); // REMOVED
        //   if (eventIdentifier) { // REMOVED
        //     console.log('Found identifier in localStorage:', eventIdentifier); // REMOVED
        //   } // REMOVED
        // } // REMOVED
        
        // Method 5: Try to get from sessionStorage (if set by parent)
        // if (!eventIdentifier) { // REMOVED
        //   eventIdentifier = sessionStorage.getItem('currentEventIdentifier'); // REMOVED
        //   if (eventIdentifier) { // REMOVED
        //     console.log('Found identifier in sessionStorage:', eventIdentifier); // REMOVED
        //   } // REMOVED
        // } // REMOVED
      // } // REMOVED

      // If no identifier found, throw error
      // if (!eventIdentifier) { // REMOVED
      //   console.error('❌ No event identifier found. Available sources:', { // REMOVED
      //     pathParts, // REMOVED
      //     parentUrl: window.parent !== window ? window.parent.location.pathname : 'N/A', // REMOVED
      //     urlParams: window.location.search, // REMOVED
      //     localStorage: localStorage.getItem('currentEventIdentifier'), // REMOVED
      //     sessionStorage: sessionStorage.getItem('currentEventIdentifier') // REMOVED
      //   }); // REMOVED
      //   throw new Error('No event identifier found in URL. Please access this page through a valid event URL (e.g., /STYLE2025/iframe/visitors) or ensure the parent page sets the event identifier.'); // REMOVED
      // } // REMOVED

      // Set the identifier state
      // setIdentifier(eventIdentifier); // REMOVED

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
              Visitors Directory
            </Typography>

          </Box>

          {/* Filters on the right */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Status Filter */}
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

            {/* Experience Filter */}
            {experiences.length > 0 && (
              <FormControl sx={{ minWidth: 150 }}>
                <Select
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
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
                  <MenuItem value="all" sx={{ minHeight: '32px', fontSize: '0.92rem', py: '4px' }}>All Experience</MenuItem>
                  {experiences.map((experience) => (
                    <MenuItem key={experience} value={experience} sx={{ minHeight: '32px', fontSize: '0.92rem', py: '4px' }}>
                      {experience}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchVisitors(identifier)}>
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
        <Grid container spacing={1.5}>
          {filteredVisitors.map((visitor) => (
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={visitor.id}>
              <Suspense fallback={<VisitorCardSkeleton />}>
                <VisitorCard
                  visitor={visitor}
                  exhibitorCompany={sampleExhibitorCompany}
                  exhibitorServices={sampleExhibitorServices}
                  isClient={isClient}
                  identifier={identifier}
                  initialFavoriteState={favoriteVisitors.has(visitor.id)}
                  onFavoriteChange={handleFavoriteChange}
                  onNameClick={(v) => { setSelectedVisitor(v); setDialogOpen(true); }}
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

      {/* Visitor Details Dialog */}
      <VisitorDetailsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} visitor={selectedVisitor} />
    </Container>
  );
}

export default function VisitorListPage() {
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
        <VisitorListView identifier={identifier || ''} />
      </Box>
    </ThemeWrapper>
  );
} 