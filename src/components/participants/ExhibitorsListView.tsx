'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
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
import { Business, Language, Favorite, FavoriteBorder, LocationOn, LinkedIn, ConnectWithoutContact as ConnectIcon } from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';

import { fieldMappingApi, type Exhibitor } from '@/services/fieldMappingApi';
import { FavoritesManager } from '@/utils/favoritesManager';
import { getCurrentUserId, getCurrentExhibitorId, isEventAdmin } from '@/utils/authUtils';

const normalizeAssetUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
  return `${base}/${path.replace(/^\/+/, '')}`;
};

const transformExhibitorData = (apiExhibitor: Exhibitor, identifier: string, index: number) => {
  const profile = (Array.isArray(apiExhibitor.exhibitorProfile) ? apiExhibitor.exhibitorProfile[0] : {}) as any;
  const address = (Array.isArray(apiExhibitor.exhibitorAddress) ? apiExhibitor.exhibitorAddress[0] : {}) as any;
  const userMap = (Array.isArray(apiExhibitor.exhibitorToUserMaps) ? apiExhibitor.exhibitorToUserMaps[0] : {}) as any;
  const customFields = (Array.isArray((apiExhibitor as any).exhibitorCustomField) ? (apiExhibitor as any).exhibitorCustomField : []) as any[];
  const getCustomField = (name: string) => customFields.find((f: any) => f.fieldName?.toLowerCase() === name.toLowerCase())?.fieldValue || '';

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
      boothSize: '',
      website: apiExhibitor.webSite || getCustomField('officialwebsite') || '',
      companyType: apiExhibitor.companyType || '',
      companyLogoPath: normalizeAssetUrl(apiExhibitor.companyLogoPath || null),
      linkedIn: profile.linkedInLink || userMap.linkedInProfile || '',
      twitter: profile.twitterLink || userMap.twitterProfile || '',
      instagram: profile.instagramLink || userMap.instagramProfile || '',
      youtube: profile.youTubeLink || '',
    },
    product: Array.isArray(apiExhibitor.product) ? apiExhibitor.product : [],
    brand: Array.isArray(apiExhibitor.brand) ? apiExhibitor.brand : [],
  };
};

