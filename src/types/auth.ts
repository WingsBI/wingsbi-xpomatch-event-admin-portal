export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  eventId?: string; // For event-specific users
  avatar?: string;
  permissions?: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'event-admin' | 'visitor' | 'exhibitor';

export interface LoginCredentials {
  email: string;
  password: string;
  eventId?: string; // Optional event context
  role?: UserRole; // Add role selection
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export interface RoleConfig {
  role: UserRole;
  defaultRoute: string;
  allowedRoutes: string[];
  permissions: string[];
  dashboardConfig: {
    showVisitors: boolean;
    showExhibitors: boolean;
    showEvents: boolean;
    showAnalytics: boolean;
    showSettings: boolean;
  };
} 