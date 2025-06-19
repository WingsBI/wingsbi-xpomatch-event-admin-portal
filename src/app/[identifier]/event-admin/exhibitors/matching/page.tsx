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
  
  const itemsPerPage = 30;
  const itemsPerColumn = 15;

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
        const mappingsData = suggestResponse.result?.mappings || suggestResponse.result;
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

  // Pagination logic
  const totalPages = Math.ceil(fieldMappings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMappings = fieldMappings.slice(startIndex, endIndex);

  // Split current mappings into two columns
  const leftColumnMappings = currentMappings.slice(0, itemsPerColumn);
  const rightColumnMappings = currentMappings.slice(itemsPerColumn);

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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Typography variant="h4">
              Exhibitors Field Mapping
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Excel File
          </Button>
        </Box>

        <Alert severity="warning" sx={{ mb: 3 }}>
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Typography variant="h4">
            Exhibitors Field Mapping
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Mapping Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Map your Excel columns to standard fields. Total fields: {fieldMappings.length}
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </Typography>
      </Alert>
      
      {/* Mapping Content */}
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            {renderMappingColumn(leftColumnMappings, `Fields ${startIndex + 1}-${startIndex + leftColumnMappings.length}`)}
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
                my: 2
              }} 
            />
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={6}>
            {rightColumnMappings.length > 0 && renderMappingColumn(
              rightColumnMappings, 
              `Fields ${startIndex + leftColumnMappings.length + 1}-${startIndex + currentMappings.length}`
            )}
          </Grid>
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
              size="large"
            />
          </Box>
        )}
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
  );
} 