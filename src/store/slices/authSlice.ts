import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, LoginCredentials } from '@/services/authApi';

export interface User {
  id: string;
  email: string;
  role: 'it-admin' | 'event-admin' | 'exhibitor' | 'visitor';
  eventId?: string;
  name?: string;
  avatar?: string;
}

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

// Get API base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Async thunks for authentication using the dedicated auth API service
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      
      if (!response.success) {
        return rejectWithValue(response.error || 'Login failed');
      }
      
      if (!response.data) {
        return rejectWithValue('Invalid response from server');
      }
      
      // Store tokens in localStorage for persistence
      if (response.data.token) {
        localStorage.setItem('jwtToken', response.data.token);
      }
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
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
      const success = await authApi.logout(identifier, token);
      
      // Clear tokens from localStorage
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('refreshToken');
      
      return success;
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear tokens even if logout API fails
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('refreshToken');
      
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
      
      // Store new tokens in localStorage
      if (response.data.token) {
        localStorage.setItem('jwtToken', response.data.token);
      }
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Token refresh failed');
    }
  }
);

// Action to restore auth state from localStorage
export const restoreAuthState = createAsyncThunk(
  'auth/restoreAuthState',
  async (identifier: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token) {
        return rejectWithValue('No stored token found');
      }
      
      // Check if token is expired
      if (authApi.isTokenExpired(token)) {
        if (refreshToken) {
          // Try to refresh the token
          const response = await authApi.refreshToken(identifier, refreshToken);
          if (response.success && response.data) {
            return response.data;
          }
        }
        return rejectWithValue('Token expired and refresh failed');
      }
      
      // Validate token with API
      const isValid = await authApi.validateToken(identifier, token);
      if (!isValid) {
        return rejectWithValue('Token validation failed');
      }
      
      // Return dummy data since we need to decode the token properly
      // In a real app, you might want to fetch user profile
      return {
        user: {
          id: '1',
          email: 'restored@user.com',
          role: 'event-admin' as const,
          eventId: identifier,
          name: 'Restored User',
        },
        token,
        refreshToken,
      };
    } catch (error) {
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