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
  Divider
} from '@mui/material';
import {
  Business,
  Work
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

  return (
    <RoleBasedRoute allowedRoles={['exhibitor']}>
      <ResponsiveDashboardLayout title="Exhibitor Details">
        <Container maxWidth="lg" sx={{ mt: 1, mb: 1 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              {/* Header Section */}
              <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    bgcolor: 'primary.main',
                    color: 'white'
                  }}
                >
                  {exhibitor.companyName ?
                    exhibitor.companyName.charAt(0).toUpperCase() :
                    getInitials(exhibitor.firstName, exhibitor.lastName)
                  }
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={4}>
                    <Typography variant="h5" component="h1" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {exhibitor.companyName}
                    </Typography>
                    {exhibitor.boothNumber && (
                      <Chip
                        icon={<Business />}
                        label={`Booth: ${exhibitor.boothNumber}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ ml: 0 }}
                      />
                    )}
                    {exhibitor.industry && (
                      <Chip
                        icon={<Work />}
                        label={exhibitor.industry}
                        variant="outlined"
                        size="small"
                        sx={{ ml: 0 }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Info Section: single two-column Grid, only show fields with data */}
              {(() => {
                const infoItems = [
                  exhibitor.email && { label: 'Email' , value: exhibitor.email },
                  exhibitor.phoneNumber && { label: 'Phone', value: exhibitor.phoneNumber },
                  exhibitor.mobileNumber && { label: 'Mobile', value: exhibitor.mobileNumber },
                  exhibitor.companyName && { label: 'Company Name', value: exhibitor.companyName },
                  exhibitor.companyType && { label: 'Type', value: exhibitor.companyType },
                  exhibitor.companyDescription && { label: 'Description', value: exhibitor.companyDescription },
                  exhibitor.industry && { label: 'Industry', value: exhibitor.industry },
                  exhibitor.website && { label: 'Website', value: <a href={exhibitor.website.startsWith('http') ? exhibitor.website : `https://${exhibitor.website}`} target="_blank" rel="noopener noreferrer">{exhibitor.website}</a> },
                 
                  exhibitor.companyLogoPath && { label: 'Logo', value: <img src={exhibitor.companyLogoPath} alt="logo" width={40} /> },
                  exhibitor.city && { label: 'City', value: exhibitor.city },
                  exhibitor.boothNumber && { label: 'Booth Number', value: exhibitor.boothNumber },
                  exhibitor.stand && { label: 'Stand', value: exhibitor.stand },
                  exhibitor.boothSize && { label: 'Booth Size', value: exhibitor.boothSize },
                  exhibitor.hall && { label: 'Hall', value: exhibitor.hall },
                  exhibitor.location && { label: 'Location', value: exhibitor.location },
                  exhibitor.address && { label: 'Address', value: exhibitor.address },
                  exhibitor.country && { label: 'Country', value: exhibitor.country },
                  exhibitor.status && { label: 'Status', value: exhibitor.status },
                  exhibitor.registrationDate && { label: 'Registration Date', value: exhibitor.registrationDate },
                  exhibitor.lastLoginDate && { label: 'Last Login', value: exhibitor.lastLoginDate },
                  exhibitor.createdAt && { label: 'Created At', value: exhibitor.createdAt },
                  exhibitor.updatedAt && { label: 'Updated At', value: exhibitor.updatedAt },
                  exhibitor.isActive !== undefined && { label: 'Active', value: exhibitor.isActive ? 'Yes' : 'No' },
                  exhibitor.interests && exhibitor.interests.length > 0 && { label: 'Interests', value: exhibitor.interests.join(', ') },
                  exhibitor.lookingFor && exhibitor.lookingFor.length > 0 && { label: 'Looking For', value: exhibitor.lookingFor.join(', ') },
                  exhibitor.products && exhibitor.products.length > 0 && { label: 'Products', value: exhibitor.products.join(', ') },
                  exhibitor.experience && { label: 'Experience', value: exhibitor.experience },
                  exhibitor.matchScore !== undefined && { label: 'Match Score', value: exhibitor.matchScore },
                ].filter(Boolean) as { label: string; value: React.ReactNode }[];
                return (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {infoItems.map((item, idx) => (
                      <Grid item xs={12} sm={6} key={idx}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '1rem', display: 'inline' }}>{item.label}:</Typography> <Typography variant="body1" sx={{ display: 'inline', fontSize: '1rem', ml: 0.5 }}>{item.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                );
              })()}

              {/* Nested: exhibitorProfile */}
              {exhibitor.exhibitorProfile && exhibitor.exhibitorProfile.length > 0 && (
                <Grid item xs={12} sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Exhibitor Profile</Typography>
                  <Box>
                    {exhibitor.exhibitorProfile.map((profile, idx) => (
                      <Box key={profile.id || idx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Company Profile:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{profile.companyProfile}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Listing As:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{profile.listingAs}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Receive Email Enquiries:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{profile.receiveEmailEnquiries}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Social:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{[
                          profile.twitterLink && `twitterLink: ${profile.twitterLink}`,
                          profile.linkedInLink && `linkedInLink: ${profile.linkedInLink}`,
                          profile.instagramLink && `instagramLink: ${profile.instagramLink}`,
                          profile.youTubeLink && `youTubeLink: ${profile.youTubeLink}`,
                          profile.faceBoolLink && `faceBoolLink: ${profile.faceBoolLink}`
                        ].filter(Boolean).join(', ')}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>ISO Certificates:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{profile.isoCertificates}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
              {/* Nested: exhibitorAddress */}
              {exhibitor.exhibitorAddress && exhibitor.exhibitorAddress.length > 0 && (
                <Grid item xs={12} sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Exhibitor Address</Typography>
                  <Box>
                    {exhibitor.exhibitorAddress.map((addr, idx) => (
                      <Box key={addr.id || idx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>City:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{addr.city}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>State/Province:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{addr.stateProvince}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Zip/Postal Code:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{addr.zipPostalCode}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>PO Box:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{addr.poBox}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
              {/* Nested: exhibitorToUserMaps */}
              {exhibitor.exhibitorToUserMaps && exhibitor.exhibitorToUserMaps.length > 0 && (
                <Grid item xs={12} sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Exhibitor Contacts</Typography>
                  <Box>
                    {exhibitor.exhibitorToUserMaps.map((user, idx) => (
                      <Box key={user.exhibitorUserMapId || idx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Name:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{user.salutation} {user.firstName} {user.middleName} {user.lastName}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Email:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{user.email}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Role:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{user.roleName}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Phone:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{user.phone}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Designation:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{user.designation}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>LinkedIn:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{user.linkedInProfile}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Instagram:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{user.instagramProfile}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>GitHub:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{user.gitHubProfile}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Twitter:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{user.twitterProfile}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
              {/* Nested: product */}
              {exhibitor.product && exhibitor.product.length > 0 && (
                <Grid item xs={12} sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Products</Typography>
                  <Box>
                    {exhibitor.product.map((prod, idx) => (
                      <Box key={prod.id || idx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Title:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{prod.title}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Category:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{prod.category}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Description:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{prod.description}</Typography>
                        {prod.imagePath && (
                          <Box mt={1}><img src={prod.imagePath} alt="product" width={80} /></Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
              {/* Nested: brand */}
              {exhibitor.brand && exhibitor.brand.length > 0 && (
                <Grid item xs={12} sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Brands</Typography>
                  <Box>
                    {exhibitor.brand.map((brand, idx) => (
                      <Box key={brand.id || idx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Name:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{brand.brandName}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Category:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{brand.category}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Description:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{brand.description}</Typography>
                        {brand.logoPath && (
                          <Box mt={1}><img src={brand.logoPath} alt="brand logo" width={80} /></Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
              {/* Nested: brochure */}
              {exhibitor.brochure && exhibitor.brochure.length > 0 && (
                <Grid item xs={12} sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Brochures</Typography>
                  <Box>
                    {exhibitor.brochure.map((brochure, idx) => (
                      <Box key={brochure.id || idx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Title:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{brochure.title}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>File:</Typography> <Typography variant="body2" sx={{ ml: 0.5 }}>{brochure.filePath ? (
                          <a href={brochure.filePath} target="_blank" rel="noopener noreferrer">Download</a>
                        ) : 'No file uploaded'}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
