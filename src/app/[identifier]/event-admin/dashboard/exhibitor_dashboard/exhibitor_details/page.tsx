"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  Skeleton,
  Alert,
  Divider,
  TextField,
  Button,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Business,
  Work,
  Add,
  Delete
} from '@mui/icons-material';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import { fieldMappingApi, type Exhibitor } from '@/services/fieldMappingApi';
import { getCurrentExhibitorId } from '@/utils/authUtils';

export default function ExhibitorSelfDetails() {
  const pathname = usePathname();
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Exhibitor | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSelfDetails = async () => {
      const exhibitorId = getCurrentExhibitorId();
      if (!exhibitorId) {
        setError('No exhibitor ID found. Please log in as an exhibitor.');
        return;
      }
      // Extract identifier from URL path
      const pathParts = pathname.split('/');
      const identifier = pathParts[1];
      setLoading(true);
      setError(null);
      try {
        const response = await fieldMappingApi.getExhibitorById(identifier, exhibitorId);
        if (response.isError) {
          let errorMessage = response.message || 'Failed to fetch exhibitor details';
          if (response.statusCode === 404) {
            errorMessage = `Exhibitor with ID ${exhibitorId} not found.`;
          } else if (response.statusCode === 401) {
            errorMessage = 'Authentication required. Please log in again.';
          } else if (response.statusCode === 403) {
            errorMessage = 'Access denied. You do not have permission to view this exhibitor.';
          } else if (response.statusCode >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          setError(errorMessage);
        } else {
          setExhibitor(response.result);
          setFormData(response.result); // initialize form data
        }
      } catch (err) {
        setError('An error occurred while fetching exhibitor details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSelfDetails();
  }, [pathname]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleInputChange = (field: keyof Exhibitor, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      // TODO: Replace with actual API call to update exhibitor
      // await fieldMappingApi.updateExhibitor(formData);
      // Optionally refetch exhibitor details
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleBasedRoute allowedRoles={['exhibitor']}>
        <ResponsiveDashboardLayout title="Exhibitor Details">
          <Container maxWidth="lg" sx={{ mt: 1, mb: 1 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Skeleton variant="circular" width={80} height={80} />
                  <Box flex={1}>
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="40%" height={24} />
                  </Box>
                </Box>
                <Box mt={2}>
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="90%" height={20} />
                </Box>
              </CardContent>
            </Card>
          </Container>
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  if (error) {
    return (
      <RoleBasedRoute allowedRoles={['exhibitor']}>
        <ResponsiveDashboardLayout title="Exhibitor Details">
          <Container maxWidth="md" sx={{ mt: 1, mb: 1 }}>
            <Alert severity="error">
              {error}
            </Alert>
          </Container>
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  if (!exhibitor) {
    return (
      <RoleBasedRoute allowedRoles={['exhibitor']}>
        <ResponsiveDashboardLayout title="Exhibitor Details">
          <Container maxWidth="md" sx={{ mt: 1, mb: 1 }}>
            <Alert severity="info">
              No exhibitor details found
            </Alert>
          </Container>
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  // --- Redesigned layout ---
  return (
    <RoleBasedRoute allowedRoles={['exhibitor']}>
      <ResponsiveDashboardLayout title="Exhibitor Details">
        <Container maxWidth="lg" sx={{ mt: 1, mb: 1 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              {/* Profile Header */}
              <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                <Box sx={{ position: 'relative', width: 70, height: 70 }}>
                  <Avatar
                    src={formData?.companyLogoPath || undefined}
                    sx={{
                      width: 50,
                      height: 50,
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: 'white',
                      bgcolor: 'primary.main',
                    }}
                  >
                    {!formData?.companyLogoPath && getInitials(formData?.firstName || '', formData?.lastName || '')}
                  </Avatar>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    {formData?.companyName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData?.email}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              {/* Details Form (editable) */}
              <Grid container spacing={2}>
                {/* Company Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 1, color: 'primary.main' }}>
                    Company Information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={formData?.companyName || ''}
                    size="small"
                    onChange={e => handleInputChange('companyName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Type"
                    value={formData?.companyType || ''}
                    size="small"
                    onChange={e => handleInputChange('companyType', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Industry"
                    value={formData?.industry || ''}
                    size="small"
                    onChange={e => handleInputChange('industry', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData?.website || ''}
                    size="small"
                    onChange={e => handleInputChange('website', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData?.companyDescription || ''}
                    size="small"
                    onChange={e => handleInputChange('companyDescription', e.target.value)}
                  />
                </Grid>
                {/* Contact Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 1, mt: 1, color: 'primary.main' }}>
                    Contact Information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData?.email || ''}
                    size="small"
                    onChange={e => handleInputChange('email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData?.phoneNumber || ''}
                    size="small"
                    onChange={e => handleInputChange('phoneNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Mobile"
                    value={formData?.mobileNumber || ''}
                    size="small"
                    onChange={e => handleInputChange('mobileNumber', e.target.value)}
                  />
                </Grid>
                {/* Address Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 1, mt: 1, color: 'primary.main' }}>
                    Address Information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData?.city || ''}
                    size="small"
                    onChange={e => handleInputChange('city', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData?.country || ''}
                    size="small"
                    onChange={e => handleInputChange('country', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData?.address || ''}
                    size="small"
                    onChange={e => handleInputChange('address', e.target.value)}
                  />
                </Grid>
                {/* Booth & Status */}
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 1, mt: 1, color: 'primary.main' }}>
                    Booth & Status
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Booth Number"
                    value={formData?.boothNumber || ''}
                    size="small"
                    onChange={e => handleInputChange('boothNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Stand"
                    value={formData?.stand || ''}
                    size="small"
                    onChange={e => handleInputChange('stand', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Booth Size"
                    value={formData?.boothSize || ''}
                    size="small"
                    onChange={e => handleInputChange('boothSize', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Hall"
                    value={formData?.hall || ''}
                    size="small"
                    onChange={e => handleInputChange('hall', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData?.location || ''}
                    size="small"
                    onChange={e => handleInputChange('location', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Status"
                    value={formData?.status || ''}
                    size="small"
                    onChange={e => handleInputChange('status', e.target.value)}
                  />
                </Grid>
                {/* Other Info */}
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 1, mt: 1, color: 'primary.main' }}>
                    Other Information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Registration Date"
                    value={formData?.registrationDate || ''}
                    size="small"
                    onChange={e => handleInputChange('registrationDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Last Login"
                    value={formData?.lastLoginDate || ''}
                    size="small"
                    onChange={e => handleInputChange('lastLoginDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Active"
                    value={formData?.isActive !== undefined ? (formData.isActive ? 'Yes' : 'No') : ''}
                    size="small"
                    onChange={e => handleInputChange('isActive', e.target.value === 'Yes')}
                  />
                </Grid>
                {/* Add more fields as needed, following the same pattern */}
              </Grid>

              {/* Products Section */}
              <Box mt={4}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: 'primary.main' }}>
                  Products
                </Typography>
                <Grid container spacing={2}>
                  {formData?.product && formData.product.length > 0 ? (
                    formData.product.map((prod, idx) => (
                      <Grid item xs={12} key={prod.id || idx}>
                        <Box display="flex" gap={2} alignItems="center" mb={2}>
                          <TextField
                            label="Title"
                            value={prod.title}
                            onChange={e => {
                              const updated = [...(formData.product || [])];
                              updated[idx] = { ...prod, title: e.target.value };
                              setFormData(f => f ? { ...f, product: updated } : f);
                            }}
                            size="small"
                            sx={{ mr: 1, flex: 1 }}
                          />
                          <TextField
                            label="Category"
                            value={prod.category}
                            onChange={e => {
                              const updated = [...(formData.product || [])];
                              updated[idx] = { ...prod, category: e.target.value };
                              setFormData(f => f ? { ...f, product: updated } : f);
                            }}
                            size="small"
                            sx={{ mr: 1, flex: 1 }}
                          />
                          <TextField
                            label="Description"
                            value={prod.description}
                            onChange={e => {
                              const updated = [...(formData.product || [])];
                              updated[idx] = { ...prod, description: e.target.value };
                              setFormData(f => f ? { ...f, product: updated } : f);
                            }}
                            size="small"
                            sx={{ mr: 1, flex: 2 }}
                          />
                          <TextField
                            label="Image URL"
                            value={prod.imagePath}
                            onChange={e => {
                              const updated = [...(formData.product || [])];
                              updated[idx] = { ...prod, imagePath: e.target.value };
                              setFormData(f => f ? { ...f, product: updated } : f);
                            }}
                            size="small"
                            sx={{ mr: 1, flex: 2 }}
                          />

                        </Box>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}><Typography color="text.secondary">No products added.</Typography></Grid>
                  )}
                 
                </Grid>
              </Box>

              {/* Save Button */}
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
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
