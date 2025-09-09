"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Event, ArrowForward, Email, ContactSupport } from "@mui/icons-material";

export default function HomePage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // For testing: Add ?mode=production to URL to test production view on localhost
  const [showProductionView, setShowProductionView] = React.useState(false);
  
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'production') {
      setShowProductionView(true);
    }
  }, []);
  
  // Get environment variables
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.CONTACT_EMAIL || 'contact@wingsbi.com';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Example identifiers for demo (only for development)
  const demoIdentifiers = [
    "AIE987654",
    "STYLE2025", 
    "TECH2024",
    "DEMO2024"
  ];

  const handleIdentifierClick = (identifier: string) => {
    router.push(`/${identifier}`);
  };

  // Production content
  if (!isDevelopment || showProductionView) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
          display: "flex",
          alignItems: "center",
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1, sm: 2 },
        }}
      >
        <Container 
          maxWidth="md"
          sx={{
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Card 
              sx={{ 
                textAlign: "center", 
                p: { xs: 2, sm: 3, md: 4 },
                borderRadius: { xs: 2, sm: 3 },
                boxShadow: { xs: 3, sm: 6 },
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
                <Event 
                  sx={{ 
                    fontSize: { xs: 48, sm: 56, md: 64 }, 
                    color: "secondary.main", 
                    mb: { xs: 1, sm: 2 } 
                  }} 
                />
                
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  fontWeight="bold"
                  sx={{
                    fontSize: { 
                      xs: '1.75rem', 
                      sm: '2.25rem', 
                      md: '3rem' 
                    },
                    lineHeight: { xs: 1.2, sm: 1.3 },
                    wordBreak: 'break-word',
                  }}
                >
                  Event Management Portal
                </Typography>

                <Typography 
                  variant="h6" 
                  color="text.secondary" 
                  sx={{ 
                    mb: { xs: 3, sm: 4 },
                    fontSize: { 
                      xs: '1rem', 
                      sm: '1.125rem', 
                      md: '1.25rem' 
                    },
                    px: { xs: 0, sm: 2 },
                    lineHeight: { xs: 1.4, sm: 1.5 },
                  }}
                >
                  Welcome to the AI Matchmaking Event Platform
                </Typography>

                <Paper 
                  sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    mb: { xs: 3, sm: 4 }, 
                    bgcolor: "grey.50",
                    borderRadius: { xs: 1, sm: 2 },
                  }}
                >
                  <ContactSupport 
                    sx={{ 
                      fontSize: { xs: 40, sm: 48 }, 
                      color: "secondary.main", 
                      mb: { xs: 1, sm: 2 } 
                    }} 
                  />
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      fontSize: { 
                        xs: '1.125rem', 
                        sm: '1.25rem' 
                      },
                      lineHeight: { xs: 1.3, sm: 1.4 },
                    }}
                  >
                    Access Required
                  </Typography>
                  <Typography 
                    variant="body1" 
                    gutterBottom
                    sx={{
                      fontSize: { 
                        xs: '0.875rem', 
                        sm: '1rem' 
                      },
                      px: { xs: 0, sm: 1 },
                      lineHeight: { xs: 1.5, sm: 1.6 },
                    }}
                  >
                    You need a direct link with your event identifier to access this portal.
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      fontSize: { 
                        xs: '0.75rem', 
                        sm: '0.875rem' 
                      },
                      lineHeight: { xs: 1.4, sm: 1.5 },
                    }}
                  >
                    The correct URL format should be:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontFamily="monospace" 
                    sx={{ 
                      mb: 3, 
                      p: { xs: 1, sm: 1.5 }, 
                      bgcolor: "grey.100", 
                      borderRadius: 1,
                      fontSize: { 
                        xs: '0.7rem', 
                        sm: '0.875rem' 
                      },
                      wordBreak: 'break-all',
                      lineHeight: { xs: 1.3, sm: 1.4 },
                    }}
                  >
                    {appUrl || 'https://xpomatch-dev-event-admin-portal.azurewebsites.net'}/<strong>[EVENT-ID]</strong>
                  </Typography>
                  
                  <Stack 
                    direction={{ xs: "column", sm: "row" }} 
                    spacing={2} 
                    justifyContent="center"
                    sx={{ 
                      gap: { xs: 1.5, sm: 2 },
                      alignItems: 'center',
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<Email />}
                      onClick={() => {
                        const emailUrl = `mailto:${contactEmail}?subject=Event Access Request&body=Hello,%0D%0A%0D%0AI need access to an event on the platform. Please provide me with the correct event identifier link.%0D%0A%0D%0AThank you!`;
                        console.log('Opening email:', emailUrl);
                        try {
                          window.location.href = emailUrl;
                        } catch (error) {
                          console.error('Failed to open email client:', error);
                          // Fallback: copy email to clipboard
                          navigator.clipboard.writeText(contactEmail).then(() => {
                            alert(`Email client not available. Contact email copied to clipboard: ${contactEmail}`);
                          }).catch(() => {
                            alert(`Please contact: ${contactEmail}`);
                          });
                        }
                      }}
                      size={isMobile ? "medium" : "large"}
                      sx={{
                        fontSize: { 
                          xs: '0.875rem', 
                          sm: '1rem' 
                        },
                        px: { xs: 2, sm: 3 },
                        py: { xs: 1, sm: 1.5 },
                        minWidth: { xs: '200px', sm: 'auto' },
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Contact Administrator
                    </Button>
                  </Stack>
                </Paper>

                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { 
                      xs: '0.75rem', 
                      sm: '0.875rem' 
                    },
                    px: { xs: 1, sm: 0 },
                    lineHeight: { xs: 1.4, sm: 1.5 },
                  }}
                >
                  If you received an email invitation, please use the direct link provided in that email.
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </Box>
    );
  }

  // Development content (existing demo functionality)
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
        display: "flex",
        alignItems: "center",
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Container 
        maxWidth="md"
        sx={{
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card 
            sx={{ 
              textAlign: "center", 
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: { xs: 2, sm: 3 },
              boxShadow: { xs: 3, sm: 6 },
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
              <Event 
                sx={{ 
                  fontSize: { xs: 48, sm: 56, md: 64 }, 
                  color: "secondary.main", 
                  mb: { xs: 1, sm: 2 } 
                }} 
              />
              
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                fontWeight="bold"
                sx={{
                  fontSize: { 
                    xs: '1.75rem', 
                    sm: '2.25rem', 
                    md: '3rem' 
                  },
                  lineHeight: { xs: 1.2, sm: 1.3 },
                  wordBreak: 'break-word',
                }}
              >
                Event Management Portal
              </Typography>
              
              <Typography 
                variant="body2" 
                color="error" 
                sx={{ 
                  mb: 2, 
                  fontWeight: "bold",
                  fontSize: { 
                    xs: '0.75rem', 
                    sm: '0.875rem' 
                  },
                  lineHeight: { xs: 1.3, sm: 1.4 },
                }}
              >
                🚧 DEVELOPMENT MODE - Demo Identifiers Available
              </Typography>

              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  mb: { xs: 3, sm: 4 },
                  fontSize: { 
                    xs: '1rem', 
                    sm: '1.125rem', 
                    md: '1.25rem' 
                  },
                  px: { xs: 0, sm: 2 },
                  lineHeight: { xs: 1.4, sm: 1.5 },
                }}
              >
                Welcome to the multi-tenant event management system
              </Typography>

              <Paper 
                sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  mb: { xs: 3, sm: 4 }, 
                  bgcolor: "grey.50",
                  borderRadius: { xs: 1, sm: 2 },
                }}
              >
                <Typography 
                  variant="body1" 
                  gutterBottom
                  sx={{
                    fontSize: { 
                      xs: '0.875rem', 
                      sm: '1rem' 
                    },
                    lineHeight: { xs: 1.5, sm: 1.6 },
                  }}
                >
                  <strong>To access your event, you need an Event Identifier.</strong>
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { 
                      xs: '0.75rem', 
                      sm: '0.875rem' 
                    },
                    lineHeight: { xs: 1.4, sm: 1.5 },
                  }}
                >
                  Each event has a unique identifier. Please use the correct URL format:
                </Typography>
                <Typography 
                  variant="body2" 
                  fontFamily="monospace" 
                  sx={{ 
                    mt: 1,
                    fontSize: { 
                      xs: '0.7rem', 
                      sm: '0.875rem' 
                    },
                    wordBreak: 'break-all',
                    lineHeight: { xs: 1.3, sm: 1.4 },
                  }}
                >
                  https://yourdomain.com/<strong>[EVENT-ID]</strong>
                </Typography>
              </Paper>

              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontSize: { 
                    xs: '1.125rem', 
                    sm: '1.25rem' 
                  },
                  lineHeight: { xs: 1.3, sm: 1.4 },
                }}
              >
                Demo Event Identifiers:
              </Typography>

              <Stack 
                spacing={2} 
                direction={{ xs: "column", sm: "row" }} 
                sx={{ 
                  justifyContent: "center", 
                  flexWrap: "wrap", 
                  gap: { xs: 1.5, sm: 2 },
                  alignItems: "center"
                }}
              >
                {demoIdentifiers.map((identifier) => (
                  <Button
                    key={identifier}
                    variant="outlined"
                    size={isMobile ? "medium" : "large"}
                    endIcon={<ArrowForward />}
                    onClick={() => handleIdentifierClick(identifier)}
                    sx={{
                      minWidth: { xs: 140, sm: 160 },
                      fontWeight: "bold",
                      fontSize: { 
                        xs: '0.875rem', 
                        sm: '1rem' 
                      },
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1, sm: 1.5 },
                      whiteSpace: 'nowrap',
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 3,
                      },
                    }}
                  >
                    {identifier}
                  </Button>
                ))}
              </Stack>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mt: { xs: 2, sm: 3 },
                  fontSize: { 
                    xs: '0.75rem', 
                    sm: '0.875rem' 
                  },
                  px: { xs: 1, sm: 0 },
                  lineHeight: { xs: 1.4, sm: 1.5 },
                }}
              >
                Don't have an event identifier? Contact your event administrator.
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
