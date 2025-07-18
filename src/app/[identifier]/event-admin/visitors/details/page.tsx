"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  IconButton,
  Link as MuiLink,
} from "@mui/material";
import {
  Email,
  Phone,
  LocationOn,
  Work,
  Language,
  LinkedIn,
  Twitter,
  Instagram,
  GitHub,
} from "@mui/icons-material";
import { fieldMappingApi } from "@/services/fieldMappingApi";

export default function VisitorDetailsPage() {
  const searchParams = useSearchParams();
  const visitorId = searchParams.get("visitorId");
  const [visitor, setVisitor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisitorDetails = async () => {
      if (!visitorId) {
        setError("No visitor ID provided");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const pathParts = window.location.pathname.split("/");
        const identifier = pathParts[1];
        const response = await fieldMappingApi.getVisitorById(identifier, parseInt(visitorId, 10));
        if (response.isError || !response.result || response.result.length === 0) {
          setError(response.message || "Failed to fetch visitor details");
        } else {
          setVisitor(response.result[0]);
        }
      } catch (err) {
        setError("An error occurred while fetching visitor details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchVisitorDetails();
  }, [visitorId]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 1, mb: 1 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!visitor) {
    return (
      <Container maxWidth="md" sx={{ mt: 1, mb: 1 }}>
        <Alert severity="info">No visitor details found</Alert>
      </Container>
    );
  }

  const userProfile = visitor.userProfile || {};
  const userAddress = visitor.userAddress || {};

  // Helper to render a field only if value is present
  const renderField = (label: string, value: any) => {
    if (value === undefined || value === null || value === "") return null;
    return (
      <Grid item xs={12} sm={6}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2"><b>{label}:</b> {value}</Typography>
        </Box>
      </Grid>
    );
  };

  // Social links as icons
  const socialLinks = [
    userProfile.linkedInProfile && {
      icon: <LinkedIn fontSize="small" />, label: 'LinkedIn', url: userProfile.linkedInProfile
    },
    userProfile.instagramProfile && {
      icon: <Instagram fontSize="small" />, label: 'Instagram', url: userProfile.instagramProfile
    },
    userProfile.gitHubProfile && {
      icon: <GitHub fontSize="small" />, label: 'GitHub', url: userProfile.gitHubProfile
    },
    userProfile.twitterProfile && {
      icon: <Twitter fontSize="small" />, label: 'Twitter', url: userProfile.twitterProfile
    },
  ].filter(Boolean);

  return (
    <Container maxWidth="lg" sx={{ mt: 1, mb: 1 }}>
      <Card>
        <CardContent sx={{ p: 2 }}>
          {/* Header Section */}
          <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                fontSize: "1.2rem",
                fontWeight: "bold",
                bgcolor: "primary.main",
                color: "white",
              }}
            >
              {getInitials(visitor.firstName, visitor.lastName)}
            </Avatar>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={8}>
                <Typography variant="h6" component="h1" sx={{ whiteSpace: "nowrap" }}>
                  {visitor.salutation} {visitor.firstName} {visitor.middleName} {visitor.lastName}
                </Typography>
            
                {userProfile.jobTitle && (
                  <Chip
                    icon={<Work />}
                    label={userProfile.jobTitle}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
              {userProfile.companyName && (
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                  {userProfile.companyName}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 1 }} />

          {/* Personal Info */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Personal Information</Typography>
          <Grid container spacing={-60}>
            {renderField('Gender', visitor.gender)}
            {renderField('Date of Birth', visitor.dateOfBirth)}
            {renderField('Nationality', userProfile.nationality)}
            {renderField('Email', visitor.email)}
            {renderField('Business Email', userProfile.businessEmail)}
            {renderField('Phone', userProfile.phone)}
            {renderField('Experience (years)', userProfile.experienceYears)}
            {renderField('Role', visitor.roleName)}
            {renderField('Status', visitor.statusName)}
            {renderField('Created Date', visitor.createdDate)}
            {renderField('Modified Date', visitor.modifiedDate)}
          </Grid>

          <Divider sx={{ my: 1 }} />

          {/* Job Info */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Job Information</Typography>
          <Grid container spacing={-60}>
            {renderField('Designation', userProfile.designation)}
            {renderField('Job Title', userProfile.jobTitle)}
            {renderField('Company Name', userProfile.companyName)}
            {userProfile.companyWebsite && (
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Language fontSize="small" />
                  <MuiLink href={userProfile.companyWebsite} target="_blank" rel="noopener noreferrer">
                    {userProfile.companyWebsite}
                  </MuiLink>
                </Box>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 1 }} />

          {/* Address Info */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Address</Typography>
          <Grid container spacing={-60}>
            {renderField('Address Line 1', userAddress.addressLine1)}
            {renderField('Address Line 2', userAddress.addressLine2)}
            {renderField('City', userAddress.cityName)}
            {renderField('State', userAddress.stateName)}
            {renderField('Country', userAddress.countryName)}
            {renderField('Postal Code', userAddress.postalCode)}
            {renderField('Latitude', userAddress.latitude)}
            {renderField('Longitude', userAddress.longitude)}
          </Grid>

          <Divider sx={{ my: 1 }} />

          {/* Social Media */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Social Media</Typography>
          <Grid container spacing={-60}>
            {socialLinks.map((link, idx) => (
              <Grid item xs={12} sm={6} key={link.label}>
                <Box display="flex" alignItems="center" gap={1}>
                  {link.icon}
                  <MuiLink href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </MuiLink>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 1 }} />

          {/* Raw Data (for debugging, can be removed) */}
          {/* <pre>{JSON.stringify(visitor, null, 2)}</pre> */}
        </CardContent>
      </Card>
    </Container>
  );
}
