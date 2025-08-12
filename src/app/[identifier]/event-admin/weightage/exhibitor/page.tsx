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
import { fieldMappingApi } from '@/services/fieldMappingApi';

interface FieldWeightage {
  id: string;
  name: string;
  weightage: number;
}

interface StandardField {
  id: number;
  fieldName: string;
  isActive: boolean;
  createdBy: number;
  createdDate: string;
  modifiedBy: number | null;
  modifiedDate: string | null;
}

export default function ExhibitorWeightagePage() {
  const params = useParams();
  const identifier = params?.identifier as string;
  
  console.log('ExhibitorWeightagePage loaded with identifier:', identifier);
  
  const [isContentScoreEnabled, setIsContentScoreEnabled] = useState(true);
  const [fields, setFields] = useState<FieldWeightage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const totalWeightage = fields.reduce((sum, field) => sum + field.weightage, 0);

  // Fetch exhibitor matching config fields on component mount
  useEffect(() => {
    const fetchExhibitorMatchingConfig = async () => {
      try {
        setLoading(true);
        const response = await fieldMappingApi.getAllExhibitorMatchingConfig(identifier);
        
        if (response.result && Array.isArray(response.result)) {
          const matchingConfigFields: FieldWeightage[] = response.result.map((field: StandardField) => ({
            id: field.fieldName,
            name: field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1).replace(/([A-Z])/g, ' $1'),
            weightage: 0
          }));
          
          // Set default weightage for first few fields to make total 100
          const fieldsWithWeightage = matchingConfigFields.map((field, index) => {
            if (index < 4) {
              return { ...field, weightage: 25 };
            }
            return field;
          });
          
          setFields(fieldsWithWeightage);
        }
      } catch (error) {
        console.error('Error fetching exhibitor matching config:', error);
        setSnackbarMessage('Failed to load exhibitor matching config. Please try again.');
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    if (identifier) {
      fetchExhibitorMatchingConfig();
    }
  }, [identifier]);

  const handleWeightageChange = (fieldId: string, newValue: number) => {
    setFields(prevFields => {
      // Calculate current total excluding the field being changed
      const currentTotal = prevFields.reduce((sum, field) => 
        field.id === fieldId ? sum : sum + field.weightage, 0
      );
      
      // Calculate the maximum allowed value for this field
      const maxAllowed = 100 - currentTotal;
      
      // Ensure the new value doesn't exceed the maximum allowed
      const validatedValue = Math.min(newValue, maxAllowed);
      
      return prevFields.map(field => 
        field.id === fieldId ? { ...field, weightage: validatedValue } : field
      );
    });
  };

  const handleInputChange = (fieldId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      handleWeightageChange(fieldId, numValue);
    }
  };

  const handleSubmit = async () => {
    try {
      // Prepare the payload for the API
      const configData = fields.map(field => ({
        fieldName: field.id,
        weight: field.weightage
      }));

      console.log('Saving exhibitor weightage configuration:', {
        isEnabled: isContentScoreEnabled,
        fields: fields,
        totalWeightage: totalWeightage,
        configData: configData
      });

      // Call the update exhibitor matching config API
      const response = await fieldMappingApi.updateExhibitorMatchingConfig(identifier, configData);
      
      if (response.isError) {
        throw new Error(response.message || 'Failed to update exhibitor matching config');
      }
      
      setSnackbarMessage('Exhibitor matching configuration saved successfully!');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      console.error('Error saving exhibitor matching config:', error);
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
              Exhibitor Weightage
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
        <Container maxWidth="lg" sx={{ py: 3 }}>
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
                    Exhibitor Weightage ({isContentScoreEnabled ? 'Enabled' : 'Disabled'})
                  </Typography>
                  <Switch
                    checked={isContentScoreEnabled}
                    onChange={(e) => setIsContentScoreEnabled(e.target.checked)}
                    color="primary"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4caf50',
                      },
                    }}
                  />
                  <Tooltip title="Learn more about Content Score">
                    <Link href="#" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', textDecoration: 'none' }}>
                      <Help fontSize="small" />
                      Help
                    </Link>
                  </Tooltip>
                </Box>
              </Box>

              {/* Fields and Weightage Section */}
              <Card sx={{ 
                borderRadius: 3, 
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
                      <Tooltip title="Configure which fields to include in content scoring">
                        <Info fontSize="small" sx={{ color: 'text.secondary' }} />
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight="600">
                        Weightage (%)
                      </Typography>
                      <Tooltip title="Set the percentage weight for each field">
                        <Info fontSize="small" sx={{ color: 'text.secondary' }} />
                      </Tooltip>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  {/* Fields List */}
                  <Box sx={{ mb: 3 }}>
                    {fields.map((field, index) => {
                      // Calculate current total excluding this field
                      const currentTotal = fields.reduce((sum, f) => 
                        f.id === field.id ? sum : sum + f.weightage, 0
                      );
                      const maxAllowed = 100 - currentTotal;
                      
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
                                     max={Math.min(100, maxAllowed + field.weightage)}
                                     step={1}
                                     marks={[
                                       { value: 0, label: '0' },
                                       { value: Math.round(Math.min(100, maxAllowed + field.weightage) / 4), label: Math.round(Math.min(100, maxAllowed + field.weightage) / 4) },
                                       { value: Math.round(Math.min(100, maxAllowed + field.weightage) / 2), label: Math.round(Math.min(100, maxAllowed + field.weightage) / 2) },
                                       { value: Math.round(Math.min(100, maxAllowed + field.weightage) * 3 / 4), label: Math.round(Math.min(100, maxAllowed + field.weightage) * 3 / 4) },
                                       { value: Math.min(100, maxAllowed + field.weightage), label: Math.min(100, maxAllowed + field.weightage) }
                                     ].filter(mark => mark.value <= Math.min(100, maxAllowed + field.weightage))}
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
                    <Typography variant="h6" fontWeight="600" color="primary">
                      Total {totalWeightage}
                    </Typography>
                  </Box>

                  {/* Add/Remove Fields Link */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                    <Link
                      href="#"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      <Info fontSize="small" />
                      ADD OR REMOVE FIELDS
                    </Link>
                  </Box>

                  {/* Submit Button */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={!isContentScoreEnabled || totalWeightage !== 100}
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
