"use client";

import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
} from '@mui/icons-material';

import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { RootState, AppDispatch } from "@/store";
import { setIdentifier } from "@/store/slices/appSlice";

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

// Mock meetings data
const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'AI Solutions Partnership Discussion',
    description: 'Exploring potential partnership opportunities for AI-driven business solutions',
    dateTime: new Date('2024-01-25T10:00:00'),
    duration: 60,
    type: 'video-call',
    attendees: [
      {
        id: '1',
        name: 'Rahul Sharma',
        email: 'rahul@company.com',
        company: 'TechCorp India',
        type: 'visitor',
        avatar: 'RS'
      },
      {
        id: '7',
        name: 'Rajesh Gupta',
        email: 'rajesh@aitech.com',
        company: 'AI Technologies Inc',
        type: 'exhibitor',
        avatar: 'RG'
      }
    ],
    status: 'scheduled',
    organizer: {
      id: 'admin1',
      name: 'Event Admin',
      email: 'admin@event.com'
    },
    agenda: [
      'Introduction and company overview',
      'AI solution presentation',
      'Partnership framework discussion',
      'Next steps and timeline'
    ],
    createdAt: new Date('2024-01-20T09:00:00'),
    updatedAt: new Date('2024-01-20T09:00:00'),
  },
  {
    id: '2',
    title: 'Product Demo: Healthcare Technology',
    description: 'Live demonstration of innovative healthcare technology solutions',
    dateTime: new Date('2024-01-24T14:30:00'),
    duration: 45,
    type: 'in-person',
    location: 'Booth A-102, Hall 1',
    attendees: [
      {
        id: '4',
        name: 'Sneha Reddy',
        email: 'sneha@healthtech.com',
        company: 'HealthTech Innovations',
        type: 'visitor',
        avatar: 'SR'
      },
      {
        id: '8',
        name: 'Kavya Nair',
        email: 'kavya@blocksecure.com',
        company: 'BlockSecure Technologies',
        type: 'exhibitor',
        avatar: 'KN'
      }
    ],
    status: 'completed',
    organizer: {
      id: 'admin1',
      name: 'Event Admin',
      email: 'admin@event.com'
    },
    agenda: [
      'Technology overview',
      'Live product demonstration',
      'Q&A session',
      'Implementation discussion'
    ],
    notes: 'Great demo! Visitor showed strong interest in implementation.',
    createdAt: new Date('2024-01-18T11:00:00'),
    updatedAt: new Date('2024-01-24T15:15:00'),
  },
  {
    id: '3',
    title: 'Investment Opportunity Briefing',
    description: 'Discussing funding opportunities for emerging startups',
    dateTime: new Date('2024-01-26T16:00:00'),
    duration: 30,
    type: 'phone-call',
    attendees: [
      {
        id: '2',
        name: 'Priya Patel',
        email: 'priya@startup.com',
        company: 'StartupXYZ',
        type: 'visitor',
        avatar: 'PP'
      },
      {
        id: '9',
        name: 'Arjun Mehta',
        email: 'arjun@fintech.com',
        company: 'FinTech Solutions',
        type: 'exhibitor',
        avatar: 'AM'
      }
    ],
    status: 'scheduled',
    organizer: {
      id: 'admin1',
      name: 'Event Admin',
      email: 'admin@event.com'
    },
    agenda: [
      'Startup pitch presentation',
      'Financial requirements review',
      'Investment terms discussion'
    ],
    createdAt: new Date('2024-01-21T13:00:00'),
    updatedAt: new Date('2024-01-21T13:00:00'),
  },
  {
    id: '4',
    title: 'Green Technology Collaboration',
    description: 'Exploring sustainable technology partnerships',
    dateTime: new Date('2024-01-23T11:00:00'),
    duration: 90,
    type: 'in-person',
    location: 'Conference Room B-3',
    attendees: [
      {
        id: '6',
        name: 'Ananya Krishnan',
        email: 'ananya@greentech.com',
        company: 'GreenTech Solutions',
        type: 'visitor',
        avatar: 'AK'
      },
      {
        id: '10',
        name: 'Deepak Kumar',
        email: 'deepak@renewable.com',
        company: 'Renewable Energy Corp',
        type: 'exhibitor',
        avatar: 'DK'
      }
    ],
    status: 'completed',
    organizer: {
      id: 'admin1',
      name: 'Event Admin',
      email: 'admin@event.com'
    },
    notes: 'Successful meeting. Both parties agreed to proceed with pilot project.',
    createdAt: new Date('2024-01-19T10:00:00'),
    updatedAt: new Date('2024-01-23T12:30:00'),
  },
  {
    id: '5',
    title: 'Networking Session: EdTech Innovations',
    description: 'Informal networking focused on education technology trends',
    dateTime: new Date('2024-01-27T15:00:00'),
    duration: 120,
    type: 'in-person',
    location: 'Networking Lounge',
    attendees: [
      {
        id: '5',
        name: 'Vikram Singh',
        email: 'vikram@edtech.com',
        company: 'EduFuture Platform',
        type: 'visitor',
        avatar: 'VS'
      },
      {
        id: '11',
        name: 'Ravi Gupta',
        email: 'ravi@logistics.com',
        company: 'Smart Logistics Ltd',
        type: 'exhibitor',
        avatar: 'RG'
      }
    ],
    status: 'cancelled',
    organizer: {
      id: 'admin1',
      name: 'Event Admin',
      email: 'admin@event.com'
    },
    notes: 'Cancelled due to schedule conflicts.',
    createdAt: new Date('2024-01-22T14:00:00'),
    updatedAt: new Date('2024-01-25T09:00:00'),
  }
];

