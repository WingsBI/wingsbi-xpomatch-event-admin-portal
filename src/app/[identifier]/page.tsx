"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";
import {
  Lock,
  Visibility,
  VisibilityOff,
  Email,
  Smartphone,
  Laptop,
  DesktopWindows,
  Tv,
  TouchApp,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { RootState, AppDispatch } from "@/store";
import { loginUser } from "@/store/slices/authSlice";
import { addNotification, setIdentifier } from "@/store/slices/appSlice";

// Define color themes
const colorThemes = {
  deepBlueTeal: {
    name: "Deep Blue & Teal",
    background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
    cardHeader: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
    button: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
    buttonHover: "linear-gradient(135deg, #0e7490 0%, #164e63 100%)",
    shadowColor: "rgba(8, 145, 178, 0.4)",
    shadowColorHover: "rgba(8, 145, 178, 0.5)",
  },
};

export default function EventLoginPage() {
  const params = useParams();
  const identifier = params.identifier as string;
  
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("deepBlueTeal");

  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Redux state
  const { responsive, ui } = useSelector((state: RootState) => state.app);
  const { user, isAuthenticated, isLoading: authLoading } = useSelector((state: RootState) => state.auth);

  // Legacy auth context for compatibility
  const { login, logout, isAuthenticated: legacyAuth, isLoading: legacyLoading } = useAuth();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Get current theme
  const currentTheme = colorThemes[selectedTheme as keyof typeof colorThemes];

  
  // Set identifier in Redux store when component mounts
  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  // Clear authentication when visiting login page
  useEffect(() => {
    if (isAuthenticated || legacyAuth) {
      logout(); // Clear legacy authentication to show login form
    }
  }, [isAuthenticated, legacyAuth, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    console.log("=== LOGIN DEBUG START ===");
    console.log("Login attempt with identifier:", identifier);
    console.log("Credentials:", { email: credentials.email, password: "***" });

    if (!credentials.email || !credentials.password) {
      setError("Please enter both email and password");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Sending login request with Redux...");

      // Use Redux for login with simplified credentials
      const result = await dispatch(loginUser({
        email: credentials.email,
        password: credentials.password,
        identifier: identifier,
      })).unwrap();

      console.log("Redux login result:", result);
      console.log("Login successful, preparing redirect...");

      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'Login successful! Redirecting...',
      }));

      // Redirect to dashboard for this event
      const redirectPath = `/${identifier}/event-admin/dashboard`;
      console.log("Redirecting to:", redirectPath);
      
      // Add a small delay to ensure state updates
      setTimeout(() => {
        router.push(redirectPath);
        console.log("Router.push called for:", redirectPath);
      }, 100);

    } catch (err: any) {
      console.error("Redux login error:", err);
      console.log("=== LOGIN ERROR ===", err);
      setError(err.message || "Login failed. Please try again.");
      
      dispatch(addNotification({
        type: 'error',
        message: err.message || "Login failed. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
      console.log("=== LOGIN DEBUG END ===");
    }
  };

  const handleChange =
    (field: "email" | "password") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCredentials((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
      // Clear error when user starts typing
      if (error) setError("");
    };

  // Quick demo login function
  const handleDemoLogin = (email: string, password: string) => {
    setCredentials({ email, password });
    setError("");
  };

  if (authLoading || legacyLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: currentTheme.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h6" color="white">
            Loading...
          </Typography>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: currentTheme.background,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease-in-out",
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%)",
          zIndex: 0,
        }}
      />

      <Container 
        maxWidth="lg" 
        sx={{ 
          position: "relative", 
          zIndex: 1, 
          pt: { xs: 14, md: 18 }, // Reduced padding to prevent scroll
          pb: { xs: 6, md: 8 },   // Reduced bottom padding
          minHeight: "calc(100vh - 80px)", // Reduced height to prevent scroll
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center"
        }}
      >

        <Grid container spacing={4} alignItems="flex-start" justifyContent="center" sx={{ width: "100%" }}>
          {/* Left side - Event info for larger screens */}
          {!isMobile && (
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                style={{ marginTop: '-10px' }} // Move left content upward
              >
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    color: "white",
                    fontWeight: 800,
                    mb: 3,
                    fontSize: { xs: "2rem", md: "2.75rem", lg: "3rem" }, // Slightly smaller
                    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {identifier} Event Portal
                </Typography>
                
                <Typography
                  variant="h6"
                  sx={{
                    color: "rgba(255, 255, 255, 0.9)",
                    mb: 4,
                    lineHeight: 1.6,
                  }}
                >
                  Welcome to the {identifier} event portal. Sign in as an event administrator to manage visitors, exhibitors, and event details.
                </Typography>

              </motion.div>
            </Grid>
          )}

          {/* Right side - Login form */}
          <Grid item xs={12} md={isMobile ? 12 : 6}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {/* Header for mobile */}
              {isMobile && (
                <Box textAlign="center" mb={4}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      color: "white",
                      fontWeight: 800,
                      mb: 2,
                      fontSize: "2.5rem",
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {identifier} Portal
                  </Typography>
                </Box>
              )}

              {/* Login Card */}
              <Card
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  backdropFilter: "blur(10px)",
                  bgcolor: "rgba(255, 255, 255, 0.95)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                  maxWidth: 500,
                  mx: "auto",
                  transition: "all 0.3s ease-in-out",
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    background: currentTheme.cardHeader,
                    p: { xs: 2, md: 3 },
                    color: "white",
                    textAlign: "center",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    Sign In
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Welcome to {identifier}
                  </Typography>
                </Box>

                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <form onSubmit={handleSubmit}>
                    {/* Error Alert */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                            {error}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email Field */}
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      size={isMobile ? "medium" : "small"}
                      value={credentials.email}
                      onChange={handleChange("email")}
                      placeholder="Enter your email"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        mb: 3,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "rgba(0,0,0,0.02)",
                          minHeight: isMobile ? 56 : 48,
                        },
                      }}
                      disabled={isSubmitting}
                      required
                    />

                    {/* Password Field */}
                    <TextField
                      fullWidth
                      label="Password"
                      size={isMobile ? "medium" : "small"}
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={handleChange("password")}
                      placeholder="Enter your password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              disabled={isSubmitting}
                              size="small"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        mb: 4,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "rgba(0,0,0,0.02)",
                          minHeight: isMobile ? 56 : 48,
                        },
                      }}
                      disabled={isSubmitting}
                      required
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{
                        py: { xs: 2, md: 1.5 },
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: { xs: "1.1rem", md: "1rem" },
                        minHeight: { xs: 56, md: 48 },
                        background: currentTheme.button,
                        boxShadow: `0 4px 20px ${currentTheme.shadowColor}`,
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                          background: currentTheme.buttonHover,
                          boxShadow: `0 6px 25px ${currentTheme.shadowColorHover}`,
                        },
                      }}
                    >
                      {isSubmitting ? "Signing In..." : "Sign In to Event Portal"}
                    </Button>

                    {/* Quick demo buttons for mobile */}
                    {isMobile && (
                      <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          onClick={() => handleDemoLogin("ritesh.ramilkanthwar@gmail.com", "kOZoO@O!")}
                          disabled={isSubmitting}
                        >
                          Test API
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleDemoLogin("eventadmin@example.com", "event123")}
                          disabled={isSubmitting}
                        >
                          Demo
                        </Button>
                      </Box>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Footer below login card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Box textAlign="center" mt={3}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      fontSize: "0.875rem",
                    }}
                  >
                    © 2025 {identifier} Event Portal. All rights reserved.
                  </Typography>
                </Box>
              </motion.div>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 