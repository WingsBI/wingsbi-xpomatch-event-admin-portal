'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { RootState } from '@/store';
import { useRoleAccess } from '@/context/RoleAccessContext';
import { roleBasedDirectoryApi } from '@/services/apiService';
import { getAuthToken, getUserData } from '@/utils/cookieManager';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

export default function DebugPage() {
  const params = useParams();
  const identifier = params?.identifier as string;
  
  // Redux auth state
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  
  // Role access context
  const { permissions, isLoading: permissionsLoading, error: permissionsError } = useRoleAccess();
  
  // Local state for testing
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Get cookie data
  const cookieToken = getAuthToken();
  const cookieUser = getUserData();

  const testApiCall = async () => {
    if (!user || !identifier) {
      setTestError('No user or identifier available');
      return;
    }

    try {
      setTestError(null);
      const roleId = user.role === 'visitor' ? 4 : user.role === 'exhibitor' ? 3 : 1;
      
      console.log('🧪 Testing API call with:', { identifier, roleId, userRole: user.role });
      
      const response = await roleBasedDirectoryApi.getAllRolebaseDirectoryAccessDetails(identifier, roleId);
      setTestResult(response);
      console.log('🧪 Test API response:', response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestError(errorMessage);
      console.error('🧪 Test API error:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Debug Page
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Authentication State
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText 
              primary="Redux isAuthenticated" 
              secondary={isAuthenticated ? '✅ True' : '❌ False'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Redux isLoading" 
              secondary={isLoading ? '⏳ True' : '✅ False'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Redux User" 
              secondary={user ? JSON.stringify(user, null, 2) : '❌ No user'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Cookie Token" 
              secondary={cookieToken ? `✅ Found (${cookieToken.length} chars)` : '❌ No token'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Cookie User" 
              secondary={cookieUser ? JSON.stringify(cookieUser, null, 2) : '❌ No user data'} 
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Role Access Context
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText 
              primary="Permissions Loading" 
              secondary={permissionsLoading ? '⏳ True' : '✅ False'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Permissions Error" 
              secondary={permissionsError || '✅ No error'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Permissions Data" 
              secondary={permissions ? JSON.stringify(permissions, null, 2) : '❌ No permissions'} 
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manual API Test
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={testApiCall}
          disabled={!user || !identifier}
          sx={{ mb: 2 }}
        >
          Test API Call
        </Button>
        
        {testError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {testError}
          </Alert>
        )}
        
        {testResult && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              API Response:
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <pre style={{ margin: 0, fontSize: '12px' }}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Debug Functions
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Open browser console and use these functions:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText 
              primary="window.testRoleAccessApi.getCurrentState()" 
              secondary="Get current RoleAccessContext state" 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="window.testRoleAccessApi.fetchRolePermissions()" 
              secondary="Manually trigger permission fetch" 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="window.testRoleAccessApi.testApiCall(identifier, roleId)" 
              secondary="Test API call with specific parameters" 
            />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
}
