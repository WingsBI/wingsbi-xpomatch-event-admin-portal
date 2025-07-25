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
import { getCurrentVisitorId, getCurrentExhibitorId, getCurrentUserId } from '@/utils/authUtils';
import { fieldMappingApi } from '@/services/fieldMappingApi';

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
  // New fields for embedding update
  interest?: string | null;
  technology?: string | null;
}

export default function ProfileSettingsPage() {
  console.log('ProfileSettingsPage component loaded');
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
    interest: '',
    technology: '',
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
    console.log('Profile useEffect', { user, identifier });
    if (user && identifier) {
      loadProfileData();
    }
  }, [user, identifier]);

  const mapVisitorToProfileData = (profile: any): ProfileData => {
    const userProfile = profile.userProfile || {};
    const userAddress = profile.userAddress || {};
    return {
      id: profile.id,
      salutation: profile.salutation || '',
      firstName: profile.firstName || '',
      middleName: profile.middleName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      gender: profile.gender || '',
      dateOfBirth: profile.dateOfBirth || '',
      userStatusId: profile.userStatusId || 1,
      isActive: (profile.userStatusId || 1) === 1,
      nationality: userProfile.nationality || '',
      phone: userProfile.phone || '',
      linkedInProfile: userProfile.linkedInProfile || '',
      instagramProfile: userProfile.instagramProfile || '',
      gitHubProfile: userProfile.gitHubProfile || '',
      twitterProfile: userProfile.twitterProfile || '',
      designation: userProfile.designation || '',
      jobTitle: userProfile.jobTitle || '',
      companyName: userProfile.companyName || '',
      companyWebsite: userProfile.companyWebsite || '',
      businessEmail: userProfile.businessEmail || '',
      experienceYears: userProfile.experienceYears || 0,
      decisionmaker: userProfile.decisionmaker || false,
      addressLine1: userAddress.addressLine1 || '',
      addressLine2: userAddress.addressLine2 || '',
      cityName: userAddress.cityName || '',
      stateName: userAddress.stateName || '',
      countryName: userAddress.countryName || '',
      postalCode: userAddress.postalCode || '',
      profilePhoto: userProfile.profilePhoto || '',
      interest: profile.interest || '', // fixed typo and correct mapping
      technology: userProfile.technology || '', // map from userProfile
    };
  };

  const loadProfileData = async () => {
    console.log('loadProfileData called');
    console.log('user:', user);
    console.log('identifier:', identifier);
    console.log('isVisitor:', isVisitor, 'isExhibitor:', isExhibitor, 'userRole:', userRole);
    try {
      setLoading(true);
      setError(null);
      let id: number | undefined;
      let profile;
      if (isVisitor) {
        id = getCurrentVisitorId() || (user?.id ? parseInt(user.id) : undefined);
        if (!id) throw new Error('No valid visitor ID found');
        const data = await fieldMappingApi.getVisitorById(identifier, id);
        profile = Array.isArray(data.result) ? data.result[0] : data.result;
      } else if (isExhibitor) {
        id = getCurrentExhibitorId() || (user?.id ? parseInt(user.id) : undefined);
        if (!id) throw new Error('No valid exhibitor ID found');
        const data = await fieldMappingApi.getVisitorById(identifier, id);
        profile = Array.isArray(data.result) ? data.result[0] : data.result;
      } else {
        id = getCurrentUserId() || (user?.id ? parseInt(user.id) : undefined);
        if (!id) throw new Error('No valid user ID found');
        const data = await fieldMappingApi.getVisitorById(identifier, id);
        profile = Array.isArray(data.result) ? data.result[0] : data.result;
      }
      setProfileData(mapVisitorToProfileData(profile));
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
        setSaving(false);
        return;
      }

      // Prepare body for updateVisitorEmbeddings
      let visitorId: number = typeof profileData.id === 'number' ? profileData.id : Number(getCurrentVisitorId());
      if (!visitorId || isNaN(visitorId)) {
        setError('No valid visitor ID found');
        setSaving(false);
        return;
      }
      const updateBody = {
        visitorId,
        interest: profileData.interest || '',
        designation: profileData.designation || '',
        technology: profileData.technology || '',
      };

      // Call the new API
      const result = await fieldMappingApi.updateVisitorEmbeddings(identifier, updateBody);
      if (result && !result.isError) {
        setSuccess('Profile updated successfully');
        // Reload profile data to show updated profile
        await loadProfileData();
      } else {
        setError(result?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving');
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
        <Container maxWidth="lg" sx={{ mt:-1, mb: 1, px: { xs: 0.5, sm: 1 }, py: 1 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="h5" component="h1" fontWeight="600" sx={{ mb: 0 }}>
                Profile Details
              </Typography>
            </Box>
          </Box>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 1.5}}>
              {success}
            </Alert>
          )}

          <Card>
            <CardContent sx={{ p: 2 }}>
              {/* Profile Header */}
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Box sx={{ position: 'relative', width: 50, height: 50 }}>
                  <Avatar
                    src={profileData.profilePhoto || undefined}
                    sx={{
                      width: 40,
                      height: 40,
                      fontSize: '1.1rem',
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
                      bottom: 2,
                      right: 2,
                      bgcolor: 'white',
                      boxShadow: 1,
                      p: 0.2,
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
                  <Typography variant="subtitle1" fontWeight="600">
                    {profileData.salutation} {profileData.firstName} {profileData.middleName} {profileData.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profileData.email}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 1.5 }} />

              {/* Profile Form */}
              <Grid container spacing={2}>
                {/* Personal Information Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5, color: 'primary.main' }}>
                    Personal Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small" disabled sx={{ mb: 0.5 }}>
                    <InputLabel>Salutation</InputLabel>
                    <Select
                      value={profileData.salutation}
                      label="Salutation"
                      onChange={(e) => handleInputChange('salutation', e.target.value)}
                      size="small"
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
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Middle Name"
                    value={profileData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value || null)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small" disabled sx={{ mb: 0.5 }}>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={profileData.gender || ''}
                      label="Gender"
                      onChange={(e) => handleInputChange('gender', e.target.value || null)}
                      size="small"
                    >
                      <MenuItem value="">Prefer not to say</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={profileData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value || null)}
                    InputLabelProps={{ shrink: true, sx: { fontSize: 13 } }}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                  />
                </Grid>

                {/* Contact & Status Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5, mt: 0.5, color: 'primary.main' }}>
                    Contact & Status
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small" disabled sx={{ mb: 0.5 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={profileData.userStatusId}
                      label="Status"
                      onChange={(e) => handleInputChange('userStatusId', e.target.value)}
                      size="small"
                    >
                      <MenuItem value={1}>Active</MenuItem>
                      <MenuItem value={2}>Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profileData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Experience Years"
                    type="number"
                    value={profileData.experienceYears || 0}
                    onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small" disabled sx={{ mb: 0.5 }}>
                    <InputLabel>Decision Maker</InputLabel>
                    <Select
                      value={profileData.decisionmaker ? 'Yes' : 'No'}
                      label="Decision Maker"
                      onChange={(e) => handleInputChange('decisionmaker', e.target.value === 'Yes')}
                      size="small"
                    >
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Social Media Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5, mt: 0.5, color: 'primary.main' }}>
                    Social Media Profiles
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="LinkedIn Profile"
                    value={profileData.linkedInProfile || ''}
                    onChange={(e) => handleInputChange('linkedInProfile', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Instagram Profile"
                    value={profileData.instagramProfile || ''}
                    onChange={(e) => handleInputChange('instagramProfile', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="GitHub Profile"
                    value={profileData.gitHubProfile || ''}
                    onChange={(e) => handleInputChange('gitHubProfile', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Twitter Profile"
                    value={profileData.twitterProfile || ''}
                    onChange={(e) => handleInputChange('twitterProfile', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>

                {/* Professional Information Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5, mt: 0.5, color: 'primary.main' }}>
                    Professional Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Designation"
                    value={profileData.designation || ''}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    size="small"
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Interest"
                    value={profileData.interest || ''}
                    onChange={(e) => handleInputChange('interest', e.target.value)}
                    size="small"
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Technology"
                    value={profileData.technology || ''}
                    onChange={(e) => handleInputChange('technology', e.target.value)}
                    size="small"
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    value={profileData.jobTitle || ''}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={profileData.companyName || ''}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    label="Company Website"
                    value={profileData.companyWebsite || ''}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    label="Business Email"
                    value={profileData.businessEmail || ''}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>

                {/* Address Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5, mt: 0.5, color: 'primary.main' }}>
                    Address Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    value={profileData.addressLine1 || ''}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    value={profileData.addressLine2 || ''}
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="City"
                    value={profileData.cityName || ''}
                    onChange={(e) => handleInputChange('cityName', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="State"
                    value={profileData.stateName || ''}
                    onChange={(e) => handleInputChange('stateName', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={profileData.countryName || ''}
                    onChange={(e) => handleInputChange('countryName', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={profileData.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    size="small"
                    disabled
                    sx={{ mb: 0.5 }}
                    InputProps={{ sx: { height: 36, fontSize: 14, py: 0 } }}
                    InputLabelProps={{ sx: { fontSize: 13 } }}
                  />
                </Grid>
              </Grid>

              {/* Save Button */}
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ minWidth: 120, height: 36 }}
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