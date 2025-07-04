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
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  maxVisitors?: number;
  maxExhibitors?: number;
  status: 'active' | 'draft' | 'completed' | 'cancelled';
  createdBy: string;
  eventAdminId: string;
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

// API Visitor types
export interface ApiVisitorData {
  // Current API fields - matching actual API response
  id: number;
  salutation: string;
  firstName: string;
  mIddleName: string; // Note: API uses this typo
  lastName: string;
  email: string;
  gender: string;
   dateOfBirth: string | null;
  roleId: number;
  roleName: string;
  userStatusId: number;
  statusName: string;
  createdDate: string;
  modifiedDate: string | null;
  
  // Nested userProfile object
  userProfile: {
    userId: number;
    nationality: string | null;
    phone: string | null;
    linkedInProfile: string | null;
    instagramProfile: string | null;
    gitHubProfile: string | null;
    twitterProfile: string | null;
    designation: string | null;
    jobTitle: string | null;
    companyName: string | null;
    companyWebsite: string | null;
    businessEmail: string | null;
    experienceYears: number;
    decisionmaker: boolean;
    createdBy: number;
    createdDate: string;
    modifiedBy: number | null;
    modifiedDate: string | null;
  };
  
  // Nested customData object
  customData: {
    id: number;
    userId: number;
    addressLine1: string | null;
    addressLine2: string | null;
    cityName: string | null;
    stateName: string | null;
    countryName: string | null;
    postalCode: string | null;
    latitude: number;
    longitude: number;
    createdDate: string;
    modifiedDate: string | null;
    createdBy: number;
    modifiedBy: number | null;
  };
}

export interface VisitorsApiResponse {
  version: string | null;
  statusCode: number;
  message: string;
  isError: boolean | null;
  responseException: any | null;
  result: ApiVisitorData[];
}

// Transformed visitor for the UI - matching mock data structure
export interface TransformedVisitor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  country?: string;
  interests?: string[];
  status: string;
  type: 'visitor' | 'exhibitor';
  eventId: string;
  registrationDate?: Date;
  invitationSent?: boolean;
  invitationDate?: Date;
  checkedIn?: boolean;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
  customData?: {
    location?: string;
    avatar?: string;
    matchScore?: number;
    industry?: string;
    experience?: string;
    lookingFor?: string[];
    salutation?: string;
    middleName?: string;
    gender?: string;
    dateOfBirth?: string | null;
    nationality?: string;
    linkedInProfile?: string;
    instagramProfile?: string;
    gitHubProfile?: string;
    twitterProfile?: string;
    businessEmail?: string;
    experienceYears?: number;
    decisionmaker?: boolean;
    addressLine1?: string;
    addressLine2?: string;
    cityName?: string;
    stateName?: string;
    postalCode?: string;
  };
}

// New API Event Details types
export interface ApiEventDetailsResponse {
  version: string;
  statusCode: number;
  message: string;
  isError: null;
  responseException: null;
  result: ApiEventDetails;
}

export interface ApiEventDetails {
  id: number;
  title: string;
  description: string;
  categoryName: string;
  modeName: string;
  statusName: string;
  startDateTime: string;
  endDateTime: string;
  marketingAbbreviation: string;
  locationDetails: ApiLocationDetails;
}

export interface ApiLocationDetails {
  id: number;
  eventId: number;
  venueName: string;
  addressLine1: string;
  addressLine2: string;
  cityName: string;
  stateName: string;
  countryName: string;
  postalCode: number;
  latitude: number;
  longitude: number;
  mapLink: string;
}

// Event Theme types
export interface ApiEventThemeResponse {
  version: string;
  statusCode: number;
  message: string;
  isError: null;
  responseException: null;
  result: ApiEventThemeDetails;
}

export interface ApiEventThemeDetails {
  id: number;
  eventId: number;
  theme: ApiTheme;
  font: ApiFont;
}

export interface ApiTheme {
  themeId: number;
  themeLabel: string;
  themeColor: string;
}

export interface ApiFont {
  fontId: number;
  fontLabel: string;
  fontFamily: string;
  className: string;
}

// Update Event payload types
export interface UpdateEventPayload {
  eventId: number;
  eventDetails: {
    eventName: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
  };
  location: {
    venueName: string;
    addressLine1: string;
    addressLine2: string | null;
    countryId: number;
    stateId: number;
    cityId: number;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
    googleMapLink: string | null;
  };
  marketingAbbreviation: string;
  themeSelectionId: number;
  fontFamilyId: number;
  logoUrl: string;
  payment: boolean;
  eventCatalogId: number;
  eventStatusId: number;
  paymentDetailsId: number;
  eventModeId: number;
}

// Theme update payload
export interface UpdateThemePayload {
  themeSettingId: number;
  themeId: number;
  fontId: number;
} 