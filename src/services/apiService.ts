import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '@/store';
import { addNotification } from '@/store/slices/appSlice';

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

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

// Types for meeting creation
export interface CreateMeetingRequest {
  agenda: string;
  visitorId: number;
  exhibitorId: number;
  meetingDate: string;
  startTime: string;
  endTime: string;
}

export interface MeetingResponse {
  id: number;
  agenda: string;
  visitorId: number;
  exhibitorId: number;
  meetingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private baseURL: string;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor() {
    // Use the Azure API base URL from environment variables
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    console.log('API Service initialized with base URL:', this.baseURL);
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: true, // Important: include cookies in requests
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add identifier and auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const state = store.getState();
        let identifier = state.app?.identifier;
        let token = state.auth?.token;

        // If no identifier in Redux, extract from current URL path
        if (!identifier) {
          if (typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            if (pathParts.length > 0 && pathParts[0] !== 'api') {
              identifier = pathParts[0];
              console.log('Using identifier from URL path:', identifier);
            }
          }
        }

        // If no token in Redux, try to get from cookies
        if (!token && typeof document !== 'undefined') {
          token = getCookie('auth-token');
          console.log('Using token from cookie:', !!token);
        }

        // Fallback to localStorage for iframe scenarios
        if (!token && typeof localStorage !== 'undefined') {
          token = localStorage.getItem('authToken') || localStorage.getItem('jwtToken');
          console.log('Using token from localStorage:', !!token);
        }

        // Throw error if no identifier found
        if (!identifier) {
          throw new Error('No event identifier found. Please access through a valid event URL.');
        }

        console.log('API Request:', {
          url: config.url,
          method: config.method,
          identifier,
          hasToken: !!token
        });

        // Inject identifier into URL if not already present
        if (config.url && !config.url.includes(`/api/${identifier}/`)) {
          // Handle both absolute and relative URLs
          if (config.url.startsWith('/api/')) {
            config.url = config.url.replace('/api/', `/api/${identifier}/`);
          } else if (!config.url.startsWith('http')) {
            config.url = `/api/${identifier}/${config.url.replace(/^\/+/, '')}`;
          }
        }

        // Add auth token to headers as fallback
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        console.log('Final API URL:', config.url);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('API Response:', {
          url: response.config.url,
          status: response.status,
          data: response.data
        });
        return response;
      },
      async (error) => {
        console.error('API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });

        const originalRequest = error.config;

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          console.log('Handling 401 error - checking authentication status');
          
          // Try to get fresh token from localStorage (compatible with Azure API system)
          if (typeof localStorage !== 'undefined') {
            const token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
            const userStr = localStorage.getItem('user');
            
            if (token && userStr) {
              try {
                const userData = JSON.parse(userStr);
                
                // Validate that we have valid data
                if (userData.id && userData.email) {
                  // Basic token validation (check if it's a JWT)
                  const tokenParts = token.split('.');
                  if (tokenParts.length === 3) {
                    // Update the authorization header and retry
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return this.axiosInstance(originalRequest);
                  }
                }
              } catch (parseError) {
                console.error('Failed to parse stored authentication data:', parseError);
              }
            }
          }
          
          // If no valid token found, clear storage and redirect to login
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
          }
          
          // User needs to login again
          if (typeof window !== 'undefined') {
            window.location.href = window.location.pathname.replace(/\/[^\/]+\/dashboard.*/, '/auth/event-admin/login');
          }
          
          return Promise.reject(error);
        }

