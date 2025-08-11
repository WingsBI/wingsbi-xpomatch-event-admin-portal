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
  Divider,
  ListSubheader,
  Avatar,
  SelectChangeEvent,
  Popover
} from '@mui/material';
import {
  ScheduleSend,
  Description,
  Person,
  Business,
  Event,
  AccessTime,
  Close,
  Favorite,
  LocationOn,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  AttachFile,
  InsertPhoto,
  InsertLink,
  CalendarToday,
  CheckCircle,
  Celebration
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
  attendiesId: number[];
  meetingDate: string;
  startTime: string;
  endTime: string;
  location?: string; // Optional location field
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
    attendiesId: [],
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState({
    date: '',
    time: '',
  });
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [favoriteVisitors, setFavoriteVisitors] = useState<any[]>([]);
  const [favoriteExhibitors, setFavoriteExhibitors] = useState<any[]>([]);
  const [selectedVisitorDetails, setSelectedVisitorDetails] = useState<any>(null);
  const [selectedExhibitorDetails, setSelectedExhibitorDetails] = useState<any>(null);
  const [loadingVisitorDetails, setLoadingVisitorDetails] = useState(false);
  const [loadingExhibitorDetails, setLoadingExhibitorDetails] = useState(false);
  const [showAttendeesPopover, setShowAttendeesPopover] = useState(false);

  const getSelectedAttendeesDisplay = () => {
    const names: string[] = [];
    
    // Show selected attendees from the form
    meetingForm.attendiesId.forEach(attendeeId => {
      // Check if it's a visitor
      const visitor = visitors.find(v => v.id === attendeeId);
      if (visitor) {
        names.push(`${visitor.firstName} ${visitor.lastName}`);
        return;
      }
      
      // Check if it's an exhibitor
      const exhibitor = exhibitors.find(e => e.id === attendeeId);
      if (exhibitor) {
        names.push(exhibitor.companyName || `${exhibitor.firstName} ${exhibitor.lastName}`);
      }
    });
    
    return names.join(', ') || 'Select attendees';
  };

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
            attendiesId: [exhibitorId]
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
            attendiesId: [visitorId]
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

  const handleFormChange = (field: keyof MeetingFormData, value: string | number | number[]) => {
    console.log('🔍 handleFormChange called:', field, value, 'Type:', typeof value);
    
    setMeetingForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Fetch details when attendees are selected
    if (field === 'attendiesId' && Array.isArray(value) && value.length > 0) {
      const lastSelectedId = value[value.length - 1];
      // Check if it's a visitor
      const visitor = visitors.find(v => v.id === lastSelectedId);
      if (visitor) {
        console.log('🔍 Fetching visitor details for ID:', lastSelectedId);
        fetchVisitorDetails(lastSelectedId);
      } else {
        // Check if it's an exhibitor
        const exhibitor = exhibitors.find(e => e.id === lastSelectedId);
        if (exhibitor) {
          console.log('🔍 Fetching exhibitor details for ID:', lastSelectedId);
          fetchExhibitorDetails(lastSelectedId);
        }
      }
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

    if (!meetingForm.attendiesId || meetingForm.attendiesId.length === 0) {
      errors.attendiesId = 'Please select at least one attendee';
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
        attendiesId: meetingForm.attendiesId,
        meetingDate: meetingForm.meetingDate,
        startTime: meetingForm.startTime,
        endTime: meetingForm.endTime
      };

      console.log('Submitting meeting data:', meetingData);

      // Call the createMeeting API
      const response = await apiService.createMeeting(identifier, meetingData);
      if (response.success) {
        // Show confirmation dialog with meeting details
        setConfirmationDetails({
          date: meetingForm.meetingDate,
          time: `${meetingForm.startTime} - ${meetingForm.endTime}`,
        });
        setShowConfirmation(true);
        setOpenDialog(false); // Hide the main dialog
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
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={false}
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          '& .MuiDialogContent-root': {
            p: 3
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        p: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleSend color="primary" fontSize="small" />
          <Typography variant="subtitle1" component="div">
            New meeting
          </Typography>
        </Box>
        <IconButton
          onClick={handleCloseDialog}
          disabled={isSubmitting}
          size="small"
          sx={{
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'rotate(90deg)',
              backgroundColor: 'action.hover',
            }
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
            {submitError}
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Loading participants...
            </Typography>
          </Box>
        )}
        
        {!loading && (
        <>
          {visitors.length === 0 && exhibitors.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }} variant="outlined">
              No participants found.
            </Alert>
          )}

          <Grid container spacing={2}>
          {/* Title Field */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                  mt: 1,
                  flexShrink: 0
                }}
              >
                <Description fontSize="small" />
              </Box>
              <TextField
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: 'none',
                    },
                    '& input': {
                      fontSize: '1.25rem',
                      fontWeight: 500,
                      padding: '0',
                      mt:1,
                      '&::placeholder': {
                        color: 'text.primary',
                        opacity: 1,
                      },
                    },
                  },
                }}
                placeholder="Add a title"
                value={meetingForm.agenda}
                onChange={(e) => handleFormChange('agenda', e.target.value)}
                variant="outlined"
                error={!!formErrors.agenda}
                helperText={formErrors.agenda}
                disabled={loading}
              />
            </Box>
          </Grid>

          {/* Attendees Selection */}
          <Grid item xs={12}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                placeholder="Invite attendees"
                onClick={() => setShowAttendeesPopover(true)}
                value={getSelectedAttendeesDisplay()}
                InputProps={{
                  startAdornment: (
                    <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                  readOnly: true,
                  sx: {
                    cursor: 'pointer',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                  }
                }}
              />
              <Popover
                open={showAttendeesPopover}
                onClose={() => setShowAttendeesPopover(false)}
                anchorEl={document.activeElement}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  sx: {
                    width: '100%',
                    maxWidth: 500,
                    mt: 1,
                    maxHeight: 500,
                    minHeight: 300,
                    overflow: 'auto'
                  }
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2">
                      Select Attendees
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setShowAttendeesPopover(false)}
                    >
                      Done
                    </Button>
                  </Box>
                  
                  {/* Visitor Selection - Only show if not a visitor */}
                  {currentUserRole !== 'visitor' && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                        Select Visitors
                      </Typography>
                      {!loading && visitors.map((visitor) => {
                        const isSelected = meetingForm.attendiesId.includes(visitor.id);
                        return (
                          <Box
                            key={visitor.id}
                            onClick={() => {
                              if (isSelected) {
                                // Remove visitor from selection
                                const updatedAttendees = meetingForm.attendiesId.filter(id => id !== visitor.id);
                                handleFormChange('attendiesId', updatedAttendees);
                              } else {
                                // Add visitor to selection
                                const updatedAttendees = [...meetingForm.attendiesId, visitor.id];
                                handleFormChange('attendiesId', updatedAttendees);
                              }
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              p: 1,
                              cursor: 'pointer',
                              borderRadius: 1,
                              bgcolor: isSelected ? 'primary.light' : 'transparent',
                              '&:hover': {
                                bgcolor: isSelected ? 'primary.main' : 'action.hover'
                              }
                            }}
                          >
                            <Box sx={{ position: 'relative' }}>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32,
                                  bgcolor: isSelected ? 'white' : `#${Math.floor(Math.random()*16777215).toString(16)}`
                                }}
                              >
                                {visitor.firstName[0]}
                              </Avatar>
                              {isSelected && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    bgcolor: '#00E676',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                  }}
                                >
                                  <CheckCircle sx={{ color: 'white', fontSize: 10 }} />
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ color: isSelected ? 'white' : 'inherit' }}>
                                {visitor.firstName} {visitor.lastName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: isSelected ? 'white' : 'text.secondary' }}>
                                {visitor.email}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  {/* Exhibitor Selection - Only show if not an exhibitor */}
                  {currentUserRole !== 'exhibitor' && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium', mt: 2 }}>
                        Select Exhibitors
                      </Typography>
                      {!loading && exhibitors.map((exhibitor) => {
                        const isSelected = meetingForm.attendiesId.includes(exhibitor.id);
                        return (
                          <Box
                            key={exhibitor.id}
                            onClick={() => {
                              if (isSelected) {
                                // Remove exhibitor from selection
                                const updatedAttendees = meetingForm.attendiesId.filter(id => id !== exhibitor.id);
                                handleFormChange('attendiesId', updatedAttendees);
                              } else {
                                // Add exhibitor to selection
                                const updatedAttendees = [...meetingForm.attendiesId, exhibitor.id];
                                handleFormChange('attendiesId', updatedAttendees);
                              }
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              p: 1,
                              cursor: 'pointer',
                              borderRadius: 1,
                              bgcolor: isSelected ? 'primary.light' : 'transparent',
                              '&:hover': {
                                bgcolor: isSelected ? 'primary.main' : 'action.hover'
                              }
                            }}
                          >
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: isSelected ? 'white' : `#${Math.floor(Math.random()*16777215).toString(16)}`
                              }}
                            >
                              {exhibitor.companyName?.[0] || exhibitor.firstName?.[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ color: isSelected ? 'white' : 'inherit' }}>
                                {exhibitor.companyName || `${exhibitor.firstName} ${exhibitor.lastName}`}
                              </Typography>
                              <Typography variant="caption" sx={{ color: isSelected ? 'white' : 'text.secondary' }}>
                                {exhibitor.email}
                              </Typography>
                            </Box>
                            {isSelected && (
                              <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Popover>
            </Box>
            {formErrors.attendiesId && (
              <FormHelperText error>
                {formErrors.attendiesId}
              </FormHelperText>
            )}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '40px',
                  width: '100%',
                  '& input': {
                    padding: '8px 12px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '0.875rem',
                },
              }}
            />
          </Grid>

          {/* Start Time */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth error={!!formErrors.startTime} disabled={loading}>
              <InputLabel>Start Time</InputLabel>
              <Select
                value={meetingForm.startTime}
                onChange={(e) => handleFormChange('startTime', e.target.value)}
                label="Start Time"
                startAdornment={
                  <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                  },
                  '& .MuiSelect-select': {
                    padding: '8px 12px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                  },
                }}
              >
                {Array.from({ length: 48 }, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const minute = i % 2 === 0 ? '00' : '30';
                  const ampm = hour < 12 ? 'AM' : 'PM';
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;
                  const displayTime = `${displayHour}:${minute} ${ampm}`;
                  return (
                    <MenuItem key={timeValue} value={timeValue}>
                      {displayTime}
                    </MenuItem>
                  );
                })}
              </Select>
              {formErrors.startTime && (
                <FormHelperText>{formErrors.startTime}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* End Time */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth error={!!formErrors.endTime} disabled={loading}>
              <InputLabel>End Time</InputLabel>
              <Select
                value={meetingForm.endTime}
                onChange={(e) => handleFormChange('endTime', e.target.value)}
                label="End Time"
                startAdornment={
                  <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                  },
                  '& .MuiSelect-select': {
                    padding: '8px 12px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                  },
                }}
              >
                {Array.from({ length: 48 }, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const minute = i % 2 === 0 ? '00' : '30';
                  const ampm = hour < 12 ? 'AM' : 'PM';
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;
                  const displayTime = `${displayHour}:${minute} ${ampm}`;
                  return (
                    <MenuItem 
                      key={timeValue} 
                      value={timeValue}
                      disabled={timeValue <= meetingForm.startTime}
                    >
                      {displayTime}
                    </MenuItem>
                  );
                })}
              </Select>
              {formErrors.endTime && (
                <FormHelperText>{formErrors.endTime}</FormHelperText>
              )}
            </FormControl>
          </Grid>

         

        </Grid>
        </>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        borderTop: '1px solid',
        borderColor: 'divider',
        gap: 1
      }}>
        <Button 
          onClick={handleCloseDialog} 
          size="small"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          size="small"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={14} /> : <ScheduleSend fontSize="small" />}
        >
          {isSubmitting ? 'Scheduling...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Confirmation Dialog */}
    <Dialog
      open={showConfirmation}
      onClose={() => {}}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #1976d2, #42a5f5, #90caf9)',
          }
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider', 
          pb: 3,
          pt: 3,
          px: 3,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              animation: 'pulse 2s infinite'
            }}
          >
            <CheckCircle sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5
              }}
            >
              Meeting Scheduled Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Your meeting has been confirmed 
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 4, px: 3, pb: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', fontWeight: 500 }}>
            Meeting Details:
          </Typography>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%)',
            borderRadius: 2,
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              background: 'linear-gradient(180deg, #1976d2, #42a5f5)',
              borderRadius: '0 2px 2px 0'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CalendarToday sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {confirmationDetails.date}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccessTime sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {confirmationDetails.time}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
          border: '1px solid',
          borderColor: 'success.light'
        }}>
          <Celebration sx={{ color: 'success.main', fontSize: 20 }} />
          <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 500 }}>
            All participants will receive invitations 
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid', 
        borderColor: 'divider', 
        p: 3,
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        <Button
          variant="contained"
          onClick={() => {
            setShowConfirmation(false);
            router.push(`/${identifier}/event-admin/meetings?view=list`);
          }}
          autoFocus
          startIcon={<ScheduleSend />}
          sx={{
            background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0, #1976d2)',
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          View All Meetings
        </Button>
      </DialogActions>
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Dialog>
     </ResponsiveDashboardLayout>
     </RoleBasedRoute>
  );
}