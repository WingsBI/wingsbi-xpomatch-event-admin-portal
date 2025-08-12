'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Switch,
  Slider,
  TextField,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Link,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Help,
  Info,
  Add,
  Remove,
} from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { fieldMappingApi, MatchingConfigField } from '@/services/fieldMappingApi';

interface FieldWeightage {
  id: string;
  name: string;
  weightage: number;
}



export default function VisitorWeightagePage() {
  const params = useParams();
  const identifier = params?.identifier as string;
  
  const [isContentScoreEnabled, setIsContentScoreEnabled] = useState(true);
  const [fields, setFields] = useState<FieldWeightage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const totalWeightage = fields.reduce((sum, field) => sum + field.weightage, 0);

  // Fetch visitor matching config fields on component mount
  useEffect(() => {
    const fetchVisitorMatchingConfig = async () => {
      try {
        setLoading(true);
        const response = await fieldMappingApi.getAllVisitorMatchingConfig(identifier);
        
        if (response.result && Array.isArray(response.result)) {
          // Sort fields by ID to maintain consistent order
          const sortedFields = response.result.sort((a, b) => a.id - b.id);
          
          const matchingConfigFields: FieldWeightage[] = sortedFields.map((field: MatchingConfigField) => ({
            id: field.fieldName,
            name: field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1).replace(/([A-Z])/g, ' $1'),
            weightage: Math.round(field.weight * 100) // Convert decimal to percentage (0.25 -> 25)
          }));
          
          setFields(matchingConfigFields);
        }
      } catch (error) {
        console.error('Error fetching visitor matching config:', error);
        setSnackbarMessage('Failed to load visitor matching config. Please try again.');
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    if (identifier) {
      fetchVisitorMatchingConfig();
    }
  }, [identifier]);

  const handleWeightageChange = (fieldId: string, newValue: number) => {
    setFields(prevFields => {
      return prevFields.map(field => 
        field.id === fieldId ? { ...field, weightage: newValue } : field
      );
    });
  };

  const handleInputChange = (fieldId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      handleWeightageChange(fieldId, numValue);
    }
  };

  // Check if total weightage exceeds 100%
  const isTotalExceeding100 = totalWeightage > 100;

  const handleSubmit = async () => {
    try {
      // Prepare the payload for the API
      const configData = fields.map(field => ({
        fieldName: field.id,
        weight: field.weightage // Send as integer percentage (25 -> 25)
      }));

      console.log('Saving visitor weightage configuration:', {
        isEnabled: isContentScoreEnabled,
        fields: fields,
        totalWeightage: totalWeightage,
        configData: configData
      });

      // Call the update visitor matching config API
      const response = await fieldMappingApi.updateVisitorMatchingConfig(identifier, configData);
      
      if (response.isError) {
        throw new Error(response.message || 'Failed to update visitor matching config');
      }
      
      setSnackbarMessage('Visitor matching configuration saved successfully!');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      console.error('Error saving visitor matching config:', error);
      setSnackbarMessage('Failed to save configuration. Please try again.');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  return (
    <RoleBasedRoute allowedRoles={['event_admin', 'event-admin']}>
      <ResponsiveDashboardLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="600">
              Visitor Weightage
            </Typography>
            <Chip 
              label="Enabled" 
              color="primary" 
              size="small" 
              sx={{ 
                backgroundColor: '#4caf50',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem'
              }} 
            />
            <IconButton size="small" sx={{ color: 'primary.main' }}>
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <Container maxWidth="lg" sx={{ py: 3, mt: -4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gap: 2 }}>
              <CircularProgress size={40} />
              <Typography variant="h6" color="text.secondary">
                Loading fields...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Content Score Toggle Section */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h6" fontWeight="600">
                    Visitor Weightage 
                  </Typography>
                 
                </Box>
              </Box>

              {/* Fields and Weightage Section */}
              <Card sx={{ 
                borderRadius: 3, 
                mt: -1,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e8eaed'
              }}>
                <CardContent sx={{ p: 4 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight="600">
                        Fields
                      </Typography>
                      
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight="600">
                        Weightage (%)
                      </Typography>
                     
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  {/* Fields List */}
                  <Box sx={{ mb: 3 }}>
                    {fields.map((field, index) => {
                      return (
                        <Box key={field.id} sx={{ mb: 3 }}>
                          <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={6}>
                              <Typography variant="body1" fontWeight="500">
                                {field.name}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flex: 1, px: 1 }}>
                                  <Slider
                                    value={field.weightage}
                                    onChange={(_, value) => handleWeightageChange(field.id, value as number)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    marks={[
                                      { value: 0, label: '0' },
                                      { value: 25, label: '25' },
                                      { value: 50, label: '50' },
                                      { value: 75, label: '75' },
                                      { value: 100, label: '100' }
                                    ]}
                                    sx={{
                                      '& .MuiSlider-thumb': {
                                        backgroundColor: '#4caf50',
                                        '&:hover': {
                                          backgroundColor: '#45a049',
                                        },
                                      },
                                      '& .MuiSlider-track': {
                                        backgroundColor: '#4caf50',
                                      },
                                      '& .MuiSlider-rail': {
                                        backgroundColor: '#e0e0e0',
                                      },
                                      '& .MuiSlider-mark': {
                                        backgroundColor: '#bfbfbf',
                                      },
                                      '& .MuiSlider-markLabel': {
                                        fontSize: '0.75rem',
                                        color: 'text.secondary',
                                      },
                                    }}
                                  />
                                </Box>
                                <TextField
                                  value={field.weightage}
                                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                                  size="small"
                                  sx={{
                                    width: 80,
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': {
                                        borderColor: '#e0e0e0',
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#4caf50',
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#4caf50',
                                      },
                                    },
                                  }}
                                />
                              </Box>
                            </Grid>
                          </Grid>
                          {index < fields.length - 1 && <Divider sx={{ mt: 3 }} />}
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Total Weightage */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="600" 
                      color={isTotalExceeding100 ? 'error' : 'primary'}
                    >
                      Total {totalWeightage}
                    </Typography>
                  </Box>

                  {/* Error Message for exceeding 100% */}
                  {isTotalExceeding100 && (
                    <Box sx={{ mb: 3 }}>
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        Total weightage should not exceed 100%. Current total: {totalWeightage}%
                      </Alert>
                    </Box>
                  )}

                 
                  

                  {/* Submit Button */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={!isContentScoreEnabled || isTotalExceeding100}
                      sx={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&:hover': {
                          backgroundColor: '#45a049',
                        },
                        '&:disabled': {
                          backgroundColor: '#e0e0e0',
                          color: '#999',
                        },
                      }}
                    >
                      SUBMIT
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </Container>

        {/* Snackbar for notifications */}
        <Snackbar
          open={showSnackbar}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
