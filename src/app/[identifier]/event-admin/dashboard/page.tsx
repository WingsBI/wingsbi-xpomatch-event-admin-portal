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
} from '@mui/material';
import {
  People, 
  Business,
  Upload,
  Settings,
  Email,
  Dashboard as DashboardIcon,
  Add,
} from '@mui/icons-material';

import { Event, Participant, DashboardStats } from '@/types';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import EventDetailsCard from '@/components/event-admin/EventDetailsCard';
import ExcelUploadDialog from '@/components/common/ExcelUploadDialog';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import { mockVisitors, mockExhibitors, mockEvent, mockStats } from '@/lib/mockData';
import { RootState, AppDispatch } from "@/store";
import { setIdentifier } from "@/store/slices/appSlice";

export default function EventAdminDashboard() {
  const params = useParams();
  const identifier = params.identifier as string;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitorsUploadOpen, setVisitorsUploadOpen] = useState(false);
  const [exhibitorsUploadOpen, setExhibitorsUploadOpen] = useState(false);

  // Set identifier in Redux store when component mounts
  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  useEffect(() => {
    fetchDashboardData();
  }, [identifier]);

  const fetchDashboardData = async () => {
    try {
      // Using mock data for demonstration, but customize for identifier
      const customEvent = {
        ...mockEvent,
        eventId: identifier,
        name: `${identifier} Event`,
        description: `Event management dashboard for ${identifier}`
      };
      setEvent(customEvent);
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      const token = localStorage.getItem('jwtToken');
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
        
        // Store both data sets in session storage for the matching page
        sessionStorage.setItem('fieldMappingData', JSON.stringify(suggestResponse.result));
        sessionStorage.setItem('standardFieldsData', JSON.stringify(standardFieldsResponse.result));
        sessionStorage.setItem('uploadType', 'visitors');
        
        // Redirect to matching page
        router.push(`/${identifier}/event-admin/visitors/matching`);
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
      const token = localStorage.getItem('jwtToken');
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
        
        // Store both data sets in session storage for the matching page
        sessionStorage.setItem('fieldMappingData', JSON.stringify(suggestResponse.result));
        sessionStorage.setItem('standardFieldsData', JSON.stringify(standardFieldsResponse.result));
        sessionStorage.setItem('uploadType', 'exhibitors');
        
        // Redirect to matching page
        router.push(`/${identifier}/event-admin/exhibitors/matching`);
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
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      subtitle: `${mockVisitors.filter(v => v.status === 'registered').length} registered`,
      action: {
        label: 'Add Visitors',
        icon: <Add />,
        onClick: handleUploadVisitors,
      }
    },
    {
      title: 'Total Exhibitors',
      value: stats?.registeredExhibitors || 0,
      icon: <Business sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      subtitle: `${mockExhibitors.filter(e => e.status === 'registered').length} registered`,
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
    <RoleBasedRoute allowedRoles={['event-admin', 'it-admin']}>
      <ResponsiveDashboardLayout 
        title={`Event Dashboard`}  >

          
          
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
                  Welcome, {user?.name }!
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Manage your event and track participant engagement
                </Typography>
              </Box>
            </Box>

            {/* Event Details */}
            {event && (
              <Box mb={1}>
                <EventDetailsCard event={event} onEventUpdate={fetchDashboardData} />
              </Box>
            )}

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
                          variant="outlined"
                          size="small"
                          startIcon={stat.action.icon}
                          onClick={stat.action.onClick}
                          sx={{
                            borderColor: stat.color,
                            color: stat.color,
                            '&:hover': {
                              borderColor: stat.color,
                              bgcolor: `${stat.color}10`,
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