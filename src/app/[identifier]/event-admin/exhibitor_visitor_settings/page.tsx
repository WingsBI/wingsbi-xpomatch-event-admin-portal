'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  Checkbox,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { roleBasedDirectoryApi } from '@/services/apiService';

interface ModuleAccess {
  id: string;
  name: string;
  exhibitor: boolean;
  visitor: boolean;
}

interface RoleBasedAccess {
  roleId: number;
  roleName: string | null;
  visitor: boolean;
  exhibitor: boolean;
  setMeeting: boolean;
  isFavorite: boolean;
}

export default function ExhibitorVisitorSettingsPage() {
  const params = useParams();
  const identifier = params?.identifier as string;
  
  const [modules, setModules] = useState<ModuleAccess[]>([
    { id: 'visitor-directory', name: 'Visitor Directory', exhibitor: true, visitor: true },
    { id: 'exhibitor-directory', name: 'Exhibitor Directory', exhibitor: true, visitor: false },
    { id: 'my-favorite', name: 'My Favorite', exhibitor: true, visitor: true },
    { id: 'meetings', name: 'Meetings', exhibitor: true, visitor: true },
  ]);

  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccessChange = (moduleId: string, role: 'exhibitor' | 'visitor', checked: boolean) => {
    setModules(prev => 
      prev.map(module => 
        module.id === moduleId 
          ? { ...module, [role]: checked }
          : module
      )
    );
  };

  // Fetch role-based access data on component mount
  useEffect(() => {
    const fetchRoleBasedAccess = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await roleBasedDirectoryApi.getAllRoleBaseDirectoryAccess(identifier);
        
        if (response.isError) {
          throw new Error(response.message || 'Failed to fetch role-based access data');
        }
        
        const roleData: RoleBasedAccess[] = response.result || [];
        
        // Map API response to UI modules
        const updatedModules = modules.map(module => {
          let exhibitorAccess = false;
          let visitorAccess = false;
          
          // Find exhibitor role (roleId = 3)
          const exhibitorRole = roleData.find(role => role.roleId === 3);
          // Find visitor role (roleId = 4)
          const visitorRole = roleData.find(role => role.roleId === 4);
          
          switch (module.id) {
            case 'visitor-directory':
              exhibitorAccess = exhibitorRole?.visitor || false;
              visitorAccess = visitorRole?.visitor || false;
              break;
            case 'exhibitor-directory':
              exhibitorAccess = exhibitorRole?.exhibitor || false;
              visitorAccess = visitorRole?.exhibitor || false;
              break;
            case 'my-favorite':
              exhibitorAccess = exhibitorRole?.isFavorite || false;
              visitorAccess = visitorRole?.isFavorite || false;
              break;
            case 'meetings':
              exhibitorAccess = exhibitorRole?.setMeeting || false;
              visitorAccess = visitorRole?.setMeeting || false;
              break;
          }
          
          return {
            ...module,
            exhibitor: exhibitorAccess,
            visitor: visitorAccess
          };
        });
        
        setModules(updatedModules);
      } catch (err) {
        console.error('Error fetching role-based access:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    
    if (identifier) {
      fetchRoleBasedAccess();
    }
  }, [identifier]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Prepare payload for API
      const payload = [
        {
          roleId: 3, // Exhibitor role
          visitor: modules.find(m => m.id === 'visitor-directory')?.exhibitor || false,
          exhibitor: modules.find(m => m.id === 'exhibitor-directory')?.exhibitor || false,
          setMeeting: modules.find(m => m.id === 'meetings')?.exhibitor || false,
          isFavorite: modules.find(m => m.id === 'my-favorite')?.exhibitor || false,
        },
        {
          roleId: 4, // Visitor role
          visitor: modules.find(m => m.id === 'visitor-directory')?.visitor || false,
          exhibitor: modules.find(m => m.id === 'exhibitor-directory')?.visitor || false,
          setMeeting: modules.find(m => m.id === 'meetings')?.visitor || false,
          isFavorite: modules.find(m => m.id === 'my-favorite')?.visitor || false,
        }
      ];
      
      const response = await roleBasedDirectoryApi.updateRolebaseDirectoryAccess(identifier, payload);
      
      if (response.isError) {
        throw new Error(response.message || 'Failed to update role-based access');
      }
      
      setShowSuccess(true);
      console.log('Role-based access updated successfully:', response);
    } catch (err) {
      console.error('Error updating role-based access:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setShowSuccess(false);
  };

  return (
    <RoleBasedRoute allowedRoles={['event_admin', 'event-admin']}>
      <ResponsiveDashboardLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="600">
              Exhibitor Visitor Settings
            </Typography>
          </Box>
        }
      >
        <Container maxWidth="lg" sx={{ py: 3, overflow: 'hidden' }}>
          <Box sx={{ mb: 3, mt: -3 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Configure module access for different user roles
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : (
            <>
              {/* Mobile View */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Paper sx={{ overflow: 'hidden', mb: 3 }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
                      Module Access Settings
                    </Typography>
                    {modules.map((module) => (
                      <Card key={module.id} sx={{ mb: 2, p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                          {module.name}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Exhibitor:
                            </Typography>
                            <Checkbox
                              checked={module.exhibitor}
                              onChange={(e) => handleAccessChange(module.id, 'exhibitor', e.target.checked)}
                              color="primary"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Visitor:
                            </Typography>
                            <Checkbox
                              checked={module.visitor}
                              onChange={(e) => handleAccessChange(module.id, 'visitor', e.target.checked)}
                              color="primary"
                            />
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                </Paper>
              </Box>

              {/* Desktop View */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Paper sx={{ width: '50%', overflow: 'hidden', mb: 3 }}>
                  <TableContainer>
                    <Table sx={{ minWidth: 200 }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.50' }}>
                          <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }}>
                            Modules
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300' }}>
                            Exhibitor
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                            Visitor
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {modules.map((module) => (
                          <TableRow key={module.id} sx={{ '&:hover': { backgroundColor: 'grey.50' } }}>
                            <TableCell 
                              component="th" 
                              scope="row" 
                              sx={{ 
                                fontWeight: '500',
                                borderRight: 1, 
                                borderColor: 'grey.300' 
                              }}
                            >
                              {module.name}
                            </TableCell>
                            <TableCell 
                              align="center" 
                              sx={{ borderRight: 1, borderColor: 'grey.300' }}
                            >
                              <Checkbox
                                checked={module.exhibitor}
                                onChange={(e) => handleAccessChange(module.id, 'exhibitor', e.target.checked)}
                                color="primary"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={module.visitor}
                                onChange={(e) => handleAccessChange(module.id, 'visitor', e.target.checked)}
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'center', md: 'flex-start' },
                gap: 1, 
                mt: 2,
                ml: { xs: 0, md: 48 }
              }}>
                <Button 
                  variant="contained" 
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ 
                    minWidth: { xs: '200px', md: 120 },
                    width: { xs: '100%', md: 'auto' }
                  }}
                >
                  {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Settings'}
                </Button>
              </Box>
            </>
          )}

          <Snackbar
            open={showSuccess}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
              Module access settings saved successfully!
            </Alert>
          </Snackbar>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
