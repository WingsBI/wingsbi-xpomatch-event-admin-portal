'use client';

import { useState } from 'react';
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

interface ExhibitorsTabProps {
  exhibitors: Participant[];
  event: Event | null;
  onDataUpdate: () => void;
}

export default function ExhibitorsTab({ exhibitors, event, onDataUpdate }: ExhibitorsTabProps) {
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
    // Handle add exhibitor logic
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
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Exhibitors Data</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload an Excel file containing exhibitor information. The file should include columns for:
              First Name, Last Name, Email, Company, Job Title, Phone, Country, Booth Number (optional).
            </Typography>
            
            <Box 
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                mt: 2,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                },
              }}
            >
              <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drop your Excel file here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse files
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>
                Choose File
              </Button>
            </Box>

            <Box mt={3}>
              <Typography variant="body2" color="text.secondary">
                <strong>Exhibitor-specific fields:</strong>
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
                <li>Booth Number</li>
                <li>Company Description</li>
                <li>Products/Services</li>
                <li>Website URL</li>
                <li>Booth Size</li>
              </ul>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 