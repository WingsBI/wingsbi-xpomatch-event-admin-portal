'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Palette,
  Check,
  Close,
  TextFields,
} from '@mui/icons-material';
import { useSimpleTheme } from '@/context/SimpleThemeContext';

interface SimpleThemeSelectorProps {
  variant?: 'icon' | 'button';
  showLabel?: boolean;
}

export function SimpleThemeSelector({ variant = 'icon', showLabel = false }: SimpleThemeSelectorProps) {
  const [open, setOpen] = useState(false);
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

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
                Customize Your Experience
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose from our premium themes and fonts
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleClose}
            sx={{ 
              background: 'rgba(0, 0, 0, 0.05)',
              '&:hover': { background: 'rgba(0, 0, 0, 0.1)' }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* Event Admin Default Theme Notice */}
          {themeSettings.isThemeAssigned && (
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
                      Default Theme from IT Administrator
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your IT Administrator set a default theme for your event. You can customize it as needed.
                    </Typography>
                  </Box>
                </Box>
                
                {themeSettings.themeConfig && (
                  <Box sx={{ pl: 5 }}>
                    <Stack direction="row" spacing={3}>
                      <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          DEFAULT THEME
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {themeSettings.themeConfig.themeName}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          DEFAULT FONT
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {themeSettings.themeConfig.fontName}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          ASSIGNED DATE
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {new Date(themeSettings.themeConfig.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Paper>
          )}

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
                  Click any theme to preview and apply
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SimpleThemeSelector; 