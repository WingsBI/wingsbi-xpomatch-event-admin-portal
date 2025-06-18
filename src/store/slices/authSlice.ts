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
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
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
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async ({ identifier, token }: { identifier: string; token?: string }) => {
    try {
      const success = await authApi.logout(identifier, token);
      return success;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
);

export const refreshToken = createAsyncThunk(
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
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Token refresh failed');
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
        state.isAuthenticated = false;
      })
      // Refresh token cases
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer; 