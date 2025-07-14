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
    // Add a small delay to ensure auth state is fully loaded
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        // Store the current path so user can be redirected back after authentication
        const currentPath = window.location.pathname;
        sessionStorage.setItem('intendedPath', currentPath);
        console.log(`Storing intended path for redirect: ${currentPath}`);
        
        // Not authenticated - redirect to login
        router.push(`/${identifier}`);
        return;
      }

      if (!isLoading && isAuthenticated && user) {
        const userRole = user.role;
        console.log('RoleBasedRoute - User data:', user);
        console.log('RoleBasedRoute - User role:', userRole);
        console.log('RoleBasedRoute - Allowed roles:', allowedRoles);
        console.log('RoleBasedRoute - Current path:', window.location.pathname);

        // If allowedRoles is specified and user role is not allowed
        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
          // Determine redirect path based on user role
          let defaultRedirectPath = redirectPath;
          
          if (!defaultRedirectPath) {
            if (userRole === 'visitor') {
              defaultRedirectPath = `/${identifier}/event-admin/dashboard/visitor_dashboard`;
            } else if (userRole === 'exhibitor') {
              defaultRedirectPath = `/${identifier}/event-admin/dashboard/exhibitor_dashboard`;
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
    }, 100); // Small delay to ensure auth state is loaded

    return () => clearTimeout(timer);
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