'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Button,
  Tooltip,
  Paper,
  Stack,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Palette,
  Close,
  Save,
} from '@mui/icons-material';
import { ApiEventThemeDetails, useApiTheme } from '@/context/ApiThemeContext';

interface SimpleThemeSelectorProps {
  variant?: 'icon' | 'button';
  showLabel?: boolean;
}

export function SimpleThemeSelector({ variant = 'icon', showLabel = false }: SimpleThemeSelectorProps) {
  const params = useParams();
  const identifier = params?.identifier as string;
  const { themeDetails, isLoading, error: contextError, refreshTheme } = useApiTheme();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use context error if available, otherwise use local error
  const displayError = contextError || error;

  // Use theme details from context instead of making separate API call
  const eventThemeDetails = themeDetails;
  const loading = isLoading;

  const saveThemeSettings = async () => {
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);
      
      // Use the context's refresh function instead of making a separate API call
      await refreshTheme();
      setSuccess('Theme settings refreshed successfully!');
    } catch (err: any) {
      console.error('Error saving theme settings:', err);
      setError(err.message || 'Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSuccess(null);
    setError(null);
  };

  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title="Theme Settings">
          <IconButton onClick={handleOpen} color="inherit">
            <Palette />
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          variant="outlined"
          startIcon={<Palette />}
          onClick={handleOpen}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
          }}
        >
          {showLabel ? 'Theme Settings' : 'Theme'}
        </Button>
      )}
      
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Palette sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Event Theme Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current theme configuration
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              onClick={saveThemeSettings}
              disabled={saving || loading}
              sx={{ mr: 1 }}
            >
              {saving ? 'Refreshing...' : 'Refresh Theme'}
            </Button>
            <IconButton onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
        

                  {/* Error Messages */}
        {displayError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {displayError}
          </Alert>
        )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Current Theme Info */}
          {eventThemeDetails && !loading && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Palette sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      Current Theme Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applied theme and font settings
                    </Typography>
                  </Box>
                </Box>
                
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      THEME
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {eventThemeDetails.theme.themeLabel}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={eventThemeDetails.theme.themeColor} 
                      sx={{ 
                        bgcolor: eventThemeDetails.theme.themeColor, 
                        color: 'white',
                        fontSize: '0.7rem',
                        mt: 0.5
                      }} 
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      FONT
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ fontFamily: eventThemeDetails.font.fontFamily }}>
                      {eventThemeDetails.font.fontLabel}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Paper>
          )}

          {/* Theme Preview */}
          {eventThemeDetails && !loading && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Theme Preview
              </Typography>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                fontFamily: eventThemeDetails.font.fontFamily
              }}>
                <Typography variant="h4" color="primary.main" sx={{ mb: 2 }}>
                  Sample Heading
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  This is how your content will look with the current theme and font settings.
                </Typography>
                <Button variant="contained" sx={{ mr: 2 }}>
                  Primary Button
                </Button>
                <Button variant="outlined">
                  Secondary Button
                </Button>
              </Box>
            </Paper>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SimpleThemeSelector; 