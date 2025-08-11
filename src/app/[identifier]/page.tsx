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
import { loginUser, restoreAuthState, clearAuth } from "@/store/slices/authSlice";
import { addNotification, setIdentifier } from "@/store/slices/appSlice";
import { clearAllAuthData, isValidUserData, getAuthenticationStatus } from '@/utils/authUtils';
import { getUserData } from '@/utils/cookieManager';

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
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Redux state
  const { responsive, ui } = useSelector((state: RootState) => state.app);
  const { user, isAuthenticated, isLoading: authLoading } = useSelector((state: RootState) => state.auth);

  // Legacy auth context for compatibility (removed - using Redux only)

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
    
    // One-time cleanup of any persisted auth state for security
    if (typeof localStorage !== 'undefined') {
      const persistedState = localStorage.getItem('persist:root');
      if (persistedState) {
        try {
          const parsed = JSON.parse(persistedState);
          if (parsed.auth) {
            console.log("Clearing old persisted auth state for security");
            delete parsed.auth;
            localStorage.setItem('persist:root', JSON.stringify(parsed));
          }
        } catch (error) {
          // If parsing fails, remove the entire persisted state
          console.log("Clearing corrupted persisted state");
          localStorage.removeItem('persist:root');
        }
      }
    }
  }, [identifier, dispatch]);

  // Try to restore authentication state on page load
  useEffect(() => {
    const restoreAuth = async () => {
      // First, check if we already have valid authentication
      if (isAuthenticated && user && isValidUserData(user)) {
        console.log("User already authenticated with valid data");
        return;
      }

      // Check authentication status
      const authStatus = getAuthenticationStatus();
      console.log("Authentication status:", authStatus);

      // If we don't have valid stored data, clear everything
      if (!authStatus.isValid) {
        console.log("No valid authentication data found, clearing all stored data");
        clearAllAuthData();
        return;
      }

      // Automatically restore authentication if we have valid stored data
      if (authStatus.hasLocalStorageToken && identifier) {
        console.log("Found stored token, attempting to restore authentication...");
        
        // Validate and restore using Redux action
        try {
          await dispatch(restoreAuthState(identifier)).unwrap();
          console.log("Authentication successfully restored from stored data");
          
          // Check if this is the main page and user should be redirected to their dashboard
          // Only redirect if user directly visited the main page, not if they were redirected here
          const currentPath = window.location.pathname;
          const isMainPage = currentPath === `/${identifier}` || currentPath === `/${identifier}/`;
          const referrer = document.referrer;
          const isExternalReferrer = !referrer || !referrer.includes(window.location.origin);
          
          if (isMainPage && isExternalReferrer) {
            // User directly visited the main page, redirect to their dashboard
            const userData = getUserData();
            if (userData && userData.role) {
              let redirectPath = `/${identifier}/event-admin/dashboard`; // Default
              
              if (userData.role === "visitor") {
                redirectPath = `/${identifier}/event-admin/exhibitors`;
              } else if (userData.role === "exhibitor") {
                redirectPath = `/${identifier}/event-admin/visitors`;
              }
              
              console.log("User directly visited main page, redirecting to dashboard:", redirectPath);
              setIsRedirecting(true);
              router.push(redirectPath);
              return;
            }
          } else if (isMainPage && !isExternalReferrer) {
            // User was redirected here from another page in the app, redirect them back
            const intendedPath = sessionStorage.getItem('intendedPath');
            if (intendedPath && intendedPath !== currentPath) {
              console.log("User was redirected here, sending back to intended path:", intendedPath);
              sessionStorage.removeItem('intendedPath');
              setIsRedirecting(true);
              router.push(intendedPath);
              return;
            }
          }
          
        } catch (error) {
          console.log("Failed to restore authentication, clearing stored data:", error);
          clearAllAuthData();
        }
      }
    };

    restoreAuth();
  }, [isAuthenticated, authLoading, identifier, dispatch, user]);

  // Cleanup redirecting state if navigation doesn't happen
  useEffect(() => {
    if (isRedirecting) {
      const timer = setTimeout(() => {
        console.log("Redirect timeout - resetting redirecting state");
        setIsRedirecting(false);
        setHasJustLoggedIn(false);
      }, 3000); // Reset after 3 seconds if redirect doesn't complete

      return () => clearTimeout(timer);
    }
  }, [isRedirecting]);

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    // Only redirect if user just logged in successfully through the form
    // This prevents automatic redirects when users visit the page directly
    if (isAuthenticated && user && isValidUserData(user) && hasJustLoggedIn && !isRedirecting) {
      const userRole = user.role;
      let redirectPath = `/${identifier}/event-admin/dashboard`; // Default
      
      if (userRole === "visitor") {
        redirectPath = `/${identifier}/event-admin/dashboard/visitor_dashboard`;
      } else if (userRole === "exhibitor") {
        redirectPath = `/${identifier}/event-admin/dashboard/exhibitor_dashboard`;
      }
      
      console.log("User just logged in successfully, redirecting to:", redirectPath);
      console.log("User data:", { id: user.id, email: user.email, role: user.role });
      setIsRedirecting(true);
      router.push(redirectPath);
    } else if (isAuthenticated && (!user || !isValidUserData(user))) {
      // If authenticated but no valid user data, something is wrong - clear auth
      console.log("Authenticated but invalid user data found - clearing authentication");
      clearAllAuthData();
      // Force logout in Redux
      dispatch(clearAuth());
    } else if (isAuthenticated && user && isValidUserData(user) && !hasJustLoggedIn) {
      // If user is authenticated but didn't just login, they might have valid session
      // But we should validate this session before redirecting
      console.log("User appears authenticated from previous session, validating...");
      
      // Validate current session using localStorage (compatible with Azure API system)
      try {
        const token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const userData = JSON.parse(userStr);
          
          if (userData && userData.id && userData.email && isValidUserData(userData)) {
            // Basic token validation (check if it's a JWT)
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              console.log("Session validated, user can stay authenticated");
              // Session is valid, user can continue to be authenticated
              // But don't auto-redirect them - let them use the login form if they want
            } else {
              console.log("Invalid token format, clearing authentication");
              clearAllAuthData();
              dispatch(clearAuth());
            }
          } else {
            console.log("Invalid user data, clearing authentication");
            clearAllAuthData();
            dispatch(clearAuth());
          }
        } else {
          console.log("No valid authentication data found, clearing authentication");
          clearAllAuthData();
          dispatch(clearAuth());
        }
      } catch (error) {
        console.error("Session validation error:", error);
        clearAllAuthData();
        dispatch(clearAuth());
      }
    }
  }, [isAuthenticated, user, hasJustLoggedIn, isRedirecting, identifier, router, dispatch]);

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

      // Set flag to prevent logout on redirect
      setHasJustLoggedIn(true);

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

      // Determine redirect path based on user role
      let redirectPath = `/${identifier}/event-admin/dashboard`; // Default for event admin
      
      if (result.user) {
        const userRole = result.user.role;
        
        console.log("User role:", userRole);
        
        // Role-based routing
        if (userRole === "visitor") {
          // Visitors should see the list of exhibitors
          redirectPath = `/${identifier}/event-admin/dashboard/visitor_dashboard`;
        } else if (userRole === "exhibitor") {
          // Exhibitors should see the list of visitors
          redirectPath = `/${identifier}/event-admin/dashboard/exhibitor_dashboard`;
        }
        // Event admins and IT admins go to dashboard by default
      }
      
      console.log("Redirecting to:", redirectPath);
      
      // Set redirecting state to show loading during redirect
      setIsRedirecting(true);
      
      // Immediate redirect without delay for better UX
      router.push(redirectPath);
      console.log("Router.push called for:", redirectPath);

    } catch (err: any) {
      console.error("Redux login error:", err);
      console.log("=== LOGIN ERROR ===", err);
      setError(err.message || "Login failed. Please try again.");
      
      dispatch(addNotification({
        type: 'error',
        message: err.message || "Login failed. Please try again.",
      }));
      
      // Reset the flags on error
      setHasJustLoggedIn(false);
      setIsRedirecting(false);
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

  if (authLoading || isSubmitting || isRedirecting) {
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
            {isSubmitting ? "Signing in..." : isRedirecting ? "Redirecting..." : "Loading..."}
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