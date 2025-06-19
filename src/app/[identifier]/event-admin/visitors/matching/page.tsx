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
} from '@mui/material';
import { ArrowBack, Save, Refresh, Upload } from '@mui/icons-material';
import { fieldMappingApi } from '@/services/fieldMappingApi';
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

export default function VisitorsMatchingPage() {
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

      if (mappingData && standardFieldsData) {
        const mappings = JSON.parse(mappingData);
        const fields = JSON.parse(standardFieldsData);
        
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
        
        // Update state directly instead of using session storage
        setFieldMappings(mappingsData);
        setStandardFields(standardFieldsResponse.result);
        
        // Set default selections based on standardField from POST API
        const defaultMappings: { [key: string]: string } = {};
        mappingsData.forEach((mapping: FieldMapping) => {
          defaultMappings[mapping.excelColumn] = mapping.standardField;
        });
        setSelectedMappings(defaultMappings);
        
        // Also store in session storage for future use
        sessionStorage.setItem('fieldMappingData', JSON.stringify(mappingsData));
        sessionStorage.setItem('standardFieldsData', JSON.stringify(standardFieldsResponse.result));
        sessionStorage.setItem('uploadType', 'visitors');
        
      } else {
        // Handle API errors
        const errorMessage = suggestResponse.statusCode !== 200 
          ? (suggestResponse.message || 'Failed to process Excel file')
          : (standardFieldsResponse.message || 'Failed to load standard fields');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error uploading visitors file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
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

  const handleSave = () => {
    console.log('Saving mappings:', selectedMappings);
    // TODO: Implement save functionality
    router.back();
  };

  const handleReset = () => {
    // Reset to default mappings from POST API
    const defaultMappings: { [key: string]: string } = {};
    fieldMappings.forEach((mapping: FieldMapping) => {
      defaultMappings[mapping.excelColumn] = mapping.standardField;
    });
    setSelectedMappings(defaultMappings);
  };

  // Split all mappings evenly into two columns
  const midPoint = Math.ceil(fieldMappings.length / 2);
  const leftColumnMappings = fieldMappings.slice(0, midPoint);
  const rightColumnMappings = fieldMappings.slice(midPoint);

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
        title="Visitors Field Mapping"
        breadcrumbs={[
          { label: 'Event Admin', href: `/${identifier}/event-admin` },
          { label: 'Visitors', href: `/${identifier}/event-admin/visitors` },
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
                  Visitors Field Mapping
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
    );
  }

  const renderMappingColumn = (mappings: FieldMapping[], title: string) => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2, fontSize: '1.1rem' }}>
        {title}
      </Typography>
      {mappings.map((mapping, index) => (
        <Card key={mapping.excelColumn} sx={{ mb: 1.5, boxShadow: 1 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={5}>
                <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                  {mapping.excelColumn}
                </Typography>
              </Grid>
              <Grid item xs={1} display="flex" justifyContent="center">
                <Typography variant="body1" color="primary" sx={{ fontSize: '1.2rem' }}>
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
                        py: 0.75,
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                      <em>Select field</em>
                    </MenuItem>
                    {standardFields.map((field) => (
                      <MenuItem key={field.id} value={field.fieldName} sx={{ fontSize: '0.875rem' }}>
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
      title="Visitors Field Mapping"
      breadcrumbs={[
        { label: 'Event Admin', href: `/${identifier}/event-admin` },
        { label: 'Visitors', href: `/${identifier}/event-admin/visitors` },
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
          {/* Header */}
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
                Visitors Field Mapping
              </Typography>
            </Box>
            
            <Box display="flex" gap={2} alignItems="center">
              <SimpleThemeSelector />
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload New File
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
              >
                Save Mapping
              </Button>
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Mapping Info */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Map your Excel columns to standard fields. Total fields: {fieldMappings.length}
            </Typography>
          </Alert>
          
          {/* Mapping Content */}
          <Paper sx={{ p: 3, maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
            <Grid container spacing={2}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                {renderMappingColumn(leftColumnMappings, `Fields 1-${leftColumnMappings.length}`)}
              </Grid>

              {/* Divider */}
              <Grid item xs={12} md={0}>
                <Divider 
                  orientation="vertical" 
                  sx={{ 
                    height: '100%',
                    display: { xs: 'none', md: 'block' }
                  }} 
                />
                <Divider 
                  sx={{ 
                    display: { xs: 'block', md: 'none' },
                    my: 1
                  }} 
                />
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={6}>
                {rightColumnMappings.length > 0 && renderMappingColumn(
                  rightColumnMappings, 
                  `Fields ${leftColumnMappings.length + 1}-${fieldMappings.length}`
                )}
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
        </Container>
      </Box>
    </ResponsiveDashboardLayout>
  );
} 