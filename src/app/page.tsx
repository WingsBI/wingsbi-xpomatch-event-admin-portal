"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "@mui/material";
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  AccountCircle,
  Palette,
  Email,
} from "@mui/icons-material";
import { SimpleThemeSelector } from "@/components/theme/SimpleThemeSelector";
import { useAuth } from "@/context/AuthContext";

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

export default function HomePage() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("deepBlueTeal");

  const { login, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Get current theme
  const currentTheme = colorThemes[selectedTheme as keyof typeof colorThemes];

  // Clear authentication when visiting homepage to show login form
  useEffect(() => {
    if (isAuthenticated) {
      logout(); // Clear authentication to show login form
    }
  }, [isAuthenticated, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    console.log("Login attempt with:", credentials); // Debug log

    if (!credentials.email || !credentials.password) {
      setError("Please enter both email and password");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Sending login request..."); // Debug log

      const result = await login({
        email: credentials.email,
        password: credentials.password,
        eventId: "EVT001",
        role: "event-admin", // Default role since selector is removed
      });

      console.log("Login result:", result); // Debug log

      if (!result.success) {
        setError(result.error || "Login failed. Please try again.");
      }
      // If successful, the AuthContext will handle the redirect
    } catch (err) {
      console.error("Login error:", err); // Debug log
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
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

  const handleThemeChange = (event: any) => {
    setSelectedTheme(event.target.value);
  };

  // Quick demo login function
  const handleDemoLogin = (email: string, password: string) => {
    setCredentials({ email, password });
    setError("");
  };

  if (isLoading) {
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
        <Typography variant="h6" color="white">
          Loading...
        </Typography>
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

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1, py: 4 }}>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: "white",
              fontWeight: 800,
              mb: 1,
              mt: 3,
              fontSize: { xs: "2rem", md: "2.5rem" },
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            Event Management Portal
          </Typography>
        </Box>

        {/* Login Card */}
        <Card
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            backdropFilter: "blur(10px)",
            bgcolor: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            minHeight: 450,
            // maxWidth: 500,
            mx: "auto",
            mt: 6,
            transition: "all 0.3s ease-in-out",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: currentTheme.cardHeader,
              p: 3,
              color: "white",
              textAlign: "center",
              minHeight: 80,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              transition: "all 0.3s ease-in-out",
            }}
          >
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Sign In
            </Typography>
          </Box>

          <CardContent sx={{ p: 4, minHeight: 320, mt: 2 }}>
            <form onSubmit={handleSubmit}>
              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Email Field */}
              <TextField
                fullWidth
                label="Email"
                type="email"
                size="small"
                value={credentials.email}
                onChange={handleChange("email")}
                placeholder="Enter any email"
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
                    minHeight: 56,
                  },
                }}
                disabled={isSubmitting}
                required
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                size="small"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={handleChange("password")}
                placeholder="Enter any password"
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
                    minHeight: 56,
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
                  py: 2,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "1rem",
                  minHeight: 56,
                  background: currentTheme.button,
                  boxShadow: `0 4px 20px ${currentTheme.shadowColor}`,
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    background: currentTheme.buttonHover,
                    boxShadow: `0 6px 25px ${currentTheme.shadowColorHover}`,
                  },
                }}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box textAlign="center" mt={4}>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            © 2024 Event Management Portal. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
