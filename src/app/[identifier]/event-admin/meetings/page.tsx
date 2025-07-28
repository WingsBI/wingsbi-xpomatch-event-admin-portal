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
      setMeetingsLoading(true);
      
      if (!identifier || !user) {
        return;
      }
      
      let response;
      
      if (user.role === 'visitor' || user.role === 'event-admin') {
        // For visitors and event-admins, call visitor meeting details
        // Using visitorId = 2 as specified in the requirement
        response = await MeetingDetailsApi.getVisitorMeetingDetails(identifier, 2);
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
        // Transform API response to match our Meeting interface
        const transformedMeetings = response.result.map((apiMeeting: any) => ({
          id: apiMeeting.id?.toString() || Math.random().toString(),
          title: apiMeeting.agenda || 'Meeting',
          description: apiMeeting.description || 'No description available',
          dateTime: new Date(apiMeeting.meetingDate + 'T' + apiMeeting.startTime),
          duration: calculateDuration(apiMeeting.startTime, apiMeeting.endTime),
          type: 'in-person' as const, // Default type
          location: apiMeeting.location || undefined,
          attendees: [
            // Add attendees based on available data
            {
              id: '1',
              name: 'Attendee',
              email: 'attendee@example.com',
              company: 'Company',
              type: 'visitor' as const,
              avatar: 'A'
            }
          ],
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
        }));
        
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
    switch (apiStatus?.toLowerCase()) {
      case 'scheduled':
      case 'pending':
        return 'scheduled';
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
        return 'scheduled';
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
    switch (tabValue) {
      case 0: // Pending meetings
        return meetings.filter(m => m.status === 'scheduled');
      case 1: // Upcoming
        return meetings.filter(m => m.dateTime > now && m.status === 'scheduled');
      case 2: // Completed
        return meetings.filter(m => m.status === 'completed');
      case 3: // Cancelled
        return meetings.filter(m => m.status === 'cancelled');
      default:
        return meetings;
    }
  };

  const getUpcomingCount = () => {
    const now = new Date();
    return meetings.filter(m => m.dateTime > now && m.status === 'scheduled').length;
  };

  const getCompletedCount = () => {
    return meetings.filter(m => m.status === 'completed').length;
  };

  const getCancelledCount = () => {
    return meetings.filter(m => m.status === 'cancelled').length;
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      return meetingDate.getDate() === date.getDate() &&
             meetingDate.getMonth() === date.getMonth() &&
             meetingDate.getFullYear() === date.getFullYear();
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

  const getMeetingsForDateAndHour = (date: Date, hour: number) => {
    return meetings.filter(meeting => {
      const meetingDate = meeting.dateTime;
      return meetingDate.getDate() === date.getDate() &&
             meetingDate.getMonth() === date.getMonth() &&
             meetingDate.getFullYear() === date.getFullYear() &&
             meetingDate.getHours() === hour;
    });
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
                      {eventDetails && ` • ${getEventDays().length} event day${getEventDays().length > 1 ? 's' : ''}`}
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
                overflow: 'auto',
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
                        const hourMeetings = getMeetingsForDateAndHour(day, hour);
                        
                        return (
                          <Box key={hourIndex} sx={{ 
                            flex: 1, 
                            borderRight: hourIndex < 23 ? 1 : 0, 
                            position: 'relative',
                           display: 'flex',
                            //bgcolor: 'grey.100',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'primary.25' }
                          }}>
                            {/* Meetings for this time slot */}
                            {hourMeetings.map((meeting, meetingIndex) => (
                              <Box
                                key={meeting.id}
                                onClick={() => {
                                  setSelectedMeeting(meeting);
                                }}
                                sx={{
                                  position: 'absolute',
                                  top: 2,
                                  left: 2,
                                  right: 2,
                                  bgcolor: getStatusColor(meeting.status) === 'primary' ? 'primary.main' :
                                           getStatusColor(meeting.status) === 'success' ? 'success.main' :
                                           getStatusColor(meeting.status) === 'warning' ? 'warning.main' :
                                           getStatusColor(meeting.status) === 'error' ? 'error.main' : 'grey.500',
                                  color: 'white',
                                  borderRadius: 1,
                                  p: 0.5,
                                  cursor: 'pointer',
                                  zIndex: 1,
                                  height: `${Math.min(meeting.duration, 50) - 4}px`,
                                  overflow: 'hidden',
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
                                  {meeting.title}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  display: 'block',
                                  fontSize: '0.6rem',
                                  opacity: 0.9,
                                  lineHeight: 1.1
                                }}>
                                  {formatDuration(meeting.duration)}
                                </Typography>
                              </Box>
                            ))}
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
                    <Tab label="Completed" />
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
                  {getFilteredMeetings().map((meeting) => (
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
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {meeting.description}
                        </Typography>
                        
                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                                                      <Grid item xs={12} sm={6} md={3}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HourglassBottom fontSize="small" color="warning" />
                                <Typography variant="body2">
                                  {formatDateTime(meeting.dateTime)}
                                </Typography>
                              </Box>
                            </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <HourglassBottom fontSize="small" color="warning" />
                              <Typography variant="body2">
                                {formatDuration(meeting.duration)}
                              </Typography>
                            </Box>
                          </Grid>
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
                            {meeting.attendees.map((attendee) => (
                              <Chip
                                key={attendee.id}
                                avatar={<Avatar sx={{ bgcolor: 'primary.main', width: 20, height: 20, fontSize: '0.7rem' }}>{attendee.avatar}</Avatar>}
                                label={`${attendee.name} (${attendee.company})`}
                                variant="outlined"
                                size="small"
                                sx={{ fontSize: '0.75rem', height: 24 }}
                              />
                            ))}
                          </Box>
                        </Box>
                    {/* Notes */}
                    {meeting.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: -1 }}>
                        Notes: {meeting.notes}
                      </Typography>
                    )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5, ml: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                        {(tabValue === 0 || tabValue === 1) ? (
                          // Pending and Upcoming meetings - show approve/reschedule/reject buttons
                          <>
                            <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
                              <IconButton 
                                size="small" 
                                color="success"
                                sx={{ 
                                  bgcolor: 'success.light', 
                                  color: 'white',
                                  '&:hover': { bgcolor: 'success.main' }
                                }}
                                title="Approve Meeting"
                              >
                                <CheckCircleOutline fontSize="small" />
                              </IconButton>
                              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>Approve</Typography>
                            </Box>
                            <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
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
                              <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>Reschedule</Typography>
                            </Box>
                            <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
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
                              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>Reject</Typography>
                            </Box>
                          </>
                        ) : null}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
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