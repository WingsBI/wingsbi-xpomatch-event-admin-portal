'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { matchmakingApi } from '@/services/apiService';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import { store } from '@/store';
import { addNotification } from '@/store/slices/appSlice';

interface MatchMakingConfig {
  id: number;
  visitorFieldName: string;
  exhibitorFieldName: string;
  weight: number;
  algorithmId: number;
  algorithmName: string;
  isActive: boolean;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string;
}

interface UpdateConfigPayload {
  id: number;
  visitorFieldName: string;
  exhibitorFieldName: string;
  weight: number;
  algorithmId: number;
}

interface AvailableField {
  value: string;
  label: string;
}

export default function WeightagePage() {
  const params = useParams();
  const identifier = params?.identifier as string;

  const [configs, setConfigs] = useState<MatchMakingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [visitorFields, setVisitorFields] = useState<AvailableField[]>([]);
  const [exhibitorFields, setExhibitorFields] = useState<AvailableField[]>([]);

  // Available algorithms
  const algorithms = [
    { id: 1, name: 'cosine_similarity', label: 'Cosine Similarity' },
    { id: 2, name: 'jaccard_set', label: 'Jaccard Set' },
    { id: 3, name: 'euclidean_distance', label: 'Euclidean Distance' },
    { id: 4, name: 'pearson_correlation', label: 'Pearson Correlation' },
  ];

  // Fetch available visitor fields
  const fetchVisitorFields = async () => {
    try {
      const response = await fieldMappingApi.getAllVisitorMatchingConfig(identifier);
      
      if (response.statusCode === 200 && response.result) {
        const fields = response.result.map((field: any) => ({
          value: field.fieldName,
          label: field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1).replace(/([A-Z])/g, ' $1')
        }));
        setVisitorFields(fields);
      } else {
        console.warn('Failed to fetch visitor fields:', response.message);
        // Fallback to default fields if API fails
        setVisitorFields([
          { value: 'industry', label: 'Industry' },
          { value: 'companytype', label: 'Company Type' },
          { value: 'technology', label: 'Technology' },
          { value: 'interests', label: 'Interests' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching visitor fields:', error);
      // Fallback to default fields if API fails
      setVisitorFields([
        { value: 'industry', label: 'Industry' },
        { value: 'companytype', label: 'Company Type' },
        { value: 'technology', label: 'Technology' },
        { value: 'interests', label: 'Interests' },
      ]);
    }
  };

  // Fetch available exhibitor fields
  const fetchExhibitorFields = async () => {
    try {
      const response = await fieldMappingApi.getAllExhibitorMatchingConfig(identifier);
      
      if (response.statusCode === 200 && response.result) {
        const fields = response.result.map((field: any) => ({
          value: field.fieldName,
          label: field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1).replace(/([A-Z])/g, ' $1')
        }));
        setExhibitorFields(fields);
      } else {
        console.warn('Failed to fetch exhibitor fields:', response.message);
        // Fallback to default fields if API fails
        setExhibitorFields([
          { value: 'industry', label: 'Industry' },
          { value: 'companytype', label: 'Company Type' },
          { value: 'technology', label: 'Technology' },
          { value: 'interests', label: 'Interests' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching exhibitor fields:', error);
      // Fallback to default fields if API fails
      setExhibitorFields([
        { value: 'industry', label: 'Industry' },
        { value: 'companytype', label: 'Company Type' },
        { value: 'technology', label: 'Technology' },
        { value: 'interests', label: 'Interests' },
      ]);
    }
  };

  // Fetch matchmaking configuration
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await matchmakingApi.getAllMatchMakingConfig(identifier);
      
      if (response.statusCode === 200 && response.result) {
        // Convert decimal weights to percentages for UI display
        const configsWithPercentages = response.result.map((config: MatchMakingConfig) => ({
          ...config,
          weight: Math.round((config.weight || 0) * 100)
        }));
        setConfigs(configsWithPercentages);
      } else {
        setError(response.message || 'Failed to fetch configuration');
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      setError('Failed to load matchmaking configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (identifier) {
      // Fetch all data in parallel
      Promise.all([
        fetchVisitorFields(),
        fetchExhibitorFields(),
        fetchConfigs()
      ]).catch(error => {
        console.error('Error fetching initial data:', error);
      });
    }
  }, [identifier]);

  // Handle visitor field change
  const handleVisitorFieldChange = (id: number, value: string) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, visitorFieldName: value } : config
    ));
  };

  // Handle exhibitor field change
  const handleExhibitorFieldChange = (id: number, value: string) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, exhibitorFieldName: value } : config
    ));
  };

  // Handle weightage change
  const handleWeightageChange = (id: number, value: number) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, weight: value } : config
    ));
  };

  // Handle algorithm change
  const handleAlgorithmChange = (id: number, algorithmId: number) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, algorithmId } : config
    ));
  };

  // Calculate total weightage
  const getTotalWeightage = () => {
    return configs.reduce((sum, config) => sum + (config.weight || 0), 0);
  };

  // Validate total weightage
  const validateWeightage = () => {
    const total = getTotalWeightage();
    if (total !== 100) {
      return `Total weightage must be 100%. Current total: ${total}%`;
    }
    return null;
  };

  // Validate duplicate fields
  const validateDuplicateFields = () => {
    const exhibitorFields = configs.map(config => config.exhibitorFieldName);
    const visitorFields = configs.map(config => config.visitorFieldName);
    
    const duplicateExhibitorFields = exhibitorFields.filter((field, index) => 
      exhibitorFields.indexOf(field) !== index
    );
    
    const duplicateVisitorFields = visitorFields.filter((field, index) => 
      visitorFields.indexOf(field) !== index
    );
    
    if (duplicateExhibitorFields.length > 0) {
      return `Duplicate exhibitor fields detected: ${duplicateExhibitorFields.join(', ')}`;
    }
    
    if (duplicateVisitorFields.length > 0) {
      return `Duplicate visitor fields detected: ${duplicateVisitorFields.join(', ')}`;
    }
    
    return null;
  };

  // Check if form has validation errors
  const hasValidationErrors = () => {
    return getTotalWeightage() !== 100 || validateDuplicateFields() !== null;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const weightageValidationError = validateWeightage();
    if (weightageValidationError) {
      setError(weightageValidationError);
      store.dispatch(addNotification({
        type: 'error',
        message: weightageValidationError,
      }));
      return;
    }

    const duplicateValidationError = validateDuplicateFields();
    if (duplicateValidationError) {
      setError(duplicateValidationError);
      store.dispatch(addNotification({
        type: 'error',
        message: duplicateValidationError,
      }));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Send weight as percentage (whole number) to API
      const payload: UpdateConfigPayload[] = configs.map(config => ({
        id: config.id,
        visitorFieldName: config.visitorFieldName,
        exhibitorFieldName: config.exhibitorFieldName,
        weight: config.weight || 0, // Send percentage directly (30, 40, 20, 10)
        algorithmId: config.algorithmId,
      }));

      // Validate payload before sending
      const invalidPayloads = payload.filter(p => 
        !p.id || 
        !p.visitorFieldName || 
        !p.exhibitorFieldName || 
        p.weight === undefined || 
        p.weight === null || 
        !p.algorithmId
      );
      
      if (invalidPayloads.length > 0) {
        console.error('Invalid payloads found:', invalidPayloads);
        setError('Invalid configuration data detected');
        return;
      }

      console.log('Sending payload:', payload);
      const response = await matchmakingApi.updateMatchMakingConfig(identifier, payload);
      console.log('API Response:', response);
      
      // Check for both statusCode and isError properties
      if (response.statusCode === 200 && !response.isError) {
        setSuccess('Matchmaking configuration updated successfully!');
        store.dispatch(addNotification({
          type: 'success',
          message: 'Matchmaking configuration updated successfully!',
        }));
        // Refresh the data
        await fetchConfigs();
      } else {
        console.error('API Error:', response);
        const errorMessage = response.message || response.error || 'Failed to update configuration';
        setError(errorMessage);
        store.dispatch(addNotification({
          type: 'error',
          message: errorMessage,
        }));
      }
    } catch (error) {
      console.error('Error updating configs:', error);
      const errorMessage = 'Failed to update matchmaking configuration';
      setError(errorMessage);
      store.dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
    } finally {
      setSaving(false);
    }
  };

  // Get algorithm name by ID
  const getAlgorithmName = (algorithmId: number) => {
    const algorithm = algorithms.find(alg => alg.id === algorithmId);
    return algorithm ? algorithm.label : 'Unknown Algorithm';
  };

  // Get field label by value
  const getFieldLabel = (value: string, fields: AvailableField[]) => {
    const field = fields.find(field => field.value === value);
    return field ? field.label : value;
  };

  // Check if exhibitor field is duplicate
  const isExhibitorFieldDuplicate = (configId: number, fieldName: string) => {
    const duplicateCount = configs.filter(config => 
      config.exhibitorFieldName === fieldName && config.id !== configId
    ).length;
    return duplicateCount > 0;
  };

  // Check if visitor field is duplicate
  const isVisitorFieldDuplicate = (configId: number, fieldName: string) => {
    const duplicateCount = configs.filter(config => 
      config.visitorFieldName === fieldName && config.id !== configId
    ).length;
    return duplicateCount > 0;
  };

  // Get exhibitor field border color
  const getExhibitorFieldBorderColor = (configId: number, fieldName: string) => {
    return isExhibitorFieldDuplicate(configId, fieldName) ? '#d32f2f' : undefined;
  };

  // Get visitor field border color
  const getVisitorFieldBorderColor = (configId: number, fieldName: string) => {
    return isVisitorFieldDuplicate(configId, fieldName) ? '#d32f2f' : undefined;
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchVisitorFields(),
        fetchExhibitorFields(),
        fetchConfigs()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RoleBasedRoute allowedRoles={['event_admin', 'event-admin']}>
        <ResponsiveDashboardLayout title="Content Matching Configuration">
          <Container maxWidth="lg" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          </Container>
        </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  return (
    <RoleBasedRoute allowedRoles={['event_admin', 'event-admin']}>
      <ResponsiveDashboardLayout title="Content Matching Configuration">
        <Container maxWidth="lg" sx={{ py: 3, overflow: 'hidden' }}>
          <Box sx={{ mb: 4, mt: -3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h1" fontWeight="500" sx={{ mb: 2, lineHeight: 1.1,fontStyle: 'italic' }} >
              Content Matching Configuration
            </Typography>
          
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 1, mt: -3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 1, mt: -3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Paper elevation={2} sx={{ 
            p: { xs: 2, md: 4 }, 
            borderRadius: 2, 
            border: '1px solid #e8eaed',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            overflow: 'hidden'
          }}>

            {/* Mobile View - Stacked Layout */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {configs.map((config, index) => (
                <Card key={config.id} sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="primary.main" fontWeight="600">
                        Field {index + 1}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Exhibitor Field:</Typography>
                      <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                        <Select
                          value={config.exhibitorFieldName}
                          onChange={(e) => handleExhibitorFieldChange(config.id, e.target.value)}
                          error={isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '#d32f2f' : undefined,
                                borderWidth: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '2px' : undefined,
                              },
                              '&:hover fieldset': {
                                borderColor: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '#d32f2f' : undefined,
                                borderWidth: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '2px' : undefined,
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '#d32f2f' : undefined,
                                borderWidth: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '2px' : undefined,
                              },
                            },
                          }}
                        >
                          {exhibitorFields.map((field) => (
                            <MenuItem key={field.value} value={field.value}>
                              {field.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Visitor Field:</Typography>
                      <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                        <Select
                          value={config.visitorFieldName}
                          onChange={(e) => handleVisitorFieldChange(config.id, e.target.value)}
                          error={isVisitorFieldDuplicate(config.id, config.visitorFieldName)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '#d32f2f' : undefined,
                                borderWidth: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '2px' : undefined,
                              },
                              '&:hover fieldset': {
                                borderColor: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '#d32f2f' : undefined,
                                borderWidth: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '2px' : undefined,
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '#d32f2f' : undefined,
                                borderWidth: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '2px' : undefined,
                              },
                            },
                          }}
                        >
                          {visitorFields.map((field) => (
                            <MenuItem key={field.value} value={field.value}>
                              {field.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                                         <Grid item xs={6}>
                       <Typography variant="caption" color="text.secondary">Algorithm:</Typography>
                       <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                         <Select
                           value={config.algorithmId}
                           onChange={(e) => handleAlgorithmChange(config.id, Number(e.target.value))}
                         >
                           {algorithms.map((algorithm) => (
                             <MenuItem key={algorithm.id} value={algorithm.id}>
                               {algorithm.label}
                             </MenuItem>
                           ))}
                         </Select>
                       </FormControl>
                     </Grid>
                     <Grid item xs={6}>
                       <Typography variant="caption" color="text.secondary">Weightage (%):</Typography>
                       <TextField
                         type="number"
                         size="small"
                         fullWidth
                         value={config.weight || ''}
                         onChange={(e) => handleWeightageChange(config.id, Number(e.target.value) || 0)}
                         inputProps={{ min: 0, max: 100, step: 1 }}
                         sx={{ mt: 0.5 }}
                       />
                     </Grid>
                  </Grid>
                </Card>
              ))}
              
              {/* Mobile Total */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <TextField
                  type="number"
                  size="small"
                  value={getTotalWeightage() || ''}
                  InputProps={{ readOnly: true }}
                  sx={{
                    width: 100,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: getTotalWeightage() === 100 ? 'success.light' : 'error.light',
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Total Weightage
                </Typography>
                {getTotalWeightage() === 100 && (
                  <Chip label="✓" size="small" color="success" />
                )}
              </Box>
            </Box>

                         {/* Desktop View - Grid Layout */}
             <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Grid container spacing={3}>
              {/* Exhibitor Column */}
              <Grid item xs={12} md={3}>
                <Typography variant="h6" fontWeight="500" sx={{ mb: 3, color: 'primary.main' }}>
                  Exhibitor Fields
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {configs.map((config) => (
                    <FormControl key={config.id} size="small">
                                                                                                                                                                                       <Select
                           value={config.exhibitorFieldName}
                           onChange={(e) => handleExhibitorFieldChange(config.id, e.target.value)}
                           error={isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName)}
                           sx={{
                             borderRadius: 1,
                             '& .MuiOutlinedInput-root': {
                               '& fieldset': {
                                 borderColor: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '#d32f2f' : undefined,
                                 borderWidth: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '2px' : undefined,
                               },
                               '&:hover fieldset': {
                                 borderColor: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '#d32f2f' : undefined,
                                 borderWidth: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '2px' : undefined,
                               },
                               '&.Mui-focused fieldset': {
                                 borderColor: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '#d32f2f' : undefined,
                                 borderWidth: isExhibitorFieldDuplicate(config.id, config.exhibitorFieldName) ? '2px' : undefined,
                               },
                             },
                           }}
                         >
                        {exhibitorFields.map((field) => (
                          <MenuItem key={field.value} value={field.value}>
                            {field.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </Box>
              </Grid>

              {/* Visitor Column */}
              <Grid item xs={12} md={3}>
                <Typography variant="h6" fontWeight="500" sx={{ mb: 3, color: 'primary.main' }}>
                  Visitor Fields
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {configs.map((config) => (
                    <FormControl key={config.id} size="small">
                                                                                                                                                                                       <Select
                           value={config.visitorFieldName}
                           onChange={(e) => handleVisitorFieldChange(config.id, e.target.value)}
                           error={isVisitorFieldDuplicate(config.id, config.visitorFieldName)}
                           sx={{
                             borderRadius: 1,
                             '& .MuiOutlinedInput-root': {
                               '& fieldset': {
                                 borderColor: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '#d32f2f' : undefined,
                                 borderWidth: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '2px' : undefined,
                               },
                               '&:hover fieldset': {
                                 borderColor: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '#d32f2f' : undefined,
                                 borderWidth: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '2px' : undefined,
                               },
                               '&.Mui-focused fieldset': {
                                 borderColor: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '#d32f2f' : undefined,
                                 borderWidth: isVisitorFieldDuplicate(config.id, config.visitorFieldName) ? '2px' : undefined,
                               },
                             },
                           }}
                         >
                        {visitorFields.map((field) => (
                          <MenuItem key={field.value} value={field.value}>
                            {field.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </Box>
              </Grid>

              {/* Algorithm Column */}
              <Grid item xs={12} md={3}>
                <Typography variant="h6" fontWeight="500" sx={{ mb: 3, color: 'primary.main' }}>
                  Algorithm
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {configs.map((config) => (
                    <FormControl key={config.id} size="small">
                      <Select
                        value={config.algorithmId}
                        onChange={(e) => handleAlgorithmChange(config.id, Number(e.target.value))}
                        sx={{
                          borderRadius: 1,
                        }}
                      >
                        {algorithms.map((algorithm) => (
                          <MenuItem key={algorithm.id} value={algorithm.id}>
                            {algorithm.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </Box>
              </Grid>

                 {/* Weightage Column */}
                 <Grid item xs={12} md={3}>
                   <Typography variant="h6" fontWeight="500" sx={{ mb: 3, color: 'primary.main' }}>
                     Weightage (%)
                   </Typography>
                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, }}>
                     {configs.map((config) => (
                       <TextField
                         key={config.id}
                         type="number"
                         size="small"
                         
                         value={config.weight || ''}
                         onChange={(e) => handleWeightageChange(config.id, Number(e.target.value) || 0)}
                         inputProps={{ 
                           min: 0, 
                           max: 100,
                           step: 1
                         }}
                         sx={{
                           '& .MuiOutlinedInput-root': {
                             borderRadius: 1,
                           },
                           
                         }}
                       />
                     ))}
                   </Box>
                   {/* Total field */}
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                     <TextField
                       type="number"
                       size="small"
                       value={getTotalWeightage() || ''}
                       InputProps={{ readOnly: true }}
                       sx={{
                         '& .MuiOutlinedInput-root': {
                           borderRadius: 1,
                           bgcolor: getTotalWeightage() === 100 ? 'success.light' : 'error.light',
                         }
                       }}
                     />
                     <Typography variant="body2" color="text.secondary">
                       Total
                     </Typography>
                     {getTotalWeightage() === 100 && (
                       <Chip label="✓" size="small" color="success" />
                     )}
                </Box>
              </Grid>
            </Grid>
             </Box>

            <Divider sx={{ my: 4,mt:2,mb:3 }} />

            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2
            }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Weightage: <strong>{getTotalWeightage()}%</strong>
                  {getTotalWeightage() !== 100 && (
                    <Typography component="span" color="error.main" sx={{ ml: 1 }}>
                      (Must equal 100%)
                    </Typography>
                  )}
                </Typography>
                {validateDuplicateFields() && (
                  <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                    {validateDuplicateFields()}
                  </Typography>
                )}
              </Box>
                
                  <Button
                   variant="contained"
                   size="medium"
                   startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                   onClick={handleSubmit}
                   disabled={saving || hasValidationErrors()}
                   sx={{
                     borderRadius: 1.5,
                     px: 3,
                     py: 1,
                     textTransform: 'none',
                     fontSize: '0.875rem',
                     fontWeight: 500,
                     mt: -1,
                  minWidth: { xs: '100%', sm: 'auto' }
                   }}
                 >
                   {saving ? 'Saving...' : 'Save Configuration'}
                 </Button>
            </Box>
          </Paper>
        </Container>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
