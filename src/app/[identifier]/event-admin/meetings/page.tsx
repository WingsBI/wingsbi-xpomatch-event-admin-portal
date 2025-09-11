"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useTheme, useMediaQuery } from '@mui/material';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
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
  Close,
  Description,
  LockClock,
  PunchClock,
  Refresh,
  ScheduleSend,
  GroupAdd,
} from '@mui/icons-material';

import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { RootState, AppDispatch } from "@/store";
import { setIdentifier, addNotification } from "@/store/slices/appSlice";
import { eventsApi, MeetingDetailsApi, apiService } from '@/services/apiService';
import { ApiEventDetails } from '@/types';
import { getCurrentVisitorId } from '@/utils/authUtils';
import { getAuthToken } from '@/utils/cookieManager';

// Cache for meetings data
const meetingsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to clear meetings cache
const clearMeetingsCache = () => {
  meetingsCache.clear();
  console.log('Meetings cache cleared');
};

// Note: Calendar and dialog components are inline in this file, no separate components to lazy load

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
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress' | 'Pending';
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
  isCancelled?: boolean;
  approvalStatus?: string;
  // Flag to indicate if current user is the meeting initiator
  isInitiator?: boolean;
  // Initiator information from API
  initiatorName?: string;
  companyName?: string;
}



// Helper functions for role and relationship checks
const isVisitor = (user: any) => user?.role === 'visitor';
const isExhibitor = (user: any) => user?.role === 'exhibitor';
const isEventAdmin = (user: any) => user?.role === 'event-admin';

const canRescheduleMeeting = (meeting: Meeting, user: any) => {
  // User can reschedule if they are the initiator
  return meeting.isInitiator === true;
};

const canCancelMeeting = (meeting: Meeting, user: any) => {
  // User can cancel if they are the initiator
  return meeting.isInitiator === true;
};

const canAcceptRejectMeeting = (meeting: Meeting, user: any) => {
  // User can accept/reject if they are an attendee (not initiator) and meeting is not already approved/cancelled
  const isExplicitlyUpcoming = meeting.approvalStatus?.toLowerCase() === 'upcoming';
  return !meeting.isInitiator && meeting.status !== 'cancelled' && !meeting.isApproved && !isExplicitlyUpcoming;
};

const shouldShowAcceptReject = (meeting: Meeting, user: any) => {
  // Show accept/reject buttons ONLY for attendees (not initiators) of non-cancelled and non-approved meetings
  // Also exclude meetings that have explicit "upcoming" status (these should show as approved)
  const isExplicitlyUpcoming = meeting.approvalStatus?.toLowerCase() === 'upcoming';
  return !meeting.isInitiator && !meeting.isApproved && meeting.status !== 'cancelled' && !isExplicitlyUpcoming;
};

const shouldShowRescheduleCancel = (meeting: Meeting, user: any) => {
  // Show reschedule/cancel buttons ONLY for initiators of non-cancelled and non-completed meetings
  return meeting.isInitiator === true && meeting.status !== 'cancelled' && meeting.status !== 'completed';
};

