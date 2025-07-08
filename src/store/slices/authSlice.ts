import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, LoginCredentials } from '@/services/authApi';
import { setIdentifier } from './appSlice';
import { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
}

// Get API base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Async thunks for authentication using the dedicated auth API service
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue, dispatch }) => {
    try {
      const response = await authApi.login(credentials);
      
      if (!response.success) {
        return rejectWithValue(response.error || 'Login failed');
      }
      
      if (!response.data) {
        return rejectWithValue('Invalid response from server');
      }
      
      // Store tokens in both cookies (via API) and localStorage for compatibility
      if (response.data.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('jwtToken', response.data.token);
        localStorage.setItem('authToken', response.data.token);
      }
      if (response.data.refreshToken && typeof localStorage !== 'undefined') {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      // Store user data in localStorage for validation
      if (response.data.user && typeof localStorage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      // Store the identifier for iframe components to use
      if (credentials.identifier) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('currentEventIdentifier', credentials.identifier);
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('currentEventIdentifier', credentials.identifier);
        }
        
        // Update the Redux store identifier
        dispatch(setIdentifier(credentials.identifier));
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async ({ identifier, token }: { identifier: string; token?: string }, { dispatch }) => {
    try {
      // Call logout API to clear cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      const success = response.ok;
      
      // Clear tokens from localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentEventIdentifier');
      }
      
      // Clear stored identifier
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('currentEventIdentifier');
      }
      
      return success;
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear tokens even if logout API fails
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentEventIdentifier');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('currentEventIdentifier');
      }
      
      return false;
    }
  }
);

export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async ({ identifier, refreshToken }: { identifier: string; refreshToken: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.refreshToken(identifier, refreshToken);
      
      if (!response.success) {
        return rejectWithValue(response.error || 'Token refresh failed');
      }
      
      if (!response.data) {
        return rejectWithValue('Invalid response from server');
      }
      
      // Store new tokens in localStorage for compatibility
      if (response.data.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('jwtToken', response.data.token);
        localStorage.setItem('authToken', response.data.token);
      }
      if (response.data.refreshToken && typeof localStorage !== 'undefined') {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Token refresh failed');
    }
  }
);

// Action to restore auth state from localStorage
// This should only be called when explicitly requested, not automatically
export const restoreAuthState = createAsyncThunk(
  'auth/restoreAuthState',
  async (identifier: string, { rejectWithValue }) => {
    try {
      // Only restore if explicitly called - don't auto-restore on app start
      console.log("Explicit auth state restoration requested for identifier:", identifier);
      
      // Try to restore from localStorage - this is compatible with the Azure API system
      if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            
            // Validate that user data is complete
            if (!user.id || !user.email) {
              console.log("Incomplete user data in localStorage");
              return rejectWithValue('Incomplete user data');
            }
            
            // Basic token validation (check if it's a JWT)
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
              console.log("Invalid token format in localStorage");
              return rejectWithValue('Invalid token format');
            }
            
            console.log("Valid authentication data found in localStorage");
            return {
              user: user,
              token: token,
              refreshToken: localStorage.getItem('refreshToken'),
            };
          } catch (parseError) {
            console.log("Failed to parse user data from localStorage");
            return rejectWithValue('Failed to parse stored user data');
          }
        }
      }
      
      console.log("No valid authentication data found in localStorage");
      return rejectWithValue('No valid authentication data found');
    } catch (error) {
      // Clear any stored data on error
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to restore auth state');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      // Refresh token cases
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.user = action.payload.user;
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      // Restore auth state cases
      .addCase(restoreAuthState.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(restoreAuthState.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer; 