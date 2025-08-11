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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText
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
  FavoriteBorder,
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';

import { fieldMappingApi, type Exhibitor, type FavoritesRequest, type GetFavoritesResponse } from '@/services/fieldMappingApi';
import ThemeWrapper from '@/components/providers/ThemeWrapper';
import ExhibitorsMatchingPage from '@/app/[identifier]/event-admin/exhibitors/matching/page';
import { getCurrentUserId, getCurrentExhibitorId, isEventAdmin } from '@/utils/authUtils';
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
      companyLogoPath?: string;
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
  const profile = (Array.isArray(apiExhibitor.exhibitorProfile) ? apiExhibitor.exhibitorProfile[0] : {}) as any;
  const address = (Array.isArray(apiExhibitor.exhibitorAddress) ? apiExhibitor.exhibitorAddress[0] : {}) as any;
  const userMap = (Array.isArray(apiExhibitor.exhibitorToUserMaps) ? apiExhibitor.exhibitorToUserMaps[0] : {}) as any;
  const customFields = (Array.isArray((apiExhibitor as any).exhibitorCustomField) ? (apiExhibitor as any).exhibitorCustomField : []) as any[];

  // Helper to get custom field by name
  const getCustomField = (name: string) => {
    const found = customFields.find((f: any) => f.fieldName?.toLowerCase() === name.toLowerCase());
    return found?.fieldValue || '';
  };

  return {
    id: apiExhibitor.id?.toString() || '',
    firstName: userMap.firstName || '',
    lastName: userMap.lastName || '',
    email: userMap.email || '',
    businessEmail: userMap.businessEmail || getCustomField('contactemail2') || '',
    company: apiExhibitor.companyName || '',
    jobTitle: userMap.jobTitle || '',
    phone: apiExhibitor.telephone || apiExhibitor.mobileNumber || '',
    phoneNumber: apiExhibitor.mobileNumber || '',
    country: apiExhibitor.country || address.countryName || address.stateProvince || '',
    status: apiExhibitor.isActive ? 'Active' : 'Inactive',
    interests: userMap.interest ? [userMap.interest] : [],
    technology: apiExhibitor.technology || '',
    type: 'exhibitor',
    eventId: identifier,
    registrationDate: apiExhibitor.createdDate ? new Date(apiExhibitor.createdDate) : null,
    customData: {
      location: address.city || '',
      avatar: apiExhibitor.companyName?.charAt(0).toUpperCase() || '',
      industry: apiExhibitor.industry || '',
      companyDescription: profile.companyProfile || '',
      boothNumber: apiExhibitor.stand || '',
      boothSize: '', // Not present in API
      website: apiExhibitor.webSite || getCustomField('officialwebsite') || '',
      companyType: apiExhibitor.companyType || '',
      companyLogoPath: apiExhibitor.companyLogoPath || null,
      linkedIn: profile.linkedInLink || userMap.linkedInProfile || '',
      twitter: profile.twitterLink || userMap.twitterProfile || '',
      instagram: profile.instagramLink || userMap.instagramProfile || '',
      youtube: profile.youTubeLink || '',
      // Add more as needed
    },
    product: Array.isArray(apiExhibitor.product) ? apiExhibitor.product : [],
    brand: Array.isArray(apiExhibitor.brand) ? apiExhibitor.brand : [],
    // Add other fields as needed
  };
};