export default function MeetingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();
  
  // Responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
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
  const [rejectingMeetingId, setRejectingMeetingId] = useState<string | null>(null);
  const [cancellingMeetingId, setCancellingMeetingId] = useState<string | null>(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showCancelConfirmDialog, setShowCancelConfirmDialog] = useState(false);
  const [selectedMeetingForReschedule, setSelectedMeetingForReschedule] = useState<Meeting | null>(null);
  const [selectedMeetingForCancel, setSelectedMeetingForCancel] = useState<Meeting | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    meetingId: '',
    agenda: '',
    description: '',
    meetingDate: '',
    startTime: '',
    endTime: ''
  });
  const [rescheduleFormErrors, setRescheduleFormErrors] = useState<Record<string, string>>({});
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDatePickerAnchorEl, setRescheduleDatePickerAnchorEl] = useState<HTMLElement | null>(null);
  const [rescheduleCurrentCalendarDate, setRescheduleCurrentCalendarDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [noMeetingsMessage, setNoMeetingsMessage] = useState<string | null>(null);

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
      
      // Clear previous error states
      setMeetingsError(null);
      setNoMeetingsMessage(null);
      
      if (!identifier || !user) {
        console.log('Missing identifier or user:', { identifier, user });
        setMeetingsError('Unable to load meetings: Missing event identifier or user information');
        return;
      }

      // Check cache first
      const cacheKey = `${identifier}-${user.id || user.email}-${user.role}`;
      const cached = meetingsCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('Using cached meetings data');
        setMeetings(cached.data);
        setMeetingsLoading(false);
        return;
      }

      setMeetingsLoading(true);
      
      console.log('Loading meetings for user:', user);
      let response;
      let initiatorResponse;
      let invitesResponse;
      let currentUserId: number | null = null;
      
      // Get user ID from JWT token for all roles
        try {
          const token = getAuthToken();
          if (token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const tokenData = JSON.parse(jsonPayload);
            if (tokenData.id) {
            currentUserId = parseInt(tokenData.id);
            }
          }
        } catch (error) {
        console.error('Error parsing JWT token for userId:', error);
      }

      if (!currentUserId) {
        console.warn('No userId found from JWT token for role:', user.role);
        setMeetingsError('Unable to load meetings: User ID not found. Please try refreshing the page.');
        return;
      }

      console.log('=== USER ROLE DEBUG ===');
        console.log('User role:', user.role);
      console.log('User ID from JWT token:', currentUserId);
        console.log('User object:', user);
        
      // All roles (event-admin, visitor, exhibitor) follow the same pattern
      console.log('Calling API with userId:', currentUserId);
      
      // Get meetings where user is the initiator
      try {
        initiatorResponse = await MeetingDetailsApi.getMeetingInitiatorDetails(identifier, currentUserId);
        console.log('Initiator response:', initiatorResponse);
          
          // Handle API errors and null responses
          if (initiatorResponse?.isError) {
            console.warn('API error for initiator meetings:', initiatorResponse.message);
            if (initiatorResponse.statusCode === 404) {
              console.log('404 error - initiator endpoint may not exist, treating as no meetings found');
              initiatorResponse = { result: [] };
            }
          }
        } catch (error) {
          console.error('Error fetching initiator meetings:', error);
          initiatorResponse = { result: [] };
        }
        
      // Get meetings where user is an attendee with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries && !invitesResponse?.result) {
          try {
          console.log(`Attempt ${retryCount + 1} to get meeting invites for attendee ID: ${currentUserId}`);
          invitesResponse = await MeetingDetailsApi.getAllMeetingInvites(identifier, currentUserId);
        console.log('Invites response:', invitesResponse);
            
            // Handle API errors and null responses
            if (invitesResponse?.isError) {
              console.warn(`API error on attempt ${retryCount + 1}:`, invitesResponse.message);
              if (invitesResponse.statusCode === 404) {
                console.log('404 error - endpoint may not exist, treating as no meetings found');
                invitesResponse = { result: [] };
                break;
              }
            }
        
            if (invitesResponse?.result && invitesResponse.result.length > 0) {
              console.log(`Successfully got ${invitesResponse.result.length} invites`);
                break;
              }
          } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            }
          
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Waiting 1 second before retry ${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Ensure invitesResponse is not null and has a result property
        if (!invitesResponse) {
          console.log('No response received, treating as no meetings found');
          invitesResponse = { result: [] };
        }
        
        if (!invitesResponse.result || invitesResponse.result.length === 0) {
          console.log('No invites found with the correct user ID from JWT token');
        }
        
        // Transform invites response to match meeting format
        console.log('=== TRANSFORMING INVITES ===');
        console.log('Raw invites response:', invitesResponse);
        console.log('Invites result array:', invitesResponse?.result);
        console.log('Number of invites to transform:', invitesResponse?.result?.length || 0);
        
        const transformedInvites = (invitesResponse?.result || []).map((invite: any, index: number) => {
        console.log(`🔍 INVITE PROCESSING - Processing invite ${index + 1}:`, invite);
        console.log(`🔍 INVITE - Attendee name: ${invite.attendeeName}, Company: ${invite.companyName}`);
          const meetingDetails = invite.meetingDetails?.[0];
        console.log(`🔍 INVITE - Meeting details for invite ${index + 1}:`, meetingDetails);
          
          // Determine if current user is the initiator of this meeting
        const isCurrentUserInitiator = currentUserId && (meetingDetails?.initiatorId === currentUserId);
          console.log(`Invite ${index + 1} initiator check:`, {
            currentUserId,
            meetingInitiatorId: meetingDetails?.initiatorId,
            isCurrentUserInitiator,
            meetingId: meetingDetails?.id || invite.meetingId || invite.id
          });
          
          const transformedInvite = {
            id: (meetingDetails?.id ?? invite.meetingId ?? invite.id).toString(),
            agenda: meetingDetails?.agenda ?? invite.attendeeName ?? 'Meeting',
            initiatorId: meetingDetails?.initiatorId ?? invite.createdBy,
            initiatorName: meetingDetails?.initiatorName ?? 'Initiator',
            companyName: meetingDetails?.companyName ?? invite.companyName,
            meetingDate: meetingDetails?.meetingDate ?? null,
            startTime: meetingDetails?.startTime ?? null,
            endTime: meetingDetails?.endTime ?? null,
            status: (invite.status?.toLowerCase() || (invite.isCancelled ? 'cancelled' : invite.isApproved ? 'scheduled' : 'pending')) as Meeting['status'],
            createdBy: meetingDetails?.createdBy ?? invite.createdBy,
            createdDate: meetingDetails?.createdDate ?? invite.createdDate,
            modifiedBy: meetingDetails?.modifiedBy ?? invite.modifiedBy,
            modifiedDate: meetingDetails?.modifiedDate ?? invite.modifiedDate,
            isActive: meetingDetails?.isActive ?? invite.isActive,

            // Add attendee information from the root level of invite response
            attendees: [
            // Add the attendee - handle both attendeesId and attendeeId
              {
                id: (invite.attendeesId || invite.attendeeId || invite.id).toString(),
                name: invite.attendeeName,
                email: `${invite.attendeeName?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                company: invite.companyName,
              type: (user.role === 'event-admin' ? 'visitor' : user.role) as 'visitor' | 'exhibitor', // Use current user role, default event-admin to visitor
                avatar: (invite.attendeeName?.charAt(0) || 'A').toUpperCase()
              }
            ],
            // Add approval status from invite
            isApproved: invite.isApproved === true,
            isCancelled: invite.isCancelled === true,
            approvalStatus: invite.status,
            // Set isInitiator based on current user ID comparison
          isInitiator: Boolean(isCurrentUserInitiator),
          };
          
          console.log('Transformed invite:', {
            id: transformedInvite.id,
            isApproved: transformedInvite.isApproved,
            isCancelled: transformedInvite.isCancelled,
            approvalStatus: transformedInvite.approvalStatus,
            status: transformedInvite.status,
            isInitiator: transformedInvite.isInitiator
          });
          
          return transformedInvite;
        }).filter(Boolean);
        
        // Combine both responses
      console.log('=== COMBINING RESPONSES ===');
        console.log('Initiator response result count:', initiatorResponse?.result?.length || 0);
        console.log('Transformed invites count:', transformedInvites.length);
        
        // Create a proper response object with the transformed data
        response = {
          version: '1.0.0.0',
          statusCode: 200,
          message: 'Meetings retrieved successfully',
          responseException: null,
          isError: false,
          result: [
            ...(initiatorResponse?.result || []),
            ...transformedInvites
          ]
        };
        
      console.log('Final combined response result count:', response.result.length);
      console.log('Final combined response:', response);
      
      if (response && !response.isError && response.result && response.result.length > 0) {
        console.log('=== RAW API RESPONSE ===');
        console.log('Response structure:', response);
        console.log('Result array length:', response.result.length);
        console.log('Current User ID:', currentUserId);
        console.log('Raw API result:', JSON.stringify(response.result, null, 2));
        response.result.forEach((meeting: any, index: number) => {
          console.log(`Raw API meeting ${index + 1}:`, {
            id: meeting.id,
            status: meeting.status,
            isApproved: meeting.isApproved,
            initiatorId: meeting.initiatorId,
            meetingDate: meeting.meetingDate,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            agenda: meeting.agenda
          });
        });
        console.log('=== END RAW API RESPONSE ===');
        
        // Transform API response to match our Meeting interface
        const transformedMeetings = response.result.map((apiMeeting: any) => {
          console.log('🔍 REGULAR MEETING PROCESSING - Processing API meeting:', apiMeeting);
          console.log('🔍 REGULAR MEETING - Attendee name:', apiMeeting.attendeeName, 'Company:', apiMeeting.companyName);
          
                  // Extract initiator information, preferring meetingDetails if available
          let initiatorId = apiMeeting.initiatorId;
          let initiatorName = apiMeeting.initiatorName;
          let companyName = apiMeeting.companyName;
          
          if (apiMeeting.meetingDetails && Array.isArray(apiMeeting.meetingDetails) && apiMeeting.meetingDetails.length > 0) {
            const meetingDetail = apiMeeting.meetingDetails[0];
            initiatorId = meetingDetail.initiatorId || initiatorId;
            initiatorName = meetingDetail.initiatorName || initiatorName;
            companyName = meetingDetail.companyName || companyName;
          }
          
          // Determine if current user is the initiator of this meeting
        const isCurrentUserInitiator = currentUserId && initiatorId === currentUserId;
        console.log('Initiator check:', {
          currentUserId,
          apiInitiatorId: initiatorId,
          isCurrentUserInitiator,
          meetingId: apiMeeting.id,
          userRole: user?.role
        });
          
          // Safely create dateTime with validation
          let dateTime: Date;
          let meetingDate = apiMeeting.meetingDate;
          let startTime = apiMeeting.startTime;
          let agenda = apiMeeting.agenda;
          
          // If date/time not at root level, check in meetingDetails array
          if ((!meetingDate || !startTime) && apiMeeting.meetingDetails && Array.isArray(apiMeeting.meetingDetails) && apiMeeting.meetingDetails.length > 0) {
            const meetingDetail = apiMeeting.meetingDetails[0];
            meetingDate = meetingDetail.meetingDate || meetingDate;
            startTime = meetingDetail.startTime || startTime;
            agenda = meetingDetail.agenda || agenda;
            console.log('Using date/time from meetingDetails:', { meetingDate, startTime, agenda });
          }
          
          try {
            if (meetingDate && startTime) {
              // API returns meetingDate in ISO format: "2025-07-31T00:00:00"
              // and startTime as separate time: "10:23:00"
              const dateStr = meetingDate;
              const timeStr = startTime;
              
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

          // Extract attendee information from the API response
          let attendees: Meeting['attendees'] = [];
          
          // Check if there's attendee information at the root level (for meeting invites)
          if (apiMeeting.attendeeName && apiMeeting.companyName) {
            console.log('Processing root level attendee:', { attendeeName: apiMeeting.attendeeName, companyName: apiMeeting.companyName });
            
            // Determine attendee type based on the meeting context
            let attendeeType: 'visitor' | 'exhibitor' = 'visitor';
            // You can add logic here to determine if the attendee is a visitor or exhibitor
            // For now, defaulting to visitor
            
              attendees.push({
                id: apiMeeting.attendeesId?.toString() || `attendee-${Math.random()}`,
                name: apiMeeting.attendeeName.trim() || 'Attendee',
                email: `${apiMeeting.attendeeName?.toLowerCase().replace(/\s+/g, '.')}@example.com` || 'attendee@example.com',
                company: apiMeeting.companyName.trim() || 'Company',
              type: attendeeType,
                avatar: (apiMeeting.attendeeName?.charAt(0) || 'A').toUpperCase()
              });
          }
          
          // Also check for attendees array (for other meeting types)
          if (apiMeeting.attendees && Array.isArray(apiMeeting.attendees)) {
            console.log('Processing attendees array:', apiMeeting.attendees);
            
            // Check if this is already a transformed attendees array (from invite processing)
            const firstAttendee = apiMeeting.attendees[0];
            if (firstAttendee && firstAttendee.name && firstAttendee.email && firstAttendee.company) {
              // This is already a transformed attendees array, use it directly
              console.log('Using already transformed attendees array');
              attendees.push(...apiMeeting.attendees);
            } else {
              // Process each attendee in the array (raw API format)
              apiMeeting.attendees.forEach((attendee: any) => {
                  const attendeeData = {
                  id: attendee.attendeesId?.toString() || `attendee-${Math.random()}`,
                  name: attendee.attendeeName || 'Attendee',
                  email: `${attendee.attendeeName?.toLowerCase().replace(/\s+/g, '.')}@example.com` || 'attendee@example.com',
                  company: attendee.companyName || 'Company',
                  type: 'visitor' as const, // Default to visitor
                  avatar: (attendee.attendeeName?.charAt(0) || 'A').toUpperCase()
                };
                
                console.log('Processed attendee:', attendeeData);
                  attendees.push(attendeeData);
              });
            }
          }

          // Remove duplicates from attendees array
          const uniqueAttendees = attendees.filter((attendee, index, self) => 
            index === self.findIndex(a => a.name === attendee.name && a.company === attendee.company)
          );
          
          console.log('Final attendees list (after deduplication):', uniqueAttendees);

          const transformedMeeting: Meeting = {
            id: apiMeeting.id?.toString() || Math.random().toString(),
            title: agenda || 'Meeting',
            description: apiMeeting.description || 'No description available',
            dateTime: dateTime,
            duration: calculateDuration(startTime, apiMeeting.endTime || (apiMeeting.meetingDetails?.[0]?.endTime)),
            type: 'in-person' as const, // Default type
            location: apiMeeting.location || undefined,
            attendees: uniqueAttendees,
            status: mapApiStatusToMeetingStatus(apiMeeting.status),
            organizer: {
              id: 'admin1',
              name: 'Event Admin',
              email: 'admin@event.com'
            },
            agenda: agenda ? [agenda] : [],
            notes: apiMeeting.notes || undefined,
            createdAt: new Date(apiMeeting.createdAt || Date.now()),
            updatedAt: new Date(apiMeeting.updatedAt || Date.now()),
            // Store original API data for display
            meetingDate: meetingDate,
            startTime: startTime,
            endTime: apiMeeting.endTime || (apiMeeting.meetingDetails?.[0]?.endTime),
            // Additional fields for approval status
            // For meetings with attendees array, check if ANY attendee has approved (for initiator view)
            isApproved: (() => {
              if (apiMeeting.attendees && Array.isArray(apiMeeting.attendees) && apiMeeting.attendees.length > 0) {
                // Check if ANY attendee has isApproved: true (changed from ALL to ANY)
                const anyAttendeeApproved = apiMeeting.attendees.some((attendee: any) => attendee.isApproved === true);
                console.log('Checking attendee approval status (ANY logic):', {
                  meetingId: apiMeeting.id,
                  totalAttendees: apiMeeting.attendees.length,
                  attendeesApprovalStatus: apiMeeting.attendees.map((a: any) => ({ name: a.attendeeName, isApproved: a.isApproved })),
                  anyAttendeeApproved
                });
                return anyAttendeeApproved;
              }
              // Fallback to the original logic if no attendees array
              return apiMeeting.isApproved === true;
            })(),
            isCancelled: apiMeeting.isCancelled === true,
            approvalStatus: apiMeeting.approvalStatus || apiMeeting.status,
            // Set isInitiator based on current user ID comparison
            isInitiator: Boolean(isCurrentUserInitiator),
            // Initiator information from API
            initiatorName: initiatorName,
            companyName: companyName,
          };
          
          console.log('Transformed meeting:', {
            id: transformedMeeting.id,
            title: transformedMeeting.title,
            originalStatus: apiMeeting.status,
            mappedStatus: transformedMeeting.status,
            isApproved: transformedMeeting.isApproved,
            apiIsApproved: apiMeeting.isApproved,
            isCancelled: transformedMeeting.isCancelled,
            apiIsCancelled: apiMeeting.isCancelled,
            isInitiator: transformedMeeting.isInitiator,
            apiInitiatorId: apiMeeting.initiatorId,
            currentUserId: currentUserId,
            dateTime: transformedMeeting.dateTime.toISOString(),
            now: new Date().toISOString(),
            isFuture: transformedMeeting.dateTime > new Date(),
            willShowInPending: !transformedMeeting.isApproved && !transformedMeeting.isCancelled,
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
            isCancelled: meeting.isCancelled,
            isInitiator: meeting.isInitiator,
            dateTime: meeting.dateTime.toISOString(),
            isFuture: meeting.dateTime > new Date(),
            pendingTab: !meeting.isApproved && !meeting.isCancelled,
            upcomingTab: meeting.isApproved && meeting.dateTime > new Date(),
            shouldShowAcceptReject: !meeting.isInitiator && !meeting.isApproved && meeting.status !== 'cancelled',
            shouldShowRescheduleCancel: meeting.isInitiator === true && meeting.status !== 'cancelled' && meeting.status !== 'completed'
          });
        });
        console.log('=== END SUMMARY ===');
        console.log('=== FINAL TRANSFORMED MEETINGS ===');
        console.log('Total meetings to be set:', transformedMeetings.length);
        console.log('Meetings data:', JSON.stringify(transformedMeetings, null, 2));
        console.log('=== END FINAL MEETINGS ===');
        
        setMeetings(transformedMeetings);
        
        // Cache the data
        const cacheKey = `${identifier}-${user.id || user.email}-${user.role}`;
        meetingsCache.set(cacheKey, {
          data: transformedMeetings,
          timestamp: Date.now()
        });
      }  
    } catch (error: any) {
      console.error('Error loading meetings:', error);
      setMeetings([]);
      setMeetingsError('An error occurred while loading meetings. Please try refreshing the page.');
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

  // Handle meeting rejection
  const handleRejectMeeting = async (meetingId: string) => {
    try {
      setRejectingMeetingId(meetingId);
      
      if (!identifier) {
        console.error('No identifier found');
        return;
      }

      const meetingIdNumber = parseInt(meetingId);
      if (isNaN(meetingIdNumber)) {
        console.error('Invalid meeting ID:', meetingId);
        return;
      }

      // Get current user's attendee ID from JWT token (same logic as loadMeetings)
      let attendeeId: number | null = null;
      
        try {
          const token = getAuthToken();
          if (token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const tokenData = JSON.parse(jsonPayload);
            attendeeId = tokenData.id ? parseInt(tokenData.id) : null;
          }
        } catch (error) {
          console.error('Error parsing JWT token for attendeeId:', error);
      }

      if (!attendeeId) {
        console.error('Could not determine attendee ID for user:', user);
        console.error('User role:', user?.role);
        console.error('User object:', user);
        return;
      }

      console.log('Rejecting meeting:', { 
        meetingId: meetingIdNumber, 
        attendeeId: attendeeId,
        identifier,
        user: user
      });
      
      console.log('Calling approveMeetingRequest with params:', {
        identifier,
        meetingIdNumber,
        attendeeId,
        isApproved: false
      });
      
      const response = await MeetingDetailsApi.approveMeetingRequest(identifier, meetingIdNumber, attendeeId, false);
      
      if (response && !response.isError) {
        console.log('Meeting rejected successfully:', response);
        
        // Update the local state immediately to show the change
        setMeetings(prevMeetings => {
          console.log('Updating meetings state for rejection:', { meetingId, prevMeetings });
          const updatedMeetings = prevMeetings.map(meeting => 
            meeting.id === meetingId 
              ? { ...meeting, isApproved: false, status: 'rejected' as Meeting['status'] }
              : meeting
          );
          console.log('Updated meetings after rejection:', updatedMeetings);
          return updatedMeetings;
        });
        
        // Clear cache and reload meetings to get the latest data from the server
        clearMeetingsCache();
        await loadMeetings();
      } else {
        console.error('Failed to reject meeting:', response);
      }
    } catch (error) {
      console.error('Error rejecting meeting:', error);
    } finally {
      setRejectingMeetingId(null);
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

      // Get current user's attendee ID from JWT token (same logic as loadMeetings)
      let attendeeId: number | null = null;
      
        try {
          const token = getAuthToken();
          if (token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const tokenData = JSON.parse(jsonPayload);
            attendeeId = tokenData.id ? parseInt(tokenData.id) : null;
          }
        } catch (error) {
          console.error('Error parsing JWT token for attendeeId:', error);
      }

      if (!attendeeId) {
        console.error('Could not determine attendee ID for user:', user);
        console.error('User role:', user?.role);
        console.error('User object:', user);
        return;
      }

      console.log('Approving meeting:', { 
        meetingId: meetingIdNumber, 
        attendeeId: attendeeId,
        identifier,
        user: user
      });
      
      console.log('Calling approveMeetingRequest with params:', {
        identifier,
        meetingIdNumber,
        attendeeId,
        isApproved: true
      });
      
      const response = await MeetingDetailsApi.approveMeetingRequest(identifier, meetingIdNumber, attendeeId, true);
      
      if (response && !response.isError) {
        console.log('Meeting approved successfully:', response);
        
        // Update the local state immediately to show the change
        setMeetings(prevMeetings => {
          console.log('Updating meetings state for approval:', { meetingId, prevMeetings });
          const updatedMeetings = prevMeetings.map(meeting => 
            meeting.id === meetingId 
              ? { ...meeting, isApproved: true, status: 'scheduled' as Meeting['status'] }
              : meeting
          );
          console.log('Updated meetings:', updatedMeetings);
          return updatedMeetings;
        });
        
        // Clear cache and reload meetings to get the latest data from the server
        clearMeetingsCache();
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

  // Handle cancel meeting confirmation dialog
  const handleOpenCancelDialog = (meeting: Meeting) => {
    setSelectedMeetingForCancel(meeting);
    setShowCancelConfirmDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setShowCancelConfirmDialog(false);
    setSelectedMeetingForCancel(null);
  };

  // Handle meeting cancellation
  const handleCancelMeeting = async () => {
    if (!selectedMeetingForCancel) {
      console.error('No meeting selected for cancellation');
      return;
    }

    try {
      setCancellingMeetingId(selectedMeetingForCancel.id);
      
      if (!identifier) {
        console.error('No identifier found');
        return;
      }

      const meetingIdNumber = parseInt(selectedMeetingForCancel.id);
      if (isNaN(meetingIdNumber)) {
        console.error('Invalid meeting ID:', selectedMeetingForCancel.id);
        return;
      }

      console.log('Cancelling meeting:', { 
        meetingId: meetingIdNumber, 
        identifier,
        user: user
      });
      
      const response = await apiService.cancelMeeting(identifier, meetingIdNumber);
      
      if (response.success) {
        console.log('Meeting cancelled successfully:', response);
        
        // Update the local state immediately to show the change
        setMeetings(prevMeetings => {
          console.log('Updating meetings state for cancellation:', {
            meetingId: selectedMeetingForCancel.id,
            prevMeetingsCount: prevMeetings.length,
            cancelledMeeting: selectedMeetingForCancel
          });
          
          const updatedMeetings = prevMeetings.map(meeting => 
            meeting.id === selectedMeetingForCancel.id 
              ? { ...meeting, status: 'cancelled' as Meeting['status'], isCancelled: true }
              : meeting
          );
          
          console.log('Updated meetings state:', {
            updatedMeetingsCount: updatedMeetings.length,
            cancelledMeetingsCount: updatedMeetings.filter(m => m.status === 'cancelled' || m.isCancelled).length
          });
          
          return updatedMeetings;
        });
        
        // Clear cache and reload meetings to get the latest data from the server
        clearMeetingsCache();
        await loadMeetings();
        
        // Close the dialog
        handleCloseCancelDialog();
      } else {
        console.error('Failed to cancel meeting:', response);
      }
    } catch (error) {
      console.error('Error cancelling meeting:', error);
    } finally {
      setCancellingMeetingId(null);
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

  // Refresh meetings when returning from schedule page
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true' && identifier && user) {
      console.log('Refreshing meetings due to URL parameter');
      setIsRefreshing(true); // Show loading state
      
      // Show notification that meetings are being refreshed
      // dispatch(addNotification({
      //   type: 'info',
      //   message: 'Refreshing Meetings: Loading your newly scheduled meeting...'
      // }));
      
      clearMeetingsCache();
      loadMeetings().then(() => {
        // Show success notification after refresh is complete
        // setTimeout(() => {
        //   dispatch(addNotification({
        //     type: 'success',
        //     message: 'Meetings Updated: Your meetings have been refreshed successfully.'
        //   }));
        // }, 1000); // Small delay to ensure API calls are complete
      }).finally(() => {
        setIsRefreshing(false); // Hide loading state
      });
      // Remove the refresh parameter from URL without triggering page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, identifier, user, loadMeetings, dispatch]);

  // Track cancelled count changes
  useEffect(() => {
    if (cancelledCount > 0) {
      console.log('Cancelled meetings detected:', cancelledCount);
    }
  }, [cancelledCount]);

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

  const handleRefreshMeetings = async () => {
    try {
      console.log('Manual refresh requested');
      setIsRefreshing(true);
      clearMeetingsCache();
      await loadMeetings();
    } catch (error) {
      console.error('Error refreshing meetings:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenRescheduleDialog = (meeting: Meeting) => {
    console.log('Opening reschedule dialog for meeting:', {
      id: meeting.id,
      title: meeting.title,
      meetingDate: meeting.meetingDate,
      startTime: meeting.startTime,
      endTime: meeting.endTime
    });
    setSelectedMeetingForReschedule(meeting);
    
    // Format date for the form (YYYY-MM-DD format for date input)
    let formattedDate = '';
    if (meeting.meetingDate) {
      try {
        const date = new Date(meeting.meetingDate);
        if (!isNaN(date.getTime())) {
          // Use local date formatting to avoid timezone issues
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      } catch (error) {
        console.error('Error parsing meeting date:', error);
      }
    }
    
    // Format time for the form (HH:MM format for time select)
    let formattedStartTime = '';
    let formattedEndTime = '';
    
    if (meeting.startTime) {
      // Handle different time formats
      if (meeting.startTime.includes(':')) {
        // Already in HH:MM format
        formattedStartTime = meeting.startTime;
      } else if (meeting.startTime.includes('T')) {
        // ISO format like "2024-01-01T10:30:00"
        const timePart = meeting.startTime.split('T')[1];
        formattedStartTime = timePart.substring(0, 5);
      } else {
        // Try to parse as a time string
        try {
          const startTime = new Date(`2000-01-01T${meeting.startTime}`);
          if (!isNaN(startTime.getTime())) {
            formattedStartTime = startTime.toTimeString().slice(0, 5);
          }
        } catch (error) {
          console.error('Error parsing start time:', error);
        }
      }
    }
    
    if (meeting.endTime) {
      // Handle different time formats
      if (meeting.endTime.includes(':')) {
        // Already in HH:MM format
        formattedEndTime = meeting.endTime;
      } else if (meeting.endTime.includes('T')) {
        // ISO format like "2024-01-01T11:30:00"
        const timePart = meeting.endTime.split('T')[1];
        formattedEndTime = timePart.substring(0, 5);
      } else {
        // Try to parse as a time string
        try {
          const endTime = new Date(`2000-01-01T${meeting.endTime}`);
          if (!isNaN(endTime.getTime())) {
            formattedEndTime = endTime.toTimeString().slice(0, 5);
          }
        } catch (error) {
          console.error('Error parsing end time:', error);
        }
      }
    }
    
    const formData = {
      meetingId: meeting.id,
      agenda: meeting.title || '',
      description: meeting.description || '',
      meetingDate: formattedDate,
      startTime: formattedStartTime,
      endTime: formattedEndTime
    };
    
    console.log('Setting reschedule form data:', formData);
    
    setRescheduleForm(formData);
    setShowRescheduleDialog(true);
  };

  const handleCloseRescheduleDialog = () => {
    setShowRescheduleDialog(false);
    setSelectedMeetingForReschedule(null);
    setIsRescheduling(false);
    setRescheduleForm({
      meetingId: '',
      agenda: '',
      description: '',
      meetingDate: '',
      startTime: '',
      endTime: ''
    });
  };

  const handleRescheduleFormChange = (field: string, value: string) => {
    console.log('Reschedule form change:', { field, value });
    setRescheduleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Debug useEffect to monitor reschedule form state
  useEffect(() => {
    if (showRescheduleDialog) {
      console.log('Current reschedule form state:', rescheduleForm);
    }
  }, [rescheduleForm, showRescheduleDialog]);

  // Handle reschedule submit
  const handleRescheduleSubmit = async () => {
    try {
      setIsRescheduling(true);
      
      if (!identifier) {
        console.error('No identifier found');
        return;
      }

      // Validate form
      if (!rescheduleForm.meetingId || !rescheduleForm.agenda || !rescheduleForm.meetingDate || !rescheduleForm.startTime || !rescheduleForm.endTime) {
        console.error('Missing required fields:', rescheduleForm);
        return;
      }

      // Convert date and times to ISO format as required by the API
      const meetingDate = new Date(rescheduleForm.meetingDate);
      
      // Create ISO strings in local timezone (without timezone conversion)
      // This assumes the API expects times in the local timezone
      const startTimeISO = `${rescheduleForm.meetingDate}T${rescheduleForm.startTime}:00.000`;
      const endTimeISO = `${rescheduleForm.meetingDate}T${rescheduleForm.endTime}:00.000`;

      console.log('Time conversion debug:', {
        originalStartTime: rescheduleForm.startTime,
        originalEndTime: rescheduleForm.endTime,
        startTimeISO,
        endTimeISO,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      const updateData = {
        meetingId: parseInt(rescheduleForm.meetingId),
        agenda: rescheduleForm.agenda,
        meetingDate: meetingDate.toISOString(),
        startTime: startTimeISO,
        endTime: endTimeISO
      };

      console.log('Submitting update meeting details:', updateData);

      const response = await apiService.updateMeetingDetails(identifier, updateData);
      
      if (response.success) {
        console.log('Meeting updated successfully:', response);
        
        // Close the dialog
        handleCloseRescheduleDialog();
        
        // Clear cache and reload meetings to get updated data
        clearMeetingsCache();
        await loadMeetings();
        
        // Show success message (you can add a toast notification here)
        console.log('Meeting rescheduled successfully!');
      } else {
        console.error('Failed to update meeting:', response);
        // You can add error handling here (show error message to user)
      }
    } catch (error) {
      console.error('Error updating meeting:', error);
      // You can add error handling here (show error message to user)
    } finally {
      setIsRescheduling(false);
    }
  };

  // Get event time slots for reschedule
  const getRescheduleEventTimeSlots = () => {
    if (!eventDetails || !eventDetails.startDateTime || !eventDetails.endDateTime) {
      return [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // Default business hours
    }
    
    // Convert UTC times to IST (UTC+5:30)
    const eventStart = convertUTCToIST(eventDetails.startDateTime);
    const eventEnd = convertUTCToIST(eventDetails.endDateTime);
    const slots = [];
    
    // Check if dates are valid
    if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
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

  // Get available end times based on start time for reschedule
  const getRescheduleAvailableEndTimes = (startTime: string) => {
    if (!startTime) return [];
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const eventTimeSlots = getRescheduleEventTimeSlots();
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

  // Check if date is in event range for reschedule
  const isRescheduleDateInEventRange = (date: string) => {
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

  // Get event date options for reschedule
  const getRescheduleEventDateOptions = () => {
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

  // Calendar navigation functions for reschedule
  const handleReschedulePreviousMonth = () => {
    setRescheduleCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleRescheduleNextMonth = () => {
    setRescheduleCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleReschedulePreviousYear = () => {
    setRescheduleCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(newDate.getFullYear() - 1);
      return newDate;
    });
  };

  const handleRescheduleNextYear = () => {
    setRescheduleCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(newDate.getFullYear() + 1);
      return newDate;
    });
  };

  const handleRescheduleToday = () => {
    const today = new Date();
    const eventDateOptions = getRescheduleEventDateOptions();
    const todayStr = today.toISOString().split('T')[0];
    
    // Only set to today if it's in the event range
    if (eventDateOptions.includes(todayStr)) {
      handleRescheduleFormChange('meetingDate', todayStr);
    }
  };

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled': return 'secondary';
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

  const getFilteredMeetings = useCallback(() => {
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
        isFuture: m.dateTime > now,
        isInitiator: m.isInitiator
      }))
    });
    
    switch (tabValue) {
      case 0: // Pending meetings - show meetings with status 'Pending'
        console.log('=== PENDING TAB FILTERING ===');
        console.log('Total meetings count:', meetings.length);
        console.log('All meetings:', meetings.map(m => ({ 
          id: m.id, 
          title: m.title, 
          isInitiator: m.isInitiator, 
          status: m.status, 
          approvalStatus: m.approvalStatus, 
          isApproved: m.isApproved,
          isCancelled: m.isCancelled
        })));
        
        const pendingMeetings = meetings.filter(m => {
          // Show meetings that are explicitly pending OR not approved (but exclude cancelled)
          // Ensure mutual exclusivity with upcoming tab
          const isExplicitlyPending = m.approvalStatus?.toLowerCase() === 'pending';
          const isNotApprovedYet = !m.isApproved && m.status !== 'cancelled' && !m.isCancelled;
          const isNotUpcoming = m.approvalStatus?.toLowerCase() !== 'upcoming';
          
          const shouldShow = (isExplicitlyPending || (isNotApprovedYet && isNotUpcoming));
          
          console.log(`Meeting ${m.id} pending check:`, {
            id: m.id,
            title: m.title,
            isInitiator: m.isInitiator,
            isApproved: m.isApproved,
            isCancelled: m.isCancelled,
            status: m.status,
            approvalStatus: m.approvalStatus,
            isExplicitlyPending,
            isNotApprovedYet,
            isNotUpcoming,
            shouldShow,
            userRole: user?.role
          });
          return shouldShow;
        });
        console.log('Pending meetings count:', pendingMeetings.length);
        console.log('Pending meetings:', pendingMeetings.map(m => ({ id: m.id, title: m.title, isApproved: m.isApproved })));
        return pendingMeetings;
      case 1: // Upcoming - show meetings with status 'Upcoming' or approved meetings in the future
        const upcomingMeetings = meetings.filter(m => {
          // Show meetings that are explicitly upcoming OR approved and in future
          // Ensure mutual exclusivity with pending tab AND exclude past meetings
          const isExplicitlyUpcoming = m.approvalStatus?.toLowerCase() === 'upcoming';
          const isApprovedAndFuture = m.isApproved && m.dateTime > now;
          const isNotCancelled = m.status !== 'cancelled' && !m.isCancelled;
          const isNotPending = m.approvalStatus?.toLowerCase() !== 'pending';
          const isFutureMeeting = m.dateTime > now; // Check if meeting is in the future
          
          const shouldShow = (isExplicitlyUpcoming || (isApprovedAndFuture && isNotPending)) && isNotCancelled && isFutureMeeting;
          
          console.log(`Meeting ${m.id} upcoming check:`, {
            id: m.id,
            isApproved: m.isApproved,
            dateTime: m.dateTime.toISOString(),
            now: now.toISOString(),
            isFuture: m.dateTime > now,
            isExplicitlyUpcoming,
            isApprovedAndFuture,
            isNotCancelled,
            isNotPending,
            isFutureMeeting,
            shouldShow,
            status: m.status,
            approvalStatus: m.approvalStatus
          });
          return shouldShow;
        });
        console.log('Upcoming meetings:', upcomingMeetings.length);
        return upcomingMeetings;
      case 2: // Ongoing - show approved meetings that are currently in progress
        const ongoingMeetings = meetings.filter(isOngoingMeeting);
        console.log('Ongoing meetings:', ongoingMeetings.length);
        return ongoingMeetings;
      case 3: // Completed - show approved meetings that are in the past and not cancelled
        const completedMeetings = meetings.filter(isCompletedMeeting);
        console.log('Completed meetings:', completedMeetings.length);
        return completedMeetings;
      case 4: // Cancelled - show all cancelled meetings
        const cancelledMeetings = meetings.filter(m => m.status === 'cancelled' || m.isCancelled);
        console.log('Cancelled meetings:', cancelledMeetings.length);
        return cancelledMeetings;
      default:
        return meetings;
    }
  }, [tabValue, meetings, user]);

  const getMyInvitesCount = () => {
    // Count meetings using same logic as pending tab
    return meetings.filter(m => {
      const isExplicitlyPending = m.approvalStatus?.toLowerCase() === 'pending';
      const isNotApprovedYet = !m.isApproved && m.status !== 'cancelled' && !m.isCancelled;
      const isNotUpcoming = m.approvalStatus?.toLowerCase() !== 'upcoming';
      return (isExplicitlyPending || (isNotApprovedYet && isNotUpcoming));
    }).length;
  };

  const getUpcomingCount = () => {
    const now = new Date();
    // Count meetings using same logic as upcoming tab
    return meetings.filter(m => {
      const isExplicitlyUpcoming = m.approvalStatus?.toLowerCase() === 'upcoming';
      const isApprovedAndFuture = m.isApproved && m.dateTime > now;
      const isNotCancelled = m.status !== 'cancelled' && !m.isCancelled;
      const isNotPending = m.approvalStatus?.toLowerCase() !== 'pending';
      const isFutureMeeting = m.dateTime > now; // Check if meeting is in the future
      return (isExplicitlyUpcoming || (isApprovedAndFuture && isNotPending)) && isNotCancelled && isFutureMeeting;
    }).length;
  };

  const isCompletedMeeting = (meeting: Meeting) => {
    const now = new Date();
    if (!meeting.endTime || !meeting.meetingDate) return false;
    
    const endDateTime = parseMeetingDateTime(meeting.meetingDate, meeting.endTime);
    if (!endDateTime) return false;
    
    // Check if meeting is approved (either explicitly or by status)
    const isApprovedMeeting = meeting.isApproved || meeting.approvalStatus?.toLowerCase() === 'upcoming';
    return isApprovedMeeting && now > endDateTime && meeting.status !== 'cancelled';
  };

  const getCompletedCount = () => {
    return meetings.filter(isCompletedMeeting).length;
  };

  const getCancelledCount = () => {
    const count = meetings.filter(m => m.status === 'cancelled' || m.isCancelled).length;
    console.log('Cancelled meetings count:', count, 'Total meetings:', meetings.length);
    
    // Update state if count changed
    if (count !== cancelledCount) {
      console.log('Cancelled count changed from', cancelledCount, 'to', count);
      setCancelledCount(count);
    }
    
    return count;
  };

  const parseMeetingDateTime = (date: string, time: string): Date | null => {
    try {
      console.log('Parsing date/time:', { date, time });
      
      // Handle date format "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DD"
      const cleanDate = date.split('T')[0];
      
      // Ensure proper date format YYYY-MM-DD
      const [year, month, day] = cleanDate.split('-').map(num => num.padStart(2, '0'));
      
      // Handle time format "HH:mm:ss" or "HH:mm"
      const cleanTime = time.split(':').slice(0, 2).join(':');
      
      // Ensure proper time format HH:mm
      const [hours, minutes] = cleanTime.split(':').map(num => num.padStart(2, '0'));
      
      const dateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}:00`;
      console.log('Constructed datetime string:', dateTimeStr);
      
      const dateObj = new Date(dateTimeStr);
      console.log('Parsed date object:', dateObj);
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date created:', { dateTimeStr, dateObj });
        return null;
      }
      
      return dateObj;
    } catch (error) {
      console.error('Error parsing date/time:', { error, date, time });
      return null;
    }
  };

  const isPastNonApprovedMeeting = (meeting: Meeting) => {
    const now = new Date();
    if (!meeting.endTime || !meeting.meetingDate) return false;
    
    const endDateTime = parseMeetingDateTime(meeting.meetingDate, meeting.endTime);
    if (!endDateTime) return false;
    
    // Check if meeting is NOT approved and time has passed
    const isApprovedMeeting = meeting.isApproved || meeting.approvalStatus?.toLowerCase() === 'upcoming';
    return !isApprovedMeeting && now > endDateTime && meeting.status !== 'cancelled';
  };

  const isOngoingMeeting = (meeting: Meeting) => {
    const now = new Date();
    console.log('Checking if meeting is ongoing:', {
      id: meeting.id,
      title: meeting.title,
      meetingDate: meeting.meetingDate,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      status: meeting.status,
      isApproved: meeting.isApproved,
      now: now.toISOString()
    });

    if (!meeting.startTime || !meeting.endTime || !meeting.meetingDate) {
      console.log('Meeting missing required date/time fields');
      return false;
    }
    
    const startDateTime = parseMeetingDateTime(meeting.meetingDate, meeting.startTime);
    const endDateTime = parseMeetingDateTime(meeting.meetingDate, meeting.endTime);
    
    if (!startDateTime || !endDateTime) {
      console.log('Failed to parse meeting date/time');
      return false;
    }
    
    // Check if meeting is approved (either explicitly or by status)
    const isApprovedMeeting = meeting.isApproved || meeting.approvalStatus?.toLowerCase() === 'upcoming';
    const isOngoing = now >= startDateTime && now <= endDateTime && meeting.status !== 'cancelled' && isApprovedMeeting;
    console.log('Meeting ongoing check result:', {
      id: meeting.id,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      isAfterStart: now >= startDateTime,
      isBeforeEnd: now <= endDateTime,
      notCancelled: meeting.status !== 'cancelled',
      isApproved: meeting.isApproved,
      approvalStatus: meeting.approvalStatus,
      isApprovedMeeting,
      isOngoing
    });
    
    return isOngoing;
  };

  const getOngoingCount = () => {
    return meetings.filter(isOngoingMeeting).length;
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
      
      // Calendar should only show upcoming meetings (approved and in the future)
      const now = new Date();
      const isExplicitlyUpcoming = meeting.approvalStatus?.toLowerCase() === 'upcoming';
      const isApprovedAndFuture = meeting.isApproved && meetingDate > now;
      const isNotCancelled = meeting.status !== 'cancelled' && !meeting.isCancelled;
      const isNotPending = meeting.approvalStatus?.toLowerCase() !== 'pending';
      const isFutureMeeting = meetingDate > now;
      
      // Use the same logic as upcoming tab filter
      const isUpcomingMeeting = (isExplicitlyUpcoming || (isApprovedAndFuture && isNotPending)) && isNotCancelled && isFutureMeeting;
      
      // Debug logging
      if (isSameDate) {
        console.log('Calendar meeting check (upcoming only):', {
          id: meeting.id,
          title: meeting.title,
          status: meeting.status,
          isApproved: meeting.isApproved,
          approvalStatus: meeting.approvalStatus,
          isExplicitlyUpcoming,
          isApprovedAndFuture,
          isNotCancelled,
          isNotPending,
          isFutureMeeting,
          isUpcomingMeeting,
          meetingDate: meetingDate.toISOString(),
          now: now.toISOString(),
          checkDate: date.toISOString(),
          willShow: isSameDate && isUpcomingMeeting
        });
      }
      
      return isSameDate && isUpcomingMeeting;
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

  const getHourSlots = () => {
    if (eventDetails && eventDetails.startDateTime && eventDetails.endDateTime) {
      // Convert UTC times to IST (UTC+5:30)
      const istStart = convertUTCToIST(eventDetails.startDateTime);
      const istEnd = convertUTCToIST(eventDetails.endDateTime);
      
      const start = istStart.getHours();
      const end = istEnd.getHours();
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
    
    // Convert UTC times to IST (UTC+5:30)
    const istStart = convertUTCToIST(eventDetails.startDateTime);
    const istEnd = convertUTCToIST(eventDetails.endDateTime);
    
    // Check if this date is within event range
    const currentDate = new Date(date);
    currentDate.setHours(hour, 0, 0, 0);
    
    // Get the start and end hours for the event (in IST)
    const eventStartHour = istStart.getHours();
    const eventEndHour = istEnd.getHours();
    
    // Check if this hour falls within the event time range
    return hour >= eventStartHour && hour <= eventEndHour;
  };



  // Calculate meeting layout for Teams-like calendar with spanning blocks
  const getMeetingLayout = (date: Date) => {
    const dayMeetings = getMeetingsForDate(date);
    const hourSlots = getHourSlots();
    
    // Create spanning meeting blocks
    const spanningMeetings: { 
      meeting: Meeting; 
      startHour: number; 
      endHour: number; 
      startMinutes: number; 
      endMinutes: number;
      left: number; 
      width: number;
      level: number;
    }[] = [];
    
    dayMeetings.forEach(meeting => {
      const meetingDate = meeting.dateTime;
      const meetingEndTime = new Date(meetingDate.getTime() + meeting.duration * 60000);
      const startHour = meetingDate.getHours();
      const endHour = meetingEndTime.getHours();
      const startMinutes = meetingDate.getMinutes();
      const endMinutes = meetingEndTime.getMinutes();
      
      spanningMeetings.push({
        meeting,
        startHour,
        endHour,
        startMinutes,
        endMinutes,
        left: 0,
        width: 100,
        level: 0
      });
    });
    
    // Sort meetings by start time for proper overlap calculation
    spanningMeetings.sort((a, b) => {
      const aStart = a.startHour * 60 + a.startMinutes;
      const bStart = b.startHour * 60 + b.startMinutes;
      return aStart - bStart;
    });
    
    // Improved overlap detection and positioning
    // Group meetings into overlapping clusters
    const overlapGroups: typeof spanningMeetings[] = [];
    const processed = new Set<number>();
    
    spanningMeetings.forEach((meeting, index) => {
      if (processed.has(index)) return;
      
      const meetingStart = meeting.startHour * 60 + meeting.startMinutes;
      const meetingEnd = meeting.endHour * 60 + meeting.endMinutes;
      
      // Create a new overlap group starting with this meeting
      const currentGroup = [meeting];
      processed.add(index);
      
      // Find all meetings that overlap with any meeting in the current group
      let foundOverlap = true;
      while (foundOverlap) {
        foundOverlap = false;
        
        spanningMeetings.forEach((otherMeeting, otherIndex) => {
          if (processed.has(otherIndex)) return;
          
          const otherStart = otherMeeting.startHour * 60 + otherMeeting.startMinutes;
          const otherEnd = otherMeeting.endHour * 60 + otherMeeting.endMinutes;
          
          // Check if this meeting overlaps with any meeting in the current group
          const overlapsWithGroup = currentGroup.some(groupMeeting => {
            const groupStart = groupMeeting.startHour * 60 + groupMeeting.startMinutes;
            const groupEnd = groupMeeting.endHour * 60 + groupMeeting.endMinutes;
            
            // True overlap detection - meetings must have overlapping time periods
            // For meetings to be considered overlapping, they must share at least 1 minute of time
            // Adjacent meetings (like 9:00-10:30 and 10:30-11:30) will NOT be grouped together
            return (otherStart < groupEnd) && (groupStart < otherEnd);
          });
          
          if (overlapsWithGroup) {
            currentGroup.push(otherMeeting);
            processed.add(otherIndex);
            foundOverlap = true;
          }
        });
      }
      
      overlapGroups.push(currentGroup);
    });
    
    // Assign levels within each overlap group
    overlapGroups.forEach(group => {
      // Sort group by start time for consistent positioning
      group.sort((a, b) => {
        const aStart = a.startHour * 60 + a.startMinutes;
        const bStart = b.startHour * 60 + b.startMinutes;
        return aStart - bStart;
      });
      
      const groupSize = group.length;
      const groupColumnWidth = 100 / groupSize;
      
      group.forEach((meeting, levelIndex) => {
        meeting.level = levelIndex;
        meeting.width = groupColumnWidth;
        meeting.left = levelIndex * groupColumnWidth;
      });
    });
    
    // Return format that works with existing rendering code
    const layout: { [hour: number]: { meeting: Meeting; top: number; height: number; left: number; width: number; spanningMeeting?: any }[] } = {};
    
    // For each hour slot, add spanning meetings that intersect with it
    hourSlots.forEach(hour => {
      layout[hour] = [];
      
      spanningMeetings.forEach(spanningMeeting => {
        // Check if this spanning meeting intersects with this hour
        if (spanningMeeting.startHour <= hour && hour <= spanningMeeting.endHour) {
          // Only render the meeting block in its starting hour to avoid duplicates
          if (hour === spanningMeeting.startHour) {
            // Calculate position and size for the spanning block
            const top = (spanningMeeting.startMinutes / 60) * 60;
            const totalDuration = (spanningMeeting.endHour - spanningMeeting.startHour) * 60 + 
                                (spanningMeeting.endMinutes - spanningMeeting.startMinutes);
            const height = Math.max((totalDuration / 60) * 60, 24);
            
            layout[hour].push({
              meeting: spanningMeeting.meeting,
              top,
              height,
              left: spanningMeeting.left,
              width: spanningMeeting.width,
              spanningMeeting
            });
          }
        }
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
    // Convert UTC times to IST (UTC+5:30)
    const eventStart = convertUTCToIST(eventDetails.startDateTime);
    const eventEnd = convertUTCToIST(eventDetails.endDateTime);
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(23, 59, 59, 999);
    return date >= eventStart && date <= eventEnd;
  };

  // Helper function to convert UTC to IST
  const convertUTCToIST = (utcDateString: string) => {
    const utcDate = new Date(utcDateString);
    return new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
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
        <Container maxWidth={isMobile ? false : "xl"} sx={{ 
          mt: 0,
          px: isMobile ? 1 : 3,
          maxWidth: isMobile ? '100%' : undefined
        }}>
          {/* Action buttons */}
          {/* Only show top-right button in calendar view */}
          {showCalendar && (
            <Box sx={{ 
              mb: 2, 
              mt: -1, 
              display: 'flex', 
              justifyContent: isMobile ? 'center' : 'flex-end', 
              gap: 1 
            }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleScheduleMeeting}
                size={isMobile ? 'medium' : 'medium'}
                fullWidth={isMobile}
                sx={{
                  maxWidth: isMobile ? '300px' : 'auto'
                }}
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
                p: isMobile ? 1.5 : 2, 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                bgcolor: 'secondary.main',
                color: 'white',
                gap: isMobile ? 1 : 0
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
                  <Box sx={{ textAlign: isMobile ? 'left' : 'right' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: isMobile ? 'flex-start' : 'center', 
                      gap: isMobile ? 1 : 2, 
                      mb: 0.5,
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
                        <Box>
                          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                            Event Start
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                            {convertUTCToIST(eventDetails.startDateTime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: isMobile ? undefined : 'numeric'
                            })}
                          </Typography>
                        </Box>

                        <Box sx={{ mx: 1, opacity: 0.6 }}>→</Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                            Event End
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                            {convertUTCToIST(eventDetails.endDateTime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: isMobile ? undefined : 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                   
                  </Box>
                )}
              </Box>

              {/* Time Slots Header - Responsive */}
              {!isMobile ? (
                // Desktop Calendar Header
                <Box sx={{ display: 'flex', borderBottom: 2, borderColor: 'grey.400' }}>
                  {/* Date column header */}
                  <Box sx={{ width: 120, p: 1, borderRight: 2, borderColor: 'grey.400', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 500 }}>
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
                        borderRight: index < getHourSlots().length - 1 ? 1 : 0, 
                        borderColor: 'grey.300',
                        bgcolor: 'grey.50'
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'text.secondary'
                        }}>
                          {formatHour(hour)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                // Mobile Calendar Header
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'grey.300', bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.85rem', 
                    color: 'text.secondary', 
                    fontWeight: 500,
                    textAlign: 'center'
                  }}>
                    Daily Schedule View
                  </Typography>
                </Box>
              )}

              {/* Date Grid - Responsive */}
              <Box sx={{ 
                height: isMobile ? 'auto' : (eventDetails ? `calc(${getEventDays().length} * 60px)` : '240px'), 
                overflow: isMobile ? 'visible' : 'hidden',
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
                ) : meetingsError ? (
                  // Show error state for meetings in calendar view
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <Alert severity="error" sx={{ maxWidth: '80%' }}>
                      <Typography variant="body2">
                        {meetingsError}
                      </Typography>
                    </Alert>
                  </Box>
                ) : noMeetingsMessage ? (
                  // Show no meetings message in calendar view
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <Alert severity="info" sx={{ maxWidth: '80%' }}>
                      <Typography variant="body2">
                        {noMeetingsMessage}
                      </Typography>
                    </Alert>
                  </Box>
                ) : isMobile ? (
                  // Mobile view - Daily cards
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {getEventDays().map((day, dayIndex) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const dayMeetings = meetings.filter(meeting => 
                        meeting.dateTime.toDateString() === day.toDateString()
                      );
                      
                      return (
                        <Card key={dayIndex} sx={{ 
                          mb: 1,
                          border: isToday ? 2 : 1,
                          borderColor: isToday ? 'secondary.main' : 'grey.300',
                          bgcolor: isToday ? 'secondary.50' : 'white',
                          boxShadow: isToday ? 2 : 1
                        }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            {/* Day header */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mb: dayMeetings.length > 0 ? 2 : 0
                            }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: isToday ? 'bold' : 'medium',
                                color: isToday ? 'secondary.main' : 'text.primary',
                                fontSize: '1rem'
                              }}>
                                {day.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </Typography>
                              <Chip 
                                label={`${dayMeetings.length} meeting${dayMeetings.length !== 1 ? 's' : ''}`}
                                size="small"
                                color={dayMeetings.length > 0 ? 'secondary' : 'default'}
                                variant={dayMeetings.length > 0 ? 'filled' : 'outlined'}
                              />
                            </Box>
                            
                            {/* Day meetings */}
                            {dayMeetings.length > 0 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {dayMeetings
                                  .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
                                  .map((meeting, meetingIndex) => (
                                    <Box
                                      key={meeting.id}
                                      onClick={() => setSelectedMeeting(meeting)}
                                      sx={{
                                        p: 1.5,
                                        borderRadius: 1,
                                        border: 1,
                                        borderColor: 'grey.200',
                                        bgcolor: getStatusColor(meeting.status) === 'secondary' ? 'secondary.50' :
                                                getStatusColor(meeting.status) === 'success' ? 'success.50' :
                                                getStatusColor(meeting.status) === 'warning' ? 'warning.50' :
                                                getStatusColor(meeting.status) === 'error' ? 'error.50' : 'grey.50',
                                        cursor: 'pointer',
                                        '&:hover': {
                                          bgcolor: getStatusColor(meeting.status) === 'secondary' ? 'secondary.100' :
                                                  getStatusColor(meeting.status) === 'success' ? 'success.100' :
                                                  getStatusColor(meeting.status) === 'warning' ? 'warning.100' :
                                                  getStatusColor(meeting.status) === 'error' ? 'error.100' : 'grey.100',
                                          transform: 'scale(1.01)',
                                          boxShadow: 1
                                        }
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ flex: 1 }}>
                                          <Typography variant="body2" sx={{ 
                                            fontWeight: 'bold',
                                            mb: 0.5,
                                            fontSize: '0.9rem'
                                          }}>
                                            {meeting.title}
                                          </Typography>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <AccessTime sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                              {formatTimeOnly(meeting.dateTime)} - {formatTimeOnly(new Date(meeting.dateTime.getTime() + meeting.duration * 60000))}
                                            </Typography>
                                          </Box>
                                          {meeting.attendees && meeting.attendees.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Person sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {meeting.attendees.length} participant{meeting.attendees.length !== 1 ? 's' : ''}
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                        <Chip
                                          label={meeting.status}
                                          size="small"
                                          color={getStatusColor(meeting.status)}
                                          variant="outlined"
                                          sx={{ fontSize: '0.7rem', height: 20 }}
                                        />
                                      </Box>
                                    </Box>
                                  ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ 
                                color: 'text.secondary',
                                fontStyle: 'italic',
                                textAlign: 'center',
                                py: 1
                              }}>
                                No meetings scheduled
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                ) : getEventDays().map((day, dayIndex) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  
                  return (
                    <Box key={dayIndex} sx={{ 
                      display: 'flex',
                      height: 60,
                      borderBottom: dayIndex < getEventDays().length - 1 ? (isWeekend ? 3 : 2) : 0, 
                      borderColor: 'grey.300',
                      bgcolor: dayIndex % 2 === 0 ? 'grey.25' : 'white',
                      '&:hover': { bgcolor: 'grey.50' }
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
                        bgcolor: isToday ? 'secondary.50' : 'grey.50'
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: isToday ? 'bold' : 'normal',
                            color: isToday ? 'secondary.main' : 'text.primary',
                            fontSize: '0.85rem'
                          }}>
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: isToday ? 'bold' : 'normal',
                            color: isToday ? 'secondary.main' : 'text.primary',
                            fontSize: '0.9rem'
                          }}>
                            {day.getDate()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Time slot columns container with relative positioning for spanning meetings */}
                      <Box sx={{ 
                        display: 'flex', 
                        flex: 1, 
                        position: 'relative',
                        height: 60
                      }}>
                        {/* Time slot columns */}
                        {getHourSlots().map((hour, hourIndex) => (
                          <Box key={hourIndex} sx={{ 
                            flex: 1, 
                            borderRight: hourIndex < getHourSlots().length - 1 ? 1 : 0, 
                            borderColor: 'grey.200',
                            cursor: 'pointer',
                            height: 60,
                            bgcolor: hour % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                            '&:hover': { bgcolor: 'secondary.25' }
                          }} />
                        ))}
                        
                        {/* Meetings positioned absolutely over the entire day row */}
                        {(() => {
                          const meetingLayout = getMeetingLayout(day);
                          const allMeetings: any[] = [];
                          
                          // Collect all meetings from all hours (but avoid duplicates)
                          Object.keys(meetingLayout).forEach(hourStr => {
                            const hourMeetings = meetingLayout[parseInt(hourStr)] || [];
                            hourMeetings.forEach(meetingData => {
                              // Only add if not already added (avoid duplicates from spanning)
                              if (!allMeetings.find(m => m.meeting.id === meetingData.meeting.id)) {
                                allMeetings.push(meetingData);
                              }
                            });
                          });
                          
                          return allMeetings.map((meetingData, meetingIndex) => {
                            const spanningMeeting = meetingData.spanningMeeting;
                            const hourSlots = getHourSlots();
                            
                            // Calculate position and size for precise spanning including partial hours
                            const totalColumns = hourSlots.length;
                            const columnWidth = 100 / totalColumns;
                            
                            const startHour = spanningMeeting?.startHour || 0;
                            const endHour = spanningMeeting?.endHour || 0;
                            const startMinutes = spanningMeeting?.startMinutes || 0;
                            const endMinutes = spanningMeeting?.endMinutes || 0;
                            
                            // Calculate precise start position (including minutes within the start hour)
                            const startIndex = hourSlots.indexOf(startHour);
                            const startMinuteFraction = startMinutes / 60; // 0.0 to 1.0
                            const preciseStartPosition = (startIndex + startMinuteFraction) * columnWidth;
                            
                            // Calculate precise end position (including minutes within the end hour)
                            const endIndex = hourSlots.indexOf(endHour);
                            const endMinuteFraction = endMinutes / 60; // 0.0 to 1.0
                            const preciseEndPosition = (endIndex + endMinuteFraction) * columnWidth;
                            
                            // Calculate the actual span width based on precise start and end positions
                            const preciseSpanWidth = preciseEndPosition - preciseStartPosition;
                            
                            // Apply meeting's width adjustment for overlapping meetings
                            const actualWidth = (meetingData.width / 100) * preciseSpanWidth;
                            const leftPosition = preciseStartPosition + (meetingData.left / 100) * preciseSpanWidth;
                            
                            const constrainedTop = Math.max(0, Math.min(meetingData.top, 60 - Math.min(meetingData.height, 56)));
                            const constrainedHeight = Math.min(meetingData.height, 60 - constrainedTop, 56);
                            
                            return (
                              <Tooltip
                                key={`${meetingData.meeting.id}-spanning`}
                                title={`${meetingData.meeting.title} (${formatTimeOnly(meetingData.meeting.dateTime)} - ${formatTimeOnly(new Date(meetingData.meeting.dateTime.getTime() + meetingData.meeting.duration * 60000))})`}
                                placement="top"
                                arrow
                              >
                                <Box
                                  onClick={() => {
                                    setSelectedMeeting(meetingData.meeting);
                                  }}
                                  sx={{
                                    position: 'absolute',
                                    top: constrainedTop + 2,
                                    left: `${leftPosition}%`,
                                    width: `${actualWidth}%`,
                                    bgcolor: getStatusColor(meetingData.meeting.status) === 'secondary' ? 'secondary.light' :
                                             getStatusColor(meetingData.meeting.status) === 'success' ? 'success.light' :
                                             getStatusColor(meetingData.meeting.status) === 'warning' ? 'warning.light' :
                                             getStatusColor(meetingData.meeting.status) === 'error' ? 'error.light' : 'grey.300',
                                    color: 'text.primary',
                                    borderRadius: 1,
                                    p: 0.5,
                                    cursor: 'pointer',
                                    zIndex: 2,
                                    height: `${constrainedHeight - 4}px`,
                                    overflow: 'hidden',
                                    margin: '0 2px',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    maxHeight: '56px',
                                    minWidth: preciseSpanWidth > columnWidth ? `${Math.max(actualWidth * 0.8, 60)}px` : 'auto',
                                    '&:hover': {
                                      opacity: 0.9,
                                      transform: 'scale(1.01)',
                                      boxShadow: 2,
                                      zIndex: 3
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
                                    opacity: 0.8,
                                    lineHeight: 1.1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {formatTimeOnly(meetingData.meeting.dateTime)} - {formatTimeOnly(new Date(meetingData.meeting.dateTime.getTime() + meetingData.meeting.duration * 60000))}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            );
                          });
                        })()}
                      </Box>
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
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    aria-label="meetings tabs"
                    sx={{
                      '& .MuiTab-root': {
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        '&.Mui-selected': {
                          color: 'secondary.main',
                        },
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: 'secondary.main',
                      },
                    }}
                  >
                    <Tab label="Pending" />
                    <Tab label={<Badge badgeContent={getUpcomingCount()} color="info">Upcoming</Badge>}/>
                    <Tab label={<Badge badgeContent={getOngoingCount()} color="warning">Ongoing</Badge>}/>
                    <Tab label={<Badge badgeContent={getCompletedCount()} color="success">Completed</Badge>}/>
                    <Tab label={<Badge badgeContent={getCancelledCount()} color="error">Cancelled</Badge>}/>
                  </Tabs>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                    
                                  <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleScheduleMeeting}
                >
                  Schedule Meeting
                </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Error Message */}
              {meetingsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {meetingsError}
                  </Typography>
                </Alert>
              )}

                            {/* No Meetings Message - Empty State */}
              {noMeetingsMessage && !meetingsError && (
                <Paper sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: 'secondary.50',
                  border: '1px solid',
                  borderColor: 'secondary.light',
                  borderRadius: 2,
                  mb: 2
                }}>
                  <CalendarMonth sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    No meetings found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {noMeetingsMessage}
                  </Typography>
                </Paper>
              )}

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
                    
                    // Debug button visibility
                    console.log('Button visibility check:', {
                      meetingId: meeting.id,
                      tabValue,
                      meetingStatus: meeting.status,
                      isInitiator: meeting.isInitiator,
                      shouldShowAcceptReject: shouldShowAcceptReject(meeting, user),
                      shouldShowRescheduleCancel: shouldShowRescheduleCancel(meeting, user),
                      isApproved: meeting.isApproved,
                      userRole: user?.role,
                      buttonLogic: {
                        acceptReject: `isInitiator: ${meeting.isInitiator}, isApproved: ${meeting.isApproved}, status: ${meeting.status}`,
                        rescheduleCancel: `isInitiator: ${meeting.isInitiator}, status: ${meeting.status}`
                      }
                    });
                    
                    return (
              <Grid item xs={12} key={meeting.id}>
                <Card sx={{ 
                  transition: 'all 0.3s',
                  // Conditional styling based on meeting state
                  ...(isPastNonApprovedMeeting(meeting) ? {
                    opacity: 0.5,
                    pointerEvents: 'none',
                    backgroundColor: 'grey.100',
                    cursor: 'not-allowed'
                  } : {
                    '&:hover': { 
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    }
                  })
                }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" component="div">
                            {meeting.title}
                          </Typography>
                          {(() => {
                            // Derive tab-specific label and color so each tab shows its own status
                            // Tabs (by usage in this file):
                            // 0 = Pending, 1 = Upcoming (approved & future), 2 = Ongoing (approved & in-progress), 3 = Completed, 4 = Cancelled
                            let label: string;
                            let color: any;

                            // Hard meeting states first
                            if (meeting.status === 'cancelled' || meeting.isCancelled) {
                              label = 'cancelled';
                              color = 'error';
                            } else if (tabValue === 0) {
                              label = 'pending';
                              color = 'warning';
                            } else if (tabValue === 1) {
                              label = 'upcoming';
                              color = 'info';
                            } else if (tabValue === 2 && isOngoingMeeting(meeting)) {
                              label = 'ongoing';
                              color = 'warning';
                            } else if (tabValue === 3) {
                              label = 'completed';
                              color = 'success';
                            } else {
                              label = meeting.status;
                              color = getStatusColor(meeting.status);
                            }

                            return (
                              <Chip
                                label={label}
                                size="small"
                                sx={{ 
                                  ml: 1,
                                  ...(color === 'error' && {
                                    bgcolor: 'error.light',
                                    color: 'error.contrastText',
                                    '& .MuiChip-label': {
                                      color: 'error.contrastText'
                                    }
                                  }),
                                  ...(color === 'warning' && {
                                    bgcolor: 'warning.light',
                                    color: 'warning.contrastText',
                                    '& .MuiChip-label': {
                                      color: 'warning.contrastText'
                                    }
                                  }),
                                  ...(color === 'info' && {
                                    bgcolor: 'info.light',
                                    color: 'info.contrastText',
                                    '& .MuiChip-label': {
                                      color: 'info.contrastText'
                                    }
                                  }),
                                  ...(color === 'success' && {
                                    bgcolor: 'success.light',
                                    color: 'success.contrastText',
                                    '& .MuiChip-label': {
                                      color: 'success.contrastText'
                                    }
                                  })
                                }}
                              />
                            );
                          })()}
                        </Box>
                        
                        
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          {/* Meeting Date */}
                          <Grid item xs={12} sm={6} md={3} sx={{ mr: -2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarMonth fontSize="small" color="warning" />
                              <Typography variant="body2">
                                {formatMeetingDate(meeting.meetingDate || '')}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Start Time */}
                          <Grid item xs={12} sm={6} md={3} sx={{ mr: -2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTime fontSize="small" color="success" />
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

                      

                        {/* Initiator Information */}
                        {meeting.initiatorName && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Initiator:
                            </Typography>
                            <Chip
                              avatar={<Avatar sx={{ bgcolor: 'secondary.main', width: 20, height: 20, fontSize: '0.7rem' }}>
                                {meeting.initiatorName.charAt(0).toUpperCase()}
                              </Avatar>}
                              label={`${meeting.initiatorName}${meeting.companyName ? ` (${meeting.companyName})` : ''}`}
                              variant="outlined"
                              size="small"
                              sx={{ fontSize: '0.75rem', height: 24 }}
                            />
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Attendees:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {meeting.attendees.map((attendee) => {
                              console.log('🎨 UI RENDERING - Rendering attendee chip with data:', attendee);
                              const displayLabel = attendee.company && attendee.company.trim() !== '' 
                                ? `${attendee.name} (${attendee.company})`
                                : attendee.name;
                              console.log('Display label:', displayLabel);
                              return (
                                <Chip
                                  key={attendee.id}
                                  avatar={<Avatar sx={{ bgcolor: 'secondary.main', width: 20, height: 20, fontSize: '0.7rem' }}>{attendee.avatar}</Avatar>}
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
                    {/* {meeting.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: -1 }}>
                        Notes: {meeting.notes}
                      </Typography>
                    )} */}
                      </Box>

                      {/* Action buttons in top right corner */}
                      {(tabValue === 0 || tabValue === 1) && meeting.status !== 'cancelled' && meeting.status !== 'completed' && (
                        <Box sx={{ display: 'flex', gap: 1, ml: 1, flexWrap: 'wrap' }}>
                          {/* Show accept/reject buttons ONLY for attendees (not initiators) */}
                          {shouldShowAcceptReject(meeting, user) && (
                            <>
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
                                  title="Accept Meeting"
                              >
                                {approvingMeetingId === meeting.id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <CheckCircleOutline fontSize="small" />
                                )}
                              </IconButton>
                              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {approvingMeetingId === meeting.id ? 'Accepting...' : 'Accept'}
                              </Typography>
                            </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              color="error"
                              disabled={rejectingMeetingId === meeting.id}
                              onClick={() => handleRejectMeeting(meeting.id)}
                              sx={{ 
                                bgcolor: 'error.light', 
                                color: 'white',
                                '&:hover': { bgcolor: 'error.main' },
                                '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                              }}
                              title="Reject Meeting"
                            >
                              {rejectingMeetingId === meeting.id ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <CancelOutlined fontSize="small" />
                              )}
                            </IconButton>
                            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {rejectingMeetingId === meeting.id ? 'Rejecting...' : 'Reject'}
                            </Typography>
                          </Box>
                            </>
                          )}
                          
                          {/* Show reschedule/cancel buttons ONLY for initiators */}
                          {shouldShowRescheduleCancel(meeting, user) && (
                            <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              color="default"
                              onClick={() => handleOpenRescheduleDialog(meeting)}
                              sx={{ 
                                bgcolor: 'grey.400', 
                                color: 'white',
                                '&:hover': { bgcolor: 'grey.600' },
                                '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                              }}
                              title="Reschedule Meeting"
                            >
                              <EventAvailable fontSize="small" />
                            </IconButton>
                            <Typography variant="caption" sx={{ color: 'gray', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              Reschedule
                            </Typography>
                          </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton 
                                  size="small" 
                                  color="default"
                                  disabled={cancellingMeetingId === meeting.id}
                                  onClick={() => handleOpenCancelDialog(meeting)}
                                  sx={{ 
                                    bgcolor: 'grey.400', 
                                    color: 'white',
                                    '&:hover': { bgcolor: 'grey.600' },
                                    '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                                  }}
                                  title="Cancel Meeting"
                                >
                                  {cancellingMeetingId === meeting.id ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <Cancel fontSize="small" />
                                  )}
                                </IconButton>
                                <Typography variant="caption" sx={{ color: 'gray', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {cancellingMeetingId === meeting.id ? 'Cancelling...' : 'Cancel'}
                                </Typography>
                              </Box>
                            </>
                          )}
                          
                          {/* Show approved status for approved meetings (for both initiators and attendees) */}
                          {(meeting.isApproved || meeting.approvalStatus?.toLowerCase() === 'upcoming') && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip 
                                label="Approved" 
                                color="success"
                                size="small"
                                icon={<CheckCircleOutline />}
                                sx={{ 
                                  fontSize: '0.75rem',
                                  backgroundColor: 'success.main',
                                  color: 'success.contrastText',
                                  '& .MuiChip-icon': {
                                    color: 'success.contrastText'
                                  }
                                }}
                              />
                            </Box>
                          )}
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

              {!meetingsLoading && !meetingsError && !noMeetingsMessage && getFilteredMeetings().length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <CalendarMonth sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    {tabValue === 0 
                      ? "No Pending Meetings"
                      : tabValue === 1
                      ? "No Upcoming Meetings"
                      : tabValue === 2
                      ? "No Ongoing Meetings"
                      : tabValue === 3
                      ? "No Completed Meetings"
                      : tabValue === 4
                      ? "No Cancelled Meetings"
                      : "No Meetings Available"
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {tabValue === 0 
                      ? "Great! All your meeting requests have been processed. Check other tabs for your meetings."
                      : tabValue === 1
                      ? "No upcoming meetings scheduled. Use the 'Schedule Meeting' button to start planning."
                      : tabValue === 2
                      ? "No meetings are currently in progress. Check your upcoming meetings tab."
                      : tabValue === 3
                      ? "No completed meetings yet. Your finished meetings will appear here."
                      : tabValue === 4
                      ? "No cancelled meetings. This is a good sign - all your meetings are active!"
                      : "No meetings available in this category at the moment."
                    }
                  </Typography>
                
                </Paper>
              )}
            </>
          )}
        </Container>

        {/* Reschedule Meeting Dialog */}
        <Dialog 
          open={showRescheduleDialog} 
          onClose={handleCloseRescheduleDialog}
          maxWidth="sm" 
          fullWidth
          disableEscapeKeyDown={false}
          PaperProps={{
            sx: {
              maxHeight: '90vh',
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
                background: 'primary.main',
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
            p: 3,
            background: 'primary.main'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'primary.main',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                }}
              >
                <ScheduleSend sx={{ color: 'secondary.main', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700,
                  
                  color: 'secondary.main',
                 
                  mb: 0.5
                }}>
                  Reschedule Meeting
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Update meeting details and time
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleCloseRescheduleDialog}
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
          
          <DialogContent sx={{ p: 3 }}>
            {selectedMeetingForReschedule && (
              <Box sx={{ mb: -1 ,mt: 3}}>
                <Grid container spacing={3}>
                  {/* Meeting Organizer Section */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: theme.palette.secondary.main,
                          color: 'white',
                          flexShrink: 0
                        }}
                      >
                        <Person sx={{ fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {user?.firstName} {user?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {user?.role === 'event-admin' ? 'Event-Admin' : user?.role === 'exhibitor' ? 'Exhibitor' : 'Visitor'} • You Are Rescheduling This Meeting
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Title Field */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: -1, mt: -3 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'secondary.main',
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
                              mt: 1,
                              '&::placeholder': {
                                color: 'text.primary',
                                opacity: 1,
                              },
                            },
                          },
                        }}
                        placeholder="Add a title"
                        value={rescheduleForm.agenda}
                        onChange={(e) => handleRescheduleFormChange('agenda', e.target.value)}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>

                  {/* Attendees Section (Read-only) */}
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
                          bgcolor: 'grey.300',
                          color: 'grey.600',
                          mt: 1,
                          flexShrink: 0
                        }}
                      >
                        <GroupAdd fontSize="small" />
                      </Box>
                      <Box sx={{ flex: 1, mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                          Attendees
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {selectedMeetingForReschedule.attendees && selectedMeetingForReschedule.attendees.length > 0 ? (
                            selectedMeetingForReschedule.attendees.map((attendee, index) => (
                              <Chip
                                key={attendee.id}
                                label={attendee.name}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.8rem',
                                  height: '28px',
                                  '& .MuiChip-label': {
                                    px: 1,
                                  },
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No attendees
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Grid>



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
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                              Date
                            </Typography>
                            <TextField
                            value={rescheduleForm.meetingDate ? new Date(rescheduleForm.meetingDate).toLocaleDateString('en-US', { 
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric'
                            }) : ''}
                            onClick={(e) => {
                              setRescheduleDatePickerAnchorEl(e.currentTarget);
                            }}
                            placeholder="Select date"
                            variant="outlined"
                            error={!!rescheduleFormErrors.meetingDate}
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
                                  borderColor: 'secondary.main',
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
                          </Box>
                          
                          {/* Calendar Popup */}
                          <Popover
                            open={Boolean(rescheduleDatePickerAnchorEl)}
                            onClose={() => setRescheduleDatePickerAnchorEl(null)}
                            anchorEl={rescheduleDatePickerAnchorEl}
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
                                  onClick={handleReschedulePreviousMonth}
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
                                  {rescheduleCurrentCalendarDate.toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    year: 'numeric' 
                                  })}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={handleRescheduleNextMonth}
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
                                  <Box sx={{ fontSize: '0.75rem', lineHeight: 0.5 }}>▶</Box>
                                </IconButton>
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <IconButton 
                                  size="small" 
                                  onClick={handleReschedulePreviousYear}
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
                                  onClick={handleRescheduleNextYear}
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
                                  const displayMonth = rescheduleCurrentCalendarDate.getMonth();
                                  const displayYear = rescheduleCurrentCalendarDate.getFullYear();
                                  
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
                                    const isSelected = rescheduleForm.meetingDate === dateStr;
                                    
                                    // Fix today comparison
                                    const today = new Date();
                                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                    const isToday = dateStr === todayStr;
                                    
                                    // Check if this date is within event range
                                    const isInEventRange = isRescheduleDateInEventRange(dateStr);
                                    
                                    calendarDays.push(
                                      <Box
                                        key={i}
                                        onClick={() => {
                                          // Only allow selection if date is in event range
                                          if (isInEventRange) {
                                            handleRescheduleFormChange('meetingDate', dateStr);
                                            setRescheduleDatePickerAnchorEl(null);
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
                                          backgroundColor: isSelected ? 'secondary.main' : 
                                                         isInEventRange ? 'transparent' : 'grey.100',
                                          border: isToday ? '2px solid' : 'none',
                                          borderColor: isToday ? 'secondary.main' : 'transparent',
                                          '&:hover': {
                                            backgroundColor: isSelected ? 'secondary.dark' : 
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
                                onClick={handleRescheduleToday}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.700rem',
                                  px: 1,
                                  py: 1,
                                  color: 'white',
                                  fontWeight: 500,
                                  '&:hover': {
                                    backgroundColor: 'secondary.50'
                                  }
                                }}
                              >
                                Today
                              </Button>
                            </Box>
                          </Popover>

                          {/* Start Time Field */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                              Start time
                            </Typography>
                            <FormControl error={!!rescheduleFormErrors.startTime} disabled={isRescheduling}>
                              <Select
                              value={rescheduleForm.startTime}
                              onChange={(e) => handleRescheduleFormChange('startTime', e.target.value)}
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
                                    borderColor: 'secondary.main',
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
                                const eventTimeSlots = getRescheduleEventTimeSlots();
                                
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
                          </Box>

                          {/* End Time Field */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                              End time
                            </Typography>
                            <FormControl error={!!rescheduleFormErrors.endTime} disabled={isRescheduling}>
                              <Select
                              value={rescheduleForm.endTime}
                              onChange={(e) => handleRescheduleFormChange('endTime', e.target.value)}
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
                                    borderColor: 'secondary.main',
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
                                const availableEndTimes = getRescheduleAvailableEndTimes(rescheduleForm.startTime);
                                
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
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Description Field */}
                  {/* <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Add a description for the meeting"
                      value={rescheduleForm.description || ''}
                      onChange={(e) => handleRescheduleFormChange('description', e.target.value)}
                      variant="outlined"
                      error={!!rescheduleFormErrors.description}
                      helperText={rescheduleFormErrors.description}
                      disabled={isRescheduling}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'secondary.main',
                          },
                        },
                      }}
                    />
                  </Grid> */}


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
              onClick={handleCloseRescheduleDialog} 
              size="small"
              disabled={isRescheduling}
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
              onClick={handleRescheduleSubmit}
              size="small"
              disabled={isRescheduling}
              startIcon={isRescheduling ? <CircularProgress size={16} /> : <ScheduleSend />}
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
              {isRescheduling ? 'Rescheduling...' : 'Reschedule Meeting'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Meeting Confirmation Dialog */}
        <Dialog 
          open={showCancelConfirmDialog} 
          onClose={handleCloseCancelDialog}
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
          {/* <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            p: 2
          }}> */}
           
            {/* <IconButton
              onClick={handleCloseCancelDialog}
              size="small"
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'rotate(90deg)',
                  backgroundColor: 'action.hover',
                }
              }}
            >
              
            </IconButton> */}
          {/* </Dialog></DialogTitle> */}
          
          <DialogContent>
            <Box sx={{ mb: 1, }}>
              <Typography variant="h6" sx={{ mb: 1,ml:0, color: 'text.secondary' }}>
                Are you sure want to cancel this meeting?
              </Typography>
              
              
            </Box>
          </DialogContent>

          <DialogActions sx={{ 
            p: 2, 
            // borderTop: '1px solid',
            // borderColor: 'divider',
            gap: 1
          }}>
            <Button 
              onClick={handleCloseCancelDialog} 
              size="small"
              variant="outlined"
            >
              Keep Meeting
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleCancelMeeting}
              size="small"
              disabled={cancellingMeetingId === selectedMeetingForCancel?.id}
              startIcon={cancellingMeetingId === selectedMeetingForCancel?.id ? <CircularProgress size={14} /> : <Cancel fontSize="small" />}
            >
              {cancellingMeetingId === selectedMeetingForCancel?.id ? 'Cancelling...' : 'Yes, Cancel Meeting'}
            </Button>
          </DialogActions>
        </Dialog>

      </ResponsiveDashboardLayout>
      
      {/* Add CSS for badge animation */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </RoleBasedRoute>
  );
} 