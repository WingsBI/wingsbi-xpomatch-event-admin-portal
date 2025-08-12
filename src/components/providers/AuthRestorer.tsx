'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'next/navigation';
import { AppDispatch } from '@/store';
import { restoreAuthState } from '@/store/slices/authSlice';
import { getAuthToken, getUserData } from '@/utils/cookieManager';

export default function AuthRestorer() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const identifier = params?.identifier as string;

  useEffect(() => {
    if (identifier && typeof window !== 'undefined') {
      // Check if we have stored auth data
      const token = getAuthToken();
      const userData = getUserData();
      
      console.log('AuthRestorer - Checking for stored auth data:', {
        hasToken: !!token,
        hasUser: !!userData,
        identifier
      });
      
      if (token && userData) {
        try {
          console.log('AuthRestorer - Found user data:', userData);
          
          // Only restore if we have valid data
          if (userData.id && userData.email) {
            console.log('AuthRestorer - Restoring auth state for identifier:', identifier);
            dispatch(restoreAuthState(identifier));
          }
        } catch (error) {
          console.error('AuthRestorer - Error parsing stored user data:', error);
        }
      }
    }
  }, [identifier, dispatch]);

  return null; // This component doesn't render anything
} 