function ExhibitorCard({ exhibitor, visitorInterests, isClient, identifier, isFavorite, onFavoriteToggle, onNameClick }: ExhibitorCardProps & { onNameClick?: (exhibitorId: string) => void }) {
  const theme = useTheme();
  const router = useRouter();
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  // Debug heart icon rendering (only log changes, not every render)
  useEffect(() => {
    if (isFavorite) {
      console.log('💖 ExhibitorCard favorite status changed - Exhibitor:', exhibitor.company, 'ID:', exhibitor.id, 'isFavorite:', isFavorite);
    }
  }, [isFavorite, exhibitor.id, exhibitor.company]);

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
    if (onNameClick) {
      onNameClick(exhibitor.id);
    }
    // If you want to keep the router navigation, you can keep it here,
    // or move it to the parent if navigation should happen after fetching data.
    // router.push(`/${identifier}/event-admin/exhibitors/details?exhibitorId=${exhibitor.id}`);
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
      // Check if current user is an exhibitor
      const currentExhibitorId = getCurrentExhibitorId();
      let finalStatus: boolean;
      
      console.log('🔍 Current status before API call:', isFavorite);
      console.log('🔍 Expected status after API call:', !isFavorite);
      
      if (currentExhibitorId) {
        // User is an exhibitor - use exhibitor-to-exhibitor favorite method
        console.log('🏢 User is exhibitor, using exhibitor-to-exhibitor favorite API');
        finalStatus = await FavoritesManager.toggleExhibitorToExhibitorFavorite(identifier, exhibitor.id, isFavorite);
      } else {
        // User is a visitor - use visitor-to-exhibitor favorite method
        console.log('👤 User is visitor, using visitor-to-exhibitor favorite API');
        finalStatus = await FavoritesManager.toggleExhibitorFavorite(identifier, exhibitor.id, isFavorite);
      }
      
      console.log('🔍 Final status returned from API:', finalStatus);
      console.log('🔍 UI will be updated to:', finalStatus);
      
      // Update UI with the final status from API
      onFavoriteToggle(exhibitor.id, finalStatus);
      
      if (finalStatus !== newFavoriteState) {
        console.log('⚠️ API returned different status than expected');
        console.log('⚠️ Expected:', newFavoriteState, 'Got:', finalStatus);
      } else {
        console.log('✅ API returned expected status:', finalStatus);
      }
      
      // For exhibitor users, reload favorites to ensure we have the latest state
      if (getCurrentExhibitorId()) {
        console.log('🔄 Will reload favorites after successful toggle to ensure sync');
        // Note: For now, the immediate UI update should be sufficient
        // If persistence issues continue, we can add a page-level reload mechanism
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
            src={exhibitor.customData?.companyLogoPath || undefined}
            sx={{
              bgcolor: 'success.main',
              width: 36,
              height: 36,
              mr: 1.5,
              fontSize: '0.9rem',
              fontWeight: 'bold',
              flexShrink: 0,
              color: 'white',
              alignSelf: 'start',
              mt: 2,
            }}
          >
            {!exhibitor.customData?.companyLogoPath && (exhibitor.company ? exhibitor.company.charAt(0).toUpperCase() : getInitials(exhibitor.firstName, exhibitor.lastName))}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0, mt: 2 }}>
            <Typography 
              variant="body2" 
              component="div" 
              fontWeight="600" 
             // onClick={handleExhibitorNameClick}
              sx={{ 
                ml: 0, 
                minHeight: '1.2rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                lineHeight: 1.2, 
                wordBreak: 'break-word',
                // cursor: 'pointer',
                // color: 'primary.main',
                // textDecoration: 'underline',
                // textDecorationColor: 'transparent',
                // transition: 'all 0.2s ease',
                // '&:hover': {
                //   color: 'primary.dark',
                //   textDecorationColor: 'currentColor',
                //   transform: 'translateY(-1px)'
                // }
              }}
            >
              {exhibitor.company}
            </Typography>
            {/* {exhibitor.jobTitle && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0, wordBreak: 'break-word', lineHeight: 1.3 }}>
                {exhibitor.jobTitle}
              </Typography>
            )} */}
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
            {isLoadingFavorite ? (
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
            <Box mb={0.5}>
              {exhibitor.customData?.location && (
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    {exhibitor.customData.location}
                  </Typography>
                </Box>
              )}
              
              {/* {exhibitor.customData?.industry && (
                <Box display="flex" alignItems="center">
                  <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {exhibitor.customData.industry}
                  </Typography>
                </Box>
              )} */}
            </Box>
          )}

          {/* Products/Services Offered - only show if data exists */}
          {/* {exhibitor.customData?.products && exhibitor.customData.products.length > 0 && (
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
          )} */}

          {/* Company Description - only show if data exists */}
          {/* {exhibitor.customData?.companyDescription && (
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
          )} */}

          {/* Common Interests - only show if data exists */}
          {/* {commonInterests.length > 0 && (
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
          )} */}
        </Box>

        <Divider sx={{ mb: 1 }} />  

        {/* Action Buttons */}
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 'auto' , mb:-2}}>
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
              px: 1,
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

// Helper: SectionTitle
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2, mb: 1, color: 'primary.main', letterSpacing: 0.5 }}>
    {children}
  </Typography>
);

