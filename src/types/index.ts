export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'it-admin' | 'event-admin' | 'visitor' | 'exhibitor';
  createdAt: Date;
  updatedAt: Date;
}

// Re-export auth types for convenience
export type { User as AuthUser, UserRole, LoginCredentials, AuthResponse, AuthContextType, RoleConfig } from './auth';

export interface Event {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  maxVisitors?: number;
  maxExhibitors?: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdBy: string; // IT Admin ID
  eventAdminId?: string;
  customAttributes: CustomAttribute[];
  marketingAbbreviation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAdmin extends User {
  eventIds: string[];
  permissions: EventAdminPermission[];
}

export interface Participant {
  id: string;
  eventId: string;
  type: 'visitor' | 'exhibitor';
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  country?: string;
  interests?: string[];
  customData: Record<string, any>;
  status: 'invited' | 'registered' | 'checked-in' | 'no-show';
  registrationDate?: Date;
  lastLoginDate?: Date;
  invitationSent: boolean;
  invitationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomAttribute {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'multiselect' | 'date' | 'boolean';
  required: boolean;
  options?: string[]; // For select/multiselect types
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  appliesToRole: 'visitor' | 'exhibitor' | 'both';
  createdAt: Date;
}

export interface EventAdminPermission {
  action: 'view' | 'edit' | 'delete' | 'invite' | 'export';
  resource: 'event' | 'visitors' | 'exhibitors' | 'attributes' | 'reports';
}

export interface InvitationTemplate {
  id: string;
  eventId: string;
  type: 'visitor' | 'exhibitor';
  subject: string;
  content: string;
  variables: string[]; // Available template variables
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchmakingResult {
  id: string;
  eventId: string;
  visitorId: string;
  exhibitorId: string;
  score: number;
  reasons: string[];
  status: 'suggested' | 'accepted' | 'declined' | 'meeting-scheduled';
  createdAt: Date;
}

export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalParticipants: number;
  registeredVisitors: number;
  registeredExhibitors: number;
  pendingInvitations: number;
  matchmakingScore: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Theme-related types for Event Admin
export interface ThemeConfig {
  id: string;
  eventId: string;
  themeKey: string;
  fontKey: string;
  themeName: string;
  fontName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // IT Admin ID from different project
}

export interface AvailableTheme {
  key: string;
  name: string;
  description: string;
  preview: string;
}

export interface AvailableFont {
  key: string;
  name: string;
  fontFamily: string;
}

export interface EventAdminThemeSettings {
  isThemeAssigned: boolean;
  themeConfig?: ThemeConfig;
  canChangeTheme: boolean; // Will be true for Event Admin
} 