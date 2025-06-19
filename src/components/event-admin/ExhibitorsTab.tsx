'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
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
  GetApp,
  Business,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Event, Participant } from '@/types';
import ExcelUploadDialog from '@/components/common/ExcelUploadDialog';
import { fieldMappingApi } from '@/services/fieldMappingApi';

interface ExhibitorsTabProps {
  exhibitors: Participant[];
  event: Event | null;
  onDataUpdate: () => void;
}

export default function ExhibitorsTab({ exhibitors, event, onDataUpdate }: ExhibitorsTabProps) {
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

  const filteredExhibitors = exhibitors.filter(exhibitor =>
    exhibitor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibitor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibitor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibitor.company?.toLowerCase().includes(searchTerm.toLowerCase())
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
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <Business sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'jobTitle',
      headerName: 'Position',
      width: 180,
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 120,
    },
    {
      field: 'boothNumber',
      headerName: 'Booth',
      width: 100,
      valueGetter: (params) => params.row.customData?.boothNumber || 'TBA',
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

  const handleAddExhibitor = () => {
    setUploadDialogOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Uploading exhibitors file:', file.name);
      
      // Check if user is authenticated
      const token = localStorage.getItem('jwtToken');
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
        
        // Store both data sets in session storage for the matching page
        sessionStorage.setItem('fieldMappingData', JSON.stringify(mappingsData));
        sessionStorage.setItem('standardFieldsData', JSON.stringify(standardFieldsResponse.result));
        sessionStorage.setItem('uploadType', 'exhibitors');
        
        // Redirect to matching page
        router.push(`/${identifier}/event-admin/exhibitors/matching`);
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
    }
  };

  const handleSendInvitations = () => {
    // Handle send invitations logic
  };

  const handleExportData = () => {
    // Handle export data logic
  };

  const handleAssignBooths = () => {
    // Handle booth assignment logic
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Exhibitors Management ({exhibitors.length})
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
            onClick={handleAddExhibitor}
          >
            Add Exhibitor
          </Button>
          <Button
            variant="outlined"
            startIcon={<Business />}
            onClick={handleAssignBooths}
          >
            Assign Booths
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
          placeholder="Search exhibitors by name, email, or company..."
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
          rows={filteredExhibitors}
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
        title="Upload Exhibitors Data"
        description="Upload an Excel file containing exhibitor information. The file will be processed and you'll be redirected to the field mapping page."
        type="exhibitors"
      />
    </Box>
  );
} 