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
} from "@mui/material";
import { Event, ArrowForward, Email, ContactSupport } from "@mui/icons-material";

export default function HomePage() {
  const router = useRouter();
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
    "EXPO2024", 
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
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Card sx={{ textAlign: "center", p: 4 }}>
              <CardContent>
                <Event sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
                
                <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                  Event Management Portal
                </Typography>

                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                  Welcome to the AI Matchmaking Event Platform
                </Typography>

                <Paper sx={{ p: 3, mb: 4, bgcolor: "grey.50" }}>
                  <ContactSupport sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Access Required
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    You need a direct link with your event identifier to access this portal.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    The correct URL format should be:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ mb: 3, p: 1, bgcolor: "grey.100", borderRadius: 1 }}>
                    {appUrl || 'https://xpomatch-dev-event-admin-portal.azurewebsites.net'}/<strong>[EVENT-ID]</strong>
                  </Typography>
                  
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
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
                      size="large"
                    >
                      Contact Administrator
                    </Button>
                  </Stack>
                </Paper>

                <Typography variant="body2" color="text.secondary">
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
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card sx={{ textAlign: "center", p: 4 }}>
            <CardContent>
              <Event sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
              
              <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                Event Management Portal
              </Typography>
              
              <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: "bold" }}>
                🚧 DEVELOPMENT MODE - Demo Identifiers Available
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Welcome to the multi-tenant event management system
              </Typography>

              <Paper sx={{ p: 3, mb: 4, bgcolor: "grey.50" }}>
                <Typography variant="body1" gutterBottom>
                  <strong>To access your event, you need an Event Identifier.</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Each event has a unique identifier. Please use the correct URL format:
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ mt: 1 }}>
                  https://yourdomain.com/<strong>[EVENT-ID]</strong>
                </Typography>
              </Paper>

              <Typography variant="h6" gutterBottom>
                Demo Event Identifiers:
              </Typography>

              <Stack spacing={2} direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "center", flexWrap: "wrap", gap: 2 }}>
                {demoIdentifiers.map((identifier) => (
                  <Button
                    key={identifier}
                    variant="outlined"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => handleIdentifierClick(identifier)}
                    sx={{
                      minWidth: 140,
                      fontWeight: "bold",
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

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                Don't have an event identifier? Contact your event administrator.
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