export default function MeetingsPage() {
  const params = useParams();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Set identifier in Redux store when component mounts
  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      case 0: // All meetings
        return meetings;
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

  return (
    <RoleBasedRoute allowedRoles={['event-admin']}>
      <ResponsiveDashboardLayout 
        title="Meetings"
        
      >
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
          {/* Header with stats */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {meetings.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Meetings
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {getUpcomingCount()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {getCompletedCount()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {getCancelledCount()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cancelled
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Action buttons */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Schedule Meeting
            </Button>
            <Button
              variant="outlined"
              startIcon={<CalendarMonth />}
            >
              View Calendar
            </Button>
          </Box>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="meetings tabs">
              <Tab label="All Meetings" />
              <Tab 
                label={
                  <Badge badgeContent={getUpcomingCount()} color="warning">
                    Upcoming
                  </Badge>
                } 
              />
              <Tab label="Completed" />
              <Tab label="Cancelled" />
            </Tabs>
          </Paper>

          {/* Meetings list */}
          <Grid container spacing={3}>
            {getFilteredMeetings().map((meeting) => (
              <Grid item xs={12} key={meeting.id}>
                <Card sx={{ 
                  transition: 'all 0.3s',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getTypeIcon(meeting.type)}
                          <Typography variant="h6" component="div">
                            {meeting.title}
                          </Typography>
                          <Chip 
                            label={meeting.status} 
                            color={getStatusColor(meeting.status)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {meeting.description}
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTime fontSize="small" />
                              <Typography variant="body2">
                                {formatDateTime(meeting.dateTime)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Schedule fontSize="small" />
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

                        {/* Attendees */}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Attendees:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          {meeting.attendees.map((attendee) => (
                            <Chip
                              key={attendee.id}
                              avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{attendee.avatar}</Avatar>}
                              label={`${attendee.name} (${attendee.company})`}
                              variant="outlined"
                              size="small"
                            />
                          ))}
                        </Box>

                        {meeting.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Notes: {meeting.notes}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => {
                          setSelectedMeeting(meeting);
                          setOpenDialog(true);
                        }}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {getFilteredMeetings().length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CalendarMonth sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No meetings found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 0 
                  ? "Schedule your first meeting to get started"
                  : "No meetings in this category"
                }
              </Typography>
            </Paper>
          )}
        </Container>

        {/* Add/Edit Meeting Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Meeting scheduling functionality would be implemented here
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button variant="contained">
              {selectedMeeting ? 'Update' : 'Schedule'}
            </Button>
          </DialogActions>
        </Dialog>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
} 