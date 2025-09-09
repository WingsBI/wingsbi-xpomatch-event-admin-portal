'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Upload,
  Close,
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface ExcelUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  title: string;
  description?: string;
  acceptedFormats?: string[];
  maxFileSize?: number; // in MB
  type: 'visitors' | 'exhibitors';
}

export default function ExcelUploadDialog({
  open,
  onClose,
  onUpload,
  title,
  description,
  acceptedFormats = ['.xlsx', '.xls', '.csv'],
  maxFileSize = 30,
  type,
}: ExcelUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
      if (!acceptedFormats.includes(fileExtension)) {
        setErrorMessage(`Please select a valid file format: ${acceptedFormats.join(', ')}`);
        setUploadStatus('error');
        return;
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        setErrorMessage(`File size should not exceed ${maxFileSize}MB`);
        setUploadStatus('error');
        return;
      }

      setSelectedFile(file);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');

      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
    onClose();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Create a proper event-like object with FileList
      const fileList = Object.assign([file], { item: (index: number) => file, length: 1 }) as FileList;
      const fakeEvent = {
        target: { files: fileList }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };


  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box py={1}>
          {description && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {description}
            </Typography>
          )}

          {/* Upload Area */}
          <Box 
            sx={{
              border: '2px dashed',
              borderColor: selectedFile ? 'success.main' : 'secondary.main',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              mt: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: selectedFile ? 'rgba(76, 175, 80, 0.04)' : 'rgba(25, 118, 210, 0.04)',
                borderColor: selectedFile ? 'success.dark' : 'secondary.dark',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {selectedFile ? (
              <>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom color="success.main">
                  File Selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drop your Excel file here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click to browse files
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Supported formats: {acceptedFormats.join(', ')} (Max {maxFileSize}MB)
                </Typography>
              </>
            )}
          </Box>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}

          {/* Upload Status */}
          {uploadStatus === 'success' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              File uploaded successfully! Redirecting to mapping page...
            </Alert>
          )}

          {uploadStatus === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          variant="contained" 
          disabled={!selectedFile || uploading}
          startIcon={uploading ? undefined : <Upload />}
        >
          {uploading ? 'Uploading...' : 'Upload & Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 