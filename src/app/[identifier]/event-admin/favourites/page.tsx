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
  Tabs,
  Tab,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Divider,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Business,
  Person,
  Email,
  Phone,
  LocationOn,
  MoreVert,
  Star,
  StarBorder,
  FilterList,
  Search,
  Delete,
  Visibility,
  Message,
  Edit,
} from '@mui/icons-material';

import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { RootState, AppDispatch } from "@/store";
import { setIdentifier } from "@/store/slices/appSlice";

interface FavouriteItem {
  id: string;
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  type: 'visitor' | 'exhibitor';
  avatar: string;
  phone?: string;
  location?: string;
  interests: string[];
  matchScore: number;
  rating: number;
  notes?: string;
  tags: string[];
  addedDate: Date;
  lastContact?: Date;
  contactCount: number;
  status: 'active' | 'inactive' | 'pending';
  priority: 'high' | 'medium' | 'low';
  customData?: {
    industry?: string;
    experience?: string;
    lookingFor?: string[];
    boothNumber?: string;
    products?: string[];
    website?: string;
  };
}

const mockFavourites: FavouriteItem[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul@company.com',
    company: 'TechCorp India',
    jobTitle: 'Senior Software Engineer',
    type: 'visitor',
    avatar: 'RS',
    phone: '+91 98765 43210',
    location: 'Mumbai, Maharashtra',
    interests: ['AI/ML', 'Web Development', 'Cloud Computing'],
    matchScore: 95,
    rating: 5,
    notes: 'Excellent potential for AI partnership. Very knowledgeable and interested in our solutions.',
    tags: ['high-priority', 'ai-expert', 'potential-partner'],
    addedDate: new Date('2024-01-20T10:00:00'),
    lastContact: new Date('2024-01-22T15:30:00'),
    contactCount: 3,
    status: 'active',
    priority: 'high',
    customData: {
      industry: 'Technology',
      experience: '5+ years',
      lookingFor: ['Partnerships', 'New Technologies', 'Networking']
    }
  },
  {
    id: '7',
    name: 'Rajesh Gupta',
    email: 'rajesh@aitech.com',
    company: 'AI Technologies Inc',
    jobTitle: 'Chief Executive Officer',
    type: 'exhibitor',
    avatar: 'RG',
    phone: '+91 98765 43216',
    location: 'Gurgaon, Haryana',
    interests: ['Artificial Intelligence', 'Machine Learning', 'Enterprise AI'],
    matchScore: 96,
    rating: 5,
    notes: 'Top-tier AI solutions provider. Excellent collaboration potential.',
    tags: ['key-partner', 'ai-solutions', 'enterprise'],
    addedDate: new Date('2024-01-18T14:00:00'),
    lastContact: new Date('2024-01-24T11:00:00'),
    contactCount: 5,
    status: 'active',
    priority: 'high',
    customData: {
      industry: 'AI/ML Solutions',
      experience: '12+ years',
      lookingFor: ['Enterprise Clients', 'AI Implementation', 'Strategic Alliances'],
      boothNumber: 'A-101',
      products: ['AI Chatbots', 'ML Analytics', 'Computer Vision'],
      website: 'https://aitech.com'
    }
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    email: 'sneha@healthtech.com',
    company: 'HealthTech Innovations',
    jobTitle: 'Founder & CEO',
    type: 'visitor',
    avatar: 'SR',
    phone: '+91 98765 43213',
    location: 'Hyderabad, Telangana',
    interests: ['Healthcare Technology', 'AI in Medicine', 'Digital Health'],
    matchScore: 89,
    rating: 4,
    notes: 'Innovative healthcare solutions. Strong interest in medical AI applications.',
    tags: ['healthcare', 'innovation', 'medical-ai'],
    addedDate: new Date('2024-01-19T09:30:00'),
    lastContact: new Date('2024-01-23T16:45:00'),
    contactCount: 2,
    status: 'active',
    priority: 'medium',
    customData: {
      industry: 'Healthcare',
      experience: '7+ years',
      lookingFor: ['Funding', 'Healthcare Partnerships', 'Regulatory Guidance']
    }
  },
  {
    id: '8',
    name: 'Kavya Nair',
    email: 'kavya@blocksecure.com',
    company: 'BlockSecure Technologies',
    jobTitle: 'Head of Product',
    type: 'exhibitor',
    avatar: 'KN',
    phone: '+91 98765 43217',
    location: 'Kochi, Kerala',
    interests: ['Blockchain', 'Cybersecurity', 'Financial Technology'],
    matchScore: 87,
    rating: 4,
    notes: 'Strong blockchain expertise. Potential for security partnerships.',
    tags: ['blockchain', 'security', 'fintech'],
    addedDate: new Date('2024-01-21T11:15:00'),
    lastContact: new Date('2024-01-24T14:20:00'),
    contactCount: 4,
    status: 'active',
    priority: 'medium',
    customData: {
      industry: 'Blockchain & Security',
      experience: '6+ years',
      lookingFor: ['Enterprise Partnerships', 'Security Solutions', 'Investment'],
      boothNumber: 'B-205',
      products: ['Blockchain Security', 'Smart Contracts', 'Crypto Wallets'],
      website: 'https://blocksecure.com'
    }
  },
  {
    id: '6',
    name: 'Ananya Krishnan',
    email: 'ananya@greentech.com',
    company: 'GreenTech Solutions',
    jobTitle: 'Sustainability Director',
    type: 'visitor',
    avatar: 'AK',
    phone: '+91 98765 43215',
    location: 'Chennai, Tamil Nadu',
    interests: ['Clean Energy', 'Environmental Tech', 'Sustainability'],
    matchScore: 91,
    rating: 5,
    notes: 'Passionate about environmental solutions. Great cultural fit.',
    tags: ['sustainability', 'clean-energy', 'environment'],
    addedDate: new Date('2024-01-17T13:00:00'),
    lastContact: new Date('2024-01-21T10:30:00'),
    contactCount: 1,
    status: 'pending',
    priority: 'low',
    customData: {
      industry: 'Clean Technology',
      experience: '6+ years',
      lookingFor: ['Green Partnerships', 'Environmental Solutions', 'Policy Advocacy']
    }
  }
];

