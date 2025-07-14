'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'next/navigation';
import { AppDispatch } from '@/store';
import { restoreAuthState } from '@/store/slices/authSlice';

export default function AuthRestorer() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const identifier = params?.identifier as string;

  useEffect(() => {
    if (identifier && typeof window !== 'undefined') {
      // Check if we have stored auth data
      const token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      console.log('AuthRestorer - Checking for stored auth data:', {
        hasToken: !!token,
        hasUser: !!userStr,
        identifier
      });
      
      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
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