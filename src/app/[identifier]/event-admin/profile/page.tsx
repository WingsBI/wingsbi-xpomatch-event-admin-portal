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
  IconButton,
} from '@mui/material';
import {
  Person,
  Save,
  Edit,
  ArrowBack,
  CameraAlt,
} from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { RootState } from '@/store';
import { getCurrentVisitorId } from '@/utils/authUtils';

// Add this fetch function (could be moved to apiService.ts)
async function getVisitorProfile(identifier: string, visitorId: number) {
  const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
  const url = `${azureApiUrl}/api/${identifier}/RegisterUsers/getVisitorById?visitorId=${visitorId}`;
  const token = localStorage.getItem('jwtToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch visitor profile');
  const json = await response.json();
  // Return the first element of the result array
  return Array.isArray(json.result) ? json.result[0] : json.result;
}

interface ProfileData {
  id?: number;
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  userStatusId: number;
  isActive: boolean;
  // userProfile fields
  nationality?: string | null;
  phone?: string | null;
  linkedInProfile?: string | null;
  instagramProfile?: string | null;
  gitHubProfile?: string | null;
  twitterProfile?: string | null;
  designation?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  companyWebsite?: string | null;
  businessEmail?: string | null;
  experienceYears?: number;
  decisionmaker?: boolean;
  // userAddress fields
  addressLine1?: string | null;
  addressLine2?: string | null;
  cityName?: string | null;
  stateName?: string | null;
  countryName?: string | null;
  postalCode?: string | null;
  profilePhoto?: string | null;
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
      if (isVisitor && identifier) {
        const visitorId = getCurrentVisitorId() || (user?.id ? parseInt(user.id) : undefined);
        if (!visitorId) throw new Error('No visitor ID found');
        const data = await getVisitorProfile(identifier, visitorId);
        setProfileData({
          id: data.id,
          salutation: data.salutation || '',
          firstName: data.firstName || '',
          middleName: data.mIddleName || '', // Note typo in API
          lastName: data.lastName || '',
          email: data.email || '',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth || '',
          userStatusId: data.userStatusId,
          isActive: data.userStatusId === 1,
          // userProfile
          nationality: data.userProfile?.nationality || '',
          phone: data.userProfile?.phone || '',
          linkedInProfile: data.userProfile?.linkedInProfile || '',
          instagramProfile: data.userProfile?.instagramProfile || '',
          gitHubProfile: data.userProfile?.gitHubProfile || '',
          twitterProfile: data.userProfile?.twitterProfile || '',
          designation: data.userProfile?.designation || '',
          jobTitle: data.userProfile?.jobTitle || '',
          companyName: data.userProfile?.companyName || '',
          companyWebsite: data.userProfile?.companyWebsite || '',
          businessEmail: data.userProfile?.businessEmail || '',
          experienceYears: data.userProfile?.experienceYears || 0,
          decisionmaker: data.userProfile?.decisionmaker || false,
          // userAddress
          addressLine1: data.userAddress?.addressLine1 || '',
          addressLine2: data.userAddress?.addressLine2 || '',
          cityName: data.userAddress?.cityName || '',
          stateName: data.userAddress?.stateName || '',
          countryName: data.userAddress?.countryName || '',
          postalCode: data.userAddress?.postalCode || '',
        });
      } else if (user) {
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

      // Prepare payload for visitor update
      let payload: any = {};
      if (isVisitor) {
        payload = {
          id: profileData.id,
          visitorId: profileData.id, // or user?.id
          salutation: profileData.salutation,
          firstName: profileData.firstName,
          mIddleName: profileData.middleName, // API expects typo
          lastName: profileData.lastName,
          email: profileData.email,
          gender: profileData.gender,
          dateOfBirth: profileData.dateOfBirth,
          userStatusId: profileData.userStatusId,
          isActive: profileData.isActive,
          userProfile: {
            userId: profileData.id,
            nationality: profileData.nationality,
            phone: profileData.phone,
            linkedInProfile: profileData.linkedInProfile,
            instagramProfile: profileData.instagramProfile,
            gitHubProfile: profileData.gitHubProfile,
            twitterProfile: profileData.twitterProfile,
            designation: profileData.designation,
            jobTitle: profileData.jobTitle,
            companyName: profileData.companyName,
            companyWebsite: profileData.companyWebsite,
            businessEmail: profileData.businessEmail,
            experienceYears: profileData.experienceYears,
            decisionmaker: profileData.decisionmaker,
            createdBy: profileData.id, // fallback
            createdDate: '',
            modifiedBy: profileData.id, // fallback
            modifiedDate: '',
          },
          userAddress: {
            userId: profileData.id,
            addressLine1: profileData.addressLine1,
            addressLine2: profileData.addressLine2,
            cityName: profileData.cityName,
            stateName: profileData.stateName,
            countryName: profileData.countryName,
            postalCode: profileData.postalCode,
            latitude: 0,
            longitude: 0,
            createdDate: '',
            modifiedDate: '',
            createdBy: profileData.id, // fallback
            modifiedBy: profileData.id, // fallback
          },
          customData: [],
        };
      } else if (isExhibitor) {
        payload = {
          ...profileData,
          exhibitorId: user?.id ? parseInt(user.id) : 20,
        };
      } else {
        payload = { ...profileData };
      }

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
        <Container maxWidth="lg">
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              

              
              <Typography variant="h4" component="h1" fontWeight="600" sx={{ mb: 0 }}>
                Profile Settings
              </Typography>
            </Box>
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
                <Box sx={{ position: 'relative', width: 80, height: 80 }}>
                  <Avatar
                    src={profileData.profilePhoto || undefined}
                    sx={{
                      width: 80,
                      height: 80,
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'white',
                      bgcolor: 'primary.main',
                    }}
                  >
                    {!profileData.profilePhoto && getInitials()}
                  </Avatar>
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'white',
                      boxShadow: 1,
                      p: 0.5,
                      zIndex: 2,
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            handleInputChange('profilePhoto', ev.target?.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <CameraAlt fontSize="small" />
                  </IconButton>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    {profileData.salutation} {profileData.firstName} {profileData.middleName} {profileData.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profileData.email}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Profile Form */}
              <Grid container spacing={3}>
                {/* Basic fields */}
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
                {/* Visitor Profile fields */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profileData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="LinkedIn Profile"
                    value={profileData.linkedInProfile || ''}
                    onChange={(e) => handleInputChange('linkedInProfile', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Instagram Profile"
                    value={profileData.instagramProfile || ''}
                    onChange={(e) => handleInputChange('instagramProfile', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GitHub Profile"
                    value={profileData.gitHubProfile || ''}
                    onChange={(e) => handleInputChange('gitHubProfile', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Twitter Profile"
                    value={profileData.twitterProfile || ''}
                    onChange={(e) => handleInputChange('twitterProfile', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Designation"
                    value={profileData.designation || ''}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    value={profileData.jobTitle || ''}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={profileData.companyName || ''}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Website"
                    value={profileData.companyWebsite || ''}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Email"
                    value={profileData.businessEmail || ''}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Experience Years"
                    type="number"
                    value={profileData.experienceYears || 0}
                    onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Decision Maker</InputLabel>
                    <Select
                      value={profileData.decisionmaker ? 'Yes' : 'No'}
                      label="Decision Maker"
                      onChange={(e) => handleInputChange('decisionmaker', e.target.value === 'Yes')}
                    >
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {/* Address fields */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    value={profileData.addressLine1 || ''}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    value={profileData.addressLine2 || ''}
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={profileData.cityName || ''}
                    onChange={(e) => handleInputChange('cityName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State"
                    value={profileData.stateName || ''}
                    onChange={(e) => handleInputChange('stateName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={profileData.countryName || ''}
                    onChange={(e) => handleInputChange('countryName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={profileData.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  />
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