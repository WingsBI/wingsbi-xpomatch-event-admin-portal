'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tooltip,
  Paper,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Palette,
  Check,
  Close,
  TextFields,
  Save,
} from '@mui/icons-material';
import { useSimpleTheme } from '@/context/SimpleThemeContext';
import { eventsApi } from '@/services/apiService';
import { ApiEventThemeDetails, UpdateThemePayload } from '@/types';

interface SimpleThemeSelectorProps {
  variant?: 'icon' | 'button';
  showLabel?: boolean;
}

export function SimpleThemeSelector({ variant = 'icon', showLabel = false }: SimpleThemeSelectorProps) {
  const params = useParams();
  const identifier = params?.identifier as string;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [eventThemeDetails, setEventThemeDetails] = useState<ApiEventThemeDetails | null>(null);
  
  const { 
    currentThemeName, 
    themes, 
    setTheme, 
    currentFontFamily, 
    fontFamilies, 
    setFontFamily,
    themeSettings,
    isLoading
  } = useSimpleTheme();

  // Load event theme details when dialog opens
  useEffect(() => {
    if (open && identifier) {
      loadEventThemeDetails();
    }
  }, [open, identifier]);

  const loadEventThemeDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading event theme details for identifier:', identifier);
      const response = await eventsApi.getEventThemeDetails(identifier);
      
      if (response.success && response.data?.result) {
        setEventThemeDetails(response.data.result);
        console.log('Event theme details loaded:', response.data.result);
        
        // Apply the theme and font from the API
        const themeDetails = response.data.result;
        if (themeDetails.theme && themeDetails.font) {
          // Map API theme to local theme (you may need to adjust this mapping)
          const themeMapping: { [key: string]: string } = {
            'Forest Professional': 'forest',
            'Ocean Blue': 'blue',
            'Sunset Orange': 'orange',
            'Purple Gradient': 'purple',
            'Green Nature': 'green',
          };
          
          const localThemeName = themeMapping[themeDetails.theme.themeLabel] || 'blue';
          setTheme(localThemeName);
          
          // Map API font to local font
          const fontMapping: { [key: string]: string } = {
            'Roboto': fontFamilies.roboto,
            'Nunito Sans': fontFamilies.nunitosans,
            'Inter': fontFamilies.inter,
            'Poppins': fontFamilies.poppins,
            'Montserrat': fontFamilies.montserrat,
            'Open Sans': fontFamilies.opensans,
            'Lato': fontFamilies.lato,
          };
          
          const localFont = fontMapping[themeDetails.font.fontLabel] || fontFamilies.roboto;
          setFontFamily(localFont);
        }
      } else {
        setError('Failed to load event theme details');
      }
    } catch (err: any) {
      console.error('Error loading event theme details:', err);
      setError(err.message || 'Failed to load event theme details');
    } finally {
      setLoading(false);
    }
  };

  const saveThemeSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      if (!eventThemeDetails) {
        setError('No event theme details available');
        return;
      }

      // Map current theme and font to API IDs
      const themeMapping: { [key: string]: number } = {
        'forest': 3, // Forest Professional
        'blue': 1,   // Ocean Blue
        'orange': 2, // Sunset Orange  
        'purple': 4, // Purple Gradient
        'green': 5,  // Green Nature
      };

      const fontMapping: { [key: string]: number } = {
        [fontFamilies.roboto]: 3,      // Roboto
        [fontFamilies.nunitosans]: 1,  // Nunito Sans
        [fontFamilies.inter]: 2,       // Inter
        [fontFamilies.poppins]: 4,     // Poppins
        [fontFamilies.montserrat]: 5,  // Montserrat
        [fontFamilies.opensans]: 6,    // Open Sans
        [fontFamilies.lato]: 7,        // Lato
      };

      const themeId = themeMapping[currentThemeName] || 1;
      const fontId = fontMapping[currentFontFamily] || 3;

      const payload: UpdateThemePayload = {
        themeSettingId: eventThemeDetails.id,
        themeId: themeId,
        fontId: fontId,
      };

      console.log('Saving theme settings with payload:', payload);
      const response = await eventsApi.updateEventTheme(identifier, payload);
      
      if (response.success) {
        setSuccess('Theme settings saved successfully!');
        // Reload the theme details to get updated data
        setTimeout(() => {
          loadEventThemeDetails();
        }, 1000);
      } else {
        setError('Failed to save theme settings');
      }
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
    setError(null);
    setSuccess(null);
  };

  const handleThemeSelect = (themeName: string) => {
    setTheme(themeName);
    
    // Send theme change message to all iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'THEME_CHANGE',
          theme: themeName
        }, '*');
      }
    });
  };

  const handleFontSelect = (fontFamily: string) => {
    setFontFamily(fontFamily);
    
    // Send font change message to all iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'FONT_CHANGE',
          fontFamily: fontFamily
        }, '*');
      }
    });
  };

  const getFontDisplayName = (fontKey: string) => {
    const fontMap: { [key: string]: string } = {
      nunitosans: 'Nunito Sans',
      inter: 'Inter',
      roboto: 'Roboto',
      poppins: 'Poppins',
      montserrat: 'Montserrat',
      opensans: 'Open Sans',
      lato: 'Lato',
    };
    return fontMap[fontKey] || fontKey.charAt(0).toUpperCase() + fontKey.slice(1);
  };

  const getCurrentFontKey = () => {
    return Object.keys(fontFamilies).find(
      key => fontFamilies[key as keyof typeof fontFamilies] === currentFontFamily
    ) || 'nunitosans';
  };

  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title="Change Theme">
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
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {showLabel ? 'Themes' : 'Theme'}
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
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
                Customize your event's appearance
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
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <IconButton 
              onClick={handleClose}
              sx={{ 
                background: 'rgba(0, 0, 0, 0.05)',
                '&:hover': { background: 'rgba(0, 0, 0, 0.1)' }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* Loading State */}
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Loading theme settings...
              </Typography>
            </Box>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Current Event Theme Info */}
          {eventThemeDetails && !loading && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
                border: '1px solid rgba(25, 118, 210, 0.2)',
                borderRadius: 3,
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Palette sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      Current Event Theme
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Theme settings loaded from your event configuration
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ pl: 5 }}>
                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        CURRENT THEME
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
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
                        CURRENT FONT
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ fontFamily: eventThemeDetails.font.fontFamily }}>
                        {eventThemeDetails.font.fontLabel}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          )}

          {!loading && (
            <Stack spacing={4}>
              {/* Font Selection Section */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <TextFields sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Font Family
                  </Typography>
                </Box>
                
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Select Font</InputLabel>
                  <Select
                    value={getCurrentFontKey()}
                    onChange={(e) => handleFontSelect(fontFamilies[e.target.value as keyof typeof fontFamilies])}
                    label="Select Font"
                    sx={{
                      borderRadius: 3,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.15)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    {Object.entries(fontFamilies).map(([key, value]) => (
                      <MenuItem 
                        key={key} 
                        value={key}
                        sx={{ 
                          fontFamily: value,
                          py: 2,
                          '&:hover': {
                            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
                          }
                        }}
                      >
                        <Typography fontFamily={value} fontWeight={500}>
                          {getFontDisplayName(key)}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider sx={{ mx: -3, opacity: 0.3 }} />

              {/* Theme Selection Section */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Palette sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Choose Your Theme
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {Object.entries(themes).map(([key, theme]) => (
                    <Grid item xs={6} sm={4} md={2.4} key={key}>
                      <Card
                        onClick={() => handleThemeSelect(key)}
                        sx={{
                          cursor: 'pointer',
                          position: 'relative',
                          borderRadius: 3,
                          overflow: 'hidden',
                          backgroundColor: 'background.paper',
                          border: currentThemeName === key 
                            ? `3px solid ${theme.preview}` 
                            : '2px solid transparent',
                          boxShadow: currentThemeName === key
                            ? `0 8px 25px ${theme.preview}40`
                            : '0 4px 12px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px) scale(1.02)',
                            boxShadow: `0 12px 35px ${theme.preview}30`,
                            borderColor: theme.preview,
                          },
                        }}
                      >
                        {/* Selected indicator */}
                        {currentThemeName === key && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              zIndex: 2,
                              bgcolor: theme.preview,
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            <Check sx={{ fontSize: 18, color: 'white' }} />
                          </Box>
                        )}

                        {/* Theme Preview */}
                        <Box
                          sx={{
                            height: 80,
                            background: `linear-gradient(135deg, ${theme.preview} 0%, ${theme.theme.palette.secondary.main} 100%)`,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {/* Mock UI Elements */}
                          <Box sx={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
                            {/* Header bar */}
                            <Box
                              sx={{
                                height: 6,
                                bgcolor: 'rgba(255,255,255,0.9)',
                                borderRadius: 3,
                                mb: 1.5,
                              }}
                            />
                            {/* Content lines */}
                            <Box
                              sx={{
                                height: 4,
                                bgcolor: 'rgba(255,255,255,0.7)',
                                borderRadius: 2,
                                width: '80%',
                                mb: 1,
                              }}
                            />
                            <Box
                              sx={{
                                height: 4,
                                bgcolor: 'rgba(255,255,255,0.5)',
                                borderRadius: 2,
                                width: '60%',
                              }}
                            />
                          </Box>
                          
                          {/* Mock buttons */}
                          <Box sx={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 1 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 8,
                                bgcolor: 'rgba(255,255,255,0.9)',
                                borderRadius: 4,
                              }}
                            />
                            <Box
                              sx={{
                                width: 24,
                                height: 8,
                                bgcolor: 'rgba(255,255,255,0.7)',
                                borderRadius: 4,
                              }}
                            />
                          </Box>
                        </Box>

                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          {/* Color palette preview */}
                          <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'center' }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                bgcolor: theme.preview,
                                borderRadius: '50%',
                                border: '2px solid #fff',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                              }}
                            />
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                bgcolor: theme.theme.palette.secondary.main,
                                borderRadius: '50%',
                                border: '2px solid #fff',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                              }}
                            />
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                bgcolor: theme.theme.palette.background.default,
                                borderRadius: '50%',
                                border: '2px solid #fff',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                              }}
                            />
                          </Stack>

                          {/* Theme color indicator */}
                          <Box
                            sx={{
                              width: '100%',
                              height: 4,
                              borderRadius: 2,
                              background: `linear-gradient(90deg, ${theme.preview} 0%, ${theme.theme.palette.secondary.main} 100%)`,
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Theme preview legend */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Click any theme to preview • Click "Save Settings" to apply changes
                  </Typography>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SimpleThemeSelector; 