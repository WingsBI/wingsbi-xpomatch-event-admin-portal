"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Autocomplete,
  TextField,
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
  LinearProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  People, 
  Business,
  LocationOn,
  Upload,
  Settings,
  Email,
  Dashboard as DashboardIcon,
  Add,
  Search,
  Groups,
  Event as EventIcon,
  TrendingUp,
  Edit,
  Visibility,
  MoreVert,
  Person,
  CheckCircle,
  Schedule,
  EmailOutlined,
  Face3,
  AccountCircle,
  Work,
  Mail,
  PersonOutline,
  BusinessCenter,
  MailOutline,
  Badge,
  WorkOutline,
  Luggage,
  Face6Sharp,
} from '@mui/icons-material';

import Face6Round from '@mui/icons-material/Face6Rounded';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import MailOutlineIcon from '@mui/icons-material/MailOutline'; 
import { Event, Participant, DashboardStats, ApiEventDetails } from '@/types';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import EventDetailsCard, { EventDetailsCardRef } from '@/components/event-admin/EventDetailsCard';
import ExcelUploadDialog from '@/components/common/ExcelUploadDialog';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import { getAuthToken } from '@/utils/cookieManager';
import { apiService, eventsApi } from '@/services/apiService';
import { RootState, AppDispatch } from "@/store";
import { setIdentifier } from "@/store/slices/appSlice";
import { color } from 'framer-motion';
import { Send } from '@mui/icons-material';
import Face6OutlinedIcon from '@mui/icons-material/Face6Outlined';

