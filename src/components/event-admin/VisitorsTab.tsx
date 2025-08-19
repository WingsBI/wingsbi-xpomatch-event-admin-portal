'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Upload,
  Add,
  Search,
  Edit,
  Delete,
  Email,
  Visibility,
  GetApp,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Event, Participant } from '@/types';
import ExcelUploadDialog from '@/components/common/ExcelUploadDialog';
import { fieldMappingApi } from '@/services/fieldMappingApi';
import { getAuthToken } from '@/utils/cookieManager';

interface VisitorsTabProps {
  visitors: Participant[];
  event: Event | null;
  onDataUpdate: () => void;
}

export default function VisitorsTab({ visitors, event, onDataUpdate }: VisitorsTabProps) {
  const router = useRouter();
  const params = useParams();
  const identifier = params?.identifier as string;
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'success';
      case 'invited': return 'warning';
      case 'checked-in': return 'info';
      case 'no-show': return 'error';
      default: return 'default';
    }
  };

  const filteredVisitors = visitors.filter(visitor =>
    visitor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      valueGetter: (params) => `${params.row.firstName} ${params.row.lastName}`,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
    },
    {
      field: 'company',
      headerName: 'Company',
      width: 200,
    },
    {
      field: 'jobTitle',
      headerName: 'Job Title',
      width: 180,
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 120,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value) as any}
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" color="primary">
            <Edit />
          </IconButton>
          <IconButton size="small" color="info">
            <Email />
          </IconButton>
          <IconButton size="small" color="error">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleUploadExcel = () => {
    setUploadDialogOpen(true);
  };

  const handleAddVisitor = () => {
    setUploadDialogOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Uploading visitors file:', file.name);
      
      // Check if user is authenticated
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
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
        const responseFileStorageId = (suggestResponse.result as any)?.fileStorageId;
        
        // Store data in session storage for the field mapping page
        console.log('Storing visitors data in session storage:', {
          identifier,
          mappingsData,
          standardFields: standardFieldsResponse.result,
          fileStorageId: responseFileStorageId
        });
        
        sessionStorage.setItem(`visitors_mapping_${identifier}`, JSON.stringify(mappingsData));
        sessionStorage.setItem(`visitors_standard_fields_${identifier}`, JSON.stringify(standardFieldsResponse.result));
        if (responseFileStorageId) {
          sessionStorage.setItem(`visitors_file_storage_id_${identifier}`, responseFileStorageId.toString());
        }
        
        // Verify data was stored
        console.log('Session storage verification:', {
          storedMapping: sessionStorage.getItem(`visitors_mapping_${identifier}`),
          storedFields: sessionStorage.getItem(`visitors_standard_fields_${identifier}`),
          storedFileId: sessionStorage.getItem(`visitors_file_storage_id_${identifier}`)
        });
        
        // Small delay to ensure session storage is persisted
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to matching page
        router.push(`/${identifier}/event-admin/visitors/matching`);
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
    }
  };

  const handleSendInvitations = () => {
    // Handle send invitations logic
  };

  const handleExportData = () => {
    // Handle export data logic
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Visitors Management ({visitors.length})
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={handleUploadExcel}
          >
            Upload Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddVisitor}
          >
            Add Visitor
          </Button>
          <Button
            variant="outlined"
            startIcon={<Email />}
            onClick={handleSendInvitations}
          >
            Send Invitations
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExportData}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search visitors by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Data Grid */}
      <Paper>
        <DataGrid
          rows={filteredVisitors}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          autoHeight
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        />
      </Paper>

      {/* Upload Dialog */}
      <ExcelUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleFileUpload}
        title="Upload Visitors Data"
        description="Upload an Excel file containing visitor information. The file will be processed and you'll be redirected to the field mapping page."
        type="visitors"
      />
    </Box>
  );
} 