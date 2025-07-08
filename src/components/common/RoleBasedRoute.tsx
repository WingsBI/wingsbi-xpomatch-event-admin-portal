'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Box, CircularProgress, Typography } from '@mui/material';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}

export default function RoleBasedRoute({ 
  children, 
  allowedRoles = [], 
  redirectPath 
}: RoleBasedRouteProps) {
  const router = useRouter();
  const params = useParams();
  const identifier = params?.identifier as string;
  
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Not authenticated - redirect to login
      router.push(`/${identifier}`);
      return;
    }

    if (!isLoading && isAuthenticated && user) {
      const userRole = user.role;

      // If allowedRoles is specified and user role is not allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // Determine redirect path based on user role
        let defaultRedirectPath = redirectPath;
        
        if (!defaultRedirectPath) {
          if (userRole === 'visitor') {
            defaultRedirectPath = `/${identifier}/event-admin/visitors`;
          } else if (userRole === 'exhibitor') {
            defaultRedirectPath = `/${identifier}/event-admin/exhibitors`;
          } else if (userRole === 'event-admin') {
            defaultRedirectPath = `/${identifier}/event-admin/dashboard`;
          } else {
            defaultRedirectPath = `/${identifier}`;
          }
        }
        
        console.log(`User role '${userRole}' not allowed for this route. Redirecting to: ${defaultRedirectPath}`);
        router.push(defaultRedirectPath);
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, redirectPath, identifier, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">
          Checking permissions...
        </Typography>
      </Box>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render children if user role is not allowed
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
} 