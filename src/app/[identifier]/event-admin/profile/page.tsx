'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Person,
  Save,
  Edit,
  ArrowBack,
} from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { RootState } from '@/store';

interface ProfileData {
  visitorId?: number;
  exhibitorId?: number;
  firstName: string;
  middleName: string;
  lastName: string;
  salutation: string;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  userStatusId: number;
  isActive: boolean;
}

export default function ProfileSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const identifier = params?.identifier as string;
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    middleName: '',
    lastName: '',
    salutation: '',
    email: null,
    gender: null,
    dateOfBirth: null,
    userStatusId: 1,
    isActive: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Determine if user is visitor or exhibitor
  const isVisitor = user?.role === 'visitor';
  const isExhibitor = user?.role === 'exhibitor';
  const userRole = isVisitor ? 'visitor' : isExhibitor ? 'exhibitor' : 'event-admin';

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll initialize with user data from Redux
      // In a real app, you'd fetch the current user's profile data from API
      if (user) {
        setProfileData({
          firstName: user.firstName || '',
          middleName: '',
          lastName: user.lastName || '',
          salutation: '',
          email: user.email || '',
          gender: null,
          dateOfBirth: null,
          userStatusId: 1,
          isActive: true,
        });
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear messages when user starts editing
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!profileData.firstName || !profileData.lastName) {
        setError('First name and last name are required');
        return;
      }

      // Prepare payload based on role
      const payload = {
        ...profileData,
        // Add the appropriate ID field based on role
        ...(isVisitor && { visitorId: user?.id ? parseInt(user.id) : 21 }), // Default for demo
        ...(isExhibitor && { exhibitorId: user?.id ? parseInt(user.id) : 20 }), // Default for demo
      };

      // Determine API endpoint based on role
      const apiUrl = isVisitor 
        ? `https://xpomatch-dev-event-admin-api.azurewebsites.net/api/${identifier}/RegisterUsers/updateVisitor`
        : `https://xpomatch-dev-event-admin-api.azurewebsites.net/api/${identifier}/ExhibitorOnboarding/updateExhibitor`;

      console.log('Updating profile:', { role: userRole, url: apiUrl, payload });

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Update response:', data);

      if (response.ok) {
        setSuccess(`${userRole.charAt(0).toUpperCase() + userRole.slice(1)} profile updated successfully!`);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <ResponsiveDashboardLayout title="Profile Settings">
        <Container maxWidth="md">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress size={50} />
          </Box>
        </Container>
      </ResponsiveDashboardLayout>
    );
  }

  return (
    <RoleBasedRoute allowedRoles={['visitor', 'exhibitor', 'event-admin']}>
      <ResponsiveDashboardLayout 
        title="Profile Settings"
        
      >
        <Container maxWidth="md">
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              

              
              <Typography variant="h5" component="h1" fontWeight="600">
                Profile Settings
              </Typography>
            </Box>
            <Chip 
              label={userRole.charAt(0).toUpperCase() + userRole.slice(1)} 
              color="primary" 
              variant="outlined"
            />
          </Box>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Profile Header */}
              <Box display="flex" alignItems="center" gap={3} mb={4}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    bgcolor: 'primary.main',
                  }}
                >
                  {getInitials()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    {profileData.salutation} {profileData.firstName} {profileData.middleName} {profileData.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profileData.email}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={profileData.isActive ? 'Active' : 'Inactive'} 
                    color={profileData.isActive ? 'success' : 'error'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Profile Form */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Salutation</InputLabel>
                    <Select
                      value={profileData.salutation}
                      label="Salutation"
                      onChange={(e) => handleInputChange('salutation', e.target.value)}
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="Mr">Mr</MenuItem>
                      <MenuItem value="Ms">Ms</MenuItem>
                      <MenuItem value="Mrs">Mrs</MenuItem>
                      <MenuItem value="Dr">Dr</MenuItem>
                      <MenuItem value="Prof">Prof</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4.5}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={4.5}>
                  <TextField
                    fullWidth
                    label="Middle Name"
                    value={profileData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value || null)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={profileData.gender || ''}
                      label="Gender"
                      onChange={(e) => handleInputChange('gender', e.target.value || null)}
                    >
                      <MenuItem value="">Prefer not to say</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={profileData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value || null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={profileData.userStatusId}
                      label="Status"
                      onChange={(e) => handleInputChange('userStatusId', e.target.value)}
                    >
                      <MenuItem value={1}>Active</MenuItem>
                      <MenuItem value={2}>Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Save Button */}
              <Box display="flex" justifyContent="flex-end" mt={4}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ minWidth: 150 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
} 