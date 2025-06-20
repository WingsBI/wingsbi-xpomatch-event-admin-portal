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
} from '@mui/material';
import { ArrowBack, Save, Refresh, Upload, CheckCircle, Business } from '@mui/icons-material';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import type { UserRegistrationResponse } from '@/services/fieldMappingApi';
import ExcelUploadDialog from '@/components/common/ExcelUploadDialog';
import ResponsiveDashboardLayout from '@/components/layouts/ResponsiveDashboardLayout';
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

export default function ExhibitorsMatchingPage() {
  const router = useRouter();
  const params = useParams();
  const identifier = params?.identifier as string;
  
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [standardFields, setStandardFields] = useState<StandardField[]>([]);
  const [selectedMappings, setSelectedMappings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<UserRegistrationResponse | null>(null);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileStorageId, setFileStorageId] = useState<number | null>(null);
  
  // Display all mappings evenly distributed

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get data from session storage first
      const mappingData = sessionStorage.getItem('fieldMappingData');
      const standardFieldsData = sessionStorage.getItem('standardFieldsData');
      const storedFileStorageId = sessionStorage.getItem('fileStorageId');

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
      console.log('Uploading exhibitors file:', file.name);
      
      // Check if user is authenticated
      const token = localStorage.getItem('jwtToken');
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
        throw new Error('Authentication failed. Your session may have expired. Please log in again.');
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
        const responseFileStorageId = (suggestResponse.result as any)?.fileStorageId || 
                                     suggestResponse.result?.fileStorageId || 
                                     2; // Default fallback as shown in sample
        
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
        
        // Also store in session storage for future use
        sessionStorage.setItem('fieldMappingData', JSON.stringify(mappingsData));
        sessionStorage.setItem('standardFieldsData', JSON.stringify(standardFieldsResponse.result));
        sessionStorage.setItem('fileStorageId', responseFileStorageId.toString());
        sessionStorage.setItem('uploadType', 'exhibitors');
        
      } else {
        // Handle API errors
        const errorMessage = suggestResponse.statusCode !== 200 
          ? (suggestResponse.message || 'Failed to process Excel file')
          : (standardFieldsResponse.message || 'Failed to load standard fields');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error uploading exhibitors file:', error);
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
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate that we have fileStorageId
      if (!fileStorageId) {
        throw new Error('File storage ID not found. Please upload an Excel file first.');
      }

      // Create the registration payload with proper structure
      const mappings = Object.entries(selectedMappings)
        .filter(([excelColumn, standardField]) => standardField) // Only include mapped fields
        .map(([excelColumn, standardField], index) => ({
          standardFieldIndex: index + 1,
          standardField,
          excelColumn
        }));

      if (mappings.length === 0) {
        throw new Error('No field mappings selected. Please map at least one field.');
      }

      const payload = {
        fileStorageId,
        mappings
      };

      console.log('Registering exhibitors with payload:', payload);

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

  const handleReset = () => {
    // Reset to default mappings from POST API
    const defaultMappings: { [key: string]: string } = {};
    fieldMappings.forEach((mapping: FieldMapping) => {
      defaultMappings[mapping.excelColumn] = mapping.standardField;
    });
    setSelectedMappings(defaultMappings);
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
      <ResponsiveDashboardLayout 
        title="Exhibitors Field Mapping"
        breadcrumbs={[
          { label: 'Event Admin', href: `/${identifier}/event-admin` },
          { label: 'Exhibitors', href: `/${identifier}/event-admin/exhibitors` },
          { label: 'Field Mapping' }
        ]}
      >
        <Box
          component="main"
          sx={{
            p: 3,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Container maxWidth="xl">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => router.back()}
                >
                  Back
                </Button>
                <Typography variant="h5">
                  Exhibitors Field Mapping
                </Typography>
              </Box>
              
              <Box display="flex" gap={2} alignItems="center">
                <SimpleThemeSelector />
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload Excel File
                </Button>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              {error}
            </Alert>
            
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Upload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Excel File Uploaded
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload an Excel file to start mapping exhibitor fields.
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
              title="Upload Exhibitors Data"
              description="Upload an Excel file containing exhibitor information for field mapping."
              type="exhibitors"
            />
          </Container>
        </Box>
      </ResponsiveDashboardLayout>
    );
  }

  const renderMappingColumn = (mappings: FieldMapping[]) => (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      {mappings.map((mapping, index) => (
        <Card key={mapping.excelColumn} sx={{ mb: 2, boxShadow: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={5}>
                <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: 1.4 }}>
                  {mapping.excelColumn}
                </Typography>
              </Grid>
              <Grid item xs={1} display="flex" justifyContent="center">
                <Typography variant="body1" color="primary" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  →
                </Typography>
              </Grid>
              <Grid item xs={6}>
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
                    <MenuItem value="" sx={{ fontSize: '0.9rem' }}>
                      <em>Select field</em>
                    </MenuItem>
                    {standardFields.map((field) => (
                      <MenuItem key={field.id} value={field.fieldName} sx={{ fontSize: '0.9rem' }}>
                        {field.fieldName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <ResponsiveDashboardLayout 
      title="Exhibitors Field Mapping"
      breadcrumbs={[
        { label: 'Event Admin', href: `/${identifier}/event-admin` },
        { label: 'Exhibitors', href: `/${identifier}/event-admin/exhibitors` },
        { label: 'Field Mapping' }
      ]}
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
                Exhibitors Field Mapping
              </Typography>
            </Box>
            
            <Box display="flex" gap={1} alignItems="center">
              <SimpleThemeSelector />
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
                {isSaving ? 'Registering Users...' : 'Save & Register Users'}
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
            title="Upload Exhibitors Data"
            description="Upload an Excel file containing exhibitor information for field mapping."
            type="exhibitors"
          />

          {/* Registration Result Dialog */}
          <Dialog
            open={registrationDialogOpen}
            onClose={() => setRegistrationDialogOpen(false)}
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
              gap: 2,
              background: '#f8fafc',
              borderBottom: '1px solid #e5e7eb',
              py: 2,
              px: 3
            }}>
              <Box sx={{ 
                background: '#10b981',
                borderRadius: '50%',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle sx={{ fontSize: 20, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Registration Completed Successfully
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Exhibitor registration process completed
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 2 }}>
              {registrationResult && (
                <Box>
                  {/* Compact Success Summary */}
                  <Box sx={{ 
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                    textAlign: 'center'
                  }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1.5} mb={1}>
                      <Box sx={{ 
                        background: '#10b981',
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Business sx={{ fontSize: 16, color: 'white' }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#065f46' }}>
                        {registrationResult.result.registeredCount}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#065f46', fontSize: '0.9rem' }}>
                      New Exhibitors Registered
                    </Typography>
                  </Box>
                  
                  {/* User Lists Section - Side by Side */}
                  <Grid container spacing={2}>
                    {/* Newly Registered Column */}
                    {registrationResult.result.newlyRegisteredEmails.length > 0 && (
                      <Grid item xs={registrationResult.result.alredyRegisteredEmails.length > 0 ? 6 : 12}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#065f46', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                          Newly Added ({registrationResult.result.newlyRegisteredEmails.length})
                        </Typography>
                        <Box sx={{ 
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: 1,
                          p: 1
                        }}>
                          {registrationResult.result.newlyRegisteredEmails.map((email, index) => (
                            <Box key={index} sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1, 
                              mb: 0.5,
                              p: 1,
                              background: 'white',
                              borderRadius: 0.5,
                              border: '1px solid #e5e7eb',
                              '&:last-child': { mb: 0 }
                            }}>
                              <Typography variant="caption" sx={{ 
                                background: '#10b981',
                                color: 'white',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                flexShrink: 0
                              }}>
                                {index + 1}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: '#374151', 
                                fontSize: '0.8rem',
                                wordBreak: 'break-word',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {email}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    )}
                    
                    {/* Already Registered Section */}
                    {registrationResult.result.alredyRegisteredEmails.length > 0 && (
                      <Grid item xs={registrationResult.result.newlyRegisteredEmails.length > 0 ? 6 : 12}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#92400e', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Business sx={{ fontSize: 16, color: '#d97706' }} />
                          Already Registered ({registrationResult.result.alredyRegisteredEmails.length})
                        </Typography>
                        <Box sx={{ 
                          background: '#fef3c7',
                          border: '1px solid #fcd34d',
                          borderRadius: 1,
                          p: 1
                        }}>
                          {/* Show in 2 columns if taking full width, otherwise single column */}
                          {registrationResult.result.newlyRegisteredEmails.length === 0 ? (
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                {registrationResult.result.alredyRegisteredEmails
                                  .slice(0, Math.ceil(registrationResult.result.alredyRegisteredEmails.length / 2))
                                  .map((email, index) => (
                                    <Box key={index} sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 1, 
                                      mb: 0.5,
                                      p: 1,
                                      background: 'white',
                                      borderRadius: 0.5,
                                      border: '1px solid #e5e7eb',
                                      '&:last-child': { mb: 0 }
                                    }}>
                                      <Typography variant="caption" sx={{ 
                                        background: '#d97706',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: 20,
                                        height: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        flexShrink: 0
                                      }}>
                                        {index + 1}
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        color: '#374151', 
                                        fontSize: '0.8rem',
                                        wordBreak: 'break-word',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {email}
                                      </Typography>
                                    </Box>
                                  ))}
                              </Grid>
                              <Grid item xs={6}>
                                {registrationResult.result.alredyRegisteredEmails
                                  .slice(Math.ceil(registrationResult.result.alredyRegisteredEmails.length / 2))
                                  .map((email, index) => (
                                    <Box key={index} sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 1, 
                                      mb: 0.5,
                                      p: 1,
                                      background: 'white',
                                      borderRadius: 0.5,
                                      border: '1px solid #e5e7eb',
                                      '&:last-child': { mb: 0 }
                                    }}>
                                      <Typography variant="caption" sx={{ 
                                        background: '#d97706',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: 20,
                                        height: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        flexShrink: 0
                                      }}>
                                        {Math.ceil(registrationResult.result.alredyRegisteredEmails.length / 2) + index + 1}
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        color: '#374151', 
                                        fontSize: '0.8rem',
                                        wordBreak: 'break-word',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {email}
                                      </Typography>
                                    </Box>
                                  ))}
                              </Grid>
                            </Grid>
                          ) : (
                            /* Single column when sharing space with newly registered users */
                            registrationResult.result.alredyRegisteredEmails.map((email, index) => (
                              <Box key={index} sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: 0.5,
                                p: 1,
                                background: 'white',
                                borderRadius: 0.5,
                                border: '1px solid #e5e7eb',
                                '&:last-child': { mb: 0 }
                              }}>
                                <Typography variant="caption" sx={{ 
                                  background: '#d97706',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: 20,
                                  height: 20,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  flexShrink: 0
                                }}>
                                  {index + 1}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  color: '#374151', 
                                  fontSize: '0.8rem',
                                  wordBreak: 'break-word',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {email}
                                </Typography>
                              </Box>
                            ))
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
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
                  router.back();
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
          `}</style>
        </Container>
      </Box>
    </ResponsiveDashboardLayout>
  );
} 