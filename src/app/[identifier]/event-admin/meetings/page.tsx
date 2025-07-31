"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Badge,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  CalendarMonth,
  VideoCameraFront,
  Phone,
  LocationOn,
  Add,
  Edit,
  Delete,
  AccessTime,
  Person,
  Business,
  Cancel,
  CheckCircle,
  Schedule,
  ChevronLeft,
  ChevronRight,
  ViewModule,
  ViewList,
  HourglassBottom,
  CheckCircleOutline,
  CancelOutlined,
  EventAvailable,
  Event,
} from '@mui/icons-material';

import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { RootState, AppDispatch } from "@/store";
import { setIdentifier } from "@/store/slices/appSlice";
import { eventsApi, MeetingDetailsApi } from '@/services/apiService';
import { ApiEventDetails } from '@/types';
import { getCurrentVisitorId } from '@/utils/authUtils';

interface Meeting {
  id: string;
  title: string;
  description: string;
  dateTime: Date;
  duration: number; // in minutes
  type: 'in-person' | 'video-call' | 'phone-call';
  location?: string;
  attendees: {
    id: string;
    name: string;
    email: string;
    company: string;
    type: 'visitor' | 'exhibitor';
    avatar: string;
  }[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  agenda?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Original API data for display
  meetingDate?: string;
  startTime?: string;
  endTime?: string;
  // Additional fields for approval status
  isApproved?: boolean;
  approvalStatus?: string;
}



// Mock meetings data removed - now using real API data

export default function MeetingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventDetails, setEventDetails] = useState<ApiEventDetails | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  const [eventLoading, setEventLoading] = useState(true);
  const [approvingMeetingId, setApprovingMeetingId] = useState<string | null>(null);

  const loadEventDetails = useCallback(async () => {
    try {
      setEventLoading(true);
      
      if (!identifier) {
        return;
      }
      
      const response = await eventsApi.getEventDetails(identifier);
      
      if (response.success && response.data?.result && response.data.result.length > 0) {
        const eventData = response.data.result[0];
        // Clean the event title by removing "exhibitor" text (case insensitive)
        if (eventData.title) {
          eventData.title = eventData.title.replace(/exhibitor/gi, '').trim();
        }
        setEventDetails(eventData);
      }
    } catch (error: any) {
      console.error('Error loading event details:', error);
    } finally {
      setEventLoading(false);
    }
  }, [identifier]);

  // Load meetings based on user role
  const loadMeetings = useCallback(async () => {
    try {
      console.log('loadMeetings function called');
      setMeetingsLoading(true);
      
      if (!identifier || !user) {
        console.log('Missing identifier or user:', { identifier, user });
        return;
      }
      
      console.log('Loading meetings for user:', user);
      let response;
      
      if (user.role === 'visitor' || user.role === 'event-admin') {
        // For visitors and event-admins, call visitor meeting details
        // Get visitor ID from JWT token instead of hardcoding
        const visitorId = getCurrentVisitorId();
        if (!visitorId) {
          console.warn('No visitor ID found for visitor/event-admin role');
          return;
        }
        console.log('Calling getVisitorMeetingDetails with visitorId:', visitorId);
        response = await MeetingDetailsApi.getVisitorMeetingDetails(identifier, visitorId);
        console.log('API response received:', response);
      } else if (user.role === 'exhibitor') {
        // For exhibitors, call exhibitor meeting details
        // Try to get exhibitorId from user object first, then fallback to JWT token
        let exhibitorId = user.exhibitorid ? parseInt(user.exhibitorid) : null;
        
        // If not found in user object, try to get from JWT token
        if (!exhibitorId && typeof localStorage !== 'undefined') {
          try {
            const token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
            if (token) {
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const tokenData = JSON.parse(jsonPayload);
              
              if (tokenData.exhibitorid) {
                exhibitorId = parseInt(tokenData.exhibitorid);
              }
            }
          } catch (error) {
            console.error('Error parsing JWT token for exhibitorId:', error);
          }
        }
        
        if (!exhibitorId) {
          console.warn('No exhibitorId found for exhibitor role');
          return;
        }
        
        response = await MeetingDetailsApi.getExhibitorMeetingDetails(identifier, exhibitorId);
      } else {
        console.warn('Unknown user role for meetings:', user.role);
        return;
      }
      
      if (response && !response.isError && response.result) {
        console.log('=== RAW API RESPONSE ===');
        console.log('Response structure:', response);
        console.log('Result array length:', response.result.length);
        response.result.forEach((meeting: any, index: number) => {
          console.log(`Raw API meeting ${index + 1}:`, {
            id: meeting.id,
            status: meeting.status,
            isApproved: meeting.isApproved,
            meetingDate: meeting.meetingDate,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            agenda: meeting.agenda
          });
        });
        console.log('=== END RAW API RESPONSE ===');
        
        // Transform API response to match our Meeting interface
        const transformedMeetings = response.result.map((apiMeeting: any) => {
          console.log('Processing API meeting:', apiMeeting);
          
          // Safely create dateTime with validation
          let dateTime: Date;
          try {
            if (apiMeeting.meetingDate && apiMeeting.startTime) {
              // API returns meetingDate in ISO format: "2025-07-31T00:00:00"
              // and startTime as separate time: "10:23:00"
              const dateStr = apiMeeting.meetingDate;
              const timeStr = apiMeeting.startTime;
              
              console.log('Parsing date for meeting:', apiMeeting.id, { dateStr, timeStr });
              
              // Extract just the date part from the ISO string (remove time part)
              let dateOnly = dateStr;
              if (dateStr.includes('T')) {
                dateOnly = dateStr.split('T')[0]; // Get "2025-07-31" from "2025-07-31T00:00:00"
              }
              
              // Use the startTime as provided
              const formattedTime = timeStr;
              
              // Create the full datetime string
              const fullDateTimeString = `${dateOnly}T${formattedTime}`;
              console.log('Created datetime string:', fullDateTimeString);
              
              dateTime = new Date(fullDateTimeString);
              
              // Validate the created date
              if (isNaN(dateTime.getTime())) {
                console.warn('Invalid date created from:', { dateStr, timeStr, dateOnly, formattedTime, fullDateTimeString });
                dateTime = new Date(); // Fallback to current date
              } else {
                console.log('Successfully parsed date:', dateTime.toISOString());
              }
            } else {
              console.warn('Missing meetingDate or startTime for meeting:', apiMeeting);
              dateTime = new Date(); // Fallback to current date
            }
          } catch (error) {
            console.error('Error creating date for meeting:', apiMeeting, error);
            dateTime = new Date(); // Fallback to current date
          }

          // Extract attendee information based on user role
          let attendees: Meeting['attendees'] = [];
          
          if (user.role === 'visitor' || user.role === 'event-admin') {
            // For visitors, show exhibitor information
            console.log('Visitor/Event-admin role - API meeting data:', apiMeeting);
            console.log('exhibitor array:', apiMeeting.exhibitor);
            
            // Check if exhibitor array exists and has data
            if (apiMeeting.exhibitor && apiMeeting.exhibitor.length > 0) {
              const exhibitorData = apiMeeting.exhibitor[0];
              console.log('First exhibitor data:', exhibitorData);
              
              // Check if exhibitorToUserMaps exists in the exhibitor data
              if (exhibitorData.exhibitorToUserMaps && exhibitorData.exhibitorToUserMaps.length > 0) {
                console.log('Using exhibitorToUserMaps path');
                const exhibitorMap = exhibitorData.exhibitorToUserMaps[0]; // Get first exhibitor user
                console.log('First exhibitor map:', exhibitorMap);
                
                const firstName = exhibitorMap.firstName || '';
                const lastName = exhibitorMap.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Exhibitor';
                const companyName = exhibitorMap.companyName || exhibitorData.companyName || 'Exhibitor Company';
                
                console.log('Extracted values:', { firstName, lastName, fullName, companyName });
                
                const attendeeData = {
                  id: exhibitorMap.exhibitorId?.toString() || 'exhibitor-1',
                  name: fullName,
                  email: exhibitorMap.email || 'exhibitor@example.com',
                  company: companyName,
                  type: 'exhibitor' as const,
                  avatar: fullName.charAt(0).toUpperCase()
                };
                console.log('Extracted attendee data from exhibitorToUserMaps:', attendeeData);
                attendees.push(attendeeData);
              } else {
                console.log('Using exhibitor direct fields path');
                // Fallback to exhibitor direct fields if exhibitorToUserMaps is not available
                const attendeeData = {
                  id: exhibitorData.id?.toString() || 'exhibitor-1',
                  name: 'Exhibitor',
                  email: 'exhibitor@example.com',
                  company: exhibitorData.companyName || 'Exhibitor Company',
                  type: 'exhibitor' as const,
                  avatar: 'E'
                };
                console.log('Extracted attendee data from exhibitor direct fields:', attendeeData);
                attendees.push(attendeeData);
              }
            } else if (apiMeeting.exhibitorName || apiMeeting.companyName || apiMeeting.exhibitorCompany) {
              console.log('Using direct fields fallback path');
              // Fallback to direct fields if exhibitor array is not available
              const exhibitorData = {
                id: apiMeeting.exhibitorId?.toString() || 'exhibitor-1',
                name: apiMeeting.exhibitorName || 'Exhibitor',
                email: apiMeeting.exhibitorEmail || 'exhibitor@example.com',
                company: apiMeeting.companyName || apiMeeting.exhibitorCompany || 'Exhibitor Company',
                type: 'exhibitor' as const,
                avatar: (apiMeeting.exhibitorName || 'E').charAt(0).toUpperCase()
              };
              console.log('Extracted exhibitor data from direct fields:', exhibitorData);
              attendees.push(exhibitorData);
            } else {
              console.log('No exhibitor data found in API response');
            }
          } else if (user.role === 'exhibitor') {
            // For exhibitors, show visitor information
            console.log('Exhibitor role - API meeting data:', apiMeeting);
            if (apiMeeting.visitorName || apiMeeting.companyName || apiMeeting.visitorCompany) {
              const visitorData = {
                id: apiMeeting.visitorId?.toString() || 'visitor-1',
                name: apiMeeting.visitorName || 'Visitor',
                email: apiMeeting.visitorEmail || 'visitor@example.com',
                company: apiMeeting.companyName || apiMeeting.visitorCompany || 'Visitor Company',
                type: 'visitor' as const,
                avatar: (apiMeeting.visitorName || 'V').charAt(0).toUpperCase()
              };
              console.log('Extracted visitor data:', visitorData);
              attendees.push(visitorData);
            }
          }

          // If no attendees found, add a fallback
          if (attendees.length === 0) {
            attendees.push({
              id: '1',
              name: 'Attendee',
              email: 'attendee@example.com',
              company: 'Company',
              type: user.role === 'exhibitor' ? 'visitor' as const : 'exhibitor' as const,
              avatar: 'A'
            });
          }

          const transformedMeeting = {
            id: apiMeeting.id?.toString() || Math.random().toString(),
            title: apiMeeting.agenda || 'Meeting',
            description: apiMeeting.description || 'No description available',
            dateTime: dateTime,
            duration: calculateDuration(apiMeeting.startTime, apiMeeting.endTime),
            type: 'in-person' as const, // Default type
            location: apiMeeting.location || undefined,
            attendees: attendees,
            status: mapApiStatusToMeetingStatus(apiMeeting.status),
            organizer: {
              id: 'admin1',
              name: 'Event Admin',
              email: 'admin@event.com'
            },
            agenda: apiMeeting.agenda ? [apiMeeting.agenda] : [],
            notes: apiMeeting.notes || undefined,
            createdAt: new Date(apiMeeting.createdAt || Date.now()),
            updatedAt: new Date(apiMeeting.updatedAt || Date.now()),
            // Store original API data for display
            meetingDate: apiMeeting.meetingDate,
            startTime: apiMeeting.startTime,
            endTime: apiMeeting.endTime,
            // Additional fields for approval status
            isApproved: apiMeeting.isApproved === true || apiMeeting.status?.toLowerCase() === 'approved' || apiMeeting.status?.toLowerCase() === 'upcoming' || false,
            approvalStatus: apiMeeting.approvalStatus || apiMeeting.status,
          };
          
          console.log('Transformed meeting:', {
            id: transformedMeeting.id,
            title: transformedMeeting.title,
            originalStatus: apiMeeting.status,
            mappedStatus: transformedMeeting.status,
            isApproved: transformedMeeting.isApproved,
            apiIsApproved: apiMeeting.isApproved,
            dateTime: transformedMeeting.dateTime.toISOString(),
            now: new Date().toISOString(),
            isFuture: transformedMeeting.dateTime > new Date(),
            willShowInPending: !transformedMeeting.isApproved,
            willShowInUpcoming: transformedMeeting.isApproved && transformedMeeting.dateTime > new Date()
          });
          
          return transformedMeeting;
        });
        
        // Log summary of all transformed meetings
        console.log('=== MEETINGS TRANSFORMATION SUMMARY ===');
        console.log('Total meetings transformed:', transformedMeetings.length);
        transformedMeetings.forEach((meeting: Meeting, index: number) => {
          console.log(`Meeting ${index + 1}:`, {
            id: meeting.id,
            title: meeting.title,
            status: meeting.status,
            isApproved: meeting.isApproved,
            dateTime: meeting.dateTime.toISOString(),
            isFuture: meeting.dateTime > new Date(),
            pendingTab: !meeting.isApproved,
            upcomingTab: meeting.isApproved && meeting.dateTime > new Date()
          });
        });
        console.log('=== END SUMMARY ===');
        
        setMeetings(transformedMeetings);
      } else {
        setMeetings([]);
      }
    } catch (error: any) {
      console.error('Error loading meetings:', error);
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  }, [identifier, user]);

  // Helper function to calculate duration from start and end times
  const calculateDuration = (startTime: string, endTime: string): number => {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      return Math.round(diffMs / (1000 * 60)); // Convert to minutes
    } catch (error) {
      console.warn('Error calculating duration:', error);
      return 60; // Default 60 minutes
    }
  };

  // Helper function to map API status to meeting status
  const mapApiStatusToMeetingStatus = (apiStatus: string): Meeting['status'] => {
    console.log('Mapping API status:', apiStatus);
    switch (apiStatus?.toLowerCase()) {
      case 'scheduled':
      case 'pending':
      case 'upcoming':
        return 'scheduled';
      case 'approved':
        return 'scheduled'; // Approved meetings are still considered 'scheduled' but with isApproved=true
      case 'completed':
      case 'finished':
        return 'completed';
      case 'cancelled':
      case 'cancelled':
        return 'cancelled';
      case 'in-progress':
      case 'ongoing':
        return 'in-progress';
      default:
        console.log('Unknown API status, defaulting to scheduled:', apiStatus);
        return 'scheduled';
    }
  };

  // Handle meeting approval
  const handleApproveMeeting = async (meetingId: string) => {
    try {
      setApprovingMeetingId(meetingId);
      
      if (!identifier) {
        console.error('No identifier found');
        return;
      }

      const meetingIdNumber = parseInt(meetingId);
      if (isNaN(meetingIdNumber)) {
        console.error('Invalid meeting ID:', meetingId);
        return;
      }

      console.log('Approving meeting:', { meetingId: meetingIdNumber, identifier });
      
      const response = await MeetingDetailsApi.approveMeetingRequest(identifier, meetingIdNumber, true);
      
      if (response && !response.isError) {
        console.log('Meeting approved successfully:', response);
        
        // Update the local state immediately to show the change
        setMeetings(prevMeetings => {
          console.log('Updating meetings state for approval:', { meetingId, prevMeetings });
          const updatedMeetings = prevMeetings.map(meeting => 
            meeting.id === meetingId 
              ? { ...meeting, isApproved: true }
              : meeting
          );
          console.log('Updated meetings:', updatedMeetings);
          return updatedMeetings;
        });
        
        // Also reload meetings to get the latest data from the server
        await loadMeetings();
      } else {
        console.error('Failed to approve meeting:', response);
      }
    } catch (error) {
      console.error('Error approving meeting:', error);
    } finally {
      setApprovingMeetingId(null);
    }
  };

  // Load event details on mount (single source of truth)
  useEffect(() => {
    const loadEventDetails = async () => {
      try {
        setEventLoading(true);
        
        if (!identifier) {
          return;
        }
        
        const response = await eventsApi.getEventDetails(identifier);
        
        if (response.success && response.data?.result && response.data.result.length > 0) {
          const eventData = response.data.result[0];
          // Clean the event title by removing "exhibitor" text (case insensitive)
          if (eventData.title) {
            eventData.title = eventData.title.replace(/exhibitor/gi, '').trim();
          }
          setEventDetails(eventData);
          
          // Set initial week to event start date if available
          if (eventData.startDateTime) {
            const eventStartDate = new Date(eventData.startDateTime);
            const weekStart = getWeekStart(eventStartDate);
            setCurrentWeekStart(weekStart);
          }
        }
      } catch (error: any) {
        console.error('Error loading event details:', error);
      } finally {
        setEventLoading(false);
      }
    };
    if (identifier) {
      loadEventDetails();
    }
  }, [identifier]);

  // Set identifier in Redux store when component mounts
  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  // Load meetings when component mounts or when user/identifier changes
  useEffect(() => {
    if (identifier && user) {
      loadMeetings();
    }
  }, [identifier, user, loadMeetings]);

  // Check for view parameter and set appropriate view
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'calendar') {
      setShowCalendar(true);
    } else if (viewParam === 'list') {
      setShowCalendar(false);
    }
  }, [searchParams]);


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };



  const handleScheduleMeeting = () => {
    router.push(`/${identifier}/event-admin/meetings/schedule-meeting`);
  };

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: Meeting['type']) => {
    switch (type) {
      case 'video-call': return <VideoCameraFront />;
      case 'phone-call': return <Phone />;
      case 'in-person': return <LocationOn />;
      default: return <CalendarMonth />;
    }
  };

  const getFilteredMeetings = () => {
    const now = new Date();
    console.log('Filtering meetings:', { 
      tabValue, 
      totalMeetings: meetings.length, 
      now: now.toISOString(),
      meetings: meetings.map(m => ({ 
        id: m.id, 
        status: m.status, 
        isApproved: m.isApproved, 
        dateTime: m.dateTime.toISOString(),
        approvalStatus: m.approvalStatus,
        isFuture: m.dateTime > now
      }))
    });
    
    switch (tabValue) {
      case 0: // Pending meetings - show meetings that are not yet approved
        const pendingMeetings = meetings.filter(m => {
          const shouldShow = !m.isApproved;
          console.log(`Meeting ${m.id} pending check:`, {
            id: m.id,
            isApproved: m.isApproved,
            shouldShow,
            status: m.status,
            approvalStatus: m.approvalStatus
          });
          return shouldShow;
        });
        console.log('Pending meetings:', pendingMeetings.length);
        return pendingMeetings;
      case 1: // Upcoming - show approved meetings that are in the future
        const upcomingMeetings = meetings.filter(m => {
          const shouldShow = m.isApproved && m.dateTime > now;
          console.log(`Meeting ${m.id} upcoming check:`, {
            id: m.id,
            isApproved: m.isApproved,
            dateTime: m.dateTime.toISOString(),
            now: now.toISOString(),
            isFuture: m.dateTime > now,
            shouldShow,
            status: m.status,
            approvalStatus: m.approvalStatus
          });
          return shouldShow;
        });
        console.log('Upcoming meetings:', upcomingMeetings.length);
        return upcomingMeetings;
      case 2: // Completed - show approved meetings that are in the past
        const completedMeetings = meetings.filter(m => {
          const shouldShow = m.isApproved && m.dateTime <= now;
          console.log(`Meeting ${m.id} completed check:`, {
            id: m.id,
            isApproved: m.isApproved,
            dateTime: m.dateTime.toISOString(),
            now: now.toISOString(),
            isPast: m.dateTime <= now,
            shouldShow,
            status: m.status,
            approvalStatus: m.approvalStatus
          });
          return shouldShow;
        });
        console.log('Completed meetings:', completedMeetings.length);
        return completedMeetings;
      case 3: // Cancelled
        return meetings.filter(m => m.status === 'cancelled');
      default:
        return meetings;
    }
  };

  const getUpcomingCount = () => {
    const now = new Date();
    return meetings.filter(m => m.isApproved && m.dateTime > now).length;
  };

  const getCompletedCount = () => {
    const now = new Date();
    return meetings.filter(m => m.isApproved && m.dateTime <= now).length;
  };

  const getCancelledCount = () => {
    return meetings.filter(m => m.status === 'cancelled').length;
  };

  const formatDateTime = (date: Date) => {
    try {
      // Check if date is valid
      if (!date || isNaN(date.getTime())) {
        console.warn('Invalid date passed to formatDateTime:', date);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  };

  // Helper function to format meeting date from API data
  const formatMeetingDate = (meetingDate: string) => {
    try {
      if (!meetingDate) return 'No Date';
      
      // Extract date part from ISO string "2025-07-31T00:00:00"
      const dateOnly = meetingDate.split('T')[0];
      const date = new Date(dateOnly);
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting meeting date:', error);
      return 'Invalid Date';
    }
  };

  // Helper function to format time from API data
  const formatTime = (timeStr: string) => {
    try {
      if (!timeStr) return 'No Time';
      
      // Handle time format "10:23:00" or "10:23"
      const timeParts = timeStr.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        
        if (isNaN(hours) || isNaN(minutes)) {
          return 'Invalid Time';
        }
        
        // Format as 12-hour time
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return `${displayHours}:${displayMinutes} ${period}`;
      }
      
      return 'Invalid Time';
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid Time';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = meeting.dateTime;
      const isSameDate = meetingDate.getDate() === date.getDate() &&
             meetingDate.getMonth() === date.getMonth() &&
             meetingDate.getFullYear() === date.getFullYear();
      
      // Only show scheduled meetings (not completed or cancelled)
      const isScheduled = meeting.status === 'scheduled' || meeting.status === 'in-progress';
      
      // Show both approved and pending meetings (but not completed)
      const isNotCompleted = meeting.status !== 'completed';
      
      // Check if meeting is in the future or today (not past)
      const now = new Date();
      const isNotPast = meetingDate >= now;
      
      // Debug logging
      if (isSameDate) {
        console.log('Calendar meeting check:', {
          id: meeting.id,
          title: meeting.title,
          status: meeting.status,
          isApproved: meeting.isApproved,
          approvalStatus: meeting.approvalStatus,
          isScheduled,
          isNotCompleted,
          isNotPast,
          meetingDate: meetingDate.toISOString(),
          now: now.toISOString(),
          checkDate: date.toISOString(),
          willShow: isSameDate && isScheduled && isNotCompleted && isNotPast
        });
      }
      
      return isSameDate && isScheduled && isNotCompleted && isNotPast;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatTimeOnly = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Weekly calendar helper functions
  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // Start from Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getWeekDays = (weekStart: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventDays = () => {
    if (!eventDetails) return [];
    
    const eventStart = new Date(eventDetails.startDateTime);
    const eventEnd = new Date(eventDetails.endDateTime);
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

  const getHourSlots = () => {
    if (eventDetails && eventDetails.startDateTime && eventDetails.endDateTime) {
      const start = new Date(eventDetails.startDateTime).getHours();
      const end = new Date(eventDetails.endDateTime).getHours();
      const slots = [];
      for (let hour = start; hour <= end; hour++) {
        slots.push(hour);
      }
      return slots;
    }
    // Fallback: 9 AM to 9 PM
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const isHourInEventRange = (hour: number, date: Date) => {
    if (!eventDetails) return false;
    
    const eventStart = new Date(eventDetails.startDateTime);
    const eventEnd = new Date(eventDetails.endDateTime);
    
    // Check if this date is within event range
    const currentDate = new Date(date);
    currentDate.setHours(hour, 0, 0, 0);
    
    // Get the start and end hours for the event
    const eventStartHour = eventStart.getHours();
    const eventEndHour = eventEnd.getHours();
    
    // Check if this hour falls within the event time range
    return hour >= eventStartHour && hour <= eventEndHour;
  };



  // Calculate meeting layout for Teams-like calendar
  const getMeetingLayout = (date: Date) => {
    const dayMeetings = getMeetingsForDate(date);
    const layout: { [hour: number]: { meeting: Meeting; top: number; height: number; left: number; width: number }[] } = {};
    
    // Group meetings by hour and calculate overlaps
    dayMeetings.forEach(meeting => {
      const meetingDate = meeting.dateTime;
      const meetingEndTime = new Date(meetingDate.getTime() + meeting.duration * 60000);
      const startHour = meetingDate.getHours();
      const endHour = meetingEndTime.getHours();
      
      // Add meeting to all hours it spans
      for (let hour = startHour; hour <= endHour; hour++) {
        if (!layout[hour]) layout[hour] = [];
        
        // Calculate top position within the hour slot (50px height per hour)
        const top = hour === startHour ? (meetingDate.getMinutes() / 60) * 50 : 0;
        
        // Calculate height for this hour slot
        let height: number;
        if (hour === startHour && hour === endHour) {
          // Meeting starts and ends in the same hour
          const startMinutes = meetingDate.getMinutes();
          const endMinutes = meetingEndTime.getMinutes();
          height = ((endMinutes - startMinutes) / 60) * 50;
        } else if (hour === startHour) {
          // Meeting starts in this hour
          const startMinutes = meetingDate.getMinutes();
          height = ((60 - startMinutes) / 60) * 50;
        } else if (hour === endHour) {
          // Meeting ends in this hour
          const endMinutes = meetingEndTime.getMinutes();
          height = (endMinutes / 60) * 50;
        } else {
          // Meeting spans the full hour
          height = 50;
        }
        
        // Ensure height is within bounds and has minimum size
        height = Math.max(Math.min(height, 50), 20);
        
        // Ensure the meeting block fits within the hour slot
        const maxTop = 50 - height;
        const constrainedTop = Math.max(0, Math.min(top, maxTop));
        
        layout[hour].push({
          meeting,
          top: constrainedTop,
          height: Math.min(height, 50 - constrainedTop), // Ensure height doesn't exceed remaining space
          left: 0, // Will be calculated below
          width: 100 // Will be calculated below
        });
      }
    });
    
    // Calculate overlapping positions for each hour
    Object.keys(layout).forEach(hourStr => {
      const hour = parseInt(hourStr);
      const hourMeetings = layout[hour];
      
      // Sort meetings by start time within the hour
      hourMeetings.sort((a, b) => a.top - b.top);
      
      // Group overlapping meetings - improved algorithm
      const overlappingGroups: typeof hourMeetings[] = [];
      const processed = new Set<number>();
      
      hourMeetings.forEach((meeting, index) => {
        if (processed.has(index)) return;
        
        const currentGroup = [meeting];
        processed.add(index);
        
        // Find all meetings that overlap with this one
        hourMeetings.forEach((otherMeeting, otherIndex) => {
          if (processed.has(otherIndex)) return;
          
          const meetingEnd = meeting.top + meeting.height;
          const otherEnd = otherMeeting.top + otherMeeting.height;
          
          // Check if meetings overlap
          if ((meeting.top < otherEnd) && (otherMeeting.top < meetingEnd)) {
            currentGroup.push(otherMeeting);
            processed.add(otherIndex);
          }
        });
        
        overlappingGroups.push(currentGroup);
      });
      
      // Calculate positions for each overlapping group
      overlappingGroups.forEach(group => {
        const groupWidth = 100 / group.length;
        group.forEach((meeting, index) => {
          meeting.left = index * groupWidth;
          meeting.width = groupWidth;
        });
      });
    });
    
    return layout;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!eventDetails) {
      const newWeekStart = new Date(currentWeekStart);
      if (direction === 'prev') {
        newWeekStart.setDate(newWeekStart.getDate() - 7);
      } else {
        newWeekStart.setDate(newWeekStart.getDate() + 7);
      }
      setCurrentWeekStart(newWeekStart);
      return;
    }
    
    // For event days, we don't need navigation since we show all event days
    // This function is kept for compatibility but doesn't do anything for event days
  };

  const isDateInEventRange = (date: Date) => {
    if (!eventDetails) return true;
    const eventStart = new Date(eventDetails.startDateTime);
    const eventEnd = new Date(eventDetails.endDateTime);
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(23, 59, 59, 999);
    return date >= eventStart && date <= eventEnd;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <RoleBasedRoute allowedRoles={['visitor', 'event-admin', 'exhibitor']}>
      <ResponsiveDashboardLayout 
        title="Meetings"
        
      >
        <Container maxWidth="xl" sx={{ mt: 0}}>
          {/* Action buttons */}
          {/* Only show top-right button in calendar view */}
          {showCalendar && (
            <Box sx={{ mb: 2, mt: -1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleScheduleMeeting}
              >
                Schedule Meeting
              </Button>
            </Box>
          )}

          {/* Weekly Calendar View */}
          {showCalendar ? (
            <Paper sx={{ 
              mb: 3, 
              overflow: 'hidden', 
              border: 1, 
              borderColor: 'grey.300',
              maxWidth: '100%',
              width: '100%',
              borderRadius: 1
            }}>
              {/* Event Calendar Header */}
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                bgcolor: 'primary.main',
                color: 'white'
              }}>
                <Box>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {eventDetails ? eventDetails.title : 'Weekly Calendar'}
                  </Typography>
                  {eventDetails && (
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {eventDetails.locationDetails && eventDetails.locationDetails.length > 0 && 
                       `${eventDetails.locationDetails[0].venueName} • `}
                      {eventDetails.categoryName}
                    </Typography>
                  )}
                </Box>
                
                {eventDetails && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                          Event Start
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {new Date(eventDetails.startDateTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>

                      <Box sx={{ mx: 1, opacity: 0.6 }}>→</Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                          Event End
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {new Date(eventDetails.endDateTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                    
                   
                  </Box>
                )}
              </Box>

              {/* Time Slots Header - Horizontal */}
              <Box sx={{ display: 'flex', borderBottom: 2, borderColor: 'grey.400' }}>
                {/* Date column header */}
                <Box sx={{ width: 120, p: 1, borderRight: 2, borderColor: 'grey.400' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    Date
                  </Typography>
                </Box>
                
                {/* Time slot headers - Horizontal */}
                {getHourSlots().map((hour, index) => {
                  return (
                    <Box key={index} sx={{ 
                      flex: 1, 
                      p: 1, 
                      textAlign: 'center', 
                      borderRight: index < 23 ? 1 : 0, 
                    
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.75rem',
                      }}>
                        {formatHour(hour)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Date Grid - Vertical with Day Partitioning */}
              <Box sx={{ 
                height: eventDetails ? `calc(${getEventDays().length} * 50px)` : '200px', 
                overflow: 'hidden', // Changed from 'auto' to 'hidden' to prevent scrollbars
                position: 'relative'
              }}>
                {eventDetails ? (meetingsLoading ? (
                  // Show loading state for meetings in calendar view
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary">
                      Loading meetings...
                    </Typography>
                  </Box>
                ) : getEventDays().map((day, dayIndex) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  
                  return (
                    <Box key={dayIndex} sx={{ 
                      display: 'flex',
                      height: 50,
                      borderBottom: dayIndex < getEventDays().length - 1 ? (isWeekend ? 3 : 2) : 0, 
                      
                      
                      '&:hover': { bgcolor: 'grey.25' }
                    }}>
                      {/* Date label */}
                      <Box sx={{ 
                        width: 120, 
                        p: 1, 
                        borderRight: 2, 
                        borderColor: 'grey.400',  
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: isToday ? 'bold' : 'normal',
                            color: isToday ? 'primary.main' : 'text.primary',
                            fontSize: '0.85rem  '
                          }}>
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: isToday ? 'bold' : 'normal',
                            color: isToday ? 'primary.main' : 'text.primary',
                            fontSize: '0.9rem'
                          }}>
                            {day.getDate()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Time slot columns with day partitioning */}
                      {getHourSlots().map((hour, hourIndex) => {
                        const meetingLayout = getMeetingLayout(day);
                        const hourMeetings = meetingLayout[hour] || [];
                        
                        return (
                          <Box key={hourIndex} sx={{ 
                            flex: 1, 
                            borderRight: hourIndex < 23 ? 1 : 0, 
                            position: 'relative',
                            display: 'flex',
                            cursor: 'pointer',
                            height: 50, // Fixed height for each hour slot
                            overflow: 'hidden', // Prevent overflow
                            '&:hover': { bgcolor: 'primary.25' }
                          }}>
                            {/* Meetings for this time slot */}
                            {hourMeetings.map((meetingData, meetingIndex) => {
                              // Ensure the meeting block stays within the hour slot bounds
                              const constrainedTop = Math.max(0, Math.min(meetingData.top, 50 - meetingData.height));
                              const constrainedHeight = Math.min(meetingData.height, 50 - constrainedTop);
                              
                              return (
                                <Tooltip
                                  key={`${meetingData.meeting.id}-${hour}`}
                                  title={meetingData.meeting.title}
                                  placement="top"
                                  arrow
                                >
                                  <Box
                                    onClick={() => {
                                      setSelectedMeeting(meetingData.meeting);
                                    }}
                                    sx={{
                                      position: 'absolute',
                                      top: constrainedTop + 1,
                                      left: `${meetingData.left}%`,
                                      width: `${meetingData.width}%`,
                                      bgcolor: getStatusColor(meetingData.meeting.status) === 'primary' ? 'primary.main' :
                                               getStatusColor(meetingData.meeting.status) === 'success' ? 'success.main' :
                                               getStatusColor(meetingData.meeting.status) === 'warning' ? 'warning.main' :
                                               getStatusColor(meetingData.meeting.status) === 'error' ? 'error.main' : 'grey.500',
                                      color: 'white',
                                      borderRadius: 1,
                                      p: 0.5,
                                      cursor: 'pointer',
                                      zIndex: 1,
                                      height: `${constrainedHeight - 2}px`,
                                      overflow: 'hidden',
                                      margin: '0 1px',
                                      border: '1px solid rgba(255,255,255,0.2)',
                                      maxHeight: '48px', // Ensure it doesn't exceed the hour slot
                                      '&:hover': {
                                        opacity: 0.9,
                                        transform: 'scale(1.02)'
                                      }
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ 
                                      display: 'block',
                                      fontWeight: 'bold',
                                      fontSize: '0.65rem',
                                      lineHeight: 1.1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {meetingData.meeting.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      display: 'block',
                                      fontSize: '0.6rem',
                                      opacity: 0.9,
                                      lineHeight: 1.1
                                    }}>
                                      {formatDuration(meetingData.meeting.duration)}
                                      {/* Show indicator if meeting continues to next hour */}
                                      {hour < 23 && meetingData.meeting.duration > 60 && 
                                       meetingData.meeting.dateTime.getHours() === hour && 
                                       meetingData.meeting.dateTime.getMinutes() + meetingData.meeting.duration > 60 && (
                                        <Box component="span" sx={{ 
                                          display: 'inline-block',
                                          width: '4px',
                                          height: '4px',
                                          borderRadius: '50%',
                                          bgcolor: 'rgba(255,255,255,0.8)',
                                          ml: 0.5
                                        }} />
                                      )}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              );
                            })}
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })) : (
                  // Show loading or empty state when no event details
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    {eventLoading ? (
                      <>
                        <Typography variant="h6" color="text.secondary">
                          Loading event details...
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CalendarMonth sx={{ fontSize: 48, color: 'text.secondary' }} />
                        <Typography variant="h6" color="text.secondary">
                          No event details available
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Event information is required to display the calendar
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>

             
            </Paper>
          ) : (





            
            <>
              {/* Tabs with Schedule Meeting button inside */}
              <Paper sx={{ mb: 2, px: 1,mt:-2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Tabs value={tabValue} onChange={handleTabChange} aria-label="meetings tabs">
                    <Tab label="Pending" />
                    <Tab label={<Badge badgeContent={getUpcomingCount()} color="warning">Upcoming</Badge>}/>
                    <Tab label={<Badge badgeContent={getCompletedCount()} color="success">Completed</Badge>}/>
                    <Tab label="Cancelled" />
                    
                  </Tabs>
                                  <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleScheduleMeeting}
                  sx={{ ml: 2 }}
                >
                  Schedule Meeting
                </Button>
                </Box>
              </Paper>

              {/* Meetings list */}
              {meetingsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body1" sx={{ ml: 2 }}>
                    Loading meetings...
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {getFilteredMeetings().map((meeting) => {
                    console.log('Rendering meeting:', {
                      id: meeting.id,
                      title: meeting.title,
                      status: meeting.status,
                      isApproved: meeting.isApproved,
                      dateTime: meeting.dateTime.toISOString()
                    });
                    
                    return (
              <Grid item xs={12} key={meeting.id}>
                <Card sx={{ 
                  
                  transition: 'all 0.3s',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" component="div">
                            {meeting.title}
                          </Typography>
                          <Chip 
                            label={meeting.status} 
                            color={getStatusColor(meeting.status)}
                            size="small"
                          />
                        </Box>
                        
                        
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          {/* Meeting Date */}
                          <Grid item xs={12} sm={6} md={3} sx={{ mr: -2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <HourglassBottom fontSize="small" color="warning" />
                              <Typography variant="body2">
                                {formatMeetingDate(meeting.meetingDate || '')}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Start Time */}
                          <Grid item xs={12} sm={6} md={3} sx={{ mr: -2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <HourglassBottom fontSize="small" color="success" />
                              <Typography variant="body2">
                                Start: {formatTime(meeting.startTime || '')}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* End Time */}
                          <Grid item xs={12} sm={6} md={3} sx={{ mr: -2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <HourglassBottom fontSize="small" color="error" />
                              <Typography variant="body2">
                                End: {formatTime(meeting.endTime || '')}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Duration */}
                          {/* <Grid item xs={12} sm={6} md={3} sx={{ mr: -2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <HourglassBottom fontSize="small" color="info" />
                              <Typography variant="body2">
                                {formatDuration(meeting.duration)}
                              </Typography>
                            </Box>
                          </Grid> */}
                          
                          {meeting.location && (
                            <Grid item xs={12} sm={6} md={3}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn fontSize="small" />
                                <Typography variant="body2">
                                  {meeting.location}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>

                      

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Attendees:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {meeting.attendees.map((attendee) => {
                              console.log('Rendering attendee chip with data:', attendee);
                              const displayLabel = attendee.company && attendee.company.trim() !== '' 
                                ? `${attendee.name} (${attendee.company})`
                                : attendee.name;
                              console.log('Display label:', displayLabel);
                              return (
                                <Chip
                                  key={attendee.id}
                                  avatar={<Avatar sx={{ bgcolor: 'primary.main', width: 20, height: 20, fontSize: '0.7rem' }}>{attendee.avatar}</Avatar>}
                                  label={displayLabel}
                                  variant="outlined"
                                  size="small"
                                  sx={{ fontSize: '0.75rem', height: 24 }}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                    {/* Notes */}
                    {meeting.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: -1 }}>
                        Notes: {meeting.notes}
                      </Typography>
                    )}
                      </Box>

                      {/* Action buttons in top right corner */}
                      {(tabValue === 0 || tabValue === 1) && (
                        <Box sx={{ display: 'flex', gap: 1, ml: 1, flexWrap: 'wrap' }}>
                          {/* Show approve button only for pending meetings */}
                          {!meeting.isApproved && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton 
                                size="small" 
                                color="success"
                                disabled={approvingMeetingId === meeting.id}
                                onClick={() => handleApproveMeeting(meeting.id)}
                                sx={{ 
                                  bgcolor: 'success.light', 
                                  color: 'white',
                                  '&:hover': { bgcolor: 'success.main' },
                                  '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                                }}
                                title="Approve Meeting"
                              >
                                {approvingMeetingId === meeting.id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <CheckCircleOutline fontSize="small" />
                                )}
                              </IconButton>
                              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {approvingMeetingId === meeting.id ? 'Approving...' : 'Approve'}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Show approved status for approved meetings */}
                          {meeting.isApproved && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip 
                                label="Approved" 
                                color="success"
                                size="small"
                                icon={<CheckCircleOutline />}
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              color="error"
                              sx={{ 
                                bgcolor: 'error.light', 
                                color: 'white',
                                '&:hover': { bgcolor: 'error.main' }
                              }}
                              title="Reject Meeting"
                            >
                              <CancelOutlined fontSize="small" />
                            </IconButton>
                            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              Reject
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              color="warning"
                              sx={{ 
                                bgcolor: 'warning.light', 
                                color: 'white',
                                '&:hover': { bgcolor: 'warning.main' }
                              }}
                              title="Reschedule Meeting"
                            >
                              <EventAvailable fontSize="small" />
                            </IconButton>
                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              Reschedule
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
                  })}
                </Grid>
              )}

              {!meetingsLoading && getFilteredMeetings().length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <CalendarMonth sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No meetings found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tabValue === 0 
                      ? "No pending meetings found"
                      : "No meetings in this category"
                    }
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Container>


      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
} 