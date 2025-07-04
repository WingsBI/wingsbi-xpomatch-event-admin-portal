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
  LinkedIn,
  Language,
  ConnectWithoutContact as ConnectIcon,
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
                {item.type === 'visitor' ? (
                  // Visitor Card - matching iframe visitor design
                  <Card sx={{
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #e8eaed',
                    bgcolor: 'background.paper',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    },
                  }}>
                    <CardContent sx={{ p: 2, pb: 1 }}>
                      {/* Header with Visitor Info and Match Score */}
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: 'primary.main',
                              width: 52,
                              height: 52,
                              mr: 1,
                              fontSize: '1.2rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {item.avatar}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" component="div" fontWeight="600" sx={{ mb: 0.5 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {item.jobTitle}
                            </Typography>
                            <Typography variant="body2" color="primary" fontWeight="500">
                              {item.company}
                            </Typography>
                            <Box>
                              {item.interests.length > 0 && (
                                <Chip
                                  label={`${item.interests.length} Relevant Interest${item.interests.length > 1 ? 's' : ''}`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#e8f5e8',
                                    color: '#2e7d32',
                                    fontWeight: 500
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center">
                          <IconButton 
                            onClick={(e) => handleMenuClick(e, item)}
                            size="small"
                            sx={{ 
                              p: 0.5,
                              mr: 0.5,
                              '&:hover': {
                                bgcolor: 'rgba(255, 0, 0, 0.1)'
                              }
                            }}
                          >
                            <Favorite sx={{ color: '#f44336', fontSize: 20 }} />
                          </IconButton>
                          <Typography variant="body2" fontWeight="600" color={
                            item.matchScore >= 95 ? '#4caf50' :
                            item.matchScore >= 90 ? '#2196f3' :
                            item.matchScore >= 85 ? '#ff9800' : '#757575'
                          }>
                            {item.matchScore}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Location */}
                      <Box mb={1}>
                        {item.location && (
                          <Box display="flex" alignItems="center" mb={1}>
                            <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {item.location}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Relevant Interests */}
                      {item.interests.length > 0 && (
                        <Box mb={1}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                            <Star sx={{ fontSize: 14, mr: 0.5 }} />
                            Relevant Interests:
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {item.interests.slice(0, 3).map((interest, index) => (
                              <Chip
                                key={index}
                                label={interest}
                                size="small"
                                sx={{ 
                                  fontSize: '0.75rem',
                                  bgcolor: '#e3f2fd',
                                  color: '#1565c0',
                                  border: 'none',
                                  fontWeight: 500
                                }}
                              />
                            ))}
                            {item.interests.length > 3 && (
                              <Chip
                                label={`+${item.interests.length - 3}`}
                                size="small"
                                sx={{ 
                                  fontSize: '0.75rem',
                                  bgcolor: '#e3f2fd',
                                  color: '#1565c0'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}

                      <Divider sx={{ mb: 2 }} />

                      {/* Action Buttons */}
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" gap={1}>
                          <IconButton size="small" sx={{ color: '#0077b5' }}>
                            <LinkedIn fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#757575' }}>
                            <Language fontSize="small" />
                          </IconButton>
                        </Box>

                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ConnectIcon />}
                          sx={{ 
                            bgcolor: 'primary.main',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 2,
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            }
                          }}
                        >
                          Connect
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  // Exhibitor Card - matching iframe exhibitor design
                  <Card sx={{
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #e8eaed',
                    bgcolor: 'background.paper',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    },
                  }}>
                    <CardContent sx={{ p: 2, pb: 1}}>
                      {/* Header with Company Info and Match Score */}
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: 'primary.main',
                              width: 52,
                              height: 52,
                              mr: 1,
                              fontSize: '1.2rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {item.company ? item.company.charAt(0).toUpperCase() : item.avatar}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" component="div" fontWeight="600" sx={{ mb: 0.5 }}>
                              {item.company || item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {item.name}
                              {item.jobTitle && ` • ${item.jobTitle}`}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              {item.customData?.boothNumber && (
                                <Chip
                                  label={item.customData.boothNumber}
                                  size="small"
                                  sx={{ 
                                    bgcolor: '#e3f2fd',
                                    color: '#1565c0',
                                    fontWeight: 500
                                  }}
                                />
                              )}
                              {item.interests.length > 0 && (
                                <Chip
                                  label={`${item.interests.length} Match`}
                                  size="small"
                                  sx={{ 
                                    bgcolor: '#e8f5e8',
                                    color: '#2e7d32',
                                    fontWeight: 500,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center">
                          <IconButton 
                            onClick={(e) => handleMenuClick(e, item)}
                            size="small"
                            sx={{ 
                              p: 0.5,
                              mr: 0.5,
                              '&:hover': {
                                bgcolor: 'rgba(255, 0, 0, 0.1)'
                              }
                            }}
                          >
                            <Favorite sx={{ color: '#f44336', fontSize: 20 }} />
                          </IconButton>
                          <Typography variant="body2" fontWeight="600" color={
                            item.matchScore >= 95 ? '#4caf50' :
                            item.matchScore >= 90 ? '#2196f3' :
                            item.matchScore >= 85 ? '#ff9800' : '#757575'
                          }>
                            {item.matchScore}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Location and Industry */}
                      {(item.location || item.customData?.industry) && (
                        <Box mb={1}>
                          {item.location && (
                            <Box display="flex" alignItems="center" mb={1}>
                              <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {item.location}
                              </Typography>
                            </Box>
                          )}
                          
                          {item.customData?.industry && (
                            <Box display="flex" alignItems="center">
                              <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {item.customData.industry}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Products/Services Offered */}
                      {item.customData?.products && item.customData.products.length > 0 && (
                        <Box mb={1}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                            Products & Services:
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {item.customData.products.slice(0, 3).map((service, index) => (
                              <Chip
                                key={index}
                                label={service}
                                size="small"
                                sx={{ 
                                  fontSize: '0.75rem',
                                  bgcolor: '#f1f3f4',
                                  color: '#5f6368',
                                  border: 'none'
                                }}
                              />
                            ))}
                            {item.customData.products.length > 3 && (
                              <Chip
                                label={`+${item.customData.products.length - 3} more`}
                                size="small"
                                sx={{ 
                                  fontSize: '0.75rem',
                                  bgcolor: '#f1f3f4',
                                  color: '#5f6368',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}

                      <Divider sx={{ mb: 2 }} />

                      {/* Action Buttons */}
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" gap={1}>
                          <IconButton size="small" sx={{ color: '#0077b5' }}>
                            <LinkedIn fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#757575' }}>
                            <Language fontSize="small" />
                          </IconButton>
                        </Box>

                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ConnectIcon />}
                          sx={{ 
                            bgcolor: 'primary.main',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 2,
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            }
                          }}
                        >
                          Connect
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}
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