function ExhibitorCard({ exhibitor, isFavorite, onFavoriteToggle, identifier, isClient }: { exhibitor: any; isFavorite: boolean; onFavoriteToggle: (id: string, fav: boolean) => void; identifier: string; isClient: boolean; }) {
  const theme = useTheme();
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  const urlWithProtocol = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  const handleFavoriteClick = async (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!identifier || identifier.trim() === '') return;

    const newFavoriteState = !isFavorite;
    onFavoriteToggle(exhibitor.id, newFavoriteState);

    setIsLoadingFavorite(true);
    try {
      const currentExhibitorId = getCurrentExhibitorId();
      let finalStatus: boolean;
      if (currentExhibitorId) {
        finalStatus = await FavoritesManager.toggleExhibitorToExhibitorFavorite(identifier, exhibitor.id, isFavorite);
      } else {
        finalStatus = await FavoritesManager.toggleExhibitorFavorite(identifier, exhibitor.id, isFavorite);
      }
      onFavoriteToggle(exhibitor.id, finalStatus);
    } catch (error) {
      onFavoriteToggle(exhibitor.id, !newFavoriteState);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e8eaed', bgcolor: 'background.paper', transition: 'all 0.3s ease-in-out', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}>
      <CardContent sx={{ p: 1, pb: 0.5, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        <Box display="flex" alignItems="center" mb={1} sx={{ minHeight: '60px', width: '100%' }}>
          <Avatar src={exhibitor.customData?.companyLogoPath || undefined} sx={{ bgcolor: 'success.main', width: 36, height: 36, mr: 1.5, fontSize: '0.9rem', fontWeight: 'bold', flexShrink: 0, color: 'white', alignSelf: 'start', mt: 2 }}>
            {!exhibitor.customData?.companyLogoPath && (exhibitor.company ? exhibitor.company.charAt(0).toUpperCase() : getInitials(exhibitor.firstName, exhibitor.lastName))}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0, mt: 2 }}>
            <Typography variant="body2" component="div" fontWeight="600" sx={{ ml: 0, minHeight: '1.2rem', display: 'flex', alignItems: 'center', gap: 0.5, lineHeight: 1.2, wordBreak: 'break-word' }}>{exhibitor.company}</Typography>
            {exhibitor.customData?.companyType && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0, wordBreak: 'break-word', lineHeight: 1.3 }}>{exhibitor.customData.companyType}</Typography>
            )}
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              {exhibitor.customData?.boothNumber && (
                <Chip label={exhibitor.customData.boothNumber} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 500 }} />
              )}
            </Box>
          </Box>
        </Box>
        {/* Content Section - optional details */}
        {(exhibitor.customData?.location) && (
          <Box mb={0.5}>
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle2" color="text.secondary">{exhibitor.customData.location}</Typography>
            </Box>
          </Box>
        )}

        {!isEventAdmin() && (
          <IconButton onClick={handleFavoriteClick} disabled={isLoadingFavorite} size="large" sx={{ position: 'absolute', top: 0, right: 8, p: 0.5 }}>
            {isLoadingFavorite ? (
              <CircularProgress size={20} sx={{ color: '#b0bec5' }} />
            ) : isFavorite ? (
              <Favorite sx={{ fontSize: 20, color: '#ef4444' }} />
            ) : (
              <FavoriteBorder sx={{ fontSize: 20, color: '#b0bec5' }} />
            )}
          </IconButton>
        )}

        <Divider sx={{ mb: 1 }} />

        {/* Action Buttons */}
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 'auto', mb: -1 }}>
          <Box display="flex" gap={1}>
            {exhibitor.customData?.linkedIn && (
              <IconButton size="small" sx={{ color: '#0077b5' }} onClick={() => window.open(urlWithProtocol(exhibitor.customData?.linkedIn), '_blank')}>
                <LinkedIn fontSize="small" />
              </IconButton>
            )}
            {exhibitor.customData?.website && exhibitor.customData.website.trim() !== '' && (
              <IconButton size="small" sx={{ color: 'hsla(0, 0.00%, 2.00%, 0.57)', '&:hover': { bgcolor: 'rgba(26, 24, 24, 0.1)' } }} onClick={() => window.open(urlWithProtocol(exhibitor.customData?.website), '_blank')}>
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
              '&:hover': { bgcolor: theme.palette.primary.dark }
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

export function ExhibitorListView({ identifier }: { identifier: string }) {
  const theme = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');
  const [exhibitors, setExhibitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteExhibitors, setFavoriteExhibitors] = useState<Set<string>>(new Set());
  const [selectedExhibitor, setSelectedExhibitor] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => { if (identifier) void fetchExhibitors(); }, [identifier]);

  const loadFavoriteStatuses = async (eventIdentifier: string) => {
    if (!eventIdentifier) return;
    try {
      const currentExhibitorId = getCurrentExhibitorId();
      if (currentExhibitorId) {
        const favoriteExhibitors = await FavoritesManager.getExhibitorFavoriteExhibitors(eventIdentifier);
        const favoriteIds = new Set(favoriteExhibitors.map((e: any) => e.id.toString()));
        setFavoriteExhibitors(favoriteIds);
      } else {
        let currentUserId = getCurrentUserId();
        if (!currentUserId) currentUserId = 1;
        const response = await fieldMappingApi.getVisitorFavorites(eventIdentifier, currentUserId);
        if (response.statusCode === 200 && response.result?.exhibitors) {
          setFavoriteExhibitors(new Set(response.result.exhibitors.map((e: any) => e.id.toString())));
        } else {
          setFavoriteExhibitors(new Set());
        }
      }
    } catch {
      setFavoriteExhibitors(new Set());
    }
  };

  const fetchExhibitors = async () => {
    try {
      setLoading(true);
      setError(null);
      try {
        const cached = sessionStorage.getItem(`exhibitors:${identifier}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setExhibitors(parsed);
            setLoading(false);
          }
        }
      } catch {}

      const response = await fieldMappingApi.getAllExhibitors(identifier);
      if (response.statusCode === 200 && response.result) {
        const transformedExhibitors = response.result.map((exhibitor: Exhibitor, index: number) => transformExhibitorData(exhibitor, identifier, index));
        setExhibitors(transformedExhibitors);
        try { sessionStorage.setItem(`exhibitors:${identifier}`, JSON.stringify(transformedExhibitors)); } catch {}
        await loadFavoriteStatuses(identifier);
      } else {
        setError('Failed to fetch exhibitors data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exhibitors data');
    } finally {
      setLoading(false);
    }
  };

  const experiences = useMemo(() => Array.from(new Set(exhibitors.map(e => e.customData?.experience).filter(Boolean))), [exhibitors]);
  const filteredExhibitors = useMemo(() => exhibitors.filter(exhibitor => {
    const matchesSearch = exhibitor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || exhibitor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || exhibitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) || exhibitor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || exhibitor.status === filterStatus;
    const matchesExperience = filterExperience === 'all' || exhibitor.customData?.experience === filterExperience;
    return matchesSearch && matchesStatus && matchesExperience;
  }), [exhibitors, searchTerm, filterStatus, filterExperience]);

  return (
    <Container maxWidth="xl" sx={{ py: 1, p: 0 }}>
      <Box mb={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography fontStyle="italic" variant="h5" component="h1" fontWeight="600" sx={{ mb: 1 }}>Exhibitors Directory</Typography>
          </Box>
          <FormControl sx={{ minWidth: 150, mb: 0.5 }}>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} displayEmpty sx={{ bgcolor: 'background.paper', height: 32, fontSize: '0.92rem', '.MuiSelect-select': { py: '6px !important', minHeight: 'unset !important' } }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="registered">Registered</MenuItem>
              <MenuItem value="invited">Invited</MenuItem>
              <MenuItem value="checked-in">Checked In</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {experiences.length > 0 && (
        <Box mb={2}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <Select value={filterExperience} onChange={(e) => setFilterExperience(e.target.value)} displayEmpty sx={{ bgcolor: 'background.paper' }}>
                  <MenuItem value="all">All Experiences</MenuItem>
                  {experiences.map((experience) => (
                    <MenuItem key={experience} value={experience}>{experience}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress size={48} />
          <Typography variant="body1" sx={{ ml: 2 }}>Loading Exhibitors...</Typography>
        </Box>
      )}

      {error && !loading && (
        <Box mb={2} textAlign="center" py={8}>
          <Business sx={{ fontSize: 64, color: 'Grey', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'Grey' }} mb={1}>{error}</Typography>
          <Typography variant="body2" color="text.secondary">Please check your connection or try again later</Typography>
        </Box>
      )}

      {!loading && !error && (
        <Grid container spacing={1.5}>
          {filteredExhibitors.map((exhibitor) => (
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} key={exhibitor.id}>
              <Suspense fallback={<ExhibitorCardSkeleton />}>
                <ExhibitorCard exhibitor={exhibitor} isFavorite={favoriteExhibitors.has(exhibitor.id)} onFavoriteToggle={(id, fav) => {
                  setFavoriteExhibitors(prev => { const s = new Set(prev); fav ? s.add(id) : s.delete(id); return s; });
                }} identifier={identifier} isClient={isClient} />
              </Suspense>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default ExhibitorListView;


