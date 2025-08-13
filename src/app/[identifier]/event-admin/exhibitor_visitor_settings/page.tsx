'use client';

import React, { useState } from 'react';
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
  Checkbox,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';

interface ModuleAccess {
  id: string;
  name: string;
  exhibitor: boolean;
  visitor: boolean;
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

  const handleAccessChange = (moduleId: string, role: 'exhibitor' | 'visitor', checked: boolean) => {
    setModules(prev => 
      prev.map(module => 
        module.id === moduleId 
          ? { ...module, [role]: checked }
          : module
      )
    );
  };

  const handleSave = () => {
    // TODO: Implement API call to save settings
    console.log('Saving module access settings:', modules);
    setShowSuccess(true);
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
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Configure module access for different user roles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the checkboxes below to control which modules are accessible to Exhibitors and Visitors.
            </Typography>
          </Box>

          <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
            <TableContainer>
              <Table sx={{ minWidth: 400 }}>
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleSave}
              sx={{ minWidth: 120 }}
            >
              Save Settings
            </Button>
          </Box>

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
