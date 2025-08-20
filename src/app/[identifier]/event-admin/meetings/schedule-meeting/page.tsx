'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { apiService, eventsApi } from '@/services/apiService';
import { addNotification } from '@/store/slices/appSlice';
import { getCurrentUser, getCurrentExhibitorId, getCurrentVisitorId } from '@/utils/authUtils';
import { FavoritesManager } from '@/utils/favoritesManager';
import { AutoSizer, List as VirtualList } from 'react-virtualized';
import GroupAddIcon from '@mui/icons-material/GroupAdd';


interface MeetingFormData {
  agenda: string;
  description: string;
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
  companyLogo?: string;
  fullData?: any;
  exhibitorId?: number; // Store the original exhibitor ID for reference
}

export default function ScheduleMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const identifier = params.identifier as string;

  const [meetingForm, setMeetingForm] = useState<MeetingFormData>({
    agenda: '',
    description: '',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserDetails, setCurrentUserDetails] = useState<any>(null);
  const [attendeeAnchorEl, setAttendeeAnchorEl] = useState<HTMLElement | null>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<HTMLElement | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const getSelectedAttendeesDisplay = () => {
    const names: string[] = [];
    
    console.log('🔍 getSelectedAttendeesDisplay - Selected IDs:', meetingForm.attendiesId);
    console.log('🔍 Available visitors count:', visitors.length);
    console.log('🔍 Available exhibitors count:', exhibitors.length);
    
    // Show selected attendees from the form
    meetingForm.attendiesId.forEach(attendeeId => {
      console.log('🔍 Looking for attendee ID:', attendeeId, 'Type:', typeof attendeeId);
      
      // Since we're in visitor role, we should only be selecting exhibitors
      // Check exhibitors first to avoid ID collision
      const exhibitor = exhibitors.find(e => e.id === attendeeId);
      if (exhibitor) {
        console.log('🔍 Found exhibitor:', exhibitor.companyName || `${exhibitor.firstName} ${exhibitor.lastName}`);
        
        // Format: "Company Name (Contact Name)"
        const contactName = `${exhibitor.firstName} ${exhibitor.lastName}`.trim();
        const companyName = exhibitor.companyName || 'Unknown Company';
        const displayName = contactName ? `${companyName} (${contactName})` : companyName;
        
        names.push(displayName);
        return;
      }
      
      // Only check visitors if we're in exhibitor role
      if (currentUserRole === 'exhibitor') {
      const visitor = visitors.find(v => v.id === attendeeId);
      if (visitor) {
          console.log('🔍 Found visitor:', visitor.firstName, visitor.lastName);
        names.push(`${visitor.firstName} ${visitor.lastName}`);
        return;
      }
      }
      
      console.log('🔍 No attendee found for ID:', attendeeId);
    });
    
    console.log('🔍 Final names array:', names);
    return names.join(', ') || 'Invite attendees';
  };

  // Filter attendees based on search query and exclude current user
  const getFilteredVisitors = () => {
    return visitors.filter(visitor => {
      // Exclude current user if they are a visitor
      if (currentUserRole === 'visitor' && visitor.id === currentUserId) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const fullName = `${visitor.firstName} ${visitor.lastName}`.toLowerCase();
        const company = (visitor.company || '').toLowerCase();
        const jobTitle = (visitor.jobTitle || '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               company.includes(searchLower) || 
               jobTitle.includes(searchLower);
      }
      
      return true;
    });
  };

  const getFilteredExhibitors = () => {
    return exhibitors.filter(exhibitor => {
      // Exclude current user if they are an exhibitor
      if (currentUserRole === 'exhibitor' && (exhibitor.id === currentUserId || exhibitor.exhibitorId === currentUserId)) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const fullName = `${exhibitor.firstName} ${exhibitor.lastName}`.toLowerCase();
        const companyName = (exhibitor.companyName || '').toLowerCase();
        const jobTitle = (exhibitor.jobTitle || '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               companyName.includes(searchLower) || 
               jobTitle.includes(searchLower);
      }
      
      return true;
    });
  };

  // Initialize current user data
  useEffect(() => {
    const currentUser = getCurrentUser();
    console.log('ScheduleMeeting - Current user:', currentUser);
    
    if (currentUser) {
      setCurrentUserRole(currentUser.role);
      // Use email as display name or extract name from email
      const displayName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
      setCurrentUserName(displayName);
      console.log('ScheduleMeeting - User role:', currentUser.role);
      console.log('ScheduleMeeting - User email:', currentUser.email);
      console.log('ScheduleMeeting - Display name:', displayName);
      
      // Set the appropriate ID based on user role
      if (currentUser.role === 'exhibitor') {
        const exhibitorId = getCurrentExhibitorId();
        console.log('ScheduleMeeting - Exhibitor ID:', exhibitorId);
        setCurrentUserId(exhibitorId);
        // Don't auto-add current user to attendees - they are the organizer
      } else if (currentUser.role === 'visitor') {
        const visitorId = getCurrentVisitorId();
        console.log('ScheduleMeeting - Visitor ID:', visitorId);
        setCurrentUserId(visitorId);
        // Don't auto-add current user to attendees - they are the organizer
      }
    }
  }, []);

  // Load participants data
    const loadParticipantsData = async () => {
      try {
        setLoading(true);
        
        // Load data based on user role to reduce initial load time
        let visitorsResponse, exhibitorsResponse;
        
        if (currentUserRole === 'visitor') {
          // Visitors only need exhibitors data
          exhibitorsResponse = await fieldMappingApi.getAllExhibitors(identifier);
        } else if (currentUserRole === 'exhibitor') {
          // Exhibitors only need visitors data
          visitorsResponse = await apiService.getAllVisitors(identifier);
        } else {
          // Event admins need both - load in parallel
          [visitorsResponse, exhibitorsResponse] = await Promise.all([
          apiService.getAllVisitors(identifier),
          fieldMappingApi.getAllExhibitors(identifier)
        ]);
        }

        // Process visitors data
        let transformedVisitors: Visitor[] = [];
        if (visitorsResponse && visitorsResponse.success && visitorsResponse.data?.result) {
          transformedVisitors = visitorsResponse.data.result.map((visitor: any) => ({
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
        let transformedExhibitors: Exhibitor[] = [];
        if (exhibitorsResponse && exhibitorsResponse.statusCode === 200 && exhibitorsResponse.result) {
          console.log('Raw exhibitors data:', exhibitorsResponse.result);
          transformedExhibitors = exhibitorsResponse.result.map((exhibitor: any) => {
            console.log('Processing exhibitor:', exhibitor);
            
            // Get the primary contact from exhibitorToUserMaps
            const primaryContact = exhibitor.exhibitorToUserMaps?.find((user: any) => user.isPrimaryContact) || 
                                   exhibitor.exhibitorToUserMaps?.[0];
            
            return {
              id: primaryContact?.userId || exhibitor.id, // Use userId from exhibitorToUserMaps instead of exhibitor.id
              firstName: primaryContact?.firstName || '',
              lastName: primaryContact?.lastName || '',
              email: primaryContact?.email || '',
              companyName: exhibitor.companyName,
              companyType: exhibitor.companyType,
              jobTitle: primaryContact?.designation || primaryContact?.jobTitle || '',
              companyLogo: exhibitor.companyLogoPath,
              // Store the full exhibitor data for display purposes
              fullData: exhibitor,
              // Store the original exhibitor ID for reference
              exhibitorId: exhibitor.id
            };
          });
          console.log('Transformed exhibitors:', transformedExhibitors);
          setExhibitors(transformedExhibitors);
        } else {
          console.error('Failed to load exhibitors:', exhibitorsResponse || 'No response');
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

  // Load participants data when component mounts - only when user role is available
  useEffect(() => {
    if (currentUserRole) {
      loadParticipantsData();
    }
  }, [identifier, currentUserRole]);

  // Helper function to convert UTC to IST
  const convertUTCToIST = (utcDateString: string) => {
    const utcDate = new Date(utcDateString);
    return new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
  };

  // Load event details
  const loadEventDetails = async () => {
    try {
      const response = await eventsApi.getEventDetails(identifier);
      
      if (response.success && response.data?.result && response.data.result.length > 0) {
        const eventData = response.data.result[0]; // Take the first event from the array
        setEventDetails(eventData);
      } else {
        console.error('Failed to load event details:', response);
      }
    } catch (error) {
      console.error('Error loading event details:', error);
    }
  };

  // Load event details when component mounts
  useEffect(() => {
    loadEventDetails();
  }, [identifier]);

  // Set calendar date to event start date when event details are loaded
  useEffect(() => {
    if (eventDetails && eventDetails.startDateTime) {
      const eventStart = convertUTCToIST(eventDetails.startDateTime);
      setCurrentCalendarDate(eventStart);
    }
  }, [eventDetails]);

  // Set current user details after participants are loaded
  useEffect(() => {
    if (currentUserId && currentUserRole && (visitors.length > 0 || exhibitors.length > 0)) {
      let userDetails = null;
      if (currentUserRole === 'visitor') {
        userDetails = visitors.find(v => v.id === currentUserId);
      } else if (currentUserRole === 'exhibitor') {
        // For exhibitors, we need to find by the original exhibitor ID or user ID
        userDetails = exhibitors.find(e => e.id === currentUserId || e.exhibitorId === currentUserId);
      }
      
      if (userDetails) {
        setCurrentUserDetails(userDetails);
        const displayName = currentUserRole === 'exhibitor' 
          ? (userDetails as Exhibitor).companyName || `${userDetails.firstName} ${userDetails.lastName}`
          : `${userDetails.firstName} ${userDetails.lastName}`;
        setCurrentUserName(displayName);
        console.log('Found current user details:', userDetails);
        console.log('Set display name:', displayName);
      }
    }
  }, [currentUserId, currentUserRole, visitors, exhibitors]);

  // Helper functions for event date and time restrictions
  const getEventDays = () => {
    if (!eventDetails) return [];
    
    // Convert UTC times to IST (UTC+5:30)
    const eventStart = convertUTCToIST(eventDetails.startDateTime);
    const eventEnd = convertUTCToIST(eventDetails.endDateTime);
    const days = [];
    
    // Set start to beginning of day
    const startDate = new Date(eventStart);
    startDate.setHours(0, 0, 0, 0);
    
    // Set end to end of day
    const endDate = new Date(eventEnd);
    endDate.setHours(23, 59, 59, 999);
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getEventTimeSlots = () => {
    if (!eventDetails || !eventDetails.startDateTime || !eventDetails.endDateTime) {
      console.log('🔍 No event details or invalid dates, using default business hours');
      return [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // Default business hours
    }
    
    // Convert UTC times to IST (UTC+5:30)
    const eventStart = convertUTCToIST(eventDetails.startDateTime);
    const eventEnd = convertUTCToIST(eventDetails.endDateTime);
    const slots = [];
    
    // Check if dates are valid
    if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
      console.log('🔍 Invalid event dates, using default business hours');
      return [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // Default business hours
    }
    
    // Use event start/end times (in IST)
    const startHour = eventStart.getHours();
    const endHour = eventEnd.getHours();
    
    // If the hours don't make sense (e.g., 0:00), use default business hours
    if (startHour === 0 && endHour === 0) {
      const defaultStartHour = 9;
      const defaultEndHour = 18;
      
      // Generate time slots from start to end hour
      for (let hour = defaultStartHour; hour <= defaultEndHour; hour++) {
        slots.push(hour);
      }
    } else {
      // Generate time slots from start to end hour
      for (let hour = startHour; hour <= endHour; hour++) {
        slots.push(hour);
      }
    }
    
    return slots;
  };

  const getAvailableEndTimes = (startTime: string) => {
    if (!startTime) return [];
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const eventTimeSlots = getEventTimeSlots();
    const endTimes = [];
    
    // If we have event details, use event time range, otherwise use full day
    const startHourLimit = eventTimeSlots.length > 0 ? Math.min(...eventTimeSlots) : 0;
    const endHourLimit = eventTimeSlots.length > 0 ? Math.max(...eventTimeSlots) : 23;
    
    for (let hour = startHour; hour <= endHourLimit; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip if this time is before or equal to start time
        if (hour === startHour && minute <= startMinute) {
          continue;
        }
        
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        endTimes.push(timeValue);
      }
    }
    
    return endTimes;
  };

  const isDateInEventRange = (date: string) => {
    if (!eventDetails) return true; // Allow all dates if no event details
    
    // Create date string in YYYY-MM-DD format for comparison
    const selectedDate = new Date(date + 'T00:00:00');
    
    // Convert UTC times to IST (UTC+5:30)
    const eventStart = convertUTCToIST(eventDetails.startDateTime);
    const eventEnd = convertUTCToIST(eventDetails.endDateTime);
    
    // Set times to beginning and end of day for comparison
    const eventStartDate = new Date(eventStart);
    eventStartDate.setHours(0, 0, 0, 0);
    
    const eventEndDate = new Date(eventEnd);
    eventEndDate.setHours(23, 59, 59, 999);
    
    return selectedDate >= eventStartDate && selectedDate <= eventEndDate;
  };

  const getEventDateOptions = () => {
    if (!eventDetails) return [];
    
    // Convert UTC times to IST (UTC+5:30)
    const eventStart = convertUTCToIST(eventDetails.startDateTime);
    const eventEnd = convertUTCToIST(eventDetails.endDateTime);
    const dates = [];
    
    // Check if dates are valid
    if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
      return [];
    }
    
    // Set start to beginning of day
    const startDate = new Date(eventStart);
    startDate.setHours(0, 0, 0, 0);
    
    // Set end to end of day
    const endDate = new Date(eventEnd);
    endDate.setHours(23, 59, 59, 999);
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = new Date(currentDate).toISOString().split('T')[0];
      dates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const isTimeInEventRange = (time: string) => {
    if (!eventDetails) return true; // Allow all times if no event details
    
    const [hours, minutes] = time.split(':').map(Number);
    // Convert UTC times to IST (UTC+5:30)
    const eventStart = convertUTCToIST(eventDetails.startDateTime);
    const eventEnd = convertUTCToIST(eventDetails.endDateTime);
    
    const eventStartHour = eventStart.getHours();
    const eventEndHour = eventEnd.getHours();
    
    return hours >= eventStartHour && hours <= eventEndHour;
  };

  // Helper function to get formatted event date range for display
  const getEventDateRangeDisplay = () => {
    if (!eventDetails) return '';
    
    const eventStart = convertUTCToIST(eventDetails.startDateTime);
    const eventEnd = convertUTCToIST(eventDetails.endDateTime);
    
    const startDate = eventStart.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const endDate = eventEnd.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return `${startDate} - ${endDate}`;
  };

  // Helper function to get formatted event time range for display
  const getEventTimeRangeDisplay = () => {
    if (!eventDetails) return '';
    
    const eventStart = convertUTCToIST(eventDetails.startDateTime);
    const eventEnd = convertUTCToIST(eventDetails.endDateTime);
    
    const startTime = eventStart.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const endTime = eventEnd.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${startTime} - ${endTime}`;
  };

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
      // Find the exhibitor to get the original exhibitor ID
      const exhibitor = exhibitors.find(e => e.id === exhibitorId);
      const originalExhibitorId = exhibitor?.exhibitorId || exhibitorId;
      
      console.log('🔍 Using original exhibitor ID for API call:', originalExhibitorId);
      console.log('🔍 Calling getExhibitorById API...');
      const response = await fieldMappingApi.getExhibitorById(identifier, originalExhibitorId);
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

    // Reset end time if start time changes and end time is now invalid
    if (field === 'startTime' && typeof value === 'string') {
      const currentEndTime = meetingForm.endTime;
      if (currentEndTime && value >= currentEndTime) {
        setMeetingForm(prev => ({ ...prev, endTime: '' }));
        console.log('🔍 Reset end time because start time changed to:', value);
      }
    }

    // Fetch details when attendees are selected
    if (field === 'attendiesId' && Array.isArray(value) && value.length > 0) {
      const lastSelectedId = value[value.length - 1];
      console.log('🔍 Last selected attendee ID:', lastSelectedId);
      
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
          console.log('🔍 Selected exhibitor:', { id: exhibitor.id, exhibitorId: exhibitor.exhibitorId, companyName: exhibitor.companyName });
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

    // Description is optional, so no validation needed

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
      // Log the selected attendee IDs for debugging
      console.log('🔍 Selected attendee IDs:', meetingForm.attendiesId);
      console.log('🔍 Available exhibitors:', exhibitors.map(e => ({ id: e.id, exhibitorId: e.exhibitorId, companyName: e.companyName })));
      console.log('🔍 Available visitors:', visitors.map(v => ({ id: v.id, name: `${v.firstName} ${v.lastName}` })));

      const meetingData = {
        agenda: meetingForm.agenda,
        description: meetingForm.description, // Commented out as requested
        attendiesId: meetingForm.attendiesId,
        meetingDate: meetingForm.meetingDate,
        startTime: meetingForm.startTime,
        endTime: meetingForm.endTime
      };

      console.log('Submitting meeting data:', meetingData);

      // Call the createMeeting API
      const response = await apiService.createMeeting(identifier, meetingData);
      if (response.success) {
        // Show success notification
        dispatch(addNotification({
          type: 'success',
          message: `Meeting Scheduled Successfully! Your meeting "${meetingForm.agenda}" has been scheduled for ${meetingForm.meetingDate} at ${meetingForm.startTime}.`
        }));
        
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
    // Navigate back to meetings page with refresh parameter
    router.push(`/${identifier}/event-admin/meetings?refresh=true`);
  };

  // Calendar navigation functions
  const handlePreviousMonth = () => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handlePreviousYear = () => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() - 1);
      return newDate;
    });
  };

  const handleNextYear = () => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentCalendarDate(new Date());
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Only set today if it's within the event range
    if (isDateInEventRange(todayStr)) {
      handleFormChange('meetingDate', todayStr);
    }
    setDatePickerAnchorEl(null);
  };

  return (
    <RoleBasedRoute allowedRoles={['visitor', 'event-admin', 'exhibitor']}>
    <ResponsiveDashboardLayout 
      title="Meetings">
    <Dialog 
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: 800,
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
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
        p: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleSend color="primary" fontSize="small" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Schedule New Meeting
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
      
      <DialogContent sx={{ 
        p: 3, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
            {submitError}
          </Alert>
        )}
        
        {/* Meeting Organizer Information */}
        <Box sx={{ 
          mb: 1, 
          p: 1, 
          borderRadius: 2, 
          bgcolor: 'primary.50', 
          //border: '1px solid',
          //borderColor: 'primary.200'
        }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'primary.main', fontWeight: 400 }}>
            Meeting Organizer
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              sx={{ 
                width: 20, 
                height: 20,
                bgcolor: 'primary.main',
                fontSize: '0.875rem'
              }}
            >
              {currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                {currentUserName || 'Loading...'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', lineHeight: 1.2 }}>
                {currentUserRole} • You are scheduling this meeting
              </Typography>
            </Box>
          </Box>
        </Box>
       
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1.5 }}>
              Loading participants...
            </Typography>
          </Box>
        )}
        
        {!loading && (
        <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
          {visitors.length === 0 && exhibitors.length === 0 && (
            <Alert severity="warning" sx={{ mb: 3 }} variant="outlined">
              No participants found.
            </Alert>
          )}

          <Grid container spacing={3}>
          {/* Title Field */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1,mt:-2 }}>
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
                  mt: 2,
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
                      fontSize: '1rem',
                      fontWeight: 400,
                      padding: '0',
                      mt:2,
                      '&::placeholder': {
                        color: 'grey.400',
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
            <Divider sx={{ mt: 1, mb: 0 }} />
          </Grid>

         

          {/* Attendees Selection */}
          <Grid item xs={12}>
            <Box sx={{ position: 'relative' }}>
              {/* <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                Meeting Attendees
              </Typography> */}
             
              <TextField
                fullWidth
                placeholder="Invite attendees"
                onClick={(e) => {
                  setAttendeeAnchorEl(e.currentTarget);
                  setShowAttendeesPopover(true);
                }}
                value={getSelectedAttendeesDisplay()}
                InputProps={{
                  startAdornment: (
                    <GroupAddIcon sx={{ ml: -1,mr: 1, color: 'text.secondary' }} />
                  ),
                  endAdornment: (
                    <Box sx={{ 
                      transform: showAttendeesPopover ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}>
                      ▼
                    </Box>
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
                onClose={() => {
                  setShowAttendeesPopover(false);
                  setAttendeeAnchorEl(null);
                }}
                anchorEl={attendeeAnchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                PaperProps={{
                  sx: {
                    width: '100%',
                    maxWidth: 500,
                    mt: 1,
                    maxHeight: 500,
                    minHeight: 250,
                    overflow: 'hidden',
                    borderRadius: 3,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }
                }}
              >
                <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexShrink: 0 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                        Select Meeting Attendees
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setShowAttendeesPopover(false);
                        setAttendeeAnchorEl(null);
                      }}
                      sx={{ 
                        minWidth: 70, 
                        height: 32, 
                        fontSize: '0.8rem',
                        borderRadius: 2,
                        textTransform: 'none'
                      }}
                    >
                      Done
                    </Button>
                  </Box>

                  {/* Search Bar */}
                  <Box sx={{ mb: 3, flexShrink: 0 }}>
                    <TextField
                      fullWidth
                      placeholder="Search attendees by name, company, or job title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                  
                  {/* Scrollable attendee lists container */}
                  <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
                  
                  {/* Visitor Selection - Only show if not a visitor */}
                  {currentUserRole !== 'visitor' && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.75, 
                        mb: 1.5,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'info.50',
                        border: '1px solid',
                        borderColor: 'info.200'
                      }}>
                        <Person sx={{ color: 'info.main', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main', fontSize: '0.875rem' }}>
                          Visitors ({getFilteredVisitors().length} available)
                        </Typography>
                      </Box>
                      {!loading && getFilteredVisitors().length > 0 ? (
                        <Box sx={{ height: 260 }}>
                          <AutoSizer>
                            {({ width, height }) => {
                              const filtered = getFilteredVisitors();
                              const rowHeight = 76;
                              const rowRenderer = ({ index, key, style }: any) => {
                                const visitor = filtered[index];
                        const isSelected = meetingForm.attendiesId.includes(visitor.id);
                        return (
                                  <div key={key} style={style}>
                          <Box
                            onClick={() => {
                              if (isSelected) {
                                          handleFormChange('attendiesId', meetingForm.attendiesId.filter(id => id !== visitor.id));
                              } else {
                                          handleFormChange('attendiesId', [...meetingForm.attendiesId, visitor.id]);
                              }
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              px: 2,
                              py: 1.5,
                              cursor: 'pointer',
                              borderRadius: 2,
                              bgcolor: isSelected ? 'primary.50' : 'transparent',
                             // border: '1px solid',
                             // borderColor: isSelected ? 'primary.200' : 'grey.200',
                              mb: 1,
                              '&:hover': {
                                bgcolor: isSelected ? 'primary.100' : 'grey.50',
                                borderColor: isSelected ? 'primary.300' : 'primary.200',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              },
                              transition: 'all 0.2s ease',
                              position: 'relative'
                            }}
                          >
                            <Box sx={{ position: 'relative' }}>
                              <Avatar 
                                sx={{ 
                                  width: 40, 
                                  height: 40,
                                            bgcolor: isSelected ? 'primary.main' : 'grey.400'
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
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    bgcolor: '#00E676',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white'
                                  }}
                                >
                                  <CheckCircle sx={{ fontSize: 12, color: 'white' }} />
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ flex: 1, px: 0.5 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.3 }}>
                                {visitor.firstName} {visitor.lastName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.2, mt: 0.25 }}>
                                {visitor.company || 'No company'}
                              </Typography>
                              {visitor.jobTitle && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.1 }}>
                                  {visitor.jobTitle}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                                  </div>
                                );
                              };
                              return (
                                <VirtualList
                                  width={width}
                                  height={height}
                                  rowCount={filtered.length}
                                  rowHeight={rowHeight}
                                  rowRenderer={rowRenderer}
                                />
                              );
                            }}
                          </AutoSizer>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          p: 3, 
                          textAlign: 'center', 
                          color: 'text.secondary',
                          border: '1px dashed',
                          borderColor: 'grey.300',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2">
                            {searchQuery ? 'No visitors found matching your search.' : 'No visitors available.'}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Exhibitor Selection - Only show if not an exhibitor */}
                  {currentUserRole !== 'exhibitor' && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.75, 
                        mb: 1.5,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'success.50',
                        border: '1px solid',
                        borderColor: 'success.200'
                      }}>
                        <Business sx={{ color: 'success.main', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main', fontSize: '0.875rem' }}>
                          Exhibitors ({getFilteredExhibitors().length} available)
                        </Typography>
                      </Box>
                      {!loading && getFilteredExhibitors().length > 0 ? (
                        <Box sx={{ height: 260 }}>
                          <AutoSizer>
                            {({ width, height }) => {
                              const filtered = getFilteredExhibitors();
                              const rowHeight = 76;
                              const rowRenderer = ({ index, key, style }: any) => {
                                const exhibitor = filtered[index];
                        const isSelected = meetingForm.attendiesId.includes(exhibitor.id);
                        return (
                                  <div key={key} style={style}>
                          <Box
                            onClick={() => {
                              if (isSelected) {
                                          handleFormChange('attendiesId', meetingForm.attendiesId.filter(id => id !== exhibitor.id));
                              } else {
                                          handleFormChange('attendiesId', [...meetingForm.attendiesId, exhibitor.id]);
                              }
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              px: 2,
                              py: 1.5,
                              cursor: 'pointer',
                              borderRadius: 2,
                              bgcolor: isSelected ? 'success.50' : 'transparent',
                             // border: '1px solid',
                             // borderColor: isSelected ? 'success.200' : 'grey.200',
                              mb: 1,
                              '&:hover': {
                                bgcolor: isSelected ? 'success.100' : 'grey.50',
                                borderColor: isSelected ? 'success.300' : 'success.200',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              },
                              transition: 'all 0.2s ease',
                              position: 'relative'
                            }}
                          >
                            <Box sx={{ position: 'relative' }}>
                              <Avatar 
                                sx={{ 
                                  width: 40, 
                                  height: 40,
                                            bgcolor: isSelected ? 'success.main' : 'grey.400'
                                }}
                                          src={exhibitor.companyLogo ? (exhibitor.companyLogo.startsWith('http') ? exhibitor.companyLogo : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://xpomatch-dev-event-admin-api.azurewebsites.net'}/${exhibitor.companyLogo.replace(/^\/+/, '')}`) : undefined}
                              >
                                {exhibitor.companyName?.[0] || exhibitor.firstName?.[0]}
                              </Avatar>
                              {isSelected && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    bgcolor: '#00E676',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white'
                                  }}
                                >
                                  <CheckCircle sx={{ fontSize: 12, color: 'white' }} />
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ flex: 1, px: 0.5 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.3 }}>
                                  {exhibitor.companyName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.2, mt: 0.25 }}>
                                {exhibitor.companyType || 'Exhibitor'}
                              </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.1 }}>
                                  Contact: {exhibitor.firstName} {exhibitor.lastName}
                                  {exhibitor.jobTitle && ` • ${exhibitor.jobTitle}`}
                                </Typography>
                            </Box>
                          </Box>
                                  </div>
                                );
                              };
                              return (
                                <VirtualList
                                  width={width}
                                  height={height}
                                  rowCount={filtered.length}
                                  rowHeight={rowHeight}
                                  rowRenderer={rowRenderer}
                                />
                              );
                            }}
                          </AutoSizer>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          p: 3, 
                          textAlign: 'center', 
                          color: 'text.secondary',
                          border: '1px dashed',
                          borderColor: 'grey.300',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2">
                            {searchQuery ? 'No exhibitors found matching your search.' : 'No exhibitors available.'}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  </Box>
                </Box>
              </Popover>
            </Box>
            {formErrors.attendiesId && (
              <FormHelperText error>
                {formErrors.attendiesId}
              </FormHelperText>
            )}
          </Grid>

          <Divider sx={{ mt: 1, mb: 1 }} />
          

          {/* Date and Time Section */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 0, pb: 3, borderBottom: '1px solid', borderColor: 'grey.200' }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  flexShrink: 0,
                  mt: 0.5
                }}
              >
                <AccessTime sx={{ fontSize: 16, color: 'grey.600' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {/* Date Field */}
                  <TextField
                    value={meetingForm.meetingDate ? new Date(meetingForm.meetingDate).toLocaleDateString('en-US', { 
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric'
                    }) : ''}
                    onClick={(e) => {
                      setDatePickerAnchorEl(e.currentTarget);
                    }}
                    placeholder="Select date"
                    variant="outlined"
                    error={!!formErrors.meetingDate}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <Event sx={{ fontSize: 16, color: 'grey.500' }} />
                      ),
                    }}
                    sx={{
                      minWidth: 140,
                      '& .MuiOutlinedInput-root': {
                        height: '40px',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'grey.300',
                        },
                        '&:hover fieldset': {
                          borderColor: 'grey.400',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.9rem',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        color: 'grey.700',
                        '&::placeholder': {
                          color: 'grey.400',
                        },
                      },
                    }}
                  />
                  
                  {/* Calendar Popup */}
                  <Popover
                    open={Boolean(datePickerAnchorEl)}
                    onClose={() => setDatePickerAnchorEl(null)}
                    anchorEl={datePickerAnchorEl}
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
                        width: 250,
                        height: 350,
                        p: 1,
                        borderRadius: 3,
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        overflow: 'hidden'
                      }
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      mb: 1,
                      pb: 1,
                      borderBottom: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={handlePreviousMonth}
                          sx={{ 
                            p: 0.5, 
                            height: 20, 
                            width: 20,
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'grey.100'
                            }
                          }}
                        >
                          <Box sx={{ fontSize: '0.75rem', lineHeight: 0.5 }}>◀</Box>
                        </IconButton>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 400, 
                          fontSize: '1rem',
                          color: 'text.primary'
                        }}>
                          {(() => {
                            // Show current calendar month and year
                            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                            return `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
                          })()}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={handleNextMonth}
                          sx={{ 
                            p: 0.5, 
                            height: 24, 
                            width: 24,
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'grey.100'
                            }
                          }}
                        >
                          <Box sx={{ fontSize: '0.75rem', lineHeight: 0.5 }}>▶</Box>
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={handlePreviousYear}
                          sx={{ 
                            p: 0.5, 
                            height: 24, 
                            width: 24,
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'grey.100'
                            }
                          }}
                        >
                          <Box sx={{ fontSize: '0.75rem', lineHeight: 0.5 }}>▲</Box>
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={handleNextYear}
                          sx={{ 
                            p: 0.5, 
                            height: 24, 
                            width: 24,
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'grey.100'
                            }
                          }}
                        >
                          <Box sx={{ fontSize: '0.75rem', lineHeight: 0.5 }}>▼</Box>
                        </IconButton>
                      </Box>
                    </Box>
                    
                   
                    
                    {/* Calendar Grid */}
                    <Box sx={{ mb: -1 }}>
                      {/* Day Headers */}
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        mb: 1,
                        gap: 0.5
                      }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                          <Typography 
                            key={day} 
                            variant="body2" 
                            sx={{ 
                              textAlign: 'center', 
                              fontWeight: 400, 
                              color: 'text.secondary', 
                              fontSize: '0.700rem',
                              py: 1
                            }}
                          >
                            {day}
                          </Typography>
                        ))}
                      </Box>
                      
                      {/* Calendar Days */}
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: 0.5
                      }}>
                        {(() => {
                          // Use current calendar month and year for navigation
                          const displayMonth = currentCalendarDate.getMonth();
                          const displayYear = currentCalendarDate.getFullYear();
                          
                          // Get the first day of the month
                          const firstDay = new Date(displayYear, displayMonth, 1);
                          const lastDay = new Date(displayYear, displayMonth + 1, 0);
                          const startDate = new Date(firstDay);
                          startDate.setDate(startDate.getDate() - firstDay.getDay());
                          
                          const calendarDays = [];
                          
                          // Generate calendar days
                          for (let i = 0; i < 42; i++) {
                            const date = new Date(startDate);
                            date.setDate(startDate.getDate() + i);
                            
                            // Fix timezone issue by creating date string in local timezone
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateStr = `${year}-${month}-${day}`;
                            
                            const isCurrentMonth = date.getMonth() === displayMonth;
                            const isSelected = meetingForm.meetingDate === dateStr;
                            
                            // Fix today comparison
                            const today = new Date();
                            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            const isToday = dateStr === todayStr;
                            
                            // Check if this date is within event range
                            const isInEventRange = isDateInEventRange(dateStr);
                            
                            calendarDays.push(
                              <Box
                                key={i}
                                onClick={() => {
                                  // Only allow selection if date is in event range
                                  if (isInEventRange) {
                                    handleFormChange('meetingDate', dateStr);
                                    setDatePickerAnchorEl(null);
                                  }
                                }}
                                sx={{
                                  aspectRatio: '1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: isInEventRange ? 'pointer' : 'not-allowed',
                                  borderRadius: 2,
                                  fontSize: '0.700rem',
                                  fontWeight: isSelected ? 600 : (isToday ? 500 : 300),
                                  color: isSelected ? 'white' : 
                                         isInEventRange ? (isCurrentMonth ? 'text.primary' : 'text.secondary') : 'text.disabled',
                                  backgroundColor: isSelected ? 'primary.main' : 
                                                 isInEventRange ? 'transparent' : 'grey.100',
                                  border: isToday ? '2px solid' : 'none',
                                  borderColor: isToday ? 'primary.main' : 'transparent',
                                  '&:hover': {
                                    backgroundColor: isSelected ? 'primary.dark' : 
                                                   isInEventRange ? 'grey.50' : 'grey.200',
                                    transform: isInEventRange ? 'scale(1.05)' : 'none',
                                  },
                                  opacity: isCurrentMonth ? (isInEventRange ? 1 : 0.3) : 0.4,
                                  transition: 'all 0.2s ease',
                                  position: 'relative'
                                }}
                              >
                                {date.getDate()}
                              </Box>
                            );
                          }
                          
                          return calendarDays;
                        })()}
                      </Box>
                    </Box>
                    
                    {/* Footer */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      pt: 1,
                      borderTop: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Button
                        size="small"
                        onClick={handleToday}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.700rem',
                          px: 1,
                          py: 1,
                          color: 'white',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: 'primary.50'
                          }
                        }}
                      >
                        Today
                      </Button>
                    </Box>
                  </Popover>
                  
                 
                  
                  {/* Start Time Field */}
                  <FormControl error={!!formErrors.startTime} disabled={loading}>
                    <Select
                      value={meetingForm.startTime}
                      onChange={(e) => handleFormChange('startTime', e.target.value)}
                      displayEmpty
                      variant="outlined"
                      sx={{
                        minWidth: 120,
                        height: '40px',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'grey.300',
                          },
                          '&:hover fieldset': {
                            borderColor: 'grey.400',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                        '& .MuiSelect-select': {
                          fontSize: '0.9rem',
                          padding: '8px 12px',
                          color: 'grey.700',
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        Start time
                      </MenuItem>
                      {(() => {
                        const timeSlots = [];
                        const eventTimeSlots = getEventTimeSlots();
                        
                        const startHour = eventTimeSlots.length > 0 ? Math.min(...eventTimeSlots) : 0;
                        const endHour = eventTimeSlots.length > 0 ? Math.max(...eventTimeSlots) : 23;
                        
                        for (let hour = startHour; hour <= endHour; hour++) {
                          for (let minute = 0; minute < 60; minute += 30) {
                            const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                            const ampm = hour < 12 ? 'AM' : 'PM';
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                            const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
                            
                            timeSlots.push(
                              <MenuItem key={timeValue} value={timeValue}>
                                {displayTime}
                              </MenuItem>
                            );
                          }
                        }
                        
                        return timeSlots;
                      })()}
                    </Select>
                  </FormControl>
                  
                  {/* "to" separator */}
                  <Typography variant="body2" sx={{ 
                    color: 'grey.600', 
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    px: 1
                  }}>
                    to
                  </Typography>
                  
                  {/* End Time Field */}
                  <FormControl error={!!formErrors.endTime} disabled={loading}>
                    <Select
                      value={meetingForm.endTime}
                      onChange={(e) => handleFormChange('endTime', e.target.value)}
                      displayEmpty
                      variant="outlined"
                      sx={{
                        minWidth: 120,
                        height: '40px',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'grey.300',
                          },
                          '&:hover fieldset': {
                            borderColor: 'grey.400',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                        '& .MuiSelect-select': {
                          fontSize: '0.9rem',
                          padding: '8px 12px',
                          color: 'grey.700',
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        End time
                      </MenuItem>
                      {(() => {
                        const availableEndTimes = getAvailableEndTimes(meetingForm.startTime);
                        
                        return availableEndTimes.map(timeValue => {
                          const [hour, minute] = timeValue.split(':').map(Number);
                          const ampm = hour < 12 ? 'AM' : 'PM';
                          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
                          
                          return (
                            <MenuItem key={timeValue} value={timeValue}>
                              {displayTime}
                            </MenuItem>
                          );
                        });
                      })()}
                    </Select>
                  </FormControl>
                </Box>
                {(formErrors.meetingDate || formErrors.startTime || formErrors.endTime) && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {formErrors.meetingDate || formErrors.startTime || formErrors.endTime}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
           {/* Description Field */}
           <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Add a description for the meeting"
              value={meetingForm.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              variant="outlined"
              error={!!formErrors.description}
              helperText={formErrors.description}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Grid>

          <Divider sx={{ mt: 1, mb: 1 }} />
         

        </Grid>
        </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 1, 
        borderTop: '1px solid',
        borderColor: 'divider',
        gap: 2,
        bgcolor: 'grey.50',
        justifyContent: 'flex-end'
      }}>
        <Button 
          onClick={handleCloseDialog} 
          size="small"
          disabled={isSubmitting}
          sx={{
            px: 1,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 300,
            color: 'text.primary',
            
            '&:hover': {
              backgroundColor: 'grey.100'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          size="small"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <ScheduleSend />}
          sx={{
            px: 1,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 300,
            fontSize: '0.900rem',
            background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0, #1976d2)',
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
              transform: 'translateY(-1px)'
            },
            '&:disabled': {
              background: 'grey.300',
              boxShadow: 'none',
              transform: 'none'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isSubmitting ? 'Scheduling Meeting...' : 'Schedule Meeting'}
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
            router.push(`/${identifier}/event-admin/meetings?refresh=true&view=list`);
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