// Helper: Field
const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box display="flex" alignItems="center" mb={0.5}>
    <Typography variant="subtitle2" fontWeight={700} sx={{ minWidth: 120 }}>{label}:</Typography>
    <Typography variant="body2" gutterBottom sx={{ ml: 1 }}>{value ?? <span style={{ color: '#aaa' }}>Not Provided</span>}</Typography>
  </Box>
);

// Helper: urlWithProtocol
const urlWithProtocol = (url: string) => {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};

// Add ExhibitorDetailsDialog component
function ExhibitorDetailsDialog({ open, onClose, exhibitor, loading }: { open: boolean; onClose: () => void; exhibitor: any; loading: boolean }) {
  if (!exhibitor) return null;
  const getInitials = (firstName: string, lastName: string, company: string) => company?.charAt(0).toUpperCase() || `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  const isMobile = useMediaQuery('(max-width:600px)');
  return (
    <Dialog open={open} onClose={(event, reason) => { if (reason === 'backdropClick') return; onClose(); }} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 , width: '100%' , height: isMobile ? '100%' : '100%' } }}
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2, pl: isMobile ? 1 : 2, py: isMobile ? 1 : 2, fontSize: isMobile ? '1.1rem' : undefined }}>
        Exhibitor Details
        <IconButton aria-label="close" onClick={onClose} sx={{ ml: 2, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.15)' } }}>
          <CloseIcon sx={{ transition: 'transform 0.4s', '&:hover': { transform: 'rotate(180deg)' } }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: isMobile ? 1 : 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress size={48} />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading Exhibitor Details...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Header */}
            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={2} mb={2}>
              <Avatar sx={{ width: isMobile ? 40 : 50, height: isMobile ? 40 : 50, fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: 'bold', bgcolor: 'primary.main', color: 'white', mb: isMobile ? 1 : 0 }}>
                {getInitials(exhibitor.firstName, exhibitor.lastName, exhibitor.company)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} fontSize={isMobile ? '1rem' : undefined}>{exhibitor.company}</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" fontSize={isMobile ? '0.95rem' : undefined}>{exhibitor.jobTitle}</Typography>
                <Typography variant="body2" color="text.secondary" fontSize={isMobile ? '0.95rem' : undefined}>{exhibitor.firstName} {exhibitor.lastName}</Typography>
               
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {/* Contact Information */}
            <SectionTitle>Contact Information</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Field label="Name" value={`${exhibitor.firstName} ${exhibitor.lastName}`} />
                <Field label="Email" value={exhibitor.email ? <a href={`mailto:${exhibitor.email}`}>{exhibitor.email}</a> : '-'} />
                <Field label="Business Email" value={exhibitor.businessEmail ? <a href={`mailto:${exhibitor.businessEmail}`}>{exhibitor.businessEmail}</a> : '-'} />
                <Field label="Phone" value={exhibitor.phone || exhibitor.phoneNumber || '-'} />
                <Field label="Country" value={exhibitor.country || '-'} />
                <Field label="Status" value={exhibitor.status || '-'} />
                <Field label="Registration Date" value={exhibitor.registrationDate?.toLocaleString?.() || '-'} />
                <Field label="Location" value={exhibitor.customData?.location || '-'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Job Title" value={exhibitor.jobTitle || '-'} />
                <Field label="Industry" value={exhibitor.customData?.industry || exhibitor.industry || '-'} />
                <Field label="Interest" value={exhibitor.interests?.join(', ') || '-'} />
                {/* {exhibitor.interests && exhibitor.interests.length > 0 && (
                  <Typography variant="body2" fontWeight={600} mt={0.5}>Interest: {exhibitor.interests.join(', ')}</Typography>
                )} */}
                <Field label="Technology" value={exhibitor.technology || '-'} />
                <Field label="Company Type" value={exhibitor.customData?.companyType || exhibitor.companyType || '-'} />
                <Field label="Website" value={
                  exhibitor.customData?.website
                    ? <a href={urlWithProtocol(exhibitor.customData?.website)} target="_blank" rel="noopener noreferrer">{exhibitor.customData?.website}</a>
                    : '-'
                } />
                {/* Social Links */}
                {exhibitor.customData?.linkedIn && (
                  <Field label="LinkedIn" value={<a href={exhibitor.customData.linkedIn} target="_blank" rel="noopener noreferrer">{exhibitor.customData.linkedIn}</a>} />
                )}
                {exhibitor.customData?.twitter && (
                  <Field label="Twitter" value={<a href={exhibitor.customData.twitter} target="_blank" rel="noopener noreferrer">{exhibitor.customData.twitter}</a>} />
                )}
                {exhibitor.customData?.instagram && (
                  <Field label="Instagram" value={<a href={exhibitor.customData.instagram} target="_blank" rel="noopener noreferrer">{exhibitor.customData.instagram}</a>} />
                )}
                {exhibitor.customData?.youtube && (
                  <Field label="YouTube" value={<a href={exhibitor.customData.youtube} target="_blank" rel="noopener noreferrer">{exhibitor.customData.youtube}</a>} />
                )}
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Booth Information */}
            <SectionTitle>Booth Information</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Field label="Booth Number" value={exhibitor.customData?.boothNumber || exhibitor.boothNumber || '-'} />
                <Field label="Booth Size" value={exhibitor.customData?.boothSize || exhibitor.boothSize || '-'} />
                <Field label="Looking For" value={exhibitor.customData?.lookingFor?.length > 0 ? exhibitor.customData.lookingFor.join(', ') : '-'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Company Description" value={exhibitor.customData?.companyDescription || exhibitor.companyDescription || '-'} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Products */}
            <SectionTitle>Products</SectionTitle>
            {Array.isArray(exhibitor.product) && exhibitor.product.length > 0 ? (
              <List dense>
                {exhibitor.product.map((prod: any, idx: number) => (
                  <ListItem key={prod.id || idx} alignItems="flex-start" sx={{ pl: 0 }}>
                    <ListItemText
                      primary={<b>{prod.title}</b>}
                      secondary={
                        <>
                          <div><b>Category:</b> {prod.category}</div>
                          <div><b>Description:</b> {prod.description}</div>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">{(exhibitor.customData?.products && exhibitor.customData.products.length > 0)
                ? exhibitor.customData.products.join(', ')
                : (exhibitor.products && exhibitor.products.length > 0)
                  ? exhibitor.products.join(', ')
                  : 'No products listed.'}</Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Brands */}
            <SectionTitle>Brands</SectionTitle>
            {Array.isArray(exhibitor.brand) && exhibitor.brand.length > 0 ? (
              <List dense>
                {exhibitor.brand.map((brand: any, idx: number) => (
                  <ListItem key={brand.id || idx} alignItems="flex-start" sx={{ pl: 0 }}>
                    <ListItemText
                      primary={<b>{brand.brandName}</b>}
                      secondary={
                        <>
                          <div><b>Category:</b> {brand.category}</div>
                          <div><b>Description:</b> {brand.description}</div>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">{(exhibitor.customData?.brand && exhibitor.customData.brand.length > 0)
                ? exhibitor.customData.brand.map((b: any) => b.brandName).join(', ')
                : 'No brands listed.'}</Typography>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
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
  const [selectedExhibitor, setSelectedExhibitor] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetchExhibitors();
  }, []);

  // Load all favorite statuses in one API call
  const loadFavoriteStatuses = async (eventIdentifier: string) => {
    if (!eventIdentifier) {
      console.log('❌ loadFavoriteStatuses called with empty identifier');
      return;
    }

    console.log('🚀 loadFavoriteStatuses CALLED with identifier:', eventIdentifier);
    
    try {
      console.log('🔍 Loading all exhibitor favorite statuses');
      
      // Check if current user is an exhibitor
      const currentExhibitorId = getCurrentExhibitorId();
      console.log('🔍 Role detection - currentExhibitorId:', currentExhibitorId);
      console.log('🔍 User type:', currentExhibitorId ? 'EXHIBITOR' : 'VISITOR');
      
      if (currentExhibitorId) {
        // User is an exhibitor - load exhibitor-to-exhibitor favorites using getFavouritedExhibitors
        console.log('🏢 User is exhibitor - loading exhibitor-to-exhibitor favorites');
        
        const favoriteExhibitors = await FavoritesManager.getExhibitorFavoriteExhibitors(eventIdentifier);
        console.log('🔍 API returned favorite exhibitors:', favoriteExhibitors);
        
        const favoriteIds = new Set(
          favoriteExhibitors.map((exhibitor: any) => {
            console.log('🔍 Processing favorite exhibitor:', exhibitor.id, 'as string:', exhibitor.id.toString());
            return exhibitor.id.toString();
          })
        );
        setFavoriteExhibitors(favoriteIds);
        console.log('✅ Loaded', favoriteIds.size, 'favorite exhibitors for exhibitor user');
        console.log('✅ Favorite IDs set:', Array.from(favoriteIds));
      } else {
        // User is a visitor - use visitor favorites API
        console.log('👤 User is visitor - loading visitor-to-exhibitor favorites');
        
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
      }
    } catch (error) {
      console.error('❌ Error loading favorite statuses:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
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
        console.log('✅ Exhibitors loaded successfully, count:', response.result.length);
        const transformedExhibitors = response.result.map((exhibitor: Exhibitor, index: number) => transformExhibitorData(exhibitor, eventIdentifier, index));
        setExhibitors(transformedExhibitors);

        console.log('🔄 About to call loadFavoriteStatuses with identifier:', eventIdentifier);
        // Load favorite statuses after exhibitors are loaded
        await loadFavoriteStatuses(eventIdentifier);
        console.log('✅ loadFavoriteStatuses completed');
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
          <Typography fontStyle="italic" variant="h5" component="h1" fontWeight="600" sx={{ mb: 1 }}>
            Exhibitors Directory
          </Typography>
          <Typography fontStyle="italic" variant="body1" color="text.secondary">
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

  // Helper to get identifier (copied from fetchExhibitors logic)
  const getIdentifier = () => {
    let eventIdentifier: string | null = null;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && pathParts[0] !== 'iframe') {
      eventIdentifier = pathParts[0];
    } else {
      try {
        if (window.parent && window.parent !== window) {
          const parentUrl = window.parent.location.pathname;
          const parentParts = parentUrl.split('/').filter(Boolean);
          if (parentParts.length > 0) {
            eventIdentifier = parentParts[0];
          }
        }
      } catch (e) {}
    }
    return eventIdentifier;
  };

  // Handler for exhibitor name click
  const handleExhibitorNameClick = async (exhibitorId: string) => {
    setDialogLoading(true);
    setDialogOpen(true);
    setSelectedExhibitor(null);
    try {
      const identifier = getIdentifier();
      if (!identifier) throw new Error('No event identifier found');
      // getExhibitorById expects a number
      const response = await fieldMappingApi.getExhibitorById(identifier, Number(exhibitorId));
      if (response.statusCode === 200 && response.result) {
        setSelectedExhibitor(response.result);
      } else {
        setSelectedExhibitor(null);
      }
    } catch (err) {
      setSelectedExhibitor(null);
    } finally {
      setDialogLoading(false);
    }
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
            <Typography fontStyle="italic" variant="h5" component="h1" fontWeight="600" sx={{ mb: 1 }}>
              Exhibitors Directory
            </Typography>

          </Box>
          
          {/* Status Filter on the right */}
          <FormControl sx={{ minWidth: 150,mb:0.5 }}>
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
      {/* {!loading && !error && (
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading exhibitors...' : `Showing ${filteredExhibitors.length} of ${exhibitors.length} exhibitors`}
          {exhibitors.length > 0 }
        </Typography>
      </Box>
      )} */}

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
                  console.log('🔄 onFavoriteToggle called with:', { id, newStatus });
                  setFavoriteExhibitors(prev => {
                    console.log('🔄 Previous favorites set:', Array.from(prev));
                    const newSet = new Set(prev);
                    if (newStatus) {
                      console.log('🔄 Adding exhibitor to favorites:', id);
                      newSet.add(id);
                    } else {
                      console.log('🔄 Removing exhibitor from favorites:', id);
                      newSet.delete(id);
                    }
                    console.log('🔄 New favorites set:', Array.from(newSet));
                    console.log('🔄 Is exhibitor', id, 'now favorited?', newSet.has(id));
                    return newSet;
                  });
                }}
                onNameClick={handleExhibitorNameClick}
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

      {/* Exhibitor Details Dialog */}
      <ExhibitorDetailsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} exhibitor={selectedExhibitor} loading={dialogLoading} />
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
        // Try to get from cookies first, then fallback to localStorage for iframe compatibility
        try {
          const { getEventIdentifier } = await import('@/utils/cookieManager');
          identifier = getEventIdentifier();
        } catch {
          identifier = localStorage.getItem('currentEventIdentifier');
        }
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