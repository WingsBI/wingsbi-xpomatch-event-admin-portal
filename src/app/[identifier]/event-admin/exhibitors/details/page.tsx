"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  IconButton
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  Work,
  Star,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi, type Exhibitor } from '@/services/fieldMappingApi';

export default function ExhibitorDetails() {
  const searchParams = useSearchParams();
  const exhibitorId = searchParams.get('exhibitorId');
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExhibitorDetails = async () => {
      if (!exhibitorId) {
        setError('No exhibitor ID provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const pathParts = window.location.pathname.split('/');
        const identifier = pathParts[1];

        console.log('🔍 Fetching exhibitor details:', {
          identifier,
          exhibitorId,
          url: window.location.pathname
        });

        const response = await fieldMappingApi.getExhibitorById(identifier, parseInt(exhibitorId, 10));
        
        console.log('🔍 Exhibitor details response:', {
          isError: response.isError,
          statusCode: response.statusCode,
          message: response.message,
          hasResult: !!response.result,
          resultKeys: response.result ? Object.keys(response.result) : []
        });
        
        if (response.isError) {
          let errorMessage = response.message || 'Failed to fetch exhibitor details';
          
          if (response.statusCode === 404) {
            errorMessage = `Exhibitor with ID ${exhibitorId} not found. Please check the exhibitor ID and try again.`;
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
        console.error('❌ Error fetching exhibitor details:', err);
        setError('An error occurred while fetching exhibitor details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExhibitorDetails();
  }, [exhibitorId]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
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
      </RoleBasedRoute>
    );
  }

  if (error) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
        <Container maxWidth="md" sx={{ mt: 1, mb: 1 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Container>
      </RoleBasedRoute>
    );
  }

  if (!exhibitor) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
        <Container maxWidth="md" sx={{ mt: 1, mb: 1 }}>
          <Alert severity="info">
            No exhibitor details found
          </Alert>
        </Container>
      </RoleBasedRoute>
    );
  }

  return (
    <RoleBasedRoute allowedRoles={['event-admin', 'visitor']}>
      <Container maxWidth="lg" sx={{ mt: 1, mb: 1 }}>
        <Card>
          <CardContent sx={{ p: 2 }}>
            {/* Header Section */}
            <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  fontSize: '1.2rem',
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
                <Box display="flex" alignItems="center" gap={8}>
                  <Typography variant="h5" component="h1" sx={{ whiteSpace: 'nowrap' }}>
                    {exhibitor.companyName || `${exhibitor.firstName} ${exhibitor.lastName}`}
                  </Typography>
                  {exhibitor.boothNumber && (
                    <Chip
                      icon={<Business />}
                      label={`Booth: ${exhibitor.boothNumber}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ ml: -4 }}
                    />
                  )}
                  {exhibitor.industry && (
                    <Chip
                      icon={<Work />}
                      label={exhibitor.industry}
                      variant="outlined"
                      size="small"
                      sx={{ ml: -4 }}
                    />
                  )}
                </Box>
                {exhibitor.jobTitle && (
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                    {exhibitor.jobTitle}
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />
            
            {/* Info Section: single two-column Grid, no vertical gaps, only show fields with data */}
            {(() => {
              // Build the info array
              const infoItems = [
                exhibitor.email && { label: 'Email', value: exhibitor.email },
                exhibitor.phoneNumber && { label: 'Phone', value: exhibitor.phoneNumber },
                exhibitor.mobileNumber && { label: 'Mobile', value: exhibitor.mobileNumber },
                exhibitor.companyName && { label: 'Company Name', value: exhibitor.companyName },
                exhibitor.companyType && { label: 'Type', value: exhibitor.companyType },
                exhibitor.companyDescription && { label: 'Description', value: exhibitor.companyDescription },
                exhibitor.industry && { label: 'Industry', value: exhibitor.industry },
                exhibitor.website && { label: 'Website', value: exhibitor.website },
                exhibitor.webSite && { label: 'Web Site', value: exhibitor.webSite },
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

              // Swap Address and Booth Size if both exist
             
              const boothSizeIdx = infoItems.findIndex(i => i.label === 'Booth Size');
             
  
              return (
                <Grid container spacing={2}>
                  {infoItems.map((item, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Box>
                        <b>{item.label}:</b> {item.value}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              );
            })()}
            {/* Nested: exhibitorProfile */}
            {exhibitor.exhibitorProfile && exhibitor.exhibitorProfile.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">Exhibitor Profile</Typography>
                <Box>
                  {exhibitor.exhibitorProfile.map((profile, idx) => (
                    <Box key={profile.id || idx} sx={{ mb: 1, pl: 1, borderLeft: '2px solid #eee' }}>
                      <div><b>Company Profile:</b> {profile.companyProfile}</div>
                      <div><b>Listing As:</b> {profile.listingAs}</div>
                      <div><b>Receive Email Enquiries:</b> {profile.receiveEmailEnquiries}</div>
                      <div><b>Social:</b> {[
                        profile.twitterLink && `twitterLink: ${profile.twitterLink}`,
                        profile.linkedInLink && `linkedInLink: ${profile.linkedInLink}`,
                        profile.instagramLink && `instagramLink: ${profile.instagramLink}`,
                        profile.youTubeLink && `youTubeLink: ${profile.youTubeLink}`,
                        profile.faceBoolLink && `faceBoolLink: ${profile.faceBoolLink}`
                      ].filter(Boolean).join(', ')}</div>
                      <div><b>ISO Certificates:</b> {profile.isoCertificates}</div>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
            {/* Nested: exhibitorAddress */}
            {exhibitor.exhibitorAddress && exhibitor.exhibitorAddress.length > 0 && (
              <Grid item xs={12}>
                 
                <Box>
                  {exhibitor.exhibitorAddress.map((addr, idx) => (
                    <Box key={addr.id || idx} sx={{ mb: 1, pl: 1, borderLeft: '2px solid #eee' }}>
                       
                      <div><b>City:</b> {addr.city}</div>
                      <div><b>State/Province:</b> {addr.stateProvince}</div>
                      <div><b>Zip/Postal Code:</b> {addr.zipPostalCode}</div>
                      <div><b>PO Box:</b> {addr.poBox}</div>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
            {/* Nested: exhibitorToUserMaps */}
            {exhibitor.exhibitorToUserMaps && exhibitor.exhibitorToUserMaps.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">Exhibitor Contacts</Typography>
                <Box>
                  {exhibitor.exhibitorToUserMaps.map((user, idx) => (
                    <Box key={user.exhibitorUserMapId || idx} sx={{ mb: 1, pl: 1, borderLeft: '2px solid #eee' }}>
                      <div><b>Name:</b> {user.salutation} {user.firstName} {user.middleName} {user.lastName}</div>
                      <div><b>Email:</b> {user.email}</div>
                      <div><b>Role:</b> {user.roleName}</div>
                      <div><b>Phone:</b> {user.phone}</div>
                      <div><b>Designation:</b> {user.designation}</div>
                      <div><b>LinkedIn:</b> {user.linkedInProfile}</div>
                      <div><b>Instagram:</b> {user.instagramProfile}</div>
                      <div><b>GitHub:</b> {user.gitHubProfile}</div>
                      <div><b>Twitter:</b> {user.twitterProfile}</div>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
            {/* Nested: product */}
            {exhibitor.product && exhibitor.product.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">Products</Typography>
                <Box>
                  {exhibitor.product.map((prod, idx) => (
                    <Box key={prod.id || idx} sx={{ mb: 1, pl: 1, borderLeft: '2px solid #eee' }}>
                      <div><b>Title:</b> {prod.title}</div>
                      <div><b>Category:</b> {prod.category}</div>
                      <div><b>Description:</b> {prod.description}</div>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
            {/* Nested: brand */}
            {exhibitor.brand && exhibitor.brand.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">Brands</Typography>
                <Box>
                  {exhibitor.brand.map((brand, idx) => (
                    <Box key={brand.id || idx} sx={{ mb: 1, pl: 1, borderLeft: '2px solid #eee' }}>
                      <div><b>Name:</b> {brand.brandName}</div>
                      <div><b>Category:</b> {brand.category}</div>
                      <div><b>Description:</b> {brand.description}</div>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Container>
    </RoleBasedRoute>
  );
}
