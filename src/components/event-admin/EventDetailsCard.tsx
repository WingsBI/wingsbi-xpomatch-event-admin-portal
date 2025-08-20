'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit,
  Event as EventIcon,
  LocationOn,
  People,
  Business,
  CalendarToday,
  Category,
  Computer,
} from '@mui/icons-material';
import { eventsApi } from '@/services/apiService';
import { ApiEventDetails, UpdateEventPayload } from '@/types';
import { getAuthToken } from '@/utils/cookieManager';

interface EventDetailsCardProps {
  onEventUpdate?: () => void;
}

export default function EventDetailsCard({ onEventUpdate }: EventDetailsCardProps) {
  const params = useParams();
  const identifier = params?.identifier as string;
  
  const [eventDetails, setEventDetails] = useState<ApiEventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<UpdateEventPayload>>({});

  useEffect(() => {
    loadEventDetails();
  }, [identifier]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading event details for identifier:', identifier);
      
      if (!identifier) {
        setError('No event identifier found. Please access through a valid event URL.');
        return;
      }
      
      const response = await eventsApi.getEventDetails(identifier);
      
      console.log('🔍 Event details response:', {
        success: response.success,
        status: response.status,
        hasData: !!response.data,
        hasResult: !!(response.data?.result),
        resultType: Array.isArray(response.data?.result) ? 'array' : typeof response.data?.result,
        resultLength: Array.isArray(response.data?.result) ? response.data.result.length : 'N/A'
      });
      
      if (response.success && response.data?.result && response.data.result.length > 0) {
        // Take the first event from the array
        setEventDetails(response.data.result[0]);
        console.log('✅ Event details loaded successfully:', response.data.result[0]);
      } else {
        console.warn('⚠️ Event details response structure:', response);
        setError('No event details found. The API returned an empty result.');
      }
    } catch (err: any) {
      console.error('❌ Error loading event details:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to load event details';
      
      if (err.message) {
        if (err.message.includes('400')) {
          errorMessage = 'Invalid event identifier. Please check the URL and try again.';
        } else if (err.message.includes('401')) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Event not found. Please check the event identifier.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'upcoming': return 'info';
      case 'draft': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    
    // Parse the UTC date string and convert to IST (UTC+5:30)
    const utcDate = new Date(dateString);
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
    
    return istDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatLocation = (locationDetails: any) => {
    if (!locationDetails || !Array.isArray(locationDetails) || locationDetails.length === 0) return 'Not set';
    
    const location = locationDetails[0]; // Take the first location
    const parts = [
      location.venueName,
      location.cityName,
      location.stateName,
      location.countryName
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleEdit = () => {
    if (!eventDetails) return;
    
    const firstLocation = eventDetails.locationDetails && Array.isArray(eventDetails.locationDetails) 
      ? eventDetails.locationDetails[0] 
      : null;
    
    // Initialize edit form with current data
    setEditedEvent({
      eventId: eventDetails.id,
      eventDetails: {
        eventName: eventDetails.title,
        description: eventDetails.description,
        startDate: eventDetails.startDateTime ? eventDetails.startDateTime.slice(0, 16) : null,
        endDate: eventDetails.endDateTime ? eventDetails.endDateTime.slice(0, 16) : null,
      },
      location: {
        venueName: firstLocation?.venueName || '',
        addressLine1: firstLocation?.addressLine1 || '',
        addressLine2: firstLocation?.addressLine2 || null,
        countryId: 2, // Default values - you may want to fetch these from another API
        stateId: 2,
        cityId: 1,
        postalCode: firstLocation?.postalCode?.toString() || null,
        latitude: firstLocation?.latitude ? parseFloat(firstLocation.latitude) : null,
        longitude: firstLocation?.longitude ? parseFloat(firstLocation.longitude) : null,
        googleMapLink: firstLocation?.mapLink || null,
      },
      marketingAbbreviation: eventDetails.marketingAbbreviation,
      themeSelectionId: 1, // Default values
      fontFamilyId: 1,
      logoUrl: 'string',
      payment: true,
      eventCatalogId: 1,
      eventStatusId: 1,
      paymentDetailsId: 1,
      eventModeId: 1,
    });
    
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!editedEvent.eventId) {
        setError('Event ID is required');
        return;
      }

      console.log('Updating event with payload:', editedEvent);
      const response = await eventsApi.updateEventDetails(identifier, editedEvent);
      
      if (response.success) {
        setEditDialogOpen(false);
        await loadEventDetails(); // Reload the data
        if (onEventUpdate) {
          onEventUpdate();
        }
      } else {
        setError('Failed to update event');
      }
    } catch (err: any) {
      console.error('Error updating event:', err);
      setError(err.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const updateEventField = (field: string, value: any) => {
    setEditedEvent(prev => ({
      ...prev,
      eventDetails: {
        ...prev.eventDetails!,
        [field]: value
      }
    }));
  };

  const updateLocationField = (field: string, value: any) => {
    setEditedEvent(prev => ({
      ...prev,
      location: {
        ...prev.location!,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={loadEventDetails}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
          
          {/* Debug information in development */}
          {process.env.NODE_ENV === 'development' && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="subtitle2" gutterBottom>
                Debug Information:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                {JSON.stringify({
                  identifier,
                  url: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://xpomatch-dev-event-admin-api.azurewebsites.net'}/api/${identifier}/Event/GetEventDetails`,
                  hasToken: !!getAuthToken(),
                  tokenLength: getAuthToken()?.length || 0,
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!eventDetails) {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Alert severity="info">
            No event details available
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                {eventDetails.title}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={eventDetails.statusName}
                  color={getStatusColor(eventDetails.statusName) as any}
                  sx={{ textTransform: 'capitalize' }}
                />
                
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEdit}
              >
                Edit Event
              </Button>
            </Box>
          </Box>

          {eventDetails.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {eventDetails.description}
            </Typography>
          )}

          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" gap={9} mb={2}>
                <Box display="flex" alignItems="center" minWidth="200px">
                  <CalendarToday sx={{ mr: 2, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2">Start Date</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(eventDetails.startDateTime)}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" minWidth="200px">
                  <CalendarToday sx={{ mr: 2, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2">End Date</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(eventDetails.endDateTime)}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" minWidth="200px">
                  <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2">Location</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatLocation(eventDetails.locationDetails)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Event Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Name"
                value={editedEvent.eventDetails?.eventName || ''}
                onChange={(e) => updateEventField('eventName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editedEvent.eventDetails?.description || ''}
                onChange={(e) => updateEventField('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={editedEvent.eventDetails?.startDate || ''}
                onChange={(e) => updateEventField('startDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={editedEvent.eventDetails?.endDate || ''}
                onChange={(e) => updateEventField('endDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Venue Name"
                value={editedEvent.location?.venueName || ''}
                onChange={(e) => updateLocationField('venueName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={editedEvent.location?.addressLine1 || ''}
                onChange={(e) => updateLocationField('addressLine1', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={editedEvent.location?.addressLine2 || ''}
                onChange={(e) => updateLocationField('addressLine2', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={editedEvent.location?.postalCode || ''}
                onChange={(e) => updateLocationField('postalCode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marketing Abbreviation"
                value={editedEvent.marketingAbbreviation || ''}
                onChange={(e) => setEditedEvent(prev => ({ ...prev, marketingAbbreviation: e.target.value }))}
              />
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : undefined}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 