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
  IconButton
} from '@mui/material';
import {
  ScheduleSend,
  Description,
  Person,
  Business,
  Event,
  AccessTime,
  Close
} from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import { apiService } from '@/services/apiService';
import { addNotification } from '@/store/slices/appSlice';
import { getCurrentUser, getCurrentExhibitorId, getCurrentVisitorId } from '@/utils/authUtils';

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
  useEffect(() => {
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

    if (identifier) {
      loadParticipantsData();
    }
  }, [identifier]);

  const handleFormChange = (field: keyof MeetingFormData, value: string | number) => {
    setMeetingForm(prev => ({
      ...prev,
      [field]: value
    }));

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
                onChange={(e) => handleFormChange('visitorId', e.target.value)}
                label="Select Visitor"
                startAdornment={
                  <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }
              >
                {currentUserRole === 'visitor' ? (
                  // Show current visitor info when user is a visitor
                  <MenuItem value={currentUserId || ''} disabled>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {visitors.find(v => v.id === currentUserId)?.firstName || 'Current'} {visitors.find(v => v.id === currentUserId)?.lastName || 'Visitor'}
                      </Typography>
                      {visitors.find(v => v.id === currentUserId)?.company && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {visitors.find(v => v.id === currentUserId)?.company}
                        </Typography>
                      )}
                      {/* <Typography variant="caption" color="text.secondary">
                        (You)
                      </Typography> */}
                    </Box>
                  </MenuItem>
                ) : visitors.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No visitors available
                    </Typography>
                  </MenuItem>
                ) : (
                  visitors.map((visitor) => (
                    <MenuItem key={visitor.id} value={visitor.id}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {visitor.firstName} {visitor.lastName}
                        </Typography>
                        {/* <Typography variant="caption" color="text.secondary">
                          {visitor.email}
                        </Typography> */}
                        {visitor.company && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {visitor.company}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
              {formErrors.visitorId && (
                <FormHelperText>{formErrors.visitorId}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Exhibitor Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.exhibitorId} disabled={loading || currentUserRole === 'exhibitor'}>
              <InputLabel>Select Exhibitor</InputLabel>
              <Select
                value={meetingForm.exhibitorId}
                onChange={(e) => handleFormChange('exhibitorId', e.target.value)}
                label="Select Exhibitor"
                startAdornment={
                  <Business sx={{ mr: 1, color: 'text.secondary' }} />
                }
              >
                {currentUserRole === 'exhibitor' ? (
                  // Show current exhibitor info when user is an exhibitor
                  <MenuItem value={currentUserId || ''} disabled>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {exhibitors.find(e => e.id === currentUserId)?.companyName || 'Current Exhibitor'}
                      </Typography>
                      {exhibitors.find(e => e.id === currentUserId)?.companyType && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {exhibitors.find(e => e.id === currentUserId)?.companyType}
                        </Typography>
                      )}
                      {/* <Typography variant="caption" color="text.secondary">
                        (You)
                      </Typography> */}
                    </Box>
                  </MenuItem>
                ) : exhibitors.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No exhibitors available
                    </Typography>
                  </MenuItem>
                ) : (
                  exhibitors.map((exhibitor) => (
                    <MenuItem key={exhibitor.id} value={exhibitor.id}>
                      <Box>
                        {/* <Typography variant="body2" fontWeight="medium">
                          {exhibitor.firstName} {exhibitor.lastName}
                        </Typography> */}
                        {exhibitor.companyName && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {exhibitor.companyName}
                          </Typography>
                        )}
                        {/* <Typography variant="caption" color="text.secondary">
                          {exhibitor.email}
                        </Typography> */}
                        {exhibitor.companyType && (
                          <Typography variant="caption" color="text.secondary">
                            {exhibitor.companyType}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
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
