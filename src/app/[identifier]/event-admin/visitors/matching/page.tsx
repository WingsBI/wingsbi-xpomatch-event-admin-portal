'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Pagination,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  TextField,
} from '@mui/material';
import { ArrowBack, Save, Refresh, Upload, CheckCircle, Person, Settings, Palette, Add, Close, RestoreFromTrash } from '@mui/icons-material';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import { getAuthToken } from '@/utils/cookieManager';
import type { UserRegistrationResponse } from '@/services/fieldMappingApi';
import ExcelUploadDialog from '@/components/common/ExcelUploadDialog';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
import RoleBasedRoute from '@/components/common/RoleBasedRoute';
import { SimpleThemeSelector } from '@/components/theme/SimpleThemeSelector';

interface FieldMapping {
  standardFieldIndex: number;
  standardField: string;
  excelColumn: string;
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

const FullPageLoader = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      zIndex: 2000, // ensure above Dialog (MUI uses 1300 for Dialogs)
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

export default function VisitorsMatchingPage() {
  const router = useRouter();
  const params = useParams();
  const identifier = params?.identifier as string;
  
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [standardFields, setStandardFields] = useState<StandardField[]>([]);
  const [selectedMappings, setSelectedMappings] = useState<{ [key: string]: string }>({});
  const [customFieldValues, setCustomFieldValues] = useState<{ [key: string]: string }>({});
  const [customFieldValidationMessages, setCustomFieldValidationMessages] = useState<{ [key: string]: string }>({});
  const [isCustomFieldFlags, setIsCustomFieldFlags] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<UserRegistrationResponse | null>(null);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileStorageId, setFileStorageId] = useState<number | null>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const settingsOpen = Boolean(settingsAnchorEl);
  const [removedFields, setRemovedFields] = useState<Set<string>>(new Set());
  // Add duplicateFields state
  const [duplicateFields, setDuplicateFields] = useState<Set<string>>(new Set());
  // Add state for showing already registered visitors
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  
  // Display all mappings evenly distributed

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get data from session storage first - using visitors-specific keys
      console.log('Loading visitors data from session storage:', {
        identifier,
        mappingData: sessionStorage.getItem(`visitors_mapping_${identifier}`),
        standardFieldsData: sessionStorage.getItem(`visitors_standard_fields_${identifier}`),
        storedFileStorageId: sessionStorage.getItem(`visitors_file_storage_id_${identifier}`)
      });
      
      const mappingData = sessionStorage.getItem(`visitors_mapping_${identifier}`);
      const standardFieldsData = sessionStorage.getItem(`visitors_standard_fields_${identifier}`);
      const storedFileStorageId = sessionStorage.getItem(`visitors_file_storage_id_${identifier}`);