export default function EventAdminDashboard() {
  const params = useParams();
  const identifier = params.identifier as string;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  
  // State for real data
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalParticipants: 0,
    registeredVisitors: 0,
    registeredExhibitors: 0,
    pendingInvitations: 0,
    matchmakingScore: 0,
  });
  const [visitors, setVisitors] = useState<Participant[]>([]);
  const [exhibitors, setExhibitors] = useState<Participant[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [eventDetails, setEventDetails] = useState<ApiEventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitorsUploadOpen, setVisitorsUploadOpen] = useState(false);
  const [exhibitorsUploadOpen, setExhibitorsUploadOpen] = useState(false);
  const eventDetailsCardRef = useRef<EventDetailsCardRef>(null);

  // Define searchable pages
  const searchablePages = [
    {
      title: 'Dashboard',
      path: `/${identifier}/event-admin/dashboard`,
      description: 'Main dashboard overview'
    },
    {
      title: 'Exhibitors',
      path: `/${identifier}/event-admin/exhibitors`,
      description: 'Manage exhibitors'
    },
    {
      title: 'Exhibitors Onboarding',
      path: `/${identifier}/event-admin/exhibitors/matching`,
      description: 'Map exhibitor fields'
    },
    {
      title: 'Visitors',
      path: `/${identifier}/event-admin/visitors`,
      description: 'Manage visitors'
    },
    {
      title: 'Visitors Onboarding',
      path: `/${identifier}/event-admin/visitors/matching`,
      description: 'Map visitor fields'
    }
  ];

  // Handle page navigation from search
  const handlePageSelect = (selectedPage: any) => {
    if (selectedPage && selectedPage.path) {
      router.push(selectedPage.path);
    }
  };

  // Set identifier in Redux store when component mounts
  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  useEffect(() => {
    loadDashboardData();
    loadEventDetails();
  }, [identifier]);

  const loadEventDetails = async () => {
    try {
      console.log('🔍 Loading event details for identifier:', identifier);
      
      if (!identifier) {
        console.warn('⚠️ No identifier available for event details load');
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
        const eventData = response.data.result[0];
        setEventDetails(eventData);
        console.log('✅ Event details loaded successfully:', eventData);
      } else {
        console.warn('⚠️ No event details found:', response);
      }
    } catch (error: any) {
      console.error('❌ Error loading event details:', {
        message: error.message,
        status: error.response?.status,
        identifier
      });
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load real data from APIs
      const [visitorsResponse, exhibitorsResponse] = await Promise.all([
        // Load visitors using apiService
        apiService.getAllVisitors(identifier).catch(() => ({ success: false, data: { result: [] } })),
        // Load exhibitors using fieldMappingApi
        fieldMappingApi.getAllExhibitors(identifier).catch(() => ({ statusCode: 404, result: [] }))
      ]);
      
      console.log('Dashboard API responses:', { visitorsResponse, exhibitorsResponse });
      
      // Process visitors data
      let visitorsData: Participant[] = [];
      if (visitorsResponse && visitorsResponse.success && visitorsResponse.data?.result) {
        // Transform API data to Participant format using actual API structure
        visitorsData = visitorsResponse.data.result.map((visitor: any) => ({
          id: visitor.id?.toString() || '',
          firstName: visitor.firstName || '',
          lastName: visitor.lastName || '',
          email: visitor.email || '',
          company: visitor.userProfile?.companyName || '',
          jobTitle: visitor.userProfile?.jobTitle || visitor.userProfile?.designation || '',
          phone: visitor.userProfile?.phone || '',
          country: visitor.customData?.countryName || '',
          status: visitor.statusName === 'Active' ? 'registered' : 'invited',
          type: 'visitor' as const,
          eventId: identifier,
          registrationDate: visitor.createdDate ? new Date(visitor.createdDate) : new Date(),
          invitationSent: true, // Assume sent if they exist in system
          invitationDate: visitor.createdDate ? new Date(visitor.createdDate) : undefined,
          checkedIn: false, // Not provided in API
          lastActivity: visitor.modifiedDate ? new Date(visitor.modifiedDate) : undefined,
          createdAt: visitor.createdDate ? new Date(visitor.createdDate) : new Date(),
          updatedAt: visitor.modifiedDate ? new Date(visitor.modifiedDate) : new Date(),
          interests: [], // Not provided in current API
          customData: {
            salutation: visitor.salutation || '',
            middleName: visitor.mIddleName || '',
            gender: visitor.gender || '',
            dateOfBirth: visitor.dateOfBirth,
            nationality: visitor.userProfile?.nationality || '',
            linkedInProfile: visitor.userProfile?.linkedInProfile || '',
            instagramProfile: visitor.userProfile?.instagramProfile || '',
            gitHubProfile: visitor.userProfile?.gitHubProfile || '',
            twitterProfile: visitor.userProfile?.twitterProfile || '',
            businessEmail: visitor.userProfile?.businessEmail || '',
            experienceYears: visitor.userProfile?.experienceYears || 0,
            decisionmaker: visitor.userProfile?.decisionmaker || false,
            addressLine1: visitor.customData?.addressLine1 || '',
            addressLine2: visitor.customData?.addressLine2 || '',
            cityName: visitor.customData?.cityName || '',
            stateName: visitor.customData?.stateName || '',
            postalCode: visitor.customData?.postalCode || '',
            location: [visitor.customData?.cityName, visitor.customData?.stateName, visitor.customData?.countryName].filter(Boolean).join(', ') || '',
            avatar: `${visitor.firstName?.charAt(0) || ''}${visitor.lastName?.charAt(0) || ''}`,
          }
        }));
      }
      
      // Process exhibitors data
      let exhibitorsData: Participant[] = [];
      if (exhibitorsResponse && exhibitorsResponse.statusCode === 200 && exhibitorsResponse.result) {
        // Transform API data to Participant format
        exhibitorsData = exhibitorsResponse.result.map((exhibitor: any) => ({
          id: exhibitor.id?.toString() || '',
          firstName: exhibitor.firstName || '',
          lastName: exhibitor.lastName || '',
          email: exhibitor.email || '',
          company: exhibitor.companyName || '',
          jobTitle: exhibitor.jobTitle || '',
          phone: exhibitor.phoneNumber || '',
          country: exhibitor.country || '',
          status: exhibitor.status || 'registered',
          type: 'exhibitor' as const,
        eventId: identifier,
          registrationDate: exhibitor.registrationDate ? new Date(exhibitor.registrationDate) : new Date(),
          invitationSent: exhibitor.invitationSent ?? false,
          invitationDate: exhibitor.invitationDate ? new Date(exhibitor.invitationDate) : undefined,
          checkedIn: exhibitor.checkedIn ?? false,
          lastActivity: exhibitor.lastActivity ? new Date(exhibitor.lastActivity) : undefined,
          createdAt: exhibitor.createdAt ? new Date(exhibitor.createdAt) : new Date(),
          updatedAt: exhibitor.updatedAt ? new Date(exhibitor.updatedAt) : new Date(),
          interests: exhibitor.interests || [],
          customData: {
            boothNumber: exhibitor.boothNumber,
            boothSize: exhibitor.boothSize,
            website: exhibitor.website,
            ...exhibitor.customData
          }
        }));
      }
      
      // Update state with real data
      setVisitors(visitorsData);
      setExhibitors(exhibitorsData);
      
      // Calculate dynamic stats from actual data
      const registeredVisitors = visitorsData.filter(v => v.status === 'registered').length;
      const registeredExhibitors = exhibitorsData.filter(e => e.status === 'registered').length;
      const invitedVisitors = visitorsData.filter(v => v.status === 'invited').length;
      const invitedExhibitors = exhibitorsData.filter(e => e.status === 'invited').length;
      const totalPendingInvitations = invitedVisitors + invitedExhibitors;
      
      setStats({
        totalEvents: 1,
        activeEvents: 1,
        totalParticipants: visitorsData.length + exhibitorsData.length,
        registeredVisitors: visitorsData.length, // Total visitors (registered + invited)
        registeredExhibitors: exhibitorsData.length, // Total exhibitors (registered + invited)
        pendingInvitations: totalPendingInvitations,
        matchmakingScore: 0, // TODO: Calculate based on actual matching data
      });
      
      // TODO: Load actual event data when API is available
      setEvent(null);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set fallback empty state
      setStats({
        totalEvents: 1,
        activeEvents: 1,
        totalParticipants: 0,
        registeredVisitors: 0,
        registeredExhibitors: 0,
        pendingInvitations: 0,
        matchmakingScore: 0,
      });
      setVisitors([]);
      setExhibitors([]);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVisitors = () => {
    setVisitorsUploadOpen(true);
  };

  const handleUploadExhibitors = () => {
    setExhibitorsUploadOpen(true);
  };

  const handleVisitorsFileUpload = async (file: File) => {
    try {
      console.log('Uploading visitors file:', file.name);
      
      // Check if user is authenticated
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
      // Call both APIs simultaneously
      const [suggestResponse, standardFieldsResponse] = await Promise.all([
        fieldMappingApi.suggestMapping(identifier, file),
        fieldMappingApi.getAllStandardFields(identifier)
      ]);
      
      console.log('Suggest mapping response:', suggestResponse);
      console.log('Standard fields response:', standardFieldsResponse);
      
      // Handle authentication errors specifically
      if (suggestResponse.statusCode === 401 || standardFieldsResponse.statusCode === 401) {
        throw new Error('Authentication failed. Your session may have expired. Please log in again.');
      }
      
      // Check if both APIs returned successful responses
      if (suggestResponse.statusCode === 200 && standardFieldsResponse.statusCode === 200) {
        // Check if we have data from both APIs
        if (!standardFieldsResponse.result || standardFieldsResponse.result.length === 0) {
          throw new Error('No standard fields available from backend. Please configure your backend API to return field data.');
        }
        
        if (!suggestResponse.result || suggestResponse.result.length === 0) {
          throw new Error('No field mapping suggestions received from backend. Please ensure your Excel file has proper headers.');
        }
        
        // Extract mappings from the nested structure
        const mappingsData = (suggestResponse.result as any)?.mappings || suggestResponse.result;
        if (!mappingsData || mappingsData.length === 0) {
          throw new Error('No field mapping suggestions received from backend. Please ensure your Excel file has proper headers.');
        }
        
        // Extract fileStorageId from the suggest response
        const responseFileStorageId = (suggestResponse.result as any)?.fileStorageId;
        
        // Store data in session storage for the field mapping page
        console.log('Storing visitors data in session storage from dashboard:', {
          identifier,
          mappingsData,
          standardFields: standardFieldsResponse.result,
          fileStorageId: responseFileStorageId
        });
        
        sessionStorage.setItem(`visitors_mapping_${identifier}`, JSON.stringify(mappingsData));
        sessionStorage.setItem(`visitors_standard_fields_${identifier}`, JSON.stringify(standardFieldsResponse.result));
        if (responseFileStorageId) {
          sessionStorage.setItem(`visitors_file_storage_id_${identifier}`, responseFileStorageId.toString());
        }
        
        // Verify data was stored
        console.log('Session storage verification from dashboard:', {
          storedMapping: sessionStorage.getItem(`visitors_mapping_${identifier}`),
          storedFields: sessionStorage.getItem(`visitors_standard_fields_${identifier}`),
          storedFileId: sessionStorage.getItem(`visitors_file_storage_id_${identifier}`)
        });
        
        // Small delay to ensure session storage is persisted
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to matching page
        router.push(`/${identifier}/event-admin/visitors/matching`);
        
        // Reload dashboard data to reflect new uploads
        setTimeout(() => {
          loadDashboardData();
        }, 1000);
      } else {
        // Handle API errors
        const errorMessage = suggestResponse.statusCode !== 200 
          ? (suggestResponse.message || 'Failed to process Excel file')
          : (standardFieldsResponse.message || 'Failed to load standard fields');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error uploading visitors file:', error);
      throw error;
    }
  };

  const handleExhibitorsFileUpload = async (file: File) => {
    try {
      console.log('Uploading exhibitors file:', file.name);
      
      // Check if user is authenticated
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
      // Call both APIs simultaneously
      const [suggestResponse, standardFieldsResponse] = await Promise.all([
        fieldMappingApi.suggestExhibitorMapping(identifier, file),
        fieldMappingApi.getAllExhibitorStandardFields(identifier)
      ]);
      
      console.log('Suggest mapping response:', suggestResponse);
      console.log('Standard fields response:', standardFieldsResponse);
      
      // Handle authentication errors specifically
      if (suggestResponse.statusCode === 401 || standardFieldsResponse.statusCode === 401) {
        throw new Error('Authentication failed. Your session may have expired. Please log in again.');
      }
      
      // Check if both APIs returned successful responses
      if (suggestResponse.statusCode === 200 && standardFieldsResponse.statusCode === 200) {
        // Check if we have data from both APIs
        if (!standardFieldsResponse.result || standardFieldsResponse.result.length === 0) {
          throw new Error('No standard fields available from backend. Please configure your backend API to return field data.');
        }
        
        if (!suggestResponse.result || suggestResponse.result.length === 0) {
          throw new Error('No field mapping suggestions received from backend. Please ensure your Excel file has proper headers.');
        }
        
        // Extract mappings from the nested structure
        const mappingsData = (suggestResponse.result as any)?.mappings || suggestResponse.result;
        if (!mappingsData || mappingsData.length === 0) {
          throw new Error('No field mapping suggestions received from backend. Please ensure your Excel file has proper headers.');
        }
        
        // Extract fileStorageId from the suggest response
        const responseFileStorageId = (suggestResponse.result as any)?.fileStorageId;
        
        // Store data in session storage for the field mapping page
        console.log('Storing exhibitors data in session storage from dashboard:', {
          identifier,
          mappingsData,
          standardFields: standardFieldsResponse.result,
          fileStorageId: responseFileStorageId
        });
        
        sessionStorage.setItem(`exhibitors_mapping_${identifier}`, JSON.stringify(mappingsData));
        sessionStorage.setItem(`exhibitors_standard_fields_${identifier}`, JSON.stringify(standardFieldsResponse.result));
        if (responseFileStorageId) {
          sessionStorage.setItem(`exhibitors_file_storage_id_${identifier}`, responseFileStorageId.toString());
        }
        
        // Verify data was stored
        console.log('Session storage verification from dashboard:', {
          storedMapping: sessionStorage.getItem(`exhibitors_mapping_${identifier}`),
          storedFields: sessionStorage.getItem(`exhibitors_standard_fields_${identifier}`),
          storedFileId: sessionStorage.getItem(`exhibitors_file_storage_id_${identifier}`)
        });
        
        // Small delay to ensure session storage is persisted
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to matching page
        router.push(`/${identifier}/event-admin/exhibitors/matching`);
        
        // Reload dashboard data to reflect new uploads
        setTimeout(() => {
          loadDashboardData();
        }, 1000);
      } else {
        // Handle API errors
        const errorMessage = suggestResponse.statusCode !== 200 
          ? (suggestResponse.message || 'Failed to process Excel file')
          : (standardFieldsResponse.message || 'Failed to load standard fields');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error uploading exhibitors file:', error);
      throw error;
    }
  };

  const handleSendInvitations = () => {
    // Handle sending invitations
    console.log('Send invitations');
  };

  // Helper function to convert UTC to IST (UTC+5:30)
  const convertUTCToIST = (utcDateString: string) => {
    const utcDate = new Date(utcDateString);
    return new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
  };

  // Helper functions for formatting event data
  const formatEventDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    try {
      const istDate = convertUTCToIST(dateString);
      return istDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatEventTime = (dateString: string) => {
    if (!dateString) return 'TBD';
    try {
      const istDate = convertUTCToIST(dateString);
      return istDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const getEventLocation = () => {
    if (!eventDetails?.locationDetails || eventDetails.locationDetails.length === 0) {
      return 'Milan, Italy';
    }
    
    const location = eventDetails.locationDetails[0];
    const parts = [location.cityName, location.stateName, location.countryName].filter(Boolean);
    return parts.join(', ') || location.venueName || 'Milan, Italy';
  };

  const getEventTitle = () => {
    if (!eventDetails?.title) return 'Gastech';
    // Clean the event title by removing "exhibitor" text (case insensitive)
    return eventDetails.title.replace(/exhibitor/gi, '').trim() || 'Gastech';
  };

  const getEventSubtitle = () => {
    if (!eventDetails?.categoryName) return 'EXHIBITION & CONFERENCE';
    return eventDetails.categoryName.toUpperCase();
  };

  const getEventDateRange = () => {
    if (!eventDetails?.startDateTime || !eventDetails?.endDateTime) {
      return '9-12 SEPTEMBER 2025 | FIERA MILANO • MILAN';
    }
    
    try {
      // Convert to IST (UTC+5:30)
      const istStartDate = convertUTCToIST(eventDetails.startDateTime);
      const istEndDate = convertUTCToIST(eventDetails.endDateTime);
      
      const startDay = istStartDate.getDate();
      const endDay = istEndDate.getDate();
      const month = istStartDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
      const year = istStartDate.getFullYear();
      
      const venue = eventDetails.locationDetails?.[0]?.venueName || 'FIERA MILANO';
      const location = getEventLocation();
      
      return `${startDay}-${endDay} ${month} ${year} | ${venue} • ${location}`;
    } catch (error) {
      return '9-12 SEPTEMBER 2025 | FIERA MILANO • MILAN';
    }
  };

  const statCards = [
    {
      title: 'Total Visitors',
      value: stats?.registeredVisitors || 0,
      icon: <Face6OutlinedIcon sx={{ 
        fontSize: 50, 
        color: '#4f46e5',
        fontWeight: 'bold',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
      }} />,
      bgColor: '#e7ecff', // Light purple background to match image
      textColor: '#3b82f6', // Blue number to match image
      titleColor: '#3b82f6', // Blue title to match image
      subtitle: 'Registered',
      action: {
        icon: <Add sx={{ fontSize: 20 }} />,
        onClick: handleUploadVisitors,
        bgColor: '#40C0E7', // Teal blue action button
      }
    },
    {
      title: 'Total Exhibitors',
      value: stats?.registeredExhibitors || 0,
      icon: <BusinessCenter sx={{ 
        fontSize: 50, 
        fontWeight: 'bold',
        color: '#d97706',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
      }} />,
      bgColor: '#ffe9cd', // Light orange background
      textColor: '#d97706', // Orange number
      titleColor: '#f59e0b', // Orange title
      subtitle: 'Registered',
      action: {
        icon: <Add sx={{ fontSize: 20 }} />,
        onClick: handleUploadExhibitors,
        bgColor: '#40C0E7', // Teal blue action button
      }
    },
    {
      title: 'Pending Invitation',
      value: stats?.pendingInvitations || 0,
      icon: <Email sx={{ 
        fontSize: 50, 
        fontWeight: 'bold',   
        color: '#0284c7',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
      }} />,
      bgColor: '#e6f4ff', // Light blue background
      textColor: '#0284c7', // Blue number
      titleColor: '#0ea5e9', // Blue title
      subtitle: 'Awaiting response',
      action: {
        icon: <Send sx={{ fontSize: 15 }} />,
        onClick: handleSendInvitations,
        bgColor: '#40C0E7', // Teal blue action button
      }
    },
  ];

  return (
    
    <RoleBasedRoute allowedRoles={['event-admin']}  >
      <ResponsiveDashboardLayout 
        title={
          <Box sx={{ minWidth: 300, maxWidth: 400  }}>
            <Autocomplete
              options={searchablePages}
              getOptionLabel={(option) => option.title}
              onChange={(event, value) => handlePageSelect(value)}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {option.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
              )}
               renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search Anything..."
                  variant="outlined"
                  size="small"
                  
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <Search sx={{ color: 'rgba(255, 255, 255, 0.8)', mr: 1 ,opacity: 0.7 }} />,
                    sx: {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '& input': {
                        color: 'text.primary',
                      },
                      '& input::placeholder': {
                        color: 'white',
                        opacity: 0.7,
                      },
                    },
                  }}
                />
              )}
              PaperComponent={(props) => (
                <Paper 
                  {...props} 
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }} 
                />
              )}
            />
          </Box>
        }
      >
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          p: 0,
        }}
      >
          <Container maxWidth="xl">
            {/* Event Header Section */}
            <Card 
              sx={{ 
                //borderRadius: 3,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.08)',
                mb: 5,
                width: '100%',
                
                alignItems: 'center',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {/* Top Section with Upcoming Chip and Edit Icon */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    pb: 1
                  }}
                >
                  <Chip 
                    label="Upcoming" 
                    size="small"
                    sx={{ 
                      backgroundColor: '#ff9800', 
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }} 
                  />
                  <IconButton 
                    size="small"
                    onClick={() => {
                      // Trigger the edit dialog from EventDetailsCard
                      if (eventDetailsCardRef.current && eventDetailsCardRef.current.handleEdit) {
                        eventDetailsCardRef.current.handleEdit();
                      }
                    }}
                    sx={{ 
                      backgroundColor: 'secondary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'secondary.dark'
                      }
                    }}
                  >
                    <Edit sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Box>

                {/* Event Branding Section */}
                <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                      <Box sx={{ mr: 3 }}>
                        <Box 
                          sx={{ 
                            width: 64,
                            height: 64,
                            backgroundColor: 'secondary.main',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {getEventTitle().charAt(0)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Box>
                          <Typography variant="h3" component="h1" fontWeight={700} color="secondary.dark" sx={{ fontSize: '2.5rem', lineHeight: 1.2 }}>
                            {getEventTitle()}
                          </Typography>
                          {/* <Typography variant="h6" color="text.secondary" fontWeight={500} sx={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {getEventSubtitle()}
                          </Typography> */}
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="secondary.dark" fontWeight={800} sx={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            EXHIBITION & CONFERENCE
                          </Typography>
                          <Typography variant="h6" color="secondary.main" fontWeight={500} sx={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {getEventDateRange()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>

            {/* Event Details */}
                {/* <Box sx={{ px: 2, pb: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Box sx={{ mr: 2 }}>
                        <Box 
                          sx={{ 
                            width: 48,
                            height: 48,
                            backgroundColor: '#1976d2',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {getEventTitle().charAt(0)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" component="h1" fontWeight={600} color="text.primary">
                          {getEventTitle()}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                          {getEventSubtitle()}
                        </Typography>
                        <Typography variant="body2" color="#1976d2" fontWeight={500}>
                          {getEventDateRange()}
                        </Typography>
                      </Box>
                     
                    </Box>
            </Box> */}

                  {/* Date, Time, and Location */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" alignItems="center" ml={2}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          backgroundColor: '#E3F2FD',
                          borderRadius: 2,
                          mr: 2
                        }}>
                          <Schedule sx={{ color: '#2196F3', fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Start Date
                          </Typography>
                          <Typography variant="body2" fontWeight={500} color="text.primary">
                            {eventDetails?.startDateTime ? `${formatEventDate(eventDetails.startDateTime)} at ${formatEventTime(eventDetails.startDateTime)}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" alignItems="center">
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          backgroundColor: '#E3F2FD',
                          borderRadius: 2,
                          mr: 2
                        }}>
                          <Schedule sx={{ color: '#2196F3', fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            End Date
                          </Typography>
                          <Typography variant="body2" fontWeight={500} color="text.primary">
                            {eventDetails?.endDateTime ? `${formatEventDate(eventDetails.endDateTime)} at ${formatEventTime(eventDetails.endDateTime)}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" alignItems="center">
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          backgroundColor: '#E3F2FD',
                          borderRadius: 2,
                          mr: 2
                        }}>
                          <LocationOn sx={{ color: '#2196F3', fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Location
                          </Typography>
                          <Typography variant="body2" fontWeight={500} color="text.primary">
                            {getEventLocation()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  {/* </Box> */}
              </CardContent>
            </Card>

            {/* Stats Cards with Actions */}
            <Grid container spacing={3}>
              {statCards.map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    sx={{ 
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      background: stat.bgColor,
                      height: '100%',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      }
                    }}
                  >
                    {/* Action Button - Top Right */}
                    <IconButton
                      onClick={stat.action.onClick}
                      sx={{
                        position: 'absolute',
                        top: 9,
                        right: 14,
                        width: 35,
                        height: 35,
                        backgroundColor: 'secondary.main',
                        color: 'white',
                        
                        '&:hover': {
                          backgroundColor: 'secondary.dark',
                          opacity: 0.8,
                        }
                      }}
                    >
                      {stat.action.icon}
                    </IconButton>

                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      {/* Main Icon - Centered */}
                      <Box 
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 2,
                          mt: 1
                        }}
                      >
                        {stat.icon}
                      </Box>

                      {/* Title */}
                      <Typography 
                        variant="body1" 
                        component="div" 
                        sx={{ 
                          fontWeight: 700,
                          color: stat.titleColor,
                          mb: 1,
                          fontSize: '1.5rem'
                        }}
                      >
                        {stat.title}
                      </Typography>

                      {/* Value */}
                      <Typography 
                        variant="h3" 
                        component="div" 
                        sx={{ 
                          fontWeight: 700,
                          color: stat.textColor,
                          mb: 0.5,
                          fontSize: '2rem'
                        }}
                      >
                        {stat.value.toLocaleString()}
                      </Typography>

                      {/* Subtitle */}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'grey.700',
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}
                      >
                        {stat.subtitle}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Event Details Card with Edit Dialog */}
            <Box sx={{ mt: 3 }}>
              <EventDetailsCard 
                ref={eventDetailsCardRef}
                onEventUpdate={loadDashboardData} 
              />
            </Box>
          </Container>
      </Box>

      {/* Upload Dialogs */}
      <ExcelUploadDialog
        open={visitorsUploadOpen}
        onClose={() => setVisitorsUploadOpen(false)}
        onUpload={handleVisitorsFileUpload}
        title="Upload Visitors Data"
        description="Upload an Excel file containing visitor information. The file will be processed and you'll be redirected to the field mapping page."
        type="visitors"
      />

      <ExcelUploadDialog
        open={exhibitorsUploadOpen}
        onClose={() => setExhibitorsUploadOpen(false)}
        onUpload={handleExhibitorsFileUpload}
        title="Upload Exhibitors Data"
        description="Upload an Excel file containing exhibitor information. The file will be processed and you'll be redirected to the field mapping page."
        type="exhibitors"
      />
    </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}