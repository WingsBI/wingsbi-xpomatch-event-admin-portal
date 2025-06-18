import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface ApiRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  timestamp: number;
  status: 'pending' | 'fulfilled' | 'rejected';
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

interface ApiState {
  loading: Record<string, boolean>;
  errors: Record<string, ApiError | null>;
  cache: Record<string, any>;
  requests: ApiRequest[];
  retryAttempts: Record<string, number>;
}

const initialState: ApiState = {
  loading: {},
  errors: {},
  cache: {},
  requests: [],
  retryAttempts: {},
};

// Generic API thunk creator
export const createApiThunk = (
  typePrefix: string,
  apiCall: (params: any) => Promise<any>
) => {
  return createAsyncThunk(typePrefix, async (params: any, { rejectWithValue }) => {
    try {
      const response = await apiCall(params);
      return response;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'API request failed',
        status: error.status,
        code: error.code,
      });
    }
  });
};

// Events API thunks
export const fetchEvents = createApiThunk(
  'api/fetchEvents',
  async ({ identifier }: { identifier: string }) => {
    const response = await fetch(`/api/${identifier}/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  }
);

export const createEvent = createApiThunk(
  'api/createEvent',
  async ({ identifier, eventData }: { identifier: string; eventData: any }) => {
    const response = await fetch(`/api/${identifier}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) throw new Error('Failed to create event');
    return response.json();
  }
);

export const updateEvent = createApiThunk(
  'api/updateEvent',
  async ({ identifier, eventId, eventData }: { identifier: string; eventId: string; eventData: any }) => {
    const response = await fetch(`/api/${identifier}/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) throw new Error('Failed to update event');
    return response.json();
  }
);

export const deleteEvent = createApiThunk(
  'api/deleteEvent',
  async ({ identifier, eventId }: { identifier: string; eventId: string }) => {
    const response = await fetch(`/api/${identifier}/events/${eventId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete event');
    return { eventId };
  }
);

// Users API thunks
export const fetchUsers = createApiThunk(
  'api/fetchUsers',
  async ({ identifier, role }: { identifier: string; role?: string }) => {
    const url = role ? `/api/${identifier}/users?role=${role}` : `/api/${identifier}/users`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }
);

export const createUser = createApiThunk(
  'api/createUser',
  async ({ identifier, userData }: { identifier: string; userData: any }) => {
    const response = await fetch(`/api/${identifier}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }
);

export const updateUser = createApiThunk(
  'api/updateUser',
  async ({ identifier, userId, userData }: { identifier: string; userId: string; userData: any }) => {
    const response = await fetch(`/api/${identifier}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }
);

export const deleteUser = createApiThunk(
  'api/deleteUser',
  async ({ identifier, userId }: { identifier: string; userId: string }) => {
    const response = await fetch(`/api/${identifier}/users/${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return { userId };
  }
);

// Onboarding API thunk
export const fetchOnboarding = createApiThunk(
  'api/fetchOnboarding',
  async ({ identifier }: { identifier: string }) => {
    const response = await fetch(`/api/${identifier}/onboarding`);
    if (!response.ok) throw new Error('Failed to fetch onboarding data');
    return response.json();
  }
);

export const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    setError: (state, action: PayloadAction<{ key: string; error: ApiError | null }>) => {
      state.errors[action.payload.key] = action.payload.error;
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    setCacheData: (state, action: PayloadAction<{ key: string; data: any }>) => {
      state.cache[action.payload.key] = action.payload.data;
    },
    clearCache: (state, action: PayloadAction<string>) => {
      delete state.cache[action.payload];
    },
    clearAllCache: (state) => {
      state.cache = {};
    },
    addRequest: (state, action: PayloadAction<Omit<ApiRequest, 'timestamp'>>) => {
      const request: ApiRequest = {
        ...action.payload,
        timestamp: Date.now(),
      };
      state.requests.push(request);
      // Keep only last 100 requests
      if (state.requests.length > 100) {
        state.requests = state.requests.slice(-100);
      }
    },
    updateRequestStatus: (state, action: PayloadAction<{ id: string; status: ApiRequest['status'] }>) => {
      const request = state.requests.find(req => req.id === action.payload.id);
      if (request) {
        request.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    // Handle all async thunks generically
    const handleAsyncThunk = (actionType: string) => {
      builder
        .addCase(`${actionType}/pending` as any, (state, action) => {
          const key = actionType.split('/')[1];
          state.loading[key] = true;
          state.errors[key] = null;
        })
        .addCase(`${actionType}/fulfilled` as any, (state, action) => {
          const key = actionType.split('/')[1];
          state.loading[key] = false;
          if (action.payload) {
            state.cache[key] = action.payload;
          }
        })
        .addCase(`${actionType}/rejected` as any, (state, action) => {
          const key = actionType.split('/')[1];
          state.loading[key] = false;
          state.errors[key] = action.payload as ApiError;
        });
    };

    // Apply to all thunks
    [
      'api/fetchEvents',
      'api/createEvent',
      'api/updateEvent',
      'api/deleteEvent',
      'api/fetchUsers',
      'api/createUser',
      'api/updateUser',
      'api/deleteUser',
      'api/fetchOnboarding',
    ].forEach(handleAsyncThunk);
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setCacheData,
  clearCache,
  clearAllCache,
  addRequest,
  updateRequestStatus,
} = apiSlice.actions;

export default apiSlice.reducer; 