export default function FavouritesPage() {
  const params = useParams();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [favourites, setFavourites] = useState<FavouriteItem[]>(mockFavourites);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<FavouriteItem | null>(null);
  const [openNotesDialog, setOpenNotesDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: FavouriteItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const getPriorityColor = (priority: FavouriteItem['priority']) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: FavouriteItem['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getFilteredFavourites = () => {
    let filtered = favourites;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (tabValue) {
      case 0: return filtered; // All
      case 1: return filtered.filter(f => f.type === 'visitor'); // Visitors
      case 2: return filtered.filter(f => f.type === 'exhibitor'); // Exhibitors
      default: return filtered;
    }
  };

  const getVisitorCount = () => favourites.filter(f => f.type === 'visitor').length;
  const getExhibitorCount = () => favourites.filter(f => f.type === 'exhibitor').length;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRemoveFavourite = (id: string) => {
    setFavourites(prev => prev.filter(f => f.id !== id));
    handleMenuClose();
  };

  return (
    <RoleBasedRoute allowedRoles={['event-admin']}>
      <ResponsiveDashboardLayout 
        title="My Favourites"
        
      >
        <Container maxWidth="xl" sx={{ mt: 1, mb: 1 }}>
          {/* Header with action buttons and stats */}
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search favourites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterList />}
              >
                Filter
              </Button>
            </Box>

            {/* Mini stats badges */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={`${favourites.length} Total`}
                variant="outlined"
                color="primary"
                size="small"
                sx={{ fontSize: '0.9rem', height: 26 }}
              />
              <Chip 
                label={`${getVisitorCount()} Visitors`}
                variant="outlined"
                color="info"
                size="small" 
                sx={{ fontSize: '0.9rem', height: 26 }}
              />
              <Chip 
                label={`${getExhibitorCount()} Exhibitors`}
                variant="outlined"
                color="success"
                size="small"
                sx={{ fontSize: '0.9rem', height: 26 }}
              />
            </Box>
          </Box>

          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="All Favourites" />
              <Tab 
                label={
                  <Badge badgeContent={getVisitorCount()} color="info">
                    Visitors
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={getExhibitorCount()} color="success">
                    Exhibitors
                  </Badge>
                } 
              />
            </Tabs>
          </Paper>

          <Grid container spacing={3}>
            {getFilteredFavourites().map((item) => (
              <Grid item xs={12} sm={6} lg={4} key={item.id}>
                <Card sx={{ 
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                          {item.avatar}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.jobTitle}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, item)}>
                        <MoreVert />
                      </IconButton>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        icon={item.type === 'visitor' ? <Person /> : <Business />}
                        label={item.type}
                        size="small"
                        color={item.type === 'visitor' ? 'info' : 'success'}
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={item.priority}
                        size="small"
                        color={getPriorityColor(item.priority)}
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={item.status}
                        size="small"
                        color={getStatusColor(item.status)}
                      />
                    </Box>

                    <Typography variant="body2" color="primary" sx={{ mb: 1, fontWeight: 'medium' }}>
                      {item.company}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Email fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {item.email}
                        </Typography>
                      </Box>
                      {item.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Phone fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {item.phone}
                          </Typography>
                        </Box>
                      )}
                      {item.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {item.location}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Match Score
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {item.matchScore}%
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Rating
                        </Typography>
                        <Rating value={item.rating} readOnly size="small" />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Interests:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {item.interests.slice(0, 3).map((interest, idx) => (
                          <Chip
                            key={idx}
                            label={interest}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                        {item.interests.length > 3 && (
                          <Chip
                            label={`+${item.interests.length - 3} more`}
                            variant="outlined"
                            size="small"
                            color="primary"
                          />
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Added: {formatDate(item.addedDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Contacts: {item.contactCount}
                      </Typography>
                    </Box>

                    {item.lastContact && (
                      <Typography variant="body2" color="text.secondary">
                        Last contact: {formatDate(item.lastContact)}
                      </Typography>
                    )}

                    {item.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          "{item.notes.length > 100 ? item.notes.substring(0, 100) + '...' : item.notes}"
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Message />}
                        variant="outlined"
                        fullWidth
                      >
                        Contact
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        variant="outlined"
                        fullWidth
                      >
                        View Profile
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {getFilteredFavourites().length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Favorite sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No favourites found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm 
                  ? "Try adjusting your search criteria"
                  : "Add participants to your favourites list to see them here"
                }
              </Typography>
            </Paper>
          )}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => setOpenNotesDialog(true)}>
              <Edit sx={{ mr: 1 }} /> Edit Notes
            </MenuItem>
            <MenuItem onClick={() => selectedItem && handleRemoveFavourite(selectedItem.id)}>
              <Delete sx={{ mr: 1 }} /> Remove Favourite
            </MenuItem>
          </Menu>

          <Dialog open={openNotesDialog} onClose={() => setOpenNotesDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Notes</DialogTitle>
            <DialogContent>
              <TextField
                multiline
                rows={4}
                fullWidth
                placeholder="Add your notes about this contact..."
                defaultValue={selectedItem?.notes || ''}
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenNotesDialog(false)}>Cancel</Button>
              <Button variant="contained">Save Notes</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
