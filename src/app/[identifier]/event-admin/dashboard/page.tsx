"use client";

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  People, 
  Business,
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
} from '@mui/icons-material';

import { Event, Participant, DashboardStats } from '@/types';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import EventDetailsCard from '@/components/event-admin/EventDetailsCard';
import ExcelUploadDialog from '@/components/common/ExcelUploadDialog';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import { getAuthToken } from '@/utils/cookieManager';
import { apiService } from '@/services/apiService';
import { RootState, AppDispatch } from "@/store";
import { setIdentifier } from "@/store/slices/appSlice";
import { color } from 'framer-motion';

export default function EventAdminDashboard() {
  const params = useParams();
  const identifier = params.identifier as string;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
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
  const [loading, setLoading] = useState(true);
  const [visitorsUploadOpen, setVisitorsUploadOpen] = useState(false);
  const [exhibitorsUploadOpen, setExhibitorsUploadOpen] = useState(false);

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
  }, [identifier]);

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
        
        // No sessionStorage persistence; pass via route/state if needed
        
        // Extract and store fileStorageId if available
        const responseFileStorageId = (suggestResponse.result as any)?.fileStorageId;
        // responseFileStorageId can be passed via route/state if needed
        
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
        
        // No sessionStorage persistence; pass via route/state if needed
        
        // Extract and store fileStorageId if available
        const responseFileStorageId = (suggestResponse.result as any)?.fileStorageId;
        // responseFileStorageId can be passed via route/state if needed
        
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

  const statCards = [
    {
      title: 'Total Visitors',
      value: stats?.registeredVisitors || 0,
      icon: <Person sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    
      subtitle: `${visitors.filter(v => v.status === 'registered').length} registered`,
      action: {
        label: 'Add Visitors' ,
        icon: <Add />,
        onClick: handleUploadVisitors,
      }
    },
    {
      title: 'Total Exhibitors',
      value: stats?.registeredExhibitors || 0,
      icon: <Business sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      subtitle: `${exhibitors.filter(e => e.status === 'registered').length} registered`,
      action: {
        label: 'Add Exhibitors',
        icon: <Add />,
        onClick: handleUploadExhibitors,
      }
    },
    {
      title: 'Pending Invitations',
      value: stats?.pendingInvitations || 0,
      icon: <Email sx={{ fontSize: 40 }} />,
      color: '#dc004e', 
      subtitle: 'Awaiting response',
      action: {
        label: 'Send Invitations',
        icon: <Email />,
        onClick: handleSendInvitations,
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
            {/* Header with Welcome Message */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box>
                <Typography variant="h5" component="h1" gutterBottom>
                  Welcome, {user?.firstName} {user?.lastName}!
                </Typography>
               
              </Box>
            </Box>

            {/* Event Details */}
            <Box mb={1}>
              <EventDetailsCard onEventUpdate={loadDashboardData} />
            </Box>

            {/* Stats Cards with Actions */}
            <Grid container spacing={3}>
              {statCards.map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            {stat.title}
                          </Typography>
                          <Typography variant="h4" component="div">
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stat.subtitle}
                          </Typography>
                        </Box>
                        <Box sx={{ color: stat.color }}>
                          {stat.icon}
                        </Box>
                      </Box>
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={stat.action.icon}
                          onClick={stat.action.onClick}
                          sx={{
                            backgroundColor: stat.color,
                            color: '#fff',
                            '&:hover': {
                              backgroundColor: stat.color,
                              opacity: 0.85,
                            },
                          }}
                        >
                          {stat.action.label}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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