        // Handle network errors with retry
        if (!error.response && originalRequest._retryCount < this.retryAttempts) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          console.log(`Retrying request (${originalRequest._retryCount}/${this.retryAttempts})`);
          await this.delay(this.retryDelay * originalRequest._retryCount);
          return this.axiosInstance(originalRequest);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: any): ApiError {
    let apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: 500,
    };

    if (error.response) {
      // Server responded with error status
      apiError = {
        message: error.response.data?.message || error.message,
        status: error.response.status,
        code: error.response.data?.code,
        details: error.response.data?.details,
      };
    } else if (error.request) {
      // Network error
      apiError = {
        message: 'Network error. Please check your connection.',
        status: 0,
        code: 'NETWORK_ERROR',
      };
    } else {
      // Other errors
      apiError = {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      };
    }

    // Show notification for errors
    store.dispatch(addNotification({
      type: 'error',
      message: apiError.message,
    }));

    return apiError;
  }

  private getAuthToken(): string | null {
    // Try different possible token keys
    const possibleKeys = [
      'jwtToken',
      'authToken',
      'token',
      'accessToken'
    ];
    let token = null;
    if (typeof localStorage !== 'undefined') {
      for (const key of possibleKeys) {
        token = localStorage.getItem(key);
        if (token) break;
      }
    }
    if (!token && typeof document !== 'undefined') {
      token = getCookie('auth-token');
    }
    return token;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Generic GET method
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(url, config);
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      throw error;
    }
  }

  // Generic POST method
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(url, data, config);
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      throw error;
    }
  }

  // Generic PUT method
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(url, data, config);
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      throw error;
    }
  }

  // Generic DELETE method
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(url, config);
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      throw error;
    }
  }

  // File upload method
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.axiosInstance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      throw error;
    }
  }

  // Batch requests
  async batch(requests: Array<{ method: 'GET' | 'POST' | 'PUT' | 'DELETE'; url: string; data?: any }>): Promise<any[]> {
    try {
      const promises = requests.map(req => {
        switch (req.method) {
          case 'GET':
            return this.get(req.url);
          case 'POST':
            return this.post(req.url, req.data);
          case 'PUT':
            return this.put(req.url, req.data);
          case 'DELETE':
            return this.delete(req.url);
          default:
            throw new Error(`Unsupported method: ${req.method}`);
        }
      });

      return await Promise.all(promises);
    } catch (error) {
      throw error;
    }
  }

  // Visitors API methods
  async getAllVisitors(identifier: string, isIframe: boolean = false): Promise<ApiResponse<any>> {
    try {
      // Get token from cookies first, then fallback to localStorage
      let token = null;
      
      if (typeof document !== 'undefined') {
        token = getCookie('auth-token');
      }
      
      if (!token && typeof localStorage !== 'undefined') {
        token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
        console.log('Got token from localStorage (fallback):', !!token);
      }
      
      // Use the Azure API base URL for external API calls
      const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
      const url = `${azureApiUrl}/api/${identifier}/RegisterUsers/getAllVisitors`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add auth token if available
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      console.log('Making API call to:', url);
      console.log('Is iframe context:', isIframe);
      console.log('Has token:', !!token);
      console.log('With headers:', headers);
      
      const response = await axios.get(url, {
        timeout: 30000,
        headers,
        // Removed withCredentials: true to avoid CORS issues when server uses wildcard origin
      });
      
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      console.error('API Error details:', error);
      // If 401 and we're in iframe context, try a different approach
      if ((error as any).response?.status === 401 && isIframe) {
        console.log('401 in iframe context - this might be expected, check if API requires auth for iframes');
      }
      throw error;
    }
  }

  // Meeting API methods
  public async createMeeting(identifier: string, meetingData: CreateMeetingRequest): Promise<ApiResponse<MeetingResponse>> {
    try {
      // Use the Azure API base URL for external API calls
      const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
      const apiUrl = `${azureApiUrl}/api/${identifier}/Meeting/createMeeting`;
      
      console.log('Meeting API Debug Info:', {
        baseURL: azureApiUrl,
        identifier,
        constructedUrl: apiUrl,
        windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'Server side',
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'Server side'
      });
      
      console.log('Calling create meeting API:', {
        url: apiUrl,
        meetingData,
        hasToken: !!this.getAuthToken()
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(meetingData),
      });

      console.log('Create meeting response status:', response.status);
      
      // Handle empty response
      const responseText = await response.text();
      console.log('Create meeting response text:', responseText);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        data = { message: 'Invalid JSON response from server' };
      }
      
      console.log('Create meeting response data:', data);

      if (!response.ok) {
        return {
          data: null as any,
          message: data.message || `HTTP ${response.status}: Failed to create meeting`,
          status: response.status,
          success: false
        };
      }

      return {
        data: data.data,
        message: data.message || 'Meeting created successfully',
        status: response.status,
        success: data.success
      };
    } catch (error) {
      console.error('Error creating meeting:', error);
      return {
        data: null as any,
        message: error instanceof Error ? error.message : 'Network error',
        status: 500,
        success: false
      };
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Specialized API methods for different entities
export const authApi = {
  login: (credentials: any) => apiService.post('/auth/login', credentials),
  logout: () => apiService.post('/auth/logout'),
  refresh: () => apiService.post('/auth/refresh'),
  me: () => apiService.get('/auth/me'),
};

export const eventsApi = {
  getAll: () => apiService.get('/events'),
  getById: (id: string) => apiService.get(`/events/${id}`),
  create: (data: any) => apiService.post('/events', data),
  update: (id: string, data: any) => apiService.put(`/events/${id}`, data),
  delete: (id: string) => apiService.delete(`/events/${id}`),
  getTheme: (id: string) => apiService.get(`/events/${id}/theme`),
  updateTheme: (id: string, theme: any) => apiService.put(`/events/${id}/theme`, theme),
  
  // New API methods for event details and theme management
  getEventDetails: async (identifier: string) => {
    const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
    const url = `${azureApiUrl}/api/${identifier}/Event/GetEventDetails`;
    
    const token = localStorage.getItem('jwtToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('🔍 Event Details API Call:', {
      url,
      identifier,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      headers
    });
    
    try {
      const response = await axios.get(url, { headers, timeout: 30000 });
      console.log('✅ Event Details API Response:', {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        hasResult: !!(response.data?.result),
        resultType: Array.isArray(response.data?.result) ? 'array' : typeof response.data?.result,
        resultLength: Array.isArray(response.data?.result) ? response.data.result.length : 'N/A'
      });
      
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error: any) {
      console.error('❌ Error fetching event details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers
      });
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Bad Request - Invalid identifier or missing required parameters';
        console.error('🔍 400 Error Details:', {
          identifier,
          apiUrl: azureApiUrl,
          fullUrl: url,
          responseData: error.response.data
        });
        throw new Error(`Event Details API Error (400): ${errorMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error('Event Details API Error (401): Unauthorized - Please check your authentication token');
      } else if (error.response?.status === 404) {
        throw new Error(`Event Details API Error (404): Event not found for identifier '${identifier}'`);
      } else if (error.response?.status === 500) {
        throw new Error('Event Details API Error (500): Internal server error - Please try again later');
      } else if (!error.response) {
        throw new Error('Event Details API Error: Network error - Please check your internet connection');
      } else {
        throw new Error(`Event Details API Error (${error.response.status}): ${error.response.data?.message || error.message}`);
      }
    }
  },

  updateEventDetails: async (identifier: string, eventData: any) => {
    const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
    const url = `${azureApiUrl}/api/${identifier}/Event/UpdateEventDetails`;
    
    const token = localStorage.getItem('jwtToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await axios.put(url, eventData, { headers, timeout: 30000 });
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      console.error('Error updating event details:', error);
      throw error;
    }
  },

  getEventThemeDetails: async (identifier: string) => {
    const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
    const url = `${azureApiUrl}/api/${identifier}/Event/getEventThemeDetails`;
    
    // Try multiple token sources
    const token = localStorage.getItem('jwtToken') || 
                  localStorage.getItem('authToken') || 
                  (typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1] : null);
    
    console.log('🔍 Theme API - Token sources:', {
      jwtToken: !!localStorage.getItem('jwtToken'),
      authToken: !!localStorage.getItem('authToken'),
      cookieToken: !!(typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1] : null),
      finalToken: !!token
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      console.log('🔍 Making theme API call to:', url);
      console.log('🔍 Theme API - Headers:', headers);
      const response = await axios.get(url, { headers, timeout: 30000 });
      console.log('🔍 Theme API response received:', response.status);
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error: any) {
      console.error('❌ Error fetching event theme details:', error);
      
      // Enhanced error logging for debugging
      if (error.response) {
        console.error('🔍 Theme API Error Details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url,
          method: error.config?.method,
          requestHeaders: error.config?.headers
        });
      } else if (error.request) {
        console.error('🔍 Theme API Network Error:', {
          request: error.request,
          message: error.message
        });
      } else {
        console.error('🔍 Theme API Other Error:', {
          message: error.message,
          config: error.config
        });
      }
      
      throw error;
    }
  },

  updateEventTheme: async (identifier: string, themeData: any) => {
    const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
    const url = `${azureApiUrl}/api/${identifier}/Event/updateEventTheme`;
    
    const token = localStorage.getItem('jwtToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await axios.put(url, themeData, { headers, timeout: 30000 });
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      console.error('Error updating event theme:', error);
      throw error;
    }
  },
};

export const usersApi = {
  getAll: (role?: string) => apiService.get(`/users${role ? `?role=${role}` : ''}`),
  getById: (id: string) => apiService.get(`/users/${id}`),
  create: (data: any) => apiService.post('/users', data),
  update: (id: string, data: any) => apiService.put(`/users/${id}`, data),
  delete: (id: string) => apiService.delete(`/users/${id}`),
  bulkImport: (file: File, onProgress?: (progress: number) => void) => 
    apiService.upload('/users/bulk-import', file, onProgress),
};

export const onboardingApi = {
  getData: () => apiService.get('/onboarding'),
  updateProgress: (data: any) => apiService.put('/onboarding', data),
  complete: () => apiService.post('/onboarding/complete'),
};

export const themesApi = {
  getAvailable: () => apiService.get('/themes/available'),
  getCurrent: () => apiService.get('/themes/current'),
  update: (theme: any) => apiService.put('/themes', theme),
};

export const fontsApi = {
  getAvailable: () => apiService.get('/fonts/available'),
};

// Add matchmaking API
export const matchmakingApi = {
  getVisitorMatch: async (identifier: string, visitorId: number, fields: string | null = null) => {
    // Use the Azure API base URL for external API calls
    const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
    const url = `${azureApiUrl}/api/${identifier}/MatchMaking/getVisitorMatch`;

    // Get token from cookies or localStorage
    let token = null;
    if (typeof document !== 'undefined') {
      token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))?.split('=')[1];
    }
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const body = JSON.stringify({ visitorId, fields });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching visitor match:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  },
};

// Notifications API
export const notificationsApi = {
  getAllNotification: async (identifier: string) => {
    try {
      // Get token from cookies first, then fallback to localStorage
      let token = null;
      if (typeof document !== 'undefined') {
        token = getCookie('auth-token');
      }
      if (!token && typeof localStorage !== 'undefined') {
        token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
      }
      // Use the Azure API base URL for external API calls
      const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
      const url = `${azureApiUrl}/api/${identifier}/Dashboard/getAllNotification`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      // Add auth token if available
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await axios.get(url, {
        timeout: 30000,
        headers,
      });
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      console.error('API Error details:', error);
      throw error;
    }
  },
};

// Export the main service
export default apiService;

// Debug function for testing API endpoints (available in browser console)
if (typeof window !== 'undefined') {
  (window as any).debugEventApi = {
    testEventDetails: async (identifier: string) => {
      console.log('🔍 Testing Event Details API for identifier:', identifier);
      try {
        const result = await eventsApi.getEventDetails(identifier);
        console.log('✅ Test successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
      }
    },
    
    testThemeDetails: async (identifier: string) => {
      console.log('🔍 Testing Theme Details API for identifier:', identifier);
      try {
        const result = await eventsApi.getEventThemeDetails(identifier);
        console.log('✅ Test successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
      }
    },
    
    getCurrentIdentifier: () => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      return pathParts.length > 0 ? pathParts[0] : null;
    },

    
    getAuthInfo: () => {
      return {
        jwtToken: !!localStorage.getItem('jwtToken'),
        authToken: !!localStorage.getItem('authToken'),
        user: localStorage.getItem('user'),
        tokenLength: localStorage.getItem('jwtToken')?.length || 0
      };
    }
  };
  
  console.log('🔧 Debug functions available: window.debugEventApi');
} 


export const ExhibitormatchmakingApi = {
  getExhibitorMatch: async (identifier: string, exhibitorid: number, fields: string | null = null) => {
    // Use the Azure API base URL for external API calls
    const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
    const url = `${azureApiUrl}/api/${identifier}/MatchMaking/getExhibitorMatch`;
 
    // Get token from cookies or localStorage
    let token = null;
    if (typeof document !== 'undefined') {
      token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))?.split('=')[1];
    }
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
    }
 
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
 
    const body = JSON.stringify({ exhibitorid, fields });
 
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching exhibitor match:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  },
};

// Meeting Details API methods
export const MeetingDetailsApi = {
  getVisitorMeetingDetails: async (identifier: string, visitorId: number) => {
    // Use the Azure API base URL for external API calls
    const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
    const url = `${azureApiUrl}/api/${identifier}/Meeting/getVisitortorMeetingDetails?visitorId=${visitorId}`;
 
    // Get token from cookies or localStorage
    let token = null;
    if (typeof document !== 'undefined') {
      token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))?.split('=')[1];
    }
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
    }
 
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
 
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching visitor meeting details:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  },

  getExhibitorMeetingDetails: async (identifier: string, exhibitorId: number) => {
    // Use the Azure API base URL for external API calls
    const azureApiUrl = 'https://xpomatch-dev-event-admin-api.azurewebsites.net';
    const url = `${azureApiUrl}/api/${identifier}/Meeting/getExhibitorMeetingDetails?exhibitorId=${exhibitorId}`;
 
    // Get token from cookies or localStorage
    let token = null;
    if (typeof document !== 'undefined') {
      token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))?.split('=')[1];
    }
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
    }
 
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
 
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching exhibitor meeting details:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  },
};
 
