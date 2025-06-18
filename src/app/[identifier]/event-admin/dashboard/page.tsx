"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Stack,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Button,
} from "@mui/material";
import {
  People,
  Business,
  Event,
  TrendingUp,
  Share,
  Edit,
  Visibility,
  Settings,
} from "@mui/icons-material";
import ResponsiveDashboardLayout from "@/components/layouts/ResponsiveDashboardLayout";
import { RootState, AppDispatch } from "@/store";
import { setIdentifier } from "@/store/slices/appSlice";

export default function EventAdminDashboard() {
  const params = useParams();
  const identifier = params.identifier as string;
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  const { responsive } = useSelector((state: RootState) => state.app);

  // Set identifier in Redux store when component mounts
  useEffect(() => {
    if (identifier) {
      dispatch(setIdentifier(identifier));
    }
  }, [identifier, dispatch]);

  // Sample data - in a real app, this would come from API
  const eventStats = {
    totalVisitors: 1247,
    totalExhibitors: 89,
    activeConnections: 156,
    matchingRate: 78,
  };

  const recentActivity = [
    { id: 1, type: "visitor", name: "John Smith", action: "registered", time: "2 minutes ago" },
    { id: 2, type: "exhibitor", name: "Tech Corp", action: "updated profile", time: "5 minutes ago" },
    { id: 3, type: "match", name: "AI Solutions", action: "new match created", time: "8 minutes ago" },
    { id: 4, type: "visitor", name: "Sarah Johnson", action: "checked in", time: "12 minutes ago" },
  ];

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        }
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {trend && (
              <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                <TrendingUp color="success" fontSize="small" />
                <Typography variant="body2" color="success.main">
                  +{trend}% from last week
                </Typography>
              </Stack>
            )}
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: `${color}.main`, 
              width: { xs: 48, md: 56 }, 
              height: { xs: 48, md: 56 } 
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'visitor': return <People fontSize="small" />;
      case 'exhibitor': return <Business fontSize="small" />;
      case 'match': return <TrendingUp fontSize="small" />;
      default: return <Event fontSize="small" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'visitor': return 'primary';
      case 'exhibitor': return 'secondary';
      case 'match': return 'success';
      default: return 'default';
    }
  };

  return (
    <ResponsiveDashboardLayout 
      title={`${identifier} Event Dashboard`}
      breadcrumbs={[
        { label: 'Event Admin', href: `/${identifier}/event-admin` },
        { label: 'Dashboard' }
      ]}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to {identifier} Event Management
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Visitors Overview
                </Typography>
                <Typography variant="h3" color="primary">
                  1,247
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Discover visitors interested in your services (6 total available)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Exhibitors
                </Typography>
                <Typography variant="h3" color="secondary">
                  89
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active exhibitors in the {identifier} event
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ResponsiveDashboardLayout>
  );
} 