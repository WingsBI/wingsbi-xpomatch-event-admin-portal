'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { RootState } from '@/store';
import { roleBasedDirectoryApi } from '@/services/apiService';

interface RoleAccessPermissions {
  visitor: boolean;
  exhibitor: boolean;
  setMeeting: boolean;
  isFavorite: boolean;
}

interface RoleAccessContextType {
  permissions: RoleAccessPermissions | null;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
}

const RoleAccessContext = createContext<RoleAccessContextType | undefined>(undefined);

export const useRoleAccess = () => {
  const context = useContext(RoleAccessContext);
  if (context === undefined) {
    throw new Error('useRoleAccess must be used within a RoleAccessProvider');
  }
  return context;
};

interface RoleAccessProviderProps {
  children: ReactNode;
}

export function RoleAccessProvider({ children }: RoleAccessProviderProps) {
  const [permissions, setPermissions] = useState<RoleAccessPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use Redux auth state instead of AuthContext
  const { user, isAuthenticated, isLoading: authLoading } = useSelector((state: RootState) => state.auth);
  const params = useParams();
  const identifier = params?.identifier as string;

  const getRoleIdFromUserRole = (role: string): number => {
    console.log('🔍 RoleAccessContext - getRoleIdFromUserRole called with role:', role);
    switch (role) {
      case 'event-admin':
        console.log('🔍 RoleAccessContext - Mapping event-admin to roleId: 1');
        return 1;
      case 'exhibitor':
        console.log('🔍 RoleAccessContext - Mapping exhibitor to roleId: 3');
        return 3;
      case 'visitor':
        console.log('🔍 RoleAccessContext - Mapping visitor to roleId: 4');
        return 4;
      default:
        console.log('🔍 RoleAccessContext - Unknown role, defaulting to roleId: 1');
        return 1; // Default to event-admin
    }
  };

  const fetchRolePermissions = async () => {
    console.log('🔍 RoleAccessContext - fetchRolePermissions called');
    console.log('🔍 RoleAccessContext - isAuthenticated:', isAuthenticated);
    console.log('🔍 RoleAccessContext - user:', user);
    console.log('🔍 RoleAccessContext - identifier:', identifier);
    console.log('🔍 RoleAccessContext - authLoading:', authLoading);
    
    if (!isAuthenticated || !user || !identifier) {
      console.log('❌ RoleAccessContext - Missing required data, skipping API call');
      console.log('❌ RoleAccessContext - isAuthenticated:', isAuthenticated);
      console.log('❌ RoleAccessContext - user exists:', !!user);
      console.log('❌ RoleAccessContext - identifier exists:', !!identifier);
      setPermissions(null);
      return;
    }

    // Only fetch for visitor and exhibitor roles
    if (user.role !== 'visitor' && user.role !== 'exhibitor') {
      console.log('ℹ️ RoleAccessContext - Skipping API call for role:', user.role);
      console.log('ℹ️ RoleAccessContext - Only visitor and exhibitor roles need permission fetching');
      setPermissions(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const roleId = getRoleIdFromUserRole(user.role);
      console.log('🚀 RoleAccessContext - Fetching role permissions for roleId:', roleId, 'user role:', user.role);

      const response = await roleBasedDirectoryApi.getAllRolebaseDirectoryAccessDetails(identifier, roleId);
      console.log('📡 RoleAccessContext - API response:', response);

      if (response.isError) {
        throw new Error(response.message || 'Failed to fetch role permissions');
      }

      const roleData = response.result?.[0];
      if (roleData) {
        const permissions: RoleAccessPermissions = {
          visitor: roleData.visitor || false,
          exhibitor: roleData.exhibitor || false,
          setMeeting: roleData.setMeeting || false,
          isFavorite: roleData.isFavorite || false,
        };

        console.log('✅ RoleAccessContext - Role permissions loaded:', permissions);
        setPermissions(permissions);
      } else {
        console.warn('⚠️ RoleAccessContext - No role data found for roleId:', roleId);
        console.warn('⚠️ RoleAccessContext - Response result:', response.result);
        setPermissions(null);
      }
    } catch (err) {
      console.error('❌ RoleAccessContext - Error fetching role permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPermissions = async () => {
    await fetchRolePermissions();
  };

  // Fetch permissions when user logs in or identifier changes
  useEffect(() => {
    console.log('🔄 RoleAccessContext - useEffect triggered');
    console.log('🔄 RoleAccessContext - isAuthenticated:', isAuthenticated);
    console.log('🔄 RoleAccessContext - user:', user);
    console.log('🔄 RoleAccessContext - identifier:', identifier);
    console.log('🔄 RoleAccessContext - authLoading:', authLoading);
    
    // Wait for authentication to finish loading
    if (authLoading) {
      console.log('⏳ RoleAccessContext - Auth still loading, waiting...');
      return;
    }
    
    if (isAuthenticated && user && identifier) {
      // Add a small delay to ensure authentication state is fully settled
      const timer = setTimeout(() => {
        console.log('🚀 RoleAccessContext - Starting permission fetch after delay');
        fetchRolePermissions();
      }, 500); // 500ms delay
      
      return () => clearTimeout(timer);
    } else {
      console.log('❌ RoleAccessContext - useEffect: Missing required data, clearing permissions');
      console.log('❌ RoleAccessContext - isAuthenticated:', isAuthenticated);
      console.log('❌ RoleAccessContext - user exists:', !!user);
      console.log('❌ RoleAccessContext - identifier exists:', !!identifier);
      setPermissions(null);
    }
  }, [isAuthenticated, user, identifier, authLoading]);

  // Add debug function to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testRoleAccessApi = {
        fetchRolePermissions,
        getCurrentState: () => ({
          isAuthenticated,
          user,
          identifier,
          permissions,
          isLoading,
          error,
          authLoading
        }),
        testApiCall: async (testIdentifier: string, testRoleId: number) => {
          console.log('🧪 Testing API call with:', { testIdentifier, testRoleId });
          try {
            const response = await roleBasedDirectoryApi.getAllRolebaseDirectoryAccessDetails(testIdentifier, testRoleId);
            console.log('🧪 Test API response:', response);
            return response;
          } catch (error) {
            console.error('🧪 Test API error:', error);
            throw error;
          }
        }
      };
      console.log('🔧 Debug functions available: window.testRoleAccessApi');
    }
  }, [isAuthenticated, user, identifier, permissions, isLoading, error, authLoading]);

  const value: RoleAccessContextType = {
    permissions,
    isLoading,
    error,
    refreshPermissions,
  };

  return (
    <RoleAccessContext.Provider value={value}>
      {children}
    </RoleAccessContext.Provider>
  );
}

export default RoleAccessProvider;