      if (mappingData && standardFieldsData) {
        const mappings = JSON.parse(mappingData);
        const fields = JSON.parse(standardFieldsData);
        
        // Set fileStorageId if available
        if (storedFileStorageId) {
          setFileStorageId(parseInt(storedFileStorageId, 10));
        }
        
        // Check if we actually have data from the APIs
        if (!fields || fields.length === 0) {
          setError('No standard fields available. Please ensure your backend API is configured to return field data.');
          return;
        }
        
        // Ensure mappings is an array (handle both old and new API response formats)
        const mappingsArray = Array.isArray(mappings) ? mappings : (mappings?.mappings || []);
        if (!mappingsArray || mappingsArray.length === 0) {
          setError('No field mapping suggestions available. Please ensure your backend API is configured to process Excel files and return mapping suggestions.');
          return;
        }
        
        setFieldMappings(mappingsArray);
        setStandardFields(fields);
        
        // Set default selections based on standardField from POST API
        const defaultMappings: { [key: string]: string } = {};
        mappingsArray.forEach((mapping: FieldMapping) => {
          defaultMappings[mapping.excelColumn] = mapping.standardField;
        });
        setSelectedMappings(defaultMappings);
      } else {
        // If no session data, show message to upload file first
        setError('No mapping data found. Please upload an Excel file first.');
      }
    } catch (err) {
      console.error('Error loading mapping data:', err);
      setError('Failed to load mapping data. Please try uploading the Excel file again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Uploading visitors file:', file.name);
      
      // Check if user is authenticated
      const token = getAuthToken();
      console.log('JWT Token check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20) + '...'
      });
      
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
      setLoading(true);
      setError(null);
      
      // Call both APIs simultaneously
      const [suggestResponse, standardFieldsResponse] = await Promise.all([
        fieldMappingApi.suggestMapping(identifier, file),
        fieldMappingApi.getAllStandardFields(identifier)
      ]);
      
      console.log('Suggest mapping response:', suggestResponse);
      console.log('Standard fields response:', standardFieldsResponse);
      
      // Handle authentication errors specifically
      if (suggestResponse.statusCode === 401 || standardFieldsResponse.statusCode === 401) {
        console.error('401 Authentication Error Details:', {
          suggestResponse: suggestResponse.statusCode === 401 ? suggestResponse : 'OK',
          standardFieldsResponse: standardFieldsResponse.statusCode === 401 ? standardFieldsResponse : 'OK',
          currentToken: token?.substring(0, 20) + '...'
        });
        
        // No localStorage usage; just surface the error
        throw new Error('Authentication failed. Your session has expired. Please log in again.');
      }
      
      // Check if both APIs returned successful responses
      if (suggestResponse.statusCode === 200 && standardFieldsResponse.statusCode === 200) {
        // Check if we have data from both APIs
        if (!standardFieldsResponse.result || standardFieldsResponse.result.length === 0) {
          throw new Error('No standard fields available from backend. Please configure your backend API to return field data.');
        }
        
        // Extract mappings from the nested structure
        const mappingsData = (suggestResponse.result as any)?.mappings || suggestResponse.result;
        if (!mappingsData || mappingsData.length === 0) {
          throw new Error('No field mapping suggestions received from backend. Please ensure your Excel file has proper headers.');
        }

        // Extract fileStorageId from the suggest response
        const responseFileStorageId = (suggestResponse.result as any)?.fileStorageId; // Default fallback as shown in sample
        
        // Update state directly instead of using session storage
        setFieldMappings(mappingsData);
        setStandardFields(standardFieldsResponse.result);
        setFileStorageId(responseFileStorageId);
        
        // Set default selections based on standardField from POST API
        const defaultMappings: { [key: string]: string } = {};
        mappingsData.forEach((mapping: FieldMapping) => {
          defaultMappings[mapping.excelColumn] = mapping.standardField;
        });
        setSelectedMappings(defaultMappings);
        
        // Also store in session storage for future use - using visitors-specific keys
        sessionStorage.setItem(`visitors_mapping_${identifier}`, JSON.stringify(mappingsData));
        sessionStorage.setItem(`visitors_standard_fields_${identifier}`, JSON.stringify(standardFieldsResponse.result));
        if (responseFileStorageId) {
          sessionStorage.setItem(`visitors_file_storage_id_${identifier}`, responseFileStorageId.toString());
        }
        
      } else {
        // Handle API errors
        const errorMessage = suggestResponse.statusCode !== 200 
          ? (suggestResponse.message || 'Failed to process Excel file')
          : (standardFieldsResponse.message || 'Failed to load standard fields');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error uploading visitors file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (excelColumn: string, selectedField: string) => {
    setSelectedMappings(prev => ({
      ...prev,
      [excelColumn]: selectedField
    }));
    
    // Set isCustomField flag based on selection
    setIsCustomFieldFlags(prev => ({
      ...prev,
      [excelColumn]: selectedField === 'CUSTOM_FIELD'
    }));
    
    // Clear custom field value and validation message if not selecting custom field
    if (selectedField !== 'CUSTOM_FIELD') {
      setCustomFieldValues(prev => {
        const newValues = { ...prev };
        delete newValues[excelColumn];
        return newValues;
      });
      
      setCustomFieldValidationMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[excelColumn];
        return newMessages;
      });
    }
  };

  const handleCustomFieldChange = (excelColumn: string, customFieldName: string) => {
    let validationMessage = '';
    let transformedValue = customFieldName;
    
    // Check for invalid characters
    const hasSpaces = customFieldName.includes(' ');
    const hasUpperCase = customFieldName !== customFieldName.toLowerCase();
    
    if (hasSpaces || hasUpperCase) {
      const issues = [];
      if (hasSpaces) issues.push('spaces');
      if (hasUpperCase) issues.push('uppercase letters');
      
      validationMessage = `Field names cannot contain ${issues.join(' or ')}. Use lowercase letters only.`;
      
      // Transform the value: remove spaces and convert to lowercase
      transformedValue = customFieldName.replace(/\s+/g, '').toLowerCase();
    }
    
    // Update the field value with transformed text
    setCustomFieldValues(prev => ({
      ...prev,
      [excelColumn]: transformedValue
    }));
    
    // Update validation message
    setCustomFieldValidationMessages(prev => ({
      ...prev,
      [excelColumn]: validationMessage
    }));
    
    // Clear validation message after 3 seconds if there was an issue
    if (validationMessage) {
      setTimeout(() => {
        setCustomFieldValidationMessages(prev => {
          const newMessages = { ...prev };
          if (newMessages[excelColumn] === validationMessage) {
            delete newMessages[excelColumn];
          }
          return newMessages;
        });
      }, 3000);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate that we have fileStorageId
      if (!fileStorageId) {
        throw new Error('File storage ID not found. Please upload an Excel file first.');
      }

      // Validate custom fields have names
      const invalidCustomFields = Object.entries(selectedMappings)
        .filter(([excelColumn, standardField]) => 
          standardField === 'CUSTOM_FIELD' && 
          (!customFieldValues[excelColumn] || customFieldValues[excelColumn].trim() === '')
        );

      if (invalidCustomFields.length > 0) {
        throw new Error('Please provide names for all custom fields before saving.');
      }

      // Create the registration payload with proper structure
      const mappings = Object.entries(selectedMappings)
        .filter(([excelColumn, standardField]) => standardField && !removedFields.has(excelColumn)) // Only include mapped fields that are not removed
        .map(([excelColumn, standardField], index) => {
          // For custom fields, use the custom field name instead of 'CUSTOM_FIELD'
          const finalFieldName = standardField === 'CUSTOM_FIELD' 
            ? customFieldValues[excelColumn].trim()
            : standardField;
          
          const isCustom = isCustomFieldFlags[excelColumn] || false;
          
          return {
            standardFieldIndex: isCustom ? null : index + 1,
            standardField: finalFieldName,
            excelColumn,
            isCustomField: isCustom
          };
        });

      if (mappings.length === 0) {
        throw new Error('No field mappings selected. Please map at least one field.');
      }

      const payload = {
        fileStorageId,
        mappings
      };

      console.log('Registering visitors with payload:', payload);

      // Call the registration API
      const response = await fieldMappingApi.registerUsers(identifier, payload);
      
      console.log('Registration response:', response);

      // Set the result and show dialog
      setRegistrationResult(response);
      setRegistrationDialogOpen(true);

    } catch (error) {
      console.error('Error registering users:', error);
      setError(error instanceof Error ? error.message : 'Failed to register users');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveField = (excelColumn: string) => {
    setRemovedFields(prev => new Set(prev).add(excelColumn));
  };

  const handleRestoreField = (excelColumn: string) => {
    setRemovedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(excelColumn);
      return newSet;
    });
  };

  const handleReset = () => {
    // Clear all mapping data and return to upload state
    setFieldMappings([]);
    setStandardFields([]);
    setSelectedMappings({});
    setCustomFieldValues({});
    setCustomFieldValidationMessages({});
    setIsCustomFieldFlags({});
    setFileStorageId(null);
    setCurrentPage(1);
    setError('No mapping data found. Please upload an Excel file first.');
    setRegistrationResult(null);
    setRemovedFields(new Set());
    setShowAlreadyRegistered(false);
    
    // Clear session storage - using visitors-specific keys
    sessionStorage.removeItem(`visitors_mapping_${identifier}`);
    sessionStorage.removeItem(`visitors_standard_fields_${identifier}`);
    sessionStorage.removeItem(`visitors_file_storage_id_${identifier}`);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  // Pagination settings
  const itemsPerPage = 9; // Show 9 mappings per page for better visibility and no scroll
  const totalPages = Math.ceil(fieldMappings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMappings = fieldMappings.slice(startIndex, endIndex);
  
  // Distribute current page mappings evenly across 3 columns for better space utilization
  const itemsPerColumn = Math.ceil(currentMappings.length / 3);
  const column1 = currentMappings.slice(0, itemsPerColumn);
  const column2 = currentMappings.slice(itemsPerColumn, itemsPerColumn * 2);
  const column3 = currentMappings.slice(itemsPerColumn * 2);

  // Helper to check for duplicate standard field mappings (excluding CUSTOM_FIELD and removed fields)
  const findDuplicateStandardFields = () => {
    const fieldToExcelColumns: { [standardField: string]: string[] } = {};
    Object.entries(selectedMappings).forEach(([excelColumn, standardField]) => {
      if (
        standardField &&
        standardField !== 'CUSTOM_FIELD' &&
        !removedFields.has(excelColumn)
      ) {
        if (!fieldToExcelColumns[standardField]) fieldToExcelColumns[standardField] = [];
        fieldToExcelColumns[standardField].push(excelColumn);
      }
    });
    // Find all excelColumns that are mapped to a duplicate standard field
    const duplicates = new Set<string>();
    Object.values(fieldToExcelColumns).forEach((excelColumns) => {
      if (excelColumns.length > 1) {
        excelColumns.forEach((col) => duplicates.add(col));
      }
    });
    return duplicates;
  };

  // Add useEffect to update duplicateFields when mappings or removedFields change
  useEffect(() => {
    setDuplicateFields(findDuplicateStandardFields());
  }, [selectedMappings, removedFields]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    );
  }

  if (error && fieldMappings.length === 0) {
    return (
      <RoleBasedRoute allowedRoles={['event-admin', 'visitor', 'exhibitor']}>
        <ResponsiveDashboardLayout 
          title="Visitors Onboarding"
          
        >
        <Box
          component="main"
          sx={{
            p: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                  >
                    Back
                  </Button>
                  
                </Box>

                <Typography variant="h6">
                    Visitors Field Mapping
                </Typography>

                <Typography variant="body1" sx={{ fontSize: '0.85rem' }}>
                  Upload an Excel file to start mapping visitor fields.
                </Typography>
              </Box>
            </Box>

            
            
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Upload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Excel File Uploaded
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload an Excel file to start mapping visitor fields.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setUploadDialogOpen(true)}
                size="large"
              >
                Upload Excel File
              </Button>
            </Paper>

            {/* Upload Dialog */}
            <ExcelUploadDialog
              open={uploadDialogOpen}
              onClose={() => setUploadDialogOpen(false)}
              onUpload={handleFileUpload}
              title="Upload Visitors Data"
              description="Upload an Excel file containing visitor information for field mapping."
              type="visitors"
            />
          </Container>
        </Box>
      </ResponsiveDashboardLayout>
      </RoleBasedRoute>
    );
  }

  const renderMappingColumn = (mappings: FieldMapping[]) => (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      {mappings.map((mapping, index) => {
        const isRemoved = removedFields.has(mapping.excelColumn);
        const isDuplicate = duplicateFields.has(mapping.excelColumn); // NEW
        return (
          <Card 
            key={mapping.excelColumn} 
            sx={{ 
              mb: 2, 
              boxShadow: 2, 
              borderRadius: 2,
              opacity: isRemoved ? 0.5 : 1,
              border: isRemoved
                ? '1px dashed #ccc'
                : isDuplicate
                  ? '2px solid #ef4444' // red border for duplicate
                  : 'none',
              transition: 'border 0.2s',
            }}
          >
            <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: 1.4, flex: 1 }}>
                  {mapping.excelColumn}
                </Typography>
                {!isRemoved ? (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveField(mapping.excelColumn)}
                    sx={{ 
                      p: 0.5, 
                      ml: 1,
                      color: 'error.main',
                      '&:hover': { backgroundColor: 'error.light', color: 'white' }
                    }}
                  >
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                ) : (
                  <IconButton
                    size="small"
                    onClick={() => handleRestoreField(mapping.excelColumn)}
                    sx={{ 
                      p: 0.5, 
                      ml: 1,
                      color: 'success.main',
                      '&:hover': { backgroundColor: 'success.light', color: 'white' }
                    }}
                  >
                    <RestoreFromTrash sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
              
              {isRemoved ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                  Field removed - will not be included in registration
                </Typography>
              ) : (
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={1} display="flex" justifyContent="center">
                    <Typography variant="body1" color="primary" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      →
                    </Typography>
                  </Grid>
                  <Grid item xs={11}>
                    <Box>
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedMappings[mapping.excelColumn] || ''}
                          onChange={(e) => handleMappingChange(mapping.excelColumn, e.target.value)}
                          displayEmpty
                          sx={{ 
                            '& .MuiSelect-select': { 
                              py: 1,
                              fontSize: '0.9rem'
                            }
                          }}
                        >
                          <MenuItem value="CUSTOM_FIELD" sx={{ fontSize: '0.9rem', color: 'primary.main', fontWeight: 'medium' }}>
                            <Box sx={{ fontSize: '0.8rem',display: 'flex', alignItems: 'left', gap: 0 }}>
                              <Add sx={{ fontSize: 15 }} />
                              Custom Field
                            </Box>
                          </MenuItem>
                          {standardFields.map((field) => (
                            <MenuItem key={field.id} value={field.fieldName} sx={{ fontSize: '0.9rem' }}>
                              {field.fieldName}
                            </MenuItem>
                          ))}
                          
                        </Select>
                      </FormControl>
                      
                      {selectedMappings[mapping.excelColumn] === 'CUSTOM_FIELD' && (
                        <Box>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Enter custom field"
                            value={customFieldValues[mapping.excelColumn] || ''}
                            onChange={(e) => handleCustomFieldChange(mapping.excelColumn, e.target.value)}
                            sx={{ 
                              mt: 1,
                              '& .MuiInputBase-input': {
                                fontSize: '0.8rem' 
                              }
                            }}
                            autoFocus
                          />
                          {customFieldValidationMessages[mapping.excelColumn] && (
                            <Typography 
                              variant="caption" 
                              color="warning.main" 
                              sx={{ 
                                display: 'block', 
                                mt: 0.5, 
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}
                            >
                              {customFieldValidationMessages[mapping.excelColumn]}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );

  return (
    <RoleBasedRoute allowedRoles={['event-admin', 'visitor', 'exhibitor']}>
      <ResponsiveDashboardLayout 
        title="Visitors Onboarding"
        
      >
      <Box
        component="main"
        sx={{
          p: 2,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container maxWidth="xl" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Compact Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => router.back()}
                size="small"
              >
                Back
              </Button>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Visitors Field Mapping
              </Typography>
            </Box>
            
            <Box display="flex" gap={1} alignItems="center">
              
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setUploadDialogOpen(true)}
                size="small"
              >
                Upload New File
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
                size="small"
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={isSaving ? undefined : <Save />}
                onClick={handleSave}
                size="small"
                disabled={isSaving}
              >
                {isSaving ? <FullPageLoader/> : 'Save & Register Users'}
              </Button>
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          {/* Compact Info with Pagination */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Alert severity="info" sx={{ py: 0.5, flex: 1, mr: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                Map your Excel columns to standard fields. Total fields: {fieldMappings.length}
                {totalPages > 1 && ` | Page ${currentPage} of ${totalPages}`}
              </Typography>
            </Alert>
            {totalPages > 1 && (
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={(event, value) => setCurrentPage(value)}
                size="small"
                color="primary"
              />
            )}
          </Box>
          
          {/* Maximized Mapping Content - No Scroll, 3 Columns */}
          <Paper sx={{ 
            p: 3, 
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            <Grid container spacing={4} sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              {/* Column 1 */}
              <Grid item xs={12} md={4} sx={{ overflow: 'hidden' }}>
                {renderMappingColumn(column1)}
              </Grid>

              {/* Column 2 */}
              <Grid item xs={12} md={4} sx={{ overflow: 'hidden' }}>
                {renderMappingColumn(column2)}
              </Grid>

              {/* Column 3 */}
              <Grid item xs={12} md={4} sx={{ overflow: 'hidden' }}>
                {renderMappingColumn(column3)}
              </Grid>
            </Grid>
          </Paper>

          {/* Upload Dialog */}
          <ExcelUploadDialog
            open={uploadDialogOpen}
            onClose={() => setUploadDialogOpen(false)}
            onUpload={handleFileUpload}
            title="Upload Visitors Data"
            description="Upload an Excel file containing visitor information for field mapping."
            type="visitors"
          />

          {/* Registration Result Dialog */}
          <Dialog
            open={registrationDialogOpen}
            onClose={() => {
              setRegistrationDialogOpen(false);
              handleReset(); // Clear mapped data when dialog is closed
            }}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                background: '#ffffff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid #e5e7eb'
              }
            }}
          >
            <DialogTitle sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              background: '#f8fafc',
              borderBottom: '1px solid #e5e7eb',
              py: 1,
              px: 2
            }}>
              <Box sx={{ 
                background: '#10b981',
                borderRadius: '50%',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle sx={{ fontSize: 15, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1f2937' }}>
                  Registration Completed Successfully
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Visitor registration process completed
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              {registrationResult && (
                <Box>
                  {/* Professional Success Summary */}
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: 2,
                    p: 2,
                    mb: 1,
                    mt: 1,
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                  }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={1}>
                      <Box sx={{ 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}>
                        <Person sx={{ fontSize: 15, color: 'white' }} />
                      </Box>
                      <Typography variant="h3" sx={{ 
                        fontWeight: 600, 
                        color: '#065f46',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        {registrationResult.result.registeredCount}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: '#065f46', 
                      mb: 1
                    }}>
                      New Visitors Registered
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#047857',
                      opacity: 0.8,
                      fontSize: '0.9rem'
                    }}>
                      Successfully processed and registered in the system
                    </Typography>
                  </Box>

                                     {/* Already Registered Visitors Button */}
                   {registrationResult.result.alredyRegisteredEmails && registrationResult.result.alredyRegisteredEmails.length > 0 && (
                     <Box sx={{ mb: 1, textAlign: 'center' }}>
                       <Button
                         variant="outlined"
                         onClick={() => setShowAlreadyRegistered(!showAlreadyRegistered)}
                         sx={{
                           border: '1px solid #3b82f6',
                           color: '#1e40af',
                           fontWeight: 500,
                           px: 3,
                           py: 1,
                           borderRadius: 2,
                           textTransform: 'none',
                           fontSize: '0.9rem',
                           background: 'rgba(59, 130, 246, 0.05)',
                           '&:hover': {
                             background: 'rgba(59, 130, 246, 0.1)',
                             border: '1px solid #2563eb'
                           }
                         }}
                         startIcon={<Person sx={{ fontSize: 18 }} />}
                       >
                         {showAlreadyRegistered ? 'Hide' : 'Show'} Already Registered Visitors ({registrationResult.result.alredyRegisteredEmails.length})
                       </Button>
                     </Box>
                   )}

                                     {/* Already Registered Visitors Section - Only show when button is clicked */}
                   {showAlreadyRegistered && registrationResult.result.alredyRegisteredEmails && registrationResult.result.alredyRegisteredEmails.length > 0 && (
                     <Box sx={{ 
                       background: 'linear-gradient(135deg,rgb(237, 241, 245) 0%,rgb(241, 245, 250) 100%)',
                       border: '1px solid #3b82f6',
                       borderRadius: 2,
                       p: 2,
                       mb: 2,
                       boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
                       animation: 'slideDown 0.3s ease-out'
                     }}>
                       <Box display="flex" alignItems="center" gap={2} mb={2}>
                         <Box sx={{ 
                           background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                           borderRadius: '50%',
                           p: 1,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                         }}>
                           <Person sx={{ fontSize: 17, color: 'white' }} />
                         </Box>
                         <Box>
                           <Typography variant="h6" sx={{ 
                             fontWeight: 600, 
                             color: '#1e40af', 
                             mb: 0.5
                           }}>
                             Already Registered Visitors
                           </Typography>
                           <Typography variant="body2" sx={{ 
                             color: '#1d4ed8',
                             opacity: 0.8,
                             fontSize: '0.9rem'
                           }}>
                             {registrationResult.result.alredyRegisteredEmails.length} visitors were already registered
                           </Typography>
                         </Box>
                       </Box>
                       
                       {/* Email List */}
                       <Box sx={{ 
                         maxHeight: 200, 
                         overflowY: 'auto',
                         background: 'rgba(255, 255, 255, 0.5)',
                         borderRadius: 1,
                         p: 1,
                         border: '1px solid rgba(59, 130, 246, 0.2)'
                       }}>
                         <Typography variant="body2" sx={{ 
                           fontWeight: 600, 
                           color: '#1e40af', 
                           mb: 1,
                           fontSize: '0.85rem'
                         }}>
                           Already registered emails:
                         </Typography>
                         <Box sx={{ 
                           display: 'grid', 
                           gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                           gap: 1
                         }}>
                           {registrationResult.result.alredyRegisteredEmails.map((email, index) => (
                             <Typography 
                               key={index}
                               variant="body2" 
                               sx={{ 
                                 color: '#1d4ed8',
                                 fontSize: '0.8rem',
                                 fontFamily: 'monospace',
                                 p: 0.5,
                                 borderRadius: 0.5,
                                 background: 'rgba(255, 255, 255, 0.3)',
                                 border: '1px solid rgba(59, 130, 246, 0.1)'
                               }}
                             >
                               {email}
                             </Typography>
                           ))}
                         </Box>
                       </Box>
                     </Box>
                   )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ 
              background: '#f8fafc',
              borderTop: '1px solid #e5e7eb',
              p: 2,
              justifyContent: 'flex-end'
            }}>
              <Button 
                onClick={() => {
                  setRegistrationDialogOpen(false);
                  handleReset(); // Clear mapped data before navigating back
                  router.push(`/${identifier}/event-admin/visitors`);
                }}
                variant="contained"
                sx={{
                  background: '#3b82f6',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    background: '#2563eb',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                Continue
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Settings Menu */}
          <Menu
            anchorEl={settingsAnchorEl}
            open={settingsOpen}
            onClose={handleSettingsClose}
            onClick={handleSettingsClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, minWidth: 200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ListItemIcon sx={{ minWidth: 'auto' }}>
                  <Palette fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Theme" />
              </Box>
              <Box sx={{ pl: 4 }}>
                <SimpleThemeSelector variant="icon" showLabel={false} />
              </Box>
            </Box>
          </Menu>

          {/* Add CSS animations */}
          <style jsx global>{`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
            @keyframes bounce {
              0% { transform: translateY(0); }
              100% { transform: translateY(-4px); }
            }
            @keyframes slideDown {
              0% { 
                opacity: 0;
                transform: translateY(-10px);
                max-height: 0;
              }
              100% { 
                opacity: 1;
                transform: translateY(0);
                max-height: 500px;
              }
            }
          `}</style>
        </Container>
      </Box>
    </ResponsiveDashboardLayout>
    </RoleBasedRoute>
  );
} 