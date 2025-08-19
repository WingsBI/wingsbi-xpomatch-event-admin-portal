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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  return meeting.isInitiator === true;
};

const canCancelMeeting = (meeting: Meeting, user: any) => {
  return meeting.isInitiator === true;
};

const canAcceptRejectMeeting = (meeting: Meeting, user: any) => {
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
    meetingDate: '',
    startTime: '',
    endTime: ''
  });
  const [isRescheduling, setIsRescheduling] = useState(false);
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
      
      if (user.role === 'visitor') {
        let visitorId = null;
        
        // Get user ID from JWT token (cookie-based) - same logic as exhibitor
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
              visitorId = parseInt(tokenData.id);
            }
          }
        } catch (error) {
          console.error('Error parsing JWT token for visitorId:', error);
        }
        
        // Fallback to getCurrentVisitorId() if JWT parsing fails
        if (!visitorId) {
          visitorId = getCurrentVisitorId();
        }
        
        console.log('=== VISITOR ROLE DEBUG ===');
        console.log('User role:', user.role);
        console.log('Visitor ID from JWT token:', visitorId);
        console.log('User object:', user);
        
        if (!visitorId) {
          console.warn('No visitorId found for visitor role');
          setMeetingsError('Unable to load meetings: Visitor ID not found. Please try refreshing the page.');
          return;
        }
        
        currentUserId = visitorId;
        
        console.log('Calling API with attendeeId:', visitorId);
        
        // Get meetings where visitor is the initiator
        try {
        initiatorResponse = await MeetingDetailsApi.getMeetingInitiatorDetails(identifier, visitorId);
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
        
        // Get meetings where visitor is an attendee with retry logic
        let invitesResponse = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries && !invitesResponse?.result) {
          try {
            console.log(`Attempt ${retryCount + 1} to get meeting invites for attendee ID: ${visitorId}`);
            invitesResponse = await MeetingDetailsApi.getAllMeetingInvites(identifier, visitorId);
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
          console.log(`🔍 VISITOR INVITE PROCESSING - Processing invite ${index + 1}:`, invite);
          console.log(`🔍 VISITOR INVITE - Attendee name: ${invite.attendeeName}, Company: ${invite.companyName}`);
          const meetingDetails = invite.meetingDetails?.[0];
          console.log(`🔍 VISITOR INVITE - Meeting details for invite ${index + 1}:`, meetingDetails);
          
          // Determine if current user is the initiator of this meeting
          // Use the original user ID (visitorId) for initiator check, not the fallback ID
          const isCurrentUserInitiator = visitorId && (meetingDetails?.initiatorId === visitorId);
          console.log(`Invite ${index + 1} initiator check:`, {
            currentUserId,
            visitorId,
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
              // Add the attendee (current user) - handle both attendeesId and attendeeId
              {
                id: (invite.attendeesId || invite.attendeeId || invite.id).toString(),
                name: invite.attendeeName,
                email: `${invite.attendeeName?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                company: invite.companyName,
                type: 'visitor', // Current user is visitor
                avatar: (invite.attendeeName?.charAt(0) || 'A').toUpperCase()
              }
              // Note: Initiator is not added to attendees list - they are shown separately in the Initiator section
            ],
            // Add approval status from invite
            isApproved: invite.isApproved === true,
            isCancelled: invite.isCancelled === true,
            approvalStatus: invite.status,
            // Set isInitiator based on current user ID comparison
            isInitiator: isCurrentUserInitiator,
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
        console.log('=== COMBINING VISITOR RESPONSES ===');
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
        
        console.log('Final combined visitor response result count:', response.result.length);
        console.log('Final combined visitor response:', response);
        
      } else if (user.role === 'exhibitor') {
        let userId = null;
        
        // Get user ID from JWT token (cookie-based)
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
              userId = parseInt(tokenData.id);
            }
          }
        } catch (error) {
          console.error('Error parsing JWT token for userId:', error);
        }
        
        if (!userId) {
          console.warn('No userId found for exhibitor role');
          setMeetingsError('Unable to load meetings: Exhibitor ID not found. Please try refreshing the page.');
          return;
        }
        
        currentUserId = userId;
        console.log('=== EXHIBITOR ROLE DEBUG ===');
        console.log('User role:', user.role);
        console.log('User ID from JWT token:', userId);
        console.log('User object:', user);
        
        console.log('Calling API with userId:', userId);
        
        // Get meetings where exhibitor is the initiator
        try {
        initiatorResponse = await MeetingDetailsApi.getMeetingInitiatorDetails(identifier, userId);
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
        
        // Get meetings where exhibitor is an attendee with retry logic
        let invitesResponse = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries && !invitesResponse?.result) {
          try {
            console.log(`Attempt ${retryCount + 1} to get meeting invites for attendee ID: ${userId}`);
        invitesResponse = await MeetingDetailsApi.getAllMeetingInvites(identifier, userId);
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
        
        console.log('=== getAllMeetingInvites Response ===');
        console.log('Full response:', invitesResponse);
        console.log('Result array:', invitesResponse?.result);
        console.log('Result length:', invitesResponse?.result?.length);
        
        // Transform invites response to match meeting format (tolerate meetingDetails: null)
        console.log('=== TRANSFORMING EXHIBITOR INVITES ===');
        console.log('Raw exhibitor invites response:', invitesResponse);
        console.log('Exhibitor invites result array:', invitesResponse?.result);
        console.log('Number of exhibitor invites to transform:', invitesResponse?.result?.length || 0);
        
        const transformedInvites = (invitesResponse?.result || []).map((invite: any, index: number) => {
          console.log(`🔍 EXHIBITOR INVITE PROCESSING - Processing exhibitor invite ${index + 1}:`, invite);
          console.log(`🔍 EXHIBITOR INVITE - Attendee name: ${invite.attendeeName}, Company: ${invite.companyName}`);
          const meetingDetails = invite.meetingDetails?.[0];
          console.log(`🔍 EXHIBITOR INVITE - Meeting details for exhibitor invite ${index + 1}:`, meetingDetails);
          
          // Determine if current user is the initiator of this meeting
          // Use the original user ID (userId) for initiator check, not the fallback ID
          const isCurrentUserInitiator = userId && (meetingDetails?.initiatorId === userId);
          console.log(`Exhibitor invite ${index + 1} initiator check:`, {
            currentUserId,
            originalUserId: userId,
            meetingInitiatorId: meetingDetails?.initiatorId,
            isCurrentUserInitiator,
            meetingId: meetingDetails?.id || invite.meetingId || invite.id
          });
          
          return {
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
              // Add the attendee (current user) - handle both attendeesId and attendeeId
              {
                id: (invite.attendeesId || invite.attendeeId || invite.id).toString(),
                name: invite.attendeeName,
                email: `${invite.attendeeName?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                company: invite.companyName,
                type: 'exhibitor', // Current user is exhibitor
                avatar: (invite.attendeeName?.charAt(0) || 'A').toUpperCase()
              }
              // Note: Initiator is not added to attendees list - they are shown separately in the Initiator section
            ],
            // Add approval status from invite
            isApproved: invite.isApproved === true,
            isCancelled: invite.isCancelled === true,
            approvalStatus: invite.status,
            // Set isInitiator based on current user ID comparison
            isInitiator: isCurrentUserInitiator,
          };
        }).filter(Boolean);
        
        console.log('=== Transformed Invites ===');
        console.log('Transformed invites count:', transformedInvites.length);
        console.log('Transformed invites:', transformedInvites);
        
        // Combine both responses
        console.log('=== COMBINING EXHIBITOR RESPONSES ===');
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
        
        console.log('Final combined exhibitor response result count:', response.result.length);
        console.log('Final combined exhibitor response:', response);
      } else if (user.role === 'event-admin') {
        // For event-admins, show all meetings
        const visitorId = getCurrentVisitorId();
        if (!visitorId) {
          console.warn('No visitor ID found for event-admin role');
          setMeetingsError('Unable to load meetings: Event admin ID not found. Please try refreshing the page.');
          return;
        }
        currentUserId = visitorId;
        try {
        response = await MeetingDetailsApi.getVisitorMeetingDetails(identifier, visitorId);
        } catch (error) {
          console.error('Error fetching event admin meetings:', error);
          response = { result: [] };
        }
      } else {
        console.warn('Unknown user role for meetings:', user.role);
        setMeetingsError(`Unable to load meetings: Unknown user role '${user.role}'. Please contact support.`);
        return;
      }
      
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
          
          // First, check if there's attendee information at the root level (for meeting invites)
          if (apiMeeting.attendeeName && apiMeeting.companyName) {
            console.log('Processing root level attendee:', { attendeeName: apiMeeting.attendeeName, companyName: apiMeeting.companyName });
            
            // Check if this attendee is already in the attendees list
            const existingAttendee = attendees.find(attendee => 
              attendee.name === apiMeeting.attendeeName.trim() && 
              attendee.company === apiMeeting.companyName.trim()
            );
            
            if (!existingAttendee) {
              attendees.push({
                id: apiMeeting.attendeesId?.toString() || `attendee-${Math.random()}`,
                name: apiMeeting.attendeeName.trim() || 'Attendee',
                email: `${apiMeeting.attendeeName?.toLowerCase().replace(/\s+/g, '.')}@example.com` || 'attendee@example.com',
                company: apiMeeting.companyName.trim() || 'Company',
                type: 'visitor' as const,
                avatar: (apiMeeting.attendeeName?.charAt(0) || 'A').toUpperCase()
              });
            } else {
              console.log('Attendee already exists in attendees list, skipping duplicate');
            }
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
                  type: 'visitor' as const,
                  avatar: (attendee.attendeeName?.charAt(0) || 'A').toUpperCase()
                };
                
                console.log('Processed attendee:', attendeeData);
                  attendees.push(attendeeData);
              });
            }
          }

          // Note: Initiator should NOT be added to attendees list - they are shown separately in the Initiator section
          // The initiator information is displayed in the "Initiator" field, not in the "Attendees" list
          
          // Note: We don't add initiator as fallback attendee anymore - initiator is shown separately

          // If still no attendees found, add a fallback
          if (attendees.length === 0) {
            console.log('No attendees or initiator found, using fallback');
            attendees.push({
              id: '1',
              name: 'Attendee',
              email: 'attendee@example.com',
              company: 'Company',
              type: 'visitor',
              avatar: 'A'
            });
          }
          
          console.log('Final attendees list:', attendees);

          const transformedMeeting = {
            id: apiMeeting.id?.toString() || Math.random().toString(),
            title: agenda || 'Meeting',
            description: apiMeeting.description || 'No description available',
            dateTime: dateTime,
            duration: calculateDuration(startTime, apiMeeting.endTime || (apiMeeting.meetingDetails?.[0]?.endTime)),
            type: 'in-person' as const, // Default type
            location: apiMeeting.location || undefined,
            attendees: attendees,
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
            isInitiator: isCurrentUserInitiator,
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
      } else if (response && !response.isError && response.result && response.result.length === 0) {
        // No meetings found - set appropriate message
        setMeetings([]);
        const roleMessages = {
          'visitor': 'Welcome! Start your networking journey by scheduling meetings with exhibitors or wait for meeting invitations.',
          'exhibitor': 'Welcome! Start connecting with visitors by scheduling meetings or wait for meeting requests.',
          'event-admin': 'No meetings have been scheduled for this event yet. Meetings will appear here once participants start scheduling.'
        };
        setNoMeetingsMessage(roleMessages[user.role as keyof typeof roleMessages] || 'Welcome! Start scheduling meetings to connect with other participants.');
      } else {
        setMeetings([]);
        setMeetingsError('Unable to load meetings. Please try refreshing the page.');
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

      // Get current user's attendee ID
      let attendeeId: number | null = null;
      
      if (user?.role === 'visitor') {
        // Get user ID from JWT token (cookie-based) - same logic as loadMeetings
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
        
        // Fallback to getCurrentVisitorId() if JWT parsing fails
        if (!attendeeId) {
          attendeeId = getCurrentVisitorId();
        }
      } else if (user?.role === 'exhibitor') {
        // Get user ID from JWT token for exhibitors (cookie-based)
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

      // Get current user's attendee ID
      let attendeeId: number | null = null;
      
      if (user?.role === 'visitor') {
        // Get user ID from JWT token (cookie-based) - same logic as loadMeetings
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
        
        // Fallback to getCurrentVisitorId() if JWT parsing fails
        if (!attendeeId) {
          attendeeId = getCurrentVisitorId();
        }
      } else if (user?.role === 'exhibitor') {
        // Get user ID from JWT token for exhibitors (cookie-based)
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
          formattedDate = date.toISOString().split('T')[0];
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
          // Ensure mutual exclusivity with pending tab
          const isExplicitlyUpcoming = m.approvalStatus?.toLowerCase() === 'upcoming';
          const isApprovedAndFuture = m.isApproved && m.dateTime > now;
          const isNotCancelled = m.status !== 'cancelled' && !m.isCancelled;
          const isNotPending = m.approvalStatus?.toLowerCase() !== 'pending';
          
          const shouldShow = (isExplicitlyUpcoming || (isApprovedAndFuture && isNotPending)) && isNotCancelled;
          
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
      return (isExplicitlyUpcoming || (isApprovedAndFuture && isNotPending)) && isNotCancelled;
    }).length;
  };

  const isCompletedMeeting = (meeting: Meeting) => {
    const now = new Date();
    if (!meeting.endTime || !meeting.meetingDate) return false;
    
    const endDateTime = parseMeetingDateTime(meeting.meetingDate, meeting.endTime);
    if (!endDateTime) return false;
    
    return meeting.isApproved && now > endDateTime && meeting.status !== 'cancelled';
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
    
    const isOngoing = now >= startDateTime && now <= endDateTime && meeting.status !== 'cancelled' && meeting.isApproved;
    console.log('Meeting ongoing check result:', {
      id: meeting.id,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      isAfterStart: now >= startDateTime,
      isBeforeEnd: now <= endDateTime,
      notCancelled: meeting.status !== 'cancelled',
      isApproved: meeting.isApproved,
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
            <Box sx={{ mb: 2, mt: -1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
                onClick={handleRefreshMeetings}
                disabled={meetingsLoading || isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
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

              {/* Date Grid - Vertical with Day Partitioning */}
              <Box sx={{ 
                height: eventDetails ? `calc(${getEventDays().length} * 60px)` : '240px', 
                overflow: 'hidden',
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
                        bgcolor: isToday ? 'primary.50' : 'grey.50'
                      }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: isToday ? 'bold' : 'normal',
                            color: isToday ? 'primary.main' : 'text.primary',
                            fontSize: '0.85rem'
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
                            '&:hover': { bgcolor: 'primary.25' }
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
                                    bgcolor: getStatusColor(meetingData.meeting.status) === 'primary' ? 'primary.light' :
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
                  <Tabs value={tabValue} onChange={handleTabChange} aria-label="meetings tabs">
                    <Tab label="Pending" />
                    <Tab label={<Badge badgeContent={getUpcomingCount()} color="warning">Upcoming</Badge>}/>
                    <Tab label={<Badge badgeContent={getOngoingCount()} color="warning">Ongoing</Badge>}/>
                    <Tab label={<Badge badgeContent={getCompletedCount()} color="success">Completed</Badge>}/>
                    <Tab label="Cancelled" />
                  </Tabs>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
                      onClick={handleRefreshMeetings}
                      disabled={meetingsLoading || isRefreshing}
                    >
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
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
                  bgcolor: 'primary.50',
                  border: '1px solid',
                  borderColor: 'primary.light',
                  borderRadius: 2,
                  mb: 2
                }}>
                  <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
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
                              color = 'success';
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
                                color={color}
                                size="small"
                                sx={{ ml: 1 }}
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
                              avatar={<Avatar sx={{ bgcolor: 'primary.main', width: 20, height: 20, fontSize: '0.7rem' }}>
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
                                sx={{ fontSize: '0.75rem' }}
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
                  {tabValue === 1 && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleScheduleMeeting}
                      sx={{ mt: 1 }}
                    >
                      Schedule Your First Meeting
                    </Button>
                  )}
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
              <Event color="primary" fontSize="small" />
              <Typography variant="subtitle1" component="div">
                Reschedule Meeting
              </Typography>
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
          
          <DialogContent>
            {/* Current Meeting Info */}
            {selectedMeetingForReschedule && (
              <Box sx={{ mb: 3, p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Event fontSize="small" />
                  Current Meeting Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Description fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Title
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedMeetingForReschedule.title}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {selectedMeetingForReschedule.meetingDate && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CalendarMonth fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatMeetingDate(selectedMeetingForReschedule.meetingDate)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {selectedMeetingForReschedule.startTime && selectedMeetingForReschedule.endTime && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <AccessTime fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Time
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatTime(selectedMeetingForReschedule.startTime)} - {formatTime(selectedMeetingForReschedule.endTime)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Current User as Organizer */}
                  {user && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Person fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Organizer (You)
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', minWidth: '60px' }}>
                              Name:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', minWidth: '60px' }}>
                              Role:
                            </Typography>
                            <Chip
                              label={user.role === 'event-admin' ? 'Event Admin' : user.role === 'exhibitor' ? 'Exhibitor' : 'Visitor'}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{
                                fontSize: '0.7rem',
                                height: '20px',
                                '& .MuiChip-label': {
                                  px: 0.5,
                                },
                              }}
                            />
                          </Box>
                          {user.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', minWidth: '60px' }}>
                                Email:
                              </Typography>
                              <Chip
                                label={user.email}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: '20px',
                                  '& .MuiChip-label': {
                                    px: 0.5,
                                  },
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )}
                  
                  {selectedMeetingForReschedule.attendees && selectedMeetingForReschedule.attendees.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Business fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                          Attendees ({selectedMeetingForReschedule.attendees.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedMeetingForReschedule.attendees.map((attendee, index) => (
                            <Chip
                              key={attendee.id}
                              label={attendee.name}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.75rem',
                                height: '24px',
                                '& .MuiChip-label': {
                                  px: 1,
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  New Meeting Details
                </Typography>
              </Grid>
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
                    value={rescheduleForm.agenda}
                    onChange={(e) => handleRescheduleFormChange('agenda', e.target.value)}
                    variant="outlined"
                  />
                </Box>
              </Grid>

              {/* Meeting Date */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Meeting Date"
                  type="date"
                  value={rescheduleForm.meetingDate}
                  onChange={(e) => handleRescheduleFormChange('meetingDate', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <Event sx={{ mr: -1, color: 'text.secondary' }} />
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
                <FormControl fullWidth>
                  <InputLabel>Start Time</InputLabel>
                  <Select
                    value={rescheduleForm.startTime}
                    onChange={(e) => handleRescheduleFormChange('startTime', e.target.value)}
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
                        <MenuItem 
                          key={timeValue} 
                          value={timeValue}
                        >
                          {displayTime}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              {/* End Time */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>End Time</InputLabel>
                  <Select
                    value={rescheduleForm.endTime}
                    onChange={(e) => handleRescheduleFormChange('endTime', e.target.value)}
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
                        <MenuItem key={timeValue} value={timeValue}>
                          {displayTime}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ 
            p: 2, 
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1
          }}>
            <Button 
              onClick={handleCloseRescheduleDialog} 
              size="small"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleRescheduleSubmit}
              size="small"
              disabled={isRescheduling}
              startIcon={isRescheduling ? <CircularProgress size={14} /> : <Event fontSize="small" />}
            >
              {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
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