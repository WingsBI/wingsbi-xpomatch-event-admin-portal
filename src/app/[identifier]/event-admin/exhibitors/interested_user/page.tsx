"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  ConnectWithoutContact as ConnectIcon,
  Business,
  Work,
} from '@mui/icons-material';

import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi, type ExhibitorFavoriteVisitorsResponse, type ExhibitorFavoriteVisitor } from '@/services/fieldMappingApi';
import { getCurrentExhibitorId } from '@/utils/authUtils';

interface TransformedVisitor {
  id: string;
  firstName: string;
  lastName: string;
  salutation: string;
  jobTitle: string;
  companyName: string;
  designation: string;
  avatar: string;
}

const transformVisitorData = (visitor: ExhibitorFavoriteVisitor): TransformedVisitor => {
  const getInitials = (firstName: string, lastName: string) => 
    `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

  return {
    id: visitor.visitorId.toString(),
    firstName: visitor.firstName || '',
    lastName: visitor.lastName || '',
    salutation: visitor.salutation || '',
    jobTitle: visitor.jobTitle || '',
    companyName: visitor.companyName || '',
    designation: visitor.designation || '',
    avatar: getInitials(visitor.firstName, visitor.lastName),
  };
};

function VisitorCard({ visitor }: { visitor: TransformedVisitor }) {
  const router = useRouter();
  
  const handleConnect = () => {
    // TODO: Implement connect functionality
    console.log('Connect with visitor:', visitor.id);
  };

  return (
    <Card sx={{ 
      height: '100%', 
      mt: -1,
      borderRadius: 3, 
      
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)', 
      border: '1px solid #e8eaed', 
      bgcolor: 'background.paper', 
      transition: 'all 0.3s ease-in-out', 
      '&:hover': { 
        transform: 'translateY(-2px)', 
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)' 
      } 
    }}>
      <CardContent sx={{ 
        p: 1.5, 
        pb: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        position: 'relative' 
      }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1} sx={{ minHeight: '45px' }}>
          <Avatar sx={{ 
            bgcolor: 'success.main', 
            width: 36, 
            height: 36, 
            mr: 1.2, 
            fontSize: '0.9rem', 
            fontWeight: 'bold', 
            flexShrink: 0, 
            color: 'white', 
            alignSelf: 'flex-start' 
          }}>
            {visitor.avatar}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" component="div" fontWeight="600" sx={{ 
              minHeight: '1.1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              lineHeight: 1.2, 
              wordBreak: 'break-word' 
            }}>
              <Box sx={{ wordBreak: 'break-word', lineHeight: 1.2 }}>
                <span>{visitor.salutation} {visitor.firstName} {visitor.lastName}</span>
              </Box>
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ 
              mb: 0.5, 
              wordBreak: 'break-word', 
              lineHeight: 1.3 
            }}>
              {visitor.jobTitle}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="secondary.main" sx={{ 
            fontWeight: 500, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            wordBreak: 'break-word',
            lineHeight: 1.3
          }}>
            
            {visitor.companyName}
          </Typography>
        </Box>

        <Divider sx={{ mb: 1, mt: 'auto' }} />
        <Box sx={{ mt: '0.5', pt: 1,ml:15 }}>
        <Button
            variant="contained"
            size="small"
            startIcon={<ConnectIcon />}
            onClick={() => {
            const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
            const identifier = pathParts[1] || '';
            router.push(`/${identifier}/event-admin/meetings/schedule-meeting?visitorId=${visitor.id}`);
            }}
            sx={{ 
            bgcolor: 'secondary.main',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            px: 1,
            py: 0.75,
            '&:hover': {
                    bgcolor: 'secondary.dark',
                        }
                }}>
            Connect
        </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function InterestedUserPage() {
  const params = useParams();
  const identifier = params.identifier as string;
  
  const [visitors, setVisitors] = useState<TransformedVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!identifier) return;

      try {
        setLoading(true);
        setError(null);

        const currentExhibitorId = getCurrentExhibitorId();
        if (!currentExhibitorId) {
          throw new Error('No exhibitor ID found. Please log in as an exhibitor.');
        }

        console.log('🔍 Loading exhibitor favorites for exhibitor ID:', currentExhibitorId);
        
        const response: ExhibitorFavoriteVisitorsResponse = await fieldMappingApi.getAllExhibitorFavorites(identifier, currentExhibitorId);
        
        if (response.statusCode === 200 && response.result) {
          console.log('✅ Loaded visitor favorites:', response.result.length, 'visitors');
          const transformedVisitors = response.result
            .filter((visitor: ExhibitorFavoriteVisitor) => visitor.isFavorite)
            .map(transformVisitorData);
          setVisitors(transformedVisitors);
        } else {
          console.log('📦 No visitor favorites found or API error');
          setVisitors([]);
          if (response.message) {
            setError(response.message || 'Failed to load favorite visitors');
          }
        }
      } catch (err: any) {
        console.error('Error loading exhibitor favorites:', err);
        setError(err.message || 'Failed to load favorite visitors');
        setVisitors([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [identifier]);

  if (loading) {
    return (
      <ResponsiveDashboardLayout title="Interested Visitors">
        <RoleBasedRoute allowedRoles={['exhibitor']}>
          <Container maxWidth="xl" sx={{ mt: 1, mb: 1 }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress />
            </Box>
          </Container>
        </RoleBasedRoute>
      </ResponsiveDashboardLayout>
    );
  }

  return (
    <ResponsiveDashboardLayout title="Interested Visitors">
      <RoleBasedRoute allowedRoles={['exhibitor']}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box mb={4}>
            <Typography variant="h5" mt={-4} component="h1" fontWeight={600} gutterBottom>
              Interested Visitors
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visitors who have shown interest in your company
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {visitors.length === 0 && !error ? (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No interested visitors found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When visitors show interest in your company, they will appear here.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {visitors.map((visitor) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={visitor.id}>
                  <VisitorCard visitor={visitor} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </RoleBasedRoute>
    </ResponsiveDashboardLayout>
  );
}
