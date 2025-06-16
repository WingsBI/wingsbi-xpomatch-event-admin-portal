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
  const { currentThemeName, themes, setTheme, currentFontFamily, fontFamilies, setFontFamily } = useSimpleTheme();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleThemeSelect = (themeName: string) => {
    setTheme(themeName);
  };

  const handleFontSelect = (fontFamily: string) => {
    setFontFamily(fontFamily);
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

  const ThemePreviewCard = ({ themeName, themeData, isSelected }: {
    themeName: string;
    themeData: typeof themes.default;
    isSelected: boolean;
  }) => (
    <Card
      sx={{
        cursor: 'pointer',
        border: isSelected ? '3px solid' : '2px solid transparent',
        borderColor: isSelected ? 'primary.main' : 'transparent',
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => handleThemeSelect(themeName)}
    >
      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            bgcolor: 'primary.main',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check sx={{ fontSize: 16, color: 'white' }} />
        </Box>
      )}
      
      <CardContent sx={{ p: 2 }}>
        {/* Theme Preview */}
        <Box sx={{ mb: 2 }}>
          <Paper
            sx={{
              height: 80,
              background: `linear-gradient(135deg, ${themeData.preview} 0%, ${themeData.theme.palette.secondary.main} 100%)`,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Mock UI Elements */}
            <Box sx={{ position: 'absolute', top: 8, left: 8, right: 8 }}>
              <Box
                sx={{
                  height: 4,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  borderRadius: 2,
                  mb: 1,
                }}
              />
              <Box
                sx={{
                  height: 3,
                  bgcolor: 'rgba(255,255,255,0.7)',
                  borderRadius: 2,
                  width: '70%',
                  mb: 1,
                }}
              />
              <Box
                sx={{
                  height: 3,
                  bgcolor: 'rgba(255,255,255,0.5)',
                  borderRadius: 2,
                  width: '50%',
                }}
              />
            </Box>
            
            {/* Mock buttons */}
            <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 0.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 8,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  borderRadius: 1,
                }}
              />
              <Box
                sx={{
                  width: 20,
                  height: 8,
                  bgcolor: 'rgba(255,255,255,0.7)',
                  borderRadius: 1,
                }}
              />
            </Box>
          </Paper>
        </Box>

        {/* Theme Info */}
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
          {themeData.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          {themeData.description}
        </Typography>

        {/* Color Chips */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              bgcolor: themeData.theme.palette.primary.main,
              borderRadius: '50%',
              border: '1px solid #ccc',
            }}
          />
          <Box
            sx={{
              width: 16,
              height: 16,
              bgcolor: themeData.theme.palette.secondary.main,
              borderRadius: '50%',
              border: '1px solid #ccc',
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {themeData.theme.palette.mode === 'dark' ? 'Dark' : 'Light'}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );

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
                  Theme Selection
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {Object.entries(themes).map(([key, theme]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Card
                      onClick={() => handleThemeSelect(key)}
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        backgroundColor: 'background.paper',
                        border: currentThemeName === key 
                          ? `2px solid ${theme.preview}` 
                          : '1px solid',
                        borderColor: currentThemeName === key ? theme.preview : 'divider',
                        boxShadow: currentThemeName === key
                          ? 2
                          : 1,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                          borderColor: theme.preview,
                        },
                      }}
                    >
                      {/* Theme Preview Header */}
                      <Box
                        sx={{
                          height: 60,
                          backgroundColor: theme.preview,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {/* Simple theme color indicator */}
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                          }}
                        />
                      </Box>

                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight={600}
                            sx={{ 
                              fontSize: '1rem',
                            }}
                          >
                            {theme.name}
                          </Typography>
                          {currentThemeName === key && (
                            <Chip
                              icon={<Check sx={{ fontSize: 16 }} />}
                              label="Active"
                              size="small"
                              sx={{
                                backgroundColor: theme.preview,
                                color: 'white',
                                fontWeight: 500,
                                '& .MuiChip-icon': { color: 'white' },
                              }}
                            />
                          )}
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            lineHeight: 1.4,
                            fontSize: '0.875rem',
                          }}
                        >
                          {theme.description}
                        </Typography>

                        {/* Mini preview elements */}
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Box
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 1,
                              background: `${theme.preview}20`,
                            }}
                          />
                          <Box
                            sx={{
                              flex: 0.7,
                              height: 6,
                              borderRadius: 1,
                              background: `${theme.preview}40`,
                            }}
                          />
                          <Box
                            sx={{
                              flex: 0.5,
                              height: 6,
                              borderRadius: 1,
                              background: theme.preview,
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SimpleThemeSelector; 