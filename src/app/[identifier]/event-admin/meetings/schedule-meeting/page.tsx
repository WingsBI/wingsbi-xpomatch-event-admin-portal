'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import {
  ScheduleSend,
  Description,
  Person,
  Business,
  Event,
  AccessTime,
  Close,
  Favorite
} from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import { apiService } from '@/services/apiService';
import { addNotification } from '@/store/slices/appSlice';
import { getCurrentUser, getCurrentExhibitorId, getCurrentVisitorId } from '@/utils/authUtils';
import { FavoritesManager } from '@/utils/favoritesManager';

interface MeetingFormData {
  agenda: string;
  visitorId: number | '';
  exhibitorId: number | '';
  meetingDate: string;
  startTime: string;
  endTime: string;
}

interface Visitor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
}

interface Exhibitor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  companyType?: string;
  jobTitle?: string;
}

export default function ScheduleMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const identifier = params.identifier as string;

  const [meetingForm, setMeetingForm] = useState<MeetingFormData>({
    agenda: '',
    visitorId: '',
    exhibitorId: '',
    meetingDate: '',
    startTime: '',
    endTime: ''
  });
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [favoriteVisitors, setFavoriteVisitors] = useState<any[]>([]);
  const [favoriteExhibitors, setFavoriteExhibitors] = useState<any[]>([]);
  const [selectedVisitorDetails, setSelectedVisitorDetails] = useState<any>(null);
  const [selectedExhibitorDetails, setSelectedExhibitorDetails] = useState<any>(null);
  const [loadingVisitorDetails, setLoadingVisitorDetails] = useState(false);
  const [loadingExhibitorDetails, setLoadingExhibitorDetails] = useState(false);

  // Initialize current user data
  useEffect(() => {
    const currentUser = getCurrentUser();
    console.log('ScheduleMeeting - Current user:', currentUser);
    
    if (currentUser) {
      setCurrentUserRole(currentUser.role);
      console.log('ScheduleMeeting - User role:', currentUser.role);
      
      // Set the appropriate ID based on user role
      if (currentUser.role === 'exhibitor') {
        const exhibitorId = getCurrentExhibitorId();
        console.log('ScheduleMeeting - Exhibitor ID:', exhibitorId);
        setCurrentUserId(exhibitorId);
        // Auto-set exhibitor ID in form
        if (exhibitorId) {
          setMeetingForm(prev => ({
            ...prev,
            exhibitorId: exhibitorId
          }));
        }
      } else if (currentUser.role === 'visitor') {
        const visitorId = getCurrentVisitorId();
        console.log('ScheduleMeeting - Visitor ID:', visitorId);
        setCurrentUserId(visitorId);
        // Auto-set visitor ID in form
        if (visitorId) {
          setMeetingForm(prev => ({
            ...prev,
            visitorId: visitorId
          }));
        }
      }
    }
  }, []);

  // Load participants data
    const loadParticipantsData = async () => {
      try {
        setLoading(true);
        
        // Load both visitors and exhibitors data from APIs
        const [visitorsResponse, exhibitorsResponse] = await Promise.all([
          apiService.getAllVisitors(identifier),
          fieldMappingApi.getAllExhibitors(identifier)
        ]);

        // Process visitors data
        if (visitorsResponse.success && visitorsResponse.data?.result) {
          const transformedVisitors: Visitor[] = visitorsResponse.data.result.map((visitor: any) => ({
            id: visitor.id,
            firstName: visitor.firstName || '',
            lastName: visitor.lastName || '',
            email: visitor.email || '',
            company: visitor.userProfile?.companyName || visitor.companyName || visitor.company || '',
            jobTitle: visitor.userProfile?.jobTitle || visitor.userProfile?.designation || visitor.jobTitle || ''
          }));
          setVisitors(transformedVisitors);
        } else {
          console.error('Failed to load visitors:', visitorsResponse);
          setVisitors([]);
        }

        // Process exhibitors data
        if (exhibitorsResponse.statusCode === 200 && exhibitorsResponse.result) {
          console.log('Raw exhibitors data:', exhibitorsResponse.result);
          const transformedExhibitors: Exhibitor[] = exhibitorsResponse.result.map((exhibitor: any) => {
            console.log('Processing exhibitor:', exhibitor);
            return {
              id: exhibitor.id,
              firstName: exhibitor.firstName || exhibitor.exhibitorToUserMaps?.[0]?.firstName || '',
              lastName: exhibitor.lastName || exhibitor.exhibitorToUserMaps?.[0]?.lastName || '',
              email: exhibitor.email || exhibitor.exhibitorToUserMaps?.[0]?.email || '',
              companyName: exhibitor.companyName,
              companyType: exhibitor.companyType,
              jobTitle: exhibitor.jobTitle || exhibitor.exhibitorToUserMaps?.[0]?.jobTitle
            };
          });
          console.log('Transformed exhibitors:', transformedExhibitors);
          setExhibitors(transformedExhibitors);
        } else {
          console.error('Failed to load exhibitors:', exhibitorsResponse);
          setExhibitors([]);
        }
      } catch (error) {
        console.error('Error loading participants data:', error);
        setVisitors([]);
        setExhibitors([]);
      } finally {
        setLoading(false);
      }
    };

  // Load participants data when component mounts
  useEffect(() => {
      loadParticipantsData();
  }, [identifier]);

  // Function to load favorites
  const loadFavorites = async () => {
    try {
      console.log('🔍 Loading favorites...');
      if (currentUserRole === 'visitor') {
        const favoriteExhibitorsData = await FavoritesManager.getVisitorFavoriteExhibitors(identifier);
        // Since the API returns only favorite exhibitors, we don't need to filter
        setFavoriteExhibitors(favoriteExhibitorsData);
      } else if (currentUserRole === 'exhibitor') {
        const favoriteVisitorsData = await FavoritesManager.getExhibitorFavoriteVisitors(identifier);
        console.log('🔍 Favorite visitors data:', favoriteVisitorsData);
        // Since the API returns only favorite visitors, we don't need to filter
        console.log('🔍 Using all favorite visitors directly:', favoriteVisitorsData);
        setFavoriteVisitors(favoriteVisitorsData);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Load favorites when component mounts
  useEffect(() => {
    console.log('🔍 useEffect for loadFavorites triggered');
    console.log('🔍 currentUserRole:', currentUserRole);
    console.log('🔍 currentUserId:', currentUserId);
    console.log('🔍 identifier:', identifier);
    if (currentUserRole && currentUserId && identifier) {
      console.log('🔍 Calling loadFavorites...');
      loadFavorites();
    } else {
      console.log('🔍 Not calling loadFavorites - missing required data');
    }
  }, [currentUserRole, currentUserId, identifier]);

  // Debug form state changes
  useEffect(() => {
    console.log('🔍 Form state changed:', meetingForm);
  }, [meetingForm]);

  // Debug current user role
  useEffect(() => {
    console.log('🔍 Current user role:', currentUserRole);
    console.log('🔍 Visitor dropdown disabled:', currentUserRole === 'visitor');
    console.log('🔍 Exhibitor dropdown disabled:', currentUserRole === 'exhibitor');
  }, [currentUserRole]);

  // Function to fetch visitor details by ID
  const fetchVisitorDetails = async (visitorId: number) => {
    console.log('🔍 fetchVisitorDetails called with ID:', visitorId);
    if (!visitorId) {
      setSelectedVisitorDetails(null);
      return;
    }

    setLoadingVisitorDetails(true);
    try {
      console.log('🔍 Calling getVisitorById API...');
      const response = await fieldMappingApi.getVisitorById(identifier, visitorId);
      console.log('🔍 getVisitorById response:', response);
      if (response.statusCode === 200 && response.result) {
        setSelectedVisitorDetails(response.result);
        console.log('Fetched visitor details:', response.result);
      } else {
        console.error('Failed to fetch visitor details:', response);
        setSelectedVisitorDetails(null);
      }
    } catch (error) {
      console.error('Error fetching visitor details:', error);
      setSelectedVisitorDetails(null);
    } finally {
      setLoadingVisitorDetails(false);
    }
  };

  // Function to fetch exhibitor details by ID
  const fetchExhibitorDetails = async (exhibitorId: number) => {
    console.log('🔍 fetchExhibitorDetails called with ID:', exhibitorId);
    if (!exhibitorId) {
      setSelectedExhibitorDetails(null);
      return;
    }

    setLoadingExhibitorDetails(true);
    try {
      console.log('🔍 Calling getExhibitorById API...');
      const response = await fieldMappingApi.getExhibitorById(identifier, exhibitorId);
      console.log('🔍 getExhibitorById response:', response);
      if (response.statusCode === 200 && response.result) {
        setSelectedExhibitorDetails(response.result);
        console.log('Fetched exhibitor details:', response.result);
      } else {
        console.error('Failed to fetch exhibitor details:', response);
        setSelectedExhibitorDetails(null);
      }
    } catch (error) {
      console.error('Error fetching exhibitor details:', error);
      setSelectedExhibitorDetails(null);
    } finally {
      setLoadingExhibitorDetails(false);
    }
  };

  const handleFormChange = (field: keyof MeetingFormData, value: string | number) => {
    console.log('🔍 handleFormChange called:', field, value, 'Type:', typeof value);
    
    setMeetingForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Fetch details when visitor or exhibitor is selected
    if (field === 'visitorId' && value) {
      console.log('🔍 Fetching visitor details for ID:', value);
      fetchVisitorDetails(Number(value));
    } else if (field === 'exhibitorId' && value) {
      console.log('🔍 Fetching exhibitor details for ID:', value);
      fetchExhibitorDetails(Number(value));
    }

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!meetingForm.agenda.trim()) {
      errors.agenda = 'Meeting agenda is required';
    }

    if (!meetingForm.visitorId) {
      errors.visitorId = 'Please select a visitor';
    }

    if (!meetingForm.exhibitorId) {
      errors.exhibitorId = 'Please select an exhibitor';
    }

    if (!meetingForm.meetingDate) {
      errors.meetingDate = 'Meeting date is required';
    }

    if (!meetingForm.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!meetingForm.endTime) {
      errors.endTime = 'End time is required';
    }

    // Validate time logic
    if (meetingForm.startTime && meetingForm.endTime) {
      if (meetingForm.startTime >= meetingForm.endTime) {
        errors.endTime = 'End time must be after start time';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const meetingData = {
        agenda: meetingForm.agenda,
        visitorId: Number(meetingForm.visitorId),
        exhibitorId: Number(meetingForm.exhibitorId),
        meetingDate: meetingForm.meetingDate,
        startTime: meetingForm.startTime,
        endTime: meetingForm.endTime
      };

      console.log('Submitting meeting data:', meetingData);

      // Call the createMeeting API
      const response = await apiService.createMeeting(identifier, meetingData);
      if (response.success) {
        // Determine who needs to accept the meeting based on who scheduled it
        let acceptanceMessage = '';
        if (currentUserRole === 'exhibitor') {
          acceptanceMessage = 'Meeting scheduled successfully! The visitor will need to accept this meeting request.';
        } else if (currentUserRole === 'visitor') {
          acceptanceMessage = 'Meeting scheduled successfully! The exhibitor will need to accept this meeting request.';
        } else {
          // For event-admin, determine based on which party they're representing
          const currentUserId = getCurrentUser()?.id;
          const scheduledVisitorId = Number(meetingForm.visitorId);
          const scheduledExhibitorId = Number(meetingForm.exhibitorId);
          
          if (currentUserId && Number(currentUserId) === scheduledVisitorId) {
            acceptanceMessage = 'Meeting scheduled successfully! The exhibitor will need to accept this meeting request.';
          } else if (currentUserId && Number(currentUserId) === scheduledExhibitorId) {
            acceptanceMessage = 'Meeting scheduled successfully! The visitor will need to accept this meeting request.';
          } else {
            acceptanceMessage = 'Meeting scheduled successfully! The meeting is pending acceptance.';
          }
        }

        // Show success notification with role-specific message
        dispatch(addNotification({
          type: 'success',
          message: acceptanceMessage,
        }));
        
        // Success - navigate back to meetings page
        router.push(`/${identifier}/event-admin/meetings`);
      } else {
        setSubmitError(response.message || 'Failed to schedule meeting. Please try again.');
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      setSubmitError('Failed to schedule meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Navigate back to meetings page
    router.push(`/${identifier}/event-admin/meetings`);
  };

  return (
    <RoleBasedRoute allowedRoles={['visitor', 'event-admin', 'exhibitor']}>
    <ResponsiveDashboardLayout 
      title="Meetings">
    <Dialog 
      open={openDialog} 
      onClose={() => {}} // Prevent closing on outside click
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={false}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ScheduleSend color="primary" />
          <Typography variant="h6" component="div">
            Schedule New Meeting
          </Typography>
        </Box>
        <IconButton
          onClick={handleCloseDialog}
          disabled={isSubmitting}
          sx={{
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'rotate(90deg) scale(1.1)',
              backgroundColor: 'action.hover',
            },
            '&:active': {
              transform: 'rotate(180deg) scale(0.9)',
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading participants data...
            </Typography>
          </Box>
        )}
        
        {!loading && (
        <>
          {visitors.length === 0 && exhibitors.length === 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              No participants found. Please ensure there are registered visitors and exhibitors for this event.
            </Alert>
          )}
          

          <Grid container spacing={3}>
          {/* Agenda Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              sx={{mt: 1}}
              label="Meeting Agenda"
              value={meetingForm.agenda}
              onChange={(e) => handleFormChange('agenda', e.target.value)}
              multiline
              rows={1}
              error={!!formErrors.agenda}
              helperText={formErrors.agenda}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <Description sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>

          {/* Visitor Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.visitorId} disabled={loading || currentUserRole === 'visitor'}>
              <InputLabel>Select Visitor</InputLabel>
              <Select
                value={meetingForm.visitorId}
                onChange={(e) => {
                  console.log('🔍 Visitor Select onChange triggered:', e.target.value);
                  handleFormChange('visitorId', e.target.value);
                }}
                label="Select Visitor"
                startAdornment={
                  <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }
              >
                {/* No visitors state */}
                {!loading && visitors.length === 0 && (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No visitors available
                    </Typography>
                  </MenuItem>
                )}
                
                {/* Current visitor when user is a visitor */}
                {!loading && currentUserRole === 'visitor' && (
                  <MenuItem value={currentUserId || ''} disabled>
                    {visitors.find(v => v.id === currentUserId)?.firstName || 'Current'} {visitors.find(v => v.id === currentUserId)?.lastName || 'Visitor'}
                    {visitors.find(v => v.id === currentUserId)?.company && ` (${visitors.find(v => v.id === currentUserId)?.company})`}
                  </MenuItem>
                )}
                
                {/* My Favorites Header */}
                {!loading && currentUserRole !== 'visitor' && favoriteVisitors.length > 0 && (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Favorite sx={{ mr: 1, color: 'error.main', fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary" fontWeight="medium">
                        My Favorites ({favoriteVisitors.length})
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                
                {/* Favorite Visitors */}
                {!loading && currentUserRole !== 'visitor' && favoriteVisitors.map((favorite) => {
                  const visitor = visitors.find(v => v.id === favorite.visitorId);
                  if (!visitor) return null;
                  return (
                    <MenuItem key={`fav-${visitor.id}`} value={visitor.id}>
                      {visitor.firstName} {visitor.lastName}
                      {visitor.company && ` (${visitor.company})`}
                    </MenuItem>
                  );
                })}
                
                {/* Divider */}
                {!loading && currentUserRole !== 'visitor' && favoriteVisitors.length > 0 && <Divider />}
                
                {/* Regular Visitors */}
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' ,ml: 2,mb: 1}}>
                     
                      <Typography variant="body2" color="text.secondary" fontWeight={200}>
                       All Visitors
                      </Typography>
                    </Box>
                  
                {!loading && currentUserRole !== 'visitor' && visitors
                  .filter(visitor => !favoriteVisitors.some(f => f.visitorId === visitor.id))
                  .map((visitor) => (
                    <MenuItem key={visitor.id} value={visitor.id}>
                      {visitor.firstName} {visitor.lastName}
                      {visitor.company && ` (${visitor.company})`}
                    </MenuItem>
                  ))}
              </Select>
              {formErrors.visitorId && (
                <FormHelperText>{formErrors.visitorId}</FormHelperText>
              )}
            
              
              {loadingVisitorDetails && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Loading visitor details...
                  </Typography>
                </Box>
              )}
            </FormControl>
          </Grid>

          {/* Exhibitor Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.exhibitorId} disabled={loading || currentUserRole === 'exhibitor'}>
              <InputLabel>Select Exhibitor</InputLabel>
              <Select
                  value={meetingForm.exhibitorId || ''}
                  onChange={(e) => {
                    handleFormChange('exhibitorId', e.target.value);
                  }}
                  onOpen={() => {
                    console.log('🔍 Exhibitor Select opened');
                  }}
                  onClose={() => {
                    console.log('🔍 Exhibitor Select closed');
                  }}
                label="Select Exhibitor"
                startAdornment={
                  <Business sx={{ mr: 1, color: 'text.secondary' }} />
                }
              >
                {/* Loading state */}
                {loading && (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Loading exhibitors...
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                
                                {/* No exhibitors state */}
                {!loading && exhibitors.length === 0 && (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No exhibitors available
                    </Typography>
                  </MenuItem>
                )}
                
                {/* My Favorites Header */}
                {!loading && favoriteExhibitors.length > 0 && (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Favorite sx={{ mr: 1, color: 'error.main', fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary" fontWeight="medium">
                        My Favorites ({favoriteExhibitors.length})
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                
                {/* Favorite Exhibitors */}
                {!loading && favoriteExhibitors.map((favorite) => {
                  const exhibitor = exhibitors.find(e => e.id === favorite.id);
                  if (!exhibitor) return null;
                  return (
                    <MenuItem key={`fav-${exhibitor.id}`} value={exhibitor.id}>
                      {exhibitor.companyName || `${exhibitor.firstName} ${exhibitor.lastName}`}
                      {exhibitor.companyType && ` (${exhibitor.companyType})`}
                    </MenuItem>
                  );
                })}
                
                {/* Divider */}
                {!loading && favoriteExhibitors.length > 0 && <Divider />}
                
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' ,ml: 2,mb: 1}}>
                     
                      <Typography variant="body2" color="text.secondary" fontWeight={200}>
                       All Exhibitors
                      </Typography>
                    </Box>
                {/* Regular Exhibitors */}
                {!loading && exhibitors
                  .filter(exhibitor => !favoriteExhibitors.some(f => f.id === exhibitor.id))
                  .map((exhibitor) => (
                    <MenuItem key={exhibitor.id} value={exhibitor.id}>
                      {exhibitor.companyName || `${exhibitor.firstName} ${exhibitor.lastName}`}
                      {exhibitor.companyType && ` (${exhibitor.companyType})`}
                    </MenuItem>
                  ))}
              </Select>
              {formErrors.exhibitorId && (
                <FormHelperText>{formErrors.exhibitorId}</FormHelperText>
              )}
              
         
              

            </FormControl>
          </Grid>

          {/* Meeting Date */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Meeting Date"
              type="date"
              value={meetingForm.meetingDate}
              onChange={(e) => handleFormChange('meetingDate', e.target.value)}
              error={!!formErrors.meetingDate}
              helperText={formErrors.meetingDate}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <Event sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>

          {/* Start Time */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={meetingForm.startTime}
              onChange={(e) => handleFormChange('startTime', e.target.value)}
              error={!!formErrors.startTime}
              helperText={formErrors.startTime}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>

          {/* End Time */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="End Time"
              type="time"
              value={meetingForm.endTime}
              onChange={(e) => handleFormChange('endTime', e.target.value)}
              error={!!formErrors.endTime}
              helperText={formErrors.endTime}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>
        </Grid>
        </>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button 
          onClick={handleCloseDialog} 
          variant="outlined" 
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <ScheduleSend />}
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
        </Button>
      </DialogActions>
    </Dialog>
     </ResponsiveDashboardLayout>
     </RoleBasedRoute>
  );
}
