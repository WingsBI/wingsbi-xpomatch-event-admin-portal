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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Save, Refresh, Add, Delete } from '@mui/icons-material';
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

interface NewFieldConfig {
  id: string; // Temporary ID for new fields
  visitorFieldName: string;
  exhibitorFieldName: string;
  weight: number;
  algorithmId: number;
  isNew: boolean;
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

interface Algorithm {
  id: number;
  algorithm: string;
  createdBy: number;
  createdDate: string;
  modifiedBy: number | null;
  modifiedDate: string;
  isActive: boolean;
}

export default function WeightagePage() {
  const params = useParams();
  const identifier = params?.identifier as string;

  const [configs, setConfigs] = useState<MatchMakingConfig[]>([]);
  const [newFields, setNewFields] = useState<NewFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [visitorFields, setVisitorFields] = useState<AvailableField[]>([]);
  const [exhibitorFields, setExhibitorFields] = useState<AvailableField[]>([]);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [newVisitorFieldName, setNewVisitorFieldName] = useState('');
  const [newExhibitorFieldName, setNewExhibitorFieldName] = useState('');
  const [addingFieldNames, setAddingFieldNames] = useState(false);

  // Extract field names from matchmaking config
  const extractFieldNamesFromConfig = (configs: MatchMakingConfig[]) => {
    const visitorFieldNames = new Set<string>();
    const exhibitorFieldNames = new Set<string>();

    configs.forEach(config => {
      if (config.visitorFieldName) {
        visitorFieldNames.add(config.visitorFieldName);
      }
      if (config.exhibitorFieldName) {
        exhibitorFieldNames.add(config.exhibitorFieldName);
      }
    });

    const visitorFields = Array.from(visitorFieldNames).map(fieldName => ({
      value: fieldName,
      label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')
    }));

    const exhibitorFields = Array.from(exhibitorFieldNames).map(fieldName => ({
      value: fieldName,
      label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')
    }));

    return { visitorFields, exhibitorFields };
  };

  // Fetch available visitor fields (now extracted from matchmaking config)
  const fetchVisitorFields = async () => {
    // This function is now handled by extractFieldNamesFromConfig
    // It will be called after fetchConfigs
  };

  // Fetch available exhibitor fields (now extracted from matchmaking config)
  const fetchExhibitorFields = async () => {
    // This function is now handled by extractFieldNamesFromConfig
    // It will be called after fetchConfigs
  };

  // Fetch available algorithms
  const fetchAlgorithms = async () => {
    try {
      const response = await matchmakingApi.getAllAlgorithms(identifier);
      
      if (response.statusCode === 200 && response.result) {
        setAlgorithms(response.result);
      } else {
        console.warn('Failed to fetch algorithms:', response.message);
        // Fallback to default algorithms if API fails
        setAlgorithms([
          { id: 1, algorithm: 'cosine_similarity', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
          { id: 2, algorithm: 'jaccard_set', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
          { id: 3, algorithm: 'jaccard_tokens', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
          { id: 4, algorithm: 'exact_match', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
          { id: 5, algorithm: 'taxonomy_distance', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
          { id: 6, algorithm: 'seniority_diff', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
          { id: 7, algorithm: 'geo_proximity', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
        ]);
      }
    } catch (error) {
      console.error('Error fetching algorithms:', error);
      // Fallback to default algorithms if API fails
      setAlgorithms([
        { id: 1, algorithm: 'cosine_similarity', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
        { id: 2, algorithm: 'jaccard_set', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
        { id: 3, algorithm: 'jaccard_tokens', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
        { id: 4, algorithm: 'exact_match', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
        { id: 5, algorithm: 'taxonomy_distance', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
        { id: 6, algorithm: 'seniority_diff', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
        { id: 7, algorithm: 'geo_proximity', createdBy: 1, createdDate: '', modifiedBy: null, modifiedDate: '', isActive: true },
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
        
        // Extract field names from the config and update dropdowns
        const { visitorFields: extractedVisitorFields, exhibitorFields: extractedExhibitorFields } = extractFieldNamesFromConfig(configsWithPercentages);
        setVisitorFields(extractedVisitorFields);
        setExhibitorFields(extractedExhibitorFields);
        
        console.log('Extracted visitor fields:', extractedVisitorFields);
        console.log('Extracted exhibitor fields:', extractedExhibitorFields);
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
      // Fetch algorithms and configs (field names are extracted from configs)
      Promise.all([
        fetchAlgorithms(),
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

      // Update existing fields
      const existingPayload: UpdateConfigPayload[] = configs.map(config => ({
        id: config.id,
        visitorFieldName: config.visitorFieldName,
        exhibitorFieldName: config.exhibitorFieldName,
        weight: config.weight || 0, // Send percentage directly (30, 40, 20, 10)
        algorithmId: config.algorithmId,
      }));

      console.log('Updating existing fields with payload:', existingPayload);
      const updateResponse = await matchmakingApi.updateMatchMakingConfig(identifier, existingPayload);
      console.log('Update API Response:', updateResponse);
      
      // Check for both statusCode and isError properties
      if (updateResponse.statusCode === 200 && !updateResponse.isError) {
        setSuccess('Matchmaking configuration updated successfully!');
        store.dispatch(addNotification({
          type: 'success',
          message: 'Matchmaking configuration updated successfully!',
        }));
        // Clear new fields and refresh the data
        setNewFields([]);
        await fetchConfigs();
      } else {
        console.error('Update API Error:', updateResponse);
        const errorMessage = updateResponse.message || updateResponse.error || 'Failed to update configuration';
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

  // Format algorithm name for display
  const formatAlgorithmName = (algorithmName: string) => {
    return algorithmName.charAt(0).toUpperCase() + algorithmName.slice(1).replace(/([A-Z])/g, ' $1');
  };

  // Get algorithm name by ID
  const getAlgorithmName = (algorithmId: number) => {
    const algorithm = algorithms.find(alg => alg.id === algorithmId);
    return algorithm ? formatAlgorithmName(algorithm.algorithm) : 'Unknown Algorithm';
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
        fetchAlgorithms(),
        fetchConfigs()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new field
  const handleAddNewField = () => {
    setShowAddFieldDialog(true);
    setError(null); // Clear any existing errors
  };

  // Handle adding custom field names
  const handleAddCustomFields = async () => {
    if (!newVisitorFieldName.trim() || !newExhibitorFieldName.trim()) {
      setError('Please enter both visitor and exhibitor field names');
      return;
    }

    // Check if field names already exist
    const visitorFieldExists = visitorFields.some(field => field.value === newVisitorFieldName.toLowerCase());
    const exhibitorFieldExists = exhibitorFields.some(field => field.value === newExhibitorFieldName.toLowerCase());

    if (visitorFieldExists) {
      setError(`Visitor field "${newVisitorFieldName}" already exists`);
      return;
    }

    if (exhibitorFieldExists) {
      setError(`Exhibitor field "${newExhibitorFieldName}" already exists`);
      return;
    }

    try {
      setAddingFieldNames(true);
      
      // Call insertMatchMakingConfig API immediately
      const insertPayload = [{
        visitorFieldName: newVisitorFieldName.toLowerCase(),
        exhibitorFieldName: newExhibitorFieldName.toLowerCase(),
        algorithmId: algorithms.length > 0 ? algorithms[0].id : 1,
      }];

      console.log('Calling insertMatchMakingConfig with payload:', insertPayload);
      const response = await matchmakingApi.insertMatchMakingConfig(identifier, insertPayload);
      console.log('Insert API Response:', response);

      if (response.statusCode === 200 && !response.isError) {
        // Add new fields to the available options
        const newVisitorField: AvailableField = {
          value: newVisitorFieldName.toLowerCase(),
          label: newVisitorFieldName.charAt(0).toUpperCase() + newVisitorFieldName.slice(1).replace(/([A-Z])/g, ' $1')
        };

        const newExhibitorField: AvailableField = {
          value: newExhibitorFieldName.toLowerCase(),
          label: newExhibitorFieldName.charAt(0).toUpperCase() + newExhibitorFieldName.slice(1).replace(/([A-Z])/g, ' $1')
        };

        // Refresh the configs to get updated field lists
        await fetchConfigs();

        // Reset dialog state
        setNewVisitorFieldName('');
        setNewExhibitorFieldName('');
        setShowAddFieldDialog(false);
        setError(null);
        
        // Show success message
        setSuccess('Field names added successfully! You can now use these fields in the dropdown lists above.');
        store.dispatch(addNotification({
          type: 'success',
          message: 'Field names added successfully! You can now use these fields in the dropdown lists above.',
        }));
      } else {
        console.error('Insert API Error:', response);
        const errorMessage = response.message || response.error || 'Failed to add field names';
        setError(errorMessage);
        store.dispatch(addNotification({
          type: 'error',
          message: errorMessage,
        }));
      }
          } catch (error) {
        console.error('Error adding field names:', error);
        const errorMessage = 'Failed to add field names';
        setError(errorMessage);
        store.dispatch(addNotification({
          type: 'error',
          message: errorMessage,
        }));
      } finally {
        setAddingFieldNames(false);
      }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setShowAddFieldDialog(false);
    setNewVisitorFieldName('');
    setNewExhibitorFieldName('');
    setError(null);
  };

  

  

  // Handle new field visitor field change
  const handleNewFieldVisitorChange = (id: string, value: string) => {
    setNewFields(prev => prev.map(field => 
      field.id === id ? { ...field, visitorFieldName: value } : field
    ));
  };

  // Handle new field exhibitor field change
  const handleNewFieldExhibitorChange = (id: string, value: string) => {
    setNewFields(prev => prev.map(field => 
      field.id === id ? { ...field, exhibitorFieldName: value } : field
    ));
  };

  // Handle new field weightage change
  const handleNewFieldWeightageChange = (id: string, value: number) => {
    setNewFields(prev => prev.map(field => 
      field.id === id ? { ...field, weight: value } : field
    ));
  };

  // Handle new field algorithm change
  const handleNewFieldAlgorithmChange = (id: string, algorithmId: number) => {
    setNewFields(prev => prev.map(field => 
      field.id === id ? { ...field, algorithmId } : field
    ));
  };

  // Remove new field
  const handleRemoveNewField = (id: string) => {
    setNewFields(prev => prev.filter(field => field.id !== id));
  };

  // Handle add button click
  const handleAddFields = async () => {
    console.log('handleAddFields called with newFields:', newFields);
    
    // Validate new fields
    const invalidFields = newFields.filter(field => 
      !field.visitorFieldName || !field.exhibitorFieldName || field.weight === 0
    );
    
    if (invalidFields.length > 0) {
      console.log('Invalid fields found:', invalidFields);
      setError('Please fill in all fields for new configurations');
      store.dispatch(addNotification({
        type: 'error',
        message: 'Please fill in all fields for new configurations',
      }));
      return;
    }

    // Check for duplicates
    const allVisitorFields = [...configs.map(c => c.visitorFieldName), ...newFields.map(f => f.visitorFieldName)];
    const allExhibitorFields = [...configs.map(c => c.exhibitorFieldName), ...newFields.map(f => f.exhibitorFieldName)];
    
    const duplicateVisitorFields = allVisitorFields.filter((field, index) => 
      allVisitorFields.indexOf(field) !== index
    );
    
    const duplicateExhibitorFields = allExhibitorFields.filter((field, index) => 
      allExhibitorFields.indexOf(field) !== index
    );
    
    if (duplicateVisitorFields.length > 0) {
      setError(`Duplicate visitor fields detected: ${duplicateVisitorFields.join(', ')}`);
      store.dispatch(addNotification({
        type: 'error',
        message: `Duplicate visitor fields detected: ${duplicateVisitorFields.join(', ')}`,
      }));
      return;
    }
    
    if (duplicateExhibitorFields.length > 0) {
      setError(`Duplicate exhibitor fields detected: ${duplicateExhibitorFields.join(', ')}`);
      store.dispatch(addNotification({
        type: 'error',
        message: `Duplicate exhibitor fields detected: ${duplicateExhibitorFields.join(', ')}`,
      }));
      return;
    }

    try {
      setAdding(true);
      setError(null);

      const payload = newFields.map(field => ({
        visitorFieldName: field.visitorFieldName,
        exhibitorFieldName: field.exhibitorFieldName,
        algorithmId: field.algorithmId,
      }));

      console.log('Adding new fields with payload:', payload);
      const response = await matchmakingApi.insertMatchMakingConfig(identifier, payload);
      console.log('Add API Response:', response);
      
      if (response.statusCode === 200 && !response.isError) {
        setSuccess('New fields added successfully!');
        store.dispatch(addNotification({
          type: 'success',
          message: 'New fields added successfully!',
        }));
        // Clear new fields and refresh data
        setNewFields([]);
        await fetchConfigs();
      } else {
        console.error('API Error:', response);
        const errorMessage = response.message || response.error || 'Failed to add new fields';
        setError(errorMessage);
        store.dispatch(addNotification({
          type: 'error',
          message: errorMessage,
        }));
      }
    } catch (error) {
      console.error('Error adding new fields:', error);
      const errorMessage = 'Failed to add new fields';
      setError(errorMessage);
      store.dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
    } finally {
      setAdding(false);
    }
  };

  // Calculate total weightage
  const getTotalWeightage = () => {
    return configs.reduce((sum, config) => sum + (config.weight || 0), 0);
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
                            <MenuItem 
                              key={field.value} 
                              value={field.value}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                '&:hover .delete-icon': {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              <span>{field.label}</span>
                              <IconButton
                                className="delete-icon"
                                size="small"
                              
                                sx={{
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                  color: 'error.main',
                                  '&:hover': {
                                    backgroundColor: 'error.light',
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
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
                            <MenuItem 
                              key={field.value} 
                              value={field.value}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                '&:hover .delete-icon': {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              <span>{field.label}</span>
                              <IconButton
                                className="delete-icon"
                                size="small"
                               
                                sx={{
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                  color: 'error.main',
                                  '&:hover': {
                                    backgroundColor: 'error.light',
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
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
                            <MenuItem 
                              key={algorithm.id} 
                              value={algorithm.id}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                '&:hover .delete-icon': {
                                  opacity: 0.5,
                                },
                              }}
                            >
                              <span>{formatAlgorithmName(algorithm.algorithm)}</span>
                              <IconButton
                                className="delete-icon"
                                size="small"
                               
                                sx={{
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                  color: 'error.main',
                                  '&:hover': {
                                    backgroundColor: 'error.light',
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
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
                        sx={{ 
                          mt: 0.5,
                          '& .MuiOutlinedInput-root': {
                            height: '40px', // Match dropdown height
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Card>
              ))}
              

              
              {/* Add Button for Mobile */}
              <Card sx={{ mb: 2, p: 2, border: '2px dashed #ccc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 60 }}>
                  <IconButton
                    onClick={handleAddNewField}
                    sx={{
                      '&:hover': {
                        bgcolor: 'primary.light',
                      },
                    }}
                  >
                    <Add />
                  </IconButton>
                </Box>
              </Card>
              
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
                          <MenuItem 
                            key={field.value} 
                            value={field.value}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              '&:hover .delete-icon': {
                                opacity: 0.5,
                              },
                            }}
                          >
                            <span>{field.label}</span>
                            <IconButton
                              className="delete-icon"
                              size="small"
                             
                              sx={{
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                color: 'error.main',
                                '&:hover': {
                                  backgroundColor: 'error.light',
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                  

                  
                  {/* Add Button */}
                  <IconButton
                    onClick={handleAddNewField}
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 1,
                      width: '100%',
                      height: 40,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light',
                      },
                    }}
                  >
                    <Add />
                  </IconButton>
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
                          <MenuItem 
                            key={field.value} 
                            value={field.value}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              '&:hover .delete-icon': {
                                opacity: 0.5,
                              },
                            }}
                          >
                            <span>{field.label}</span>
                            <IconButton
                              className="delete-icon"
                              size="small"
                          
                              sx={{
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                color: 'error.main',
                                '&:hover': {
                                  backgroundColor: 'error.light',
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
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
                          <MenuItem 
                            key={algorithm.id} 
                            value={algorithm.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              '&:hover .delete-icon': {
                                opacity: 0.5,
                              },
                            }}
                          >
                            <span>{formatAlgorithmName(algorithm.algorithm)}</span>
                            <IconButton
                              className="delete-icon"
                              size="small"
                             
                              sx={{
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                color: 'error.main',
                                '&:hover': {
                                  backgroundColor: 'error.light',
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
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
                             height: '45px', // Match dropdown height
                             mb:0.3
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

        {/* Add Field Dialog */}
        <Dialog 
          open={showAddFieldDialog} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Add New Field Names
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Visitor Field Name"
                    value={newVisitorFieldName}
                    onChange={(e) => {
                      setNewVisitorFieldName(e.target.value);
                      setError(null); // Clear error when user types
                    }}
                    placeholder="e.g., City Name"
                    size="small"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Exhibitor Field Name"
                    value={newExhibitorFieldName}
                    onChange={(e) => {
                      setNewExhibitorFieldName(e.target.value);
                      setError(null); // Clear error when user types
                    }}
                    placeholder="e.g., City"
                    size="small"
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Enter the field names you want to add. These will be available in the dropdown menus for future configurations.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit" disabled={addingFieldNames}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCustomFields} 
              variant="contained" 
              color="primary"
              disabled={addingFieldNames || !newVisitorFieldName.trim() || !newExhibitorFieldName.trim()}
              startIcon={addingFieldNames ? <CircularProgress size={16} /> : undefined}
            >
              {addingFieldNames ? 'Adding...' : 'Add Fields'}
            </Button>
          </DialogActions>
        </Dialog>
      </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
}
