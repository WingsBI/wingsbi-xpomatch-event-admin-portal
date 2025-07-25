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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Move fetchSelfDetails outside useEffect
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

  useEffect(() => {
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
    // Extract identifier from URL path
    const pathParts = pathname.split('/');
    const identifier = pathParts[1];
    // Prepare the update body as per the new API
    const updateBody: any = {
      exhibitorId: formData.id,
      products: formData.products || '',
      technology: formData.technology || '',
      companyProfile: formData.companyDescription || '',
      companyType: formData.companyType || '',
      productTitle: formData.product && formData.product[0]?.title || '',
      productDescription: formData.product && formData.product[0]?.description || '',
      productType: formData.product && formData.product[0]?.category || '',
      brandCategory: formData.brand && formData.brand[0]?.category || '',
      brandDescription: formData.brand && formData.brand[0]?.description || '',
      brandName: formData.brand && formData.brand[0]?.brandName || '',
    };
    try {
      const response = await fieldMappingApi.updateExhibitorEmbeddingUpdate(identifier, updateBody);
      if (response.isError) {
        setError(response.message || 'Failed to update exhibitor');
      } else {
        setError(null);
        setFormData(prev => prev ? { ...prev, ...updateBody } : prev); // Optimistically update
        // Refetch exhibitor details to show updated profile
        await new Promise(res => setTimeout(res, 500));
        await fetchSelfDetails();
        setSuccessMessage('Profile updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('An error occurred while updating exhibitor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to get a valid brand object for editing
  const getValidBrand = (existing?: any) => ({
    id: existing?.id || 0,
    exhibitorId: existing?.exhibitorId || formData?.id || 0,
    brandName: existing?.brandName || '',
    category: existing?.category || '',
    description: existing?.description || '',
    logoPath: existing?.logoPath || '',
    createdBy: existing?.createdBy || 0,
    createdDate: existing?.createdDate || '',
    modifiedBy: existing?.modifiedBy || null,
    modifiedDate: existing?.modifiedDate || null,
    isActive: typeof existing?.isActive === 'boolean' ? existing.isActive : true,
  });

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
        <Container maxWidth="lg" sx={{ mt: -1 }}>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          <Card>
            <CardContent sx={{ p: 2 }}>
              {/* Profile Header */}
              <Box display="flex" alignItems="center" mb={1} mt={-1}>
                <Box sx={{ position: 'relative', width: 70, height: 70 }}>
                  <Avatar
                    src={formData?.companyLogoPath || undefined}
                    sx={{
                      width: 40, // reduced from 50
                      height: 40, // reduced from 50
                      fontSize: '1rem', // reduced
                      fontWeight: 'bold',
                      color: 'white',
                      bgcolor: 'primary.main',
                      mt: 1
                    }}
                  >
                    {!formData?.companyLogoPath && getInitials(formData?.firstName || '', formData?.lastName || '')}
                  </Avatar>
                </Box>
                <Box >
                  <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.95rem' }}>
                    {formData?.companyName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {formData?.email}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 1 }} />

              {/* Details Form (editable) */}
              <Grid container spacing={2}>
                {/* Company Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0, color: 'primary.main', fontSize: '0.95rem' }}>
                    Company Information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={formData?.companyName || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Type"
                    value={formData?.companyType || ''}
                    size="small"
                    onChange={e => handleInputChange('companyType', e.target.value)}
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Industry"
                    value={formData?.industry || ''}
                    size="small"
                    onChange={e => handleInputChange('industry', e.target.value)}
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData?.website || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                {/* Move Technology above Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Technology"
                    value={formData?.technology || ''}
                    size="small"
                    onChange={e => handleInputChange('technology', e.target.value)}
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData?.companyDescription || ''}
                    onChange={e => handleInputChange('companyDescription', e.target.value)}
                    multiline
                    minRows={1} // Start with 2 rows
                    maxRows={10} // Optional: limit to 10 rows max
                    size="small"
                    sx={{ mr: 1, flex: 2, width: '100%' }}
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>

                {/* Products Section */}
                <Box mt={2} ml={2}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, color: 'primary.main', fontSize: '0.95rem' }}>
                    Products
                  </Typography>
                  <Grid container spacing={2}>
                    {formData?.product && formData.product.length > 0 ? (
                      formData.product.map((prod, idx) => (
                        <Grid item xs={12} key={prod.id || idx}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4} md={4}>
                              <TextField
                                fullWidth
                                label="Title"
                                value={prod.title}
                                onChange={e => {
                                  const updated = [...(formData.product || [])];
                                  updated[idx] = { ...prod, title: e.target.value };
                                  setFormData(f => f ? { ...f, product: updated } : f);
                                }}
                                size="small"
                                InputProps={{ sx: { fontSize: '0.9rem' } }}
                                InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                              <TextField
                                fullWidth
                                label="Category"
                                value={prod.category}
                                onChange={e => {
                                  const updated = [...(formData.product || [])];
                                  updated[idx] = { ...prod, category: e.target.value };
                                  setFormData(f => f ? { ...f, product: updated } : f);
                                }}
                                size="small"
                                InputProps={{ sx: { fontSize: '0.9rem' } }}
                                InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4} md={4}>
                              <TextField
                                fullWidth
                                label="Image URL"
                                value={prod.imagePath}
                                disabled
                                size="small"
                                InputProps={{ sx: { fontSize: '0.9rem' } }}
                                InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Description"
                                value={prod.description}
                                onChange={e => {
                                  const updated = [...(formData.product || [])];
                                  updated[idx] = { ...prod, description: e.target.value };
                                  setFormData(f => f ? { ...f, product: updated } : f);
                                }}
                                multiline
                                minRows={1}
                                maxRows={10}
                                size="small"
                                sx={{ width: '100%' }}
                                InputProps={{ sx: { fontSize: '0.9rem' } }}
                                InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                              />
                            </Grid>
                          </Grid>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}><Typography color="text.secondary" variant="caption" sx={{ fontSize: '0.8rem' }}>No products added.</Typography></Grid>
                    )}
                  </Grid>
                </Box>


                {/* Brand Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0, mt: 1, color: 'primary.main', fontSize: '0.95rem' }}>
                    Brand Information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Brand Name"
                    value={formData?.brand && formData.brand[0]?.brandName || ''}
                    size="small"
                    onChange={e => {
                      setFormData(f => {
                        if (!f) return f;
                        const current = f.brand && f.brand[0] ? f.brand[0] : undefined;
                        const updatedBrand = { ...getValidBrand(current), brandName: e.target.value };
                        return { ...f, brand: [updatedBrand] };
                      });
                    }}
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Brand Category"
                    value={formData?.brand && formData.brand[0]?.category || ''}
                    size="small"
                    onChange={e => {
                      setFormData(f => {
                        if (!f) return f;
                        const current = f.brand && f.brand[0] ? f.brand[0] : undefined;
                        const updatedBrand = { ...getValidBrand(current), category: e.target.value };
                        return { ...f, brand: [updatedBrand] };
                      });
                    }}
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={8} md={8}>
                  <TextField
                    fullWidth
                    label="Brand Description"
                    value={formData?.brand && formData.brand[0]?.description || ''}
                    size="small"
                    onChange={e => {
                      setFormData(f => {
                        if (!f) return f;
                        const current = f.brand && f.brand[0] ? f.brand[0] : undefined;
                        const updatedBrand = { ...getValidBrand(current), description: e.target.value };
                        return { ...f, brand: [updatedBrand] };
                      });
                    }}
                    multiline
                    minRows={1}
                    maxRows={10}
                    sx={{ width: '100%' }}
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                {/* Contact Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0, mt: 1, color: 'primary.main', fontSize: '0.95rem' }}>
                    Contact Information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData?.email || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData?.phoneNumber || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                {/* Address Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0, mt: 1, color: 'primary.main', fontSize: '0.95rem' }}>
                    Address Information
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData?.city || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData?.country || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData?.address || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                {/* Booth & Status */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0, mt: 1, color: 'primary.main', fontSize: '0.95rem' }}>
                    Booth & Status
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Booth Number"
                    value={formData?.boothNumber || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Hall"
                    value={formData?.hall || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData?.location || ''}
                    size="small"
                    disabled
                    InputProps={{ sx: { fontSize: '0.9rem' } }}
                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </Grid>
                {/* Add more fields as needed, following the same pattern */}
              </Grid>

              {/* Products Section */}
              <Box mt={4}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, color: 'primary.main', fontSize: '0.95rem' }}>
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
                            InputProps={{ sx: { fontSize: '0.9rem' } }}
                            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
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
                            InputProps={{ sx: { fontSize: '0.9rem' } }}
                            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                          />
                         
                          <TextField
                            label="Image URL"
                            value={prod.imagePath}
                            disabled
                            size="small"
                            sx={{ mr: 1, flex: 2 }}
                            InputProps={{ sx: { fontSize: '0.9rem' } }}
                            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                          />
                        </Box>
                        <Box>
                        <TextField
                            label="Description"
                            value={prod.description}
                            onChange={e => {
                              const updated = [...(formData.product || [])];
                              updated[idx] = { ...prod, description: e.target.value };
                              setFormData(f => f ? { ...f, product: updated } : f);
                            }}
                            multiline
                            minRows={2} // Start with 2 rows
                            maxRows={10} // Optional: limit to 10 rows max
                            size="small"
                            sx={{ mr: 1, flex: 2, width: '100%' }}
                            InputProps={{ sx: { fontSize: '0.9rem' } }}
                            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                          />
                        </Box>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}><Typography color="text.secondary" variant="caption" sx={{ fontSize: '0.8rem' }}>No products added.</Typography></Grid>
                  )}
                </Grid>
              </Box>

              {/* Save Button */}
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ minWidth: 100, fontSize: '0.9rem', py: 0.5 }}
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
