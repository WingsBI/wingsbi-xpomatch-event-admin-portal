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
  ChevronLeft,
  ChevronRight,
  ViewModule,
  ViewList,
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  return (
    <RoleBasedRoute allowedRoles={['event-admin']}>
      <ResponsiveDashboardLayout 
        title="Meetings"
        
      >
        <Container maxWidth="xl" sx={{ mt: 1, mb: 1 }}>
          {/* Header with action buttons and stats */}
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
              >
                Schedule Meeting
              </Button>
              <Button
                variant="outlined"
                startIcon={showCalendar ? <ViewList /> : <CalendarMonth />}
                onClick={() => setShowCalendar(!showCalendar)}
              >
                {showCalendar ? 'List View' : 'Calendar View'}
              </Button>
            </Box>

            {/* Mini stats badges */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={`${meetings.length} Total`}
                variant="outlined"
                color="primary"
                size="small"
                sx={{ fontSize: '0.9rem', height: 26 }}
              />
              <Chip 
                label={`${getUpcomingCount()} Upcoming`}
                variant="outlined"
                color="warning"
                size="small" 
                sx={{ fontSize: '0.9rem', height: 26 }}
              />
              <Chip 
                label={`${getCompletedCount()} Done`}
                variant="outlined"
                color="success"
                size="small"
                sx={{ fontSize: '0.9rem', height: 26 }}
              />
              <Chip 
                label={`${getCancelledCount()} Cancelled`}
                variant="outlined"
                color="error"
                size="small"
                sx={{ fontSize: '0.9rem', height: 26 }}
              />
            </Box>
          </Box>

          {/* Calendar View */}
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
              {/* Calendar Header */}
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                bgcolor: 'primary.main',
                color: 'white'
              }}>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => navigateMonth('prev')}
                    sx={{ 
                      color: 'white', 
                      borderColor: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => setCurrentDate(new Date())}
                    sx={{ 
                      bgcolor: 'white', 
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => navigateMonth('next')}
                    sx={{ 
                      color: 'white', 
                      borderColor: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    <ChevronRight />
                  </Button>
                </Box>
              </Box>

              {/* Weekday Headers */}
              <Box sx={{ display: 'flex', bgcolor: 'grey.100', borderBottom: 1, borderColor: 'grey.300' }}>
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                  <Box key={day} sx={{ 
                    flex: 1, 
                    p: 1, 
                    textAlign: 'center', 
                    borderRight: index < 6 ? 1 : 0, 
                    borderColor: 'grey.300' 
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                      {day}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Calendar Grid */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)',
                border: 0,
                '& > *': {
                  borderRight: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'grey.300'
                },
                '& > *:nth-of-type(7n)': {
                  borderRight: 'none'
                }
              }}>
                {(() => {
                  const daysInMonth = getDaysInMonth(currentDate);
                  const firstDay = getFirstDayOfMonth(currentDate);
                  const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;
                  const cells = [];
                  
                  for (let i = 0; i < totalCells; i++) {
                    const dayNumber = i - firstDay + 1;
                    const isValidDay = dayNumber >= 1 && dayNumber <= daysInMonth;
                    
                    if (isValidDay) {
                      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                      const dayMeetings = getMeetingsForDate(dayDate);
                      const isToday = dayDate.toDateString() === new Date().toDateString();
                      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                      
                      cells.push(
                        <Box key={dayNumber} sx={{ 
                          minHeight: { xs: 80, sm: 90, md: 100 }, 
                          p: { xs: 0.5, sm: 0.75, md: 1 },
                          bgcolor: isToday ? 'primary.50' : isWeekend ? 'grey.25' : 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          '&:hover': { 
                            bgcolor: isToday ? 'primary.100' : 'grey.50',
                            cursor: 'pointer'
                          }
                        }}>
                          {/* Day number */}
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: { xs: 0.5, sm: 0.75, md: 1 }
                          }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: isToday ? 'bold' : 'normal',
                                bgcolor: isToday ? 'primary.main' : 'transparent',
                                color: isToday ? 'white' : 'inherit',
                                borderRadius: isToday ? '50%' : 0,
                                width: isToday ? { xs: 24, sm: 28, md: 32 } : 'auto',
                                height: isToday ? { xs: 24, sm: 28, md: 32 } : 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
                              }}
                            >
                              {dayNumber}
                            </Typography>
                            {dayMeetings.length > 0 && (
                              <Chip 
                                label={dayMeetings.length}
                                size="small"
                                color="primary"
                                sx={{ 
                                  height: { xs: 16, sm: 18, md: 20 }, 
                                  fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                                  '& .MuiChip-label': { px: { xs: 0.5, sm: 0.75, md: 1 } }
                                }}
                              />
                            )}
                          </Box>

                          {/* Meetings */}
                          <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            {dayMeetings.slice(0, 2).map((meeting, index) => (
                              <Box
                                key={meeting.id}
                                onClick={() => {
                                  setSelectedMeeting(meeting);
                                  setOpenDialog(true);
                                }}
                                sx={{
                                  p: { xs: 0.25, sm: 0.35, md: 0.5 },
                                  mb: { xs: 0.25, sm: 0.35, md: 0.5 },
                                  bgcolor: getStatusColor(meeting.status) === 'primary' ? 'primary.main' :
                                           getStatusColor(meeting.status) === 'success' ? 'success.main' :
                                           getStatusColor(meeting.status) === 'warning' ? 'warning.main' :
                                           getStatusColor(meeting.status) === 'error' ? 'error.main' : 'grey.500',
                                  color: 'white',
                                  borderRadius: 0.5,
                                  cursor: 'pointer',
                                  lineHeight: 1.1,
                                  '&:hover': {
                                    opacity: 0.8,
                                    transform: 'scale(1.02)'
                                  }
                                }}
                              >
                                <Typography variant="caption" sx={{ 
                                  display: 'block',
                                  fontWeight: 'bold',
                                  color: 'inherit',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }
                                }}>
                                  {formatTimeOnly(meeting.dateTime)}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  display: 'block',
                                  color: 'inherit',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' }
                                }}>
                                  {meeting.title}
                                </Typography>
                              </Box>
                            ))}
                            {dayMeetings.length > 2 && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontStyle: 'italic',
                                  fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' }
                                }}
                              >
                                +{dayMeetings.length - 2} more
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    } else {
                      // Empty cell for days outside the current month
                      cells.push(
                        <Box key={`empty-${i}`} sx={{ 
                          minHeight: { xs: 80, sm: 90, md: 100 }, 
                          bgcolor: 'grey.50'
                        }} />
                      );
                    }
                  }
                  
                  return cells;
                })()}
              </Box>
            </Paper>
          ) : (
            <>
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
            </>
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