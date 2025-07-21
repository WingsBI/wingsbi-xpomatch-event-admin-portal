const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://xpomatch-dev-event-admin-api.azurewebsites.net';

export interface FieldMappingResponse {
  version: string;
  statusCode: number;
  message: string;
  isError: boolean | null;
  responseException: any;
  result: FieldMapping[];
}

export interface FieldMapping {
  standardFieldIndex: number;
  standardField: string;
  excelColumn: string;
}

export interface StandardField {
  id: number;
  fieldName: string;
  displayName?: string;
  isActive: boolean;
  createdBy: number;
  createdDate: string;
  modifiedBy: number | null;
  modifiedDate: string | null;
}

export interface StandardFieldsResponse {
  version: string | null;
  statusCode: number;
  message: string | null;
  isError: boolean | null;
  responseException: any;
  result: StandardField[];
}

export interface UserRegistrationMapping {
  standardFieldIndex: number | null;
  standardField: string;
  excelColumn: string;
  isCustomField: boolean;
}

export interface UserRegistrationPayload {
  fileStorageId: number;
  mappings: UserRegistrationMapping[];
}

export interface UserRegistrationResponse {
  version: string | null;
  statusCode: number;
  message: string;
  isError: boolean | null;
  responseException: any;
  result: {
    registeredCount: number;
    newlyRegisteredEmails: string[];
    alredyRegisteredEmails: string[]; // Visitors API uses this typo
  };
}

export interface ExhibitorRegistrationResponse {
  version: string | null;
  statusCode: number;
  message: string;
  isError: boolean | null;
  responseException: any;
  result: {
    registeredCount: number;
    newlyRegisteredEmails: string[];
    alreadyRegisteredEmails: string[]; // Exhibitors API uses correct spelling
  };
}

export interface Visitor {
  VisitorId: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: 'active' | 'inactive' | 'pending' | 'registered' | 'checked-in' | 'invited';
  registrationDate: string;
  lastLoginDate?: string;
  jobTitle?: string;
  salutation?: string;
  middleName?: string;
  gender?: string;
  dateOfBirth?: string;
  interests?: string[];
  avatar?: string;
  invitationSent?: boolean;
  invitationDate?: string;
  checkedIn?: boolean;
  lastActivity?: string;
  createdAt?: string;
  updatedAt?: string;
  industry?: string;
  experience?: string;
  matchScore?: number;
  lookingFor?: string[];
  companyDescription?: string;
  products?: string[];
  boothNumber?: string;
  boothSize?: string;
  website?: string;
  location?: string;
  companyType?: string;
  hall?: string;
  stand?: string;
  telephone?: string;
  mobileNumber?: string;
  webSite?: string;
  companyLogoPath?: string;
  profileId?: number;
  addressId?: number;
  isActive?: boolean;
  createdBy?: number;
  createdDate?: string;
  modifiedBy?: number;
  
}
export interface Exhibitor {
  // Current API fields
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: 'active' | 'inactive' | 'pending' | 'registered' | 'checked-in' | 'invited';
  registrationDate: string;
  lastLoginDate?: string;
  
  // Future API fields that will be added gradually
  jobTitle?: string;
  salutation?: string;
  middleName?: string;
  gender?: string;
  dateOfBirth?: string;
  interests?: string[];
  avatar?: string;
  invitationSent?: boolean;
  invitationDate?: string;
  checkedIn?: boolean;
  lastActivity?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Custom data fields that will come from API in future
  industry?: string;
  experience?: string;
  matchScore?: number;
  lookingFor?: string[];
  companyDescription?: string;
  products?: string[];
  boothNumber?: string;
  boothSize?: string;
  website?: string;
  location?: string;
  companyType?: string;
  
  // Additional fields from the actual API response
  hall?: string;
  stand?: string;
  telephone?: string;
  mobileNumber?: string;
  webSite?: string;
  companyLogoPath?: string;
  profileId?: number;
  addressId?: number;
  isActive?: boolean;
  createdBy?: number;
  createdDate?: string;
  modifiedBy?: number;
  modifiedDate?: string;
  
  // Nested objects from API
  exhibitorProfile?: Array<{
    id: number;
    companyProfile: string;
    listingAs: string;
    receiveEmailEnquiries: string;
    faceBoolLink: string | null;
    twitterLink: string;
    linkedInLink: string;
    instagramLink: string;
    youTubeLink: string;
    isoCertificates: string;
    isActive: boolean;
    createdDate: string;
    createdBy: number;
    modifiedDate: string | null;
    modifiedBy: number | null;
  }>;
  exhibitorAddress?: Array<{
    id: number;
    city: string;
    poBox: string;
    addressLine1: string;
    zipPostalCode: string;
    stateProvince: string;
    isActive: boolean;
    createdDate: string;
    createdBy: number;
    modifiedDate: string | null;
    modifiedBy: number | null;
  }>;
  exhibitorToUserMaps?: Array<{
    exhibitorUserMapId: number;
    exhibitorId: number;
    userId: number;
    isPrimaryContact: boolean;
    salutation: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    gender: string;
    dateOfBirth: string | null;
    interest: string;
    eventId: number;
    roleId: number;
    roleName: string;
    userStatusId: number;
    userStatusName: string;
    nationality: string;
    profilePhoto: string | null;
    phone: string;
    linkedInProfile: string;
    instagramProfile: string;
    gitHubProfile: string;
    twitterProfile: string | null;
    designation: string;
    jobTitle: string;
    companyName: string;
    companyWebsite: string;
    businessEmail: string;
    experienceYears: number;
    decisionMaker: boolean;
    addressLine1: string;
    addressLine2: string;
    cityName: string | null;
    stateName: string | null;
    countryName: string | null;
    postalCode: string;
    latitude: string;
    longitude: string;
  }>;
  product?: Array<{
    id: number;
    exhibitorId: number;
    title: string;
    category: string;
    description: string;
    imagePath: string;
    isActive: boolean;
    createdDate: string;
    createdBy: number;
    modifiedDate: string | null;
    modifiedBy: number | null;
  }>;
  brand?: Array<{
    id: number;
    exhibitorId: number;
    brandName: string;
    category: string;
    description: string;
    logoPath: string;
    createdBy: number;
    createdDate: string;
    modifiedBy: number | null;
    modifiedDate: string | null;
    isActive: boolean;
  }>;
  brochure?: Array<{
    id: number;
    exhibitorId: number;
    title: string;
    filePath: string | null;
    isActive: boolean;
    createdDate: string;
    createdBy: number;
    modifiedDate: string | null;
    modifiedBy: number | null;
  }>;
}

export interface ExhibitorsListResponse {
  version: string | null;
  statusCode: number;
  message: string | null;
  isError: boolean | null;
  responseException: any;
  result: Exhibitor[];
}

export interface ExhibitorDetailResponse {
  version: string | null;
  statusCode: number;
  message: string | null;
  isError: boolean | null;
  responseException: any;
  result: Exhibitor;
}

export interface FavoritesRequest {
  visitorId: number;
  exhibitorId: number;
  isFavorite: boolean;
}

export interface FavoritesResponse {
  version: string;
  statusCode: number;
  message: string;
  isError: boolean | null;
  responseException: any;
  result: boolean;
}

export interface GetFavoritesResponse {
  version: string;
  statusCode: number;
  message: string;
  isError: boolean | null;
  responseException: any;
  result: {
    visitorId: number;
    exhibitorId: number;
    isFavorite: boolean;
  }[];
}

// New interfaces for exhibitor favorite visitors API
export interface ExhibitorFavoriteVisitor {
  exhibitorFavoriteId: number;
  exhibitorId: number;
  visitorId: number;
  isFavorite: boolean;
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: string | null;
  interest: string;
  eventId: number;
  roleId: number;
  roleName: string;
  userStatusId: number;
  userStatusName: string;
  nationality: string;
  profilePhoto: string | null;
  phone: string;
  linkedInProfile: string;
  instagramProfile: string;
  gitHubProfile: string;
  twitterProfile: string;
  designation: string;
  jobTitle: string;
  companyName: string;
  companyWebsite: string;
  businessEmail: string;
  experienceYears: number;
  decisionMaker: boolean;
  addressLine1: string;
  addressLine2: string;
  cityName: string;
  stateName: string;
  countryName: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
}

export interface ExhibitorFavoriteVisitorsResponse {
  version: string | null;
  statusCode: number;
  message: string;
  isError: boolean | null;
  responseException: any;
  result: ExhibitorFavoriteVisitor[];
}

// New interfaces for visitor favorites API
export interface VisitorFavoriteExhibitor {
  id: number;
  companyName: string;
  companyType: string;
  hall: string;
  stand: string;
  country: string;
  telephone: string;
  mobileNumber: string;
  webSite: string;
  companyLogoPath: string;
  profileId: number;
  addressId: number;
  isActive: boolean;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string;
  exhibitorProfile: Array<{
    id: number;
    companyProfile: string;
    listingAs: string;
    receiveEmailEnquiries: string;
    faceBoolLink: string | null;
    twitterLink: string;
    linkedInLink: string;
    instagramLink: string;
    youTubeLink: string;
    isoCertificates: string;
    isActive: boolean;
    createdDate: string;
    createdBy: number;
    modifiedDate: string | null;
    modifiedBy: number | null;
  }>;
  exhibitorAddress: Array<{
    id: number;
    city: string;
    poBox: string;
    addressLine1: string;
    zipPostalCode: string;
    stateProvince: string;
    isActive: boolean;
    createdDate: string;
    createdBy: number;
    modifiedDate: string | null;
    modifiedBy: number | null;
  }>;
  exhibitorToUserMaps: Array<{
    exhibitorUserMapId: number;
    exhibitorId: number;
    userId: number;
    isPrimaryContact: boolean;
    salutation: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    gender: string;
    dateOfBirth: string | null;
    interest: string;
    eventId: number;
    roleId: number;
    roleName: string;
    userStatusId: number;
    userStatusName: string;
    nationality: string;
    profilePhoto: string | null;
    phone: string;
    linkedInProfile: string;
    instagramProfile: string;
    gitHubProfile: string;
    twitterProfile: string | null;
    designation: string;
    jobTitle: string;
    companyName: string;
    companyWebsite: string;
    businessEmail: string;
    experienceYears: number;
    decisionMaker: boolean;
    addressLine1: string;
    addressLine2: string;
    cityName: string | null;
    stateName: string | null;
    countryName: string | null;
    postalCode: string;
    latitude: string;
    longitude: string;
  }>;
  product: Array<{
    id: number;
    exhibitorId: number;
    title: string;
    category: string;
    description: string;
    imagePath: string;
    isActive: boolean;
    createdDate: string;
    createdBy: number;
    modifiedDate: string | null;
    modifiedBy: number | null;
  }>;
  brand: Array<{
    id: number;
    exhibitorId: number;
    brandName: string;
    category: string;
    description: string;
    logoPath: string;
    createdBy: number;
    createdDate: string;
    modifiedBy: number | null;
    modifiedDate: string | null;
    isActive: boolean;
  }>;
}

export interface VisitorFavoritesResponse {
  version: string | null;
  statusCode: number;
  message: string;
  isError: boolean | null;
  responseException: any;
  result: {
    id: number;
    exhibitorId: number;
    visitorId: number;
    isFavorite: boolean;
    createdBy: number;
    createdDate: string;
    modifiedBy: number;
    modifiedDate: string;
    exhibitors: VisitorFavoriteExhibitor[];
  };
}

class FieldMappingApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('FieldMapping API Service initialized with base URL:', this.baseURL);
  }

  /**
   * Get JWT token from localStorage or Redux store
   */
  private getAuthToken(): string | null {
    // Try different possible token keys
    const possibleKeys = ['jwtToken', 'authToken', 'token', 'accessToken'];
    
    for (const key of possibleKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        console.log(`🔑 Found token with key: ${key}`);
        return token;
      }
    }

    console.log('🔑 No authentication token found in localStorage');
    console.log('🔑 Available localStorage keys:', Object.keys(localStorage));
    return null;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Upload Excel file and get suggested field mappings
   */
  async suggestMapping(identifier: string, file: File): Promise<FieldMappingResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/FieldMapping/suggestMapping`;
      
      console.log('Calling suggest mapping API:', {
        url: apiUrl,
        fileName: file.name,
        fileSize: file.size,
        hasToken: !!this.getAuthToken()
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      console.log('Suggest mapping response status:', response.status);
      
      const data = await response.json();
      console.log('Suggest mapping response data:', data);

      if (!response.ok) {
        return {
          version: "1.0.0.0",
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to process file`,
          isError: true,
          responseException: data.responseException || null,
          result: []
        };
      }

      return data;
    } catch (error) {
      console.error('Error suggesting field mapping:', error);
      return {
        version: "1.0.0.0",
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  }

  /**
   * Get all available standard fields
   */
  async getAllStandardFields(identifier: string): Promise<StandardFieldsResponse> {
    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/Common/getAllStandardFields`;
      
      console.log('Calling get all standard fields API:', {
        url: apiUrl,
        hasToken: !!this.getAuthToken()
      });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      console.log('Get standard fields response status:', response.status);
      
      const data = await response.json();
      console.log('Get standard fields response data:', data);

      if (!response.ok) {
        return {
          version: null,
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to fetch standard fields`,
          isError: true,
          responseException: data.responseException || null,
          result: []
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching standard fields:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  }

  /**
   * Submit final field mappings
   */
  async submitFieldMapping(
    identifier: string, 
    mappings: Array<{ excelColumn: string; standardField: string }>
  ): Promise<any> {
    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/FieldMapping/submitMapping`;
      
      console.log('Calling submit field mapping API:', {
        url: apiUrl,
        mappingsCount: mappings.length,
        hasToken: !!this.getAuthToken()
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mappings }),
      });

      console.log('Submit mapping response status:', response.status);
      
      const data = await response.json();
      console.log('Submit mapping response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to submit mappings`);
      }

      return data;
    } catch (error) {
      console.error('Error submitting field mapping:', error);
      throw error;
    }
  }

  /**
   * Register users from Excel file with field mappings (for visitors)
   */
  async registerUsers(
    identifier: string, 
    payload: UserRegistrationPayload
  ): Promise<UserRegistrationResponse> {
    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/RegisterUsers/register-from-excel`;
      
      console.log('Calling register users API:', {
        url: apiUrl,
        fileStorageId: payload.fileStorageId,
        mappingsCount: payload.mappings.length,
        hasToken: !!this.getAuthToken()
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Register users response status:', response.status);
      
      const data = await response.json();
      console.log('Register users response data:', data);

      if (!response.ok) {
        return {
          version: null,
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to register users`,
          isError: true,
          responseException: data.responseException || null,
          result: {
            registeredCount: 0,
            newlyRegisteredEmails: [],
            alredyRegisteredEmails: []
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Error registering users:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: {
          registeredCount: 0,
          newlyRegisteredEmails: [],
          alredyRegisteredEmails: []
        }
      };
    }
  }

  /**
   * Get all available exhibitor standard fields
   */
  async getAllExhibitorStandardFields(identifier: string): Promise<StandardFieldsResponse> {
    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/Common/getAllExebitorStandardFields`;
      
      console.log('Calling get all exhibitor standard fields API:', {
        url: apiUrl,
        hasToken: !!this.getAuthToken()
      });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      console.log('Get exhibitor standard fields response status:', response.status);
      
      const data = await response.json();
      console.log('Get exhibitor standard fields response data:', data);

      if (!response.ok) {
        return {
          version: null,
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to fetch exhibitor standard fields`,
          isError: true,
          responseException: data.responseException || null,
          result: []
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching exhibitor standard fields:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  }

  /**
   * Upload Excel file and get suggested exhibitor field mappings
   */
  async suggestExhibitorMapping(identifier: string, file: File): Promise<FieldMappingResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/ExhibitorFieldMapping/ExhibitorMappingSuggestion`;
      
      console.log('Calling exhibitor suggest mapping API:', {
        url: apiUrl,
        fileName: file.name,
        fileSize: file.size,
        hasToken: !!this.getAuthToken()
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      console.log('Exhibitor suggest mapping response status:', response.status);
      
      const data = await response.json();
      console.log('Exhibitor suggest mapping response data:', data);

      if (!response.ok) {
        return {
          version: "1.0.0.0",
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to process file`,
          isError: true,
          responseException: data.responseException || null,
          result: []
        };
      }

      return data;
    } catch (error) {
      console.error('Error suggesting exhibitor field mapping:', error);
      return {
        version: "1.0.0.0",
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  }

  /**
   * Register exhibitors from Excel file with field mappings
   */
  async registerExhibitors(
    identifier: string, 
    payload: UserRegistrationPayload
  ): Promise<ExhibitorRegistrationResponse> {
    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/ExhibitorOnboarding/registerExhibitor`;
      
      console.log('Calling register exhibitors API:', {
        url: apiUrl,
        fileStorageId: payload.fileStorageId,
        mappingsCount: payload.mappings.length,
        hasToken: !!this.getAuthToken()
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Register exhibitors response status:', response.status);
      
      const data = await response.json();
      console.log('Register exhibitors response data:', data);

      if (!response.ok) {
        return {
          version: null,
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to register exhibitors`,
          isError: true,
          responseException: data.responseException || null,
          result: {
            registeredCount: 0,
            newlyRegisteredEmails: [],
            alreadyRegisteredEmails: []
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Error registering exhibitors:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: {
          registeredCount: 0,
          newlyRegisteredEmails: [],
          alreadyRegisteredEmails: []
        }
      };
    }
  }

  /**
   * Get all exhibitors
   */
  async getAllExhibitors(identifier: string): Promise<ExhibitorsListResponse> {
    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/ExhibitorOnboarding/getAllExhibitor`;
      
      console.log('Calling get all exhibitors API:', {
        url: apiUrl,
        hasToken: !!this.getAuthToken()
      });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      console.log('Get all exhibitors response status:', response.status);
      
      const data = await response.json();
      console.log('Get all exhibitors response data:', data);

      if (!response.ok) {
        return {
          version: null,
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to fetch exhibitors`,
          isError: true,
          responseException: data.responseException || null,
          result: []
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching exhibitors:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  }

  /**
   * Get exhibitor by ID
   */
  async getExhibitorById(identifier: string, exhibitorId: number): Promise<ExhibitorDetailResponse> {
    try {
      // Call external backend API directly
      // Try different possible endpoint names since the exact one might not exist
      const possibleEndpoints = [
        `${this.baseURL}/api/${identifier}/ExhibitorOnboarding/getAllExhibitorById?exhibitorId=${exhibitorId}`,
        `${this.baseURL}/api/${identifier}/ExhibitorOnboarding/getExhibitorById?exhibitorId=${exhibitorId}`,
        `${this.baseURL}/api/${identifier}/ExhibitorOnboarding/getExhibitor?id=${exhibitorId}`,
        `${this.baseURL}/api/${identifier}/ExhibitorOnboarding/getExhibitorById/${exhibitorId}`,
        `${this.baseURL}/api/${identifier}/ExhibitorOnboarding/exhibitor/${exhibitorId}`,
      ];
      
      let apiUrl = possibleEndpoints[0]; // Start with the original
      const headers = this.getAuthHeaders();
      
      console.log('🔍 GET EXHIBITOR BY ID API CALL STARTING');
      console.log('🔍 URL:', apiUrl);
      console.log('🔍 Exhibitor ID:', exhibitorId);
      console.log('🔍 Headers:', headers);
      console.log('🔍 Auth Token:', this.getAuthToken() ? 'Present' : 'Missing');
      console.log('🔍 Base URL:', this.baseURL);

      // Try different endpoints until one works
      let response: Response;
      let workingEndpoint = null;
      
      // Try the correct endpoint first with authentication
      const correctUrl = `${this.baseURL}/api/${identifier}/ExhibitorOnboarding/getAllExhibitorById?exhibitorId=${exhibitorId}`;
      console.log('🔍 Trying correct endpoint with auth:', correctUrl);
      
      response = await fetch(correctUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 Correct endpoint status:', response.status);
      
      // If the correct endpoint fails, try others as fallback
      if (response.status === 404) {
        for (let i = 1; i < possibleEndpoints.length; i++) {
          const currentUrl = possibleEndpoints[i];
          console.log(`🔍 Trying fallback endpoint ${i + 1}:`, currentUrl);
          
          try {
            const testResponse = await fetch(currentUrl, {
              method: 'GET',
              headers: {
                ...headers,
                'Content-Type': 'application/json',
              },
            });
            
            console.log(`🔍 Fallback endpoint ${i + 1} status:`, testResponse.status);
            
            if (testResponse.status !== 404) {
              response = testResponse;
              console.log(`✅ Found working fallback endpoint:`, currentUrl);
              break;
            }
          } catch (error) {
            console.log(`🔍 Fallback endpoint ${i + 1} failed:`, error);
          }
        }
      }

      console.log('✅ Get exhibitor by ID response status:', response.status);
      console.log('✅ Get exhibitor by ID response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to get exhibitor details`;
        let responseData = null;
        
        try {
          // Try to parse response body for error details
          const responseText = await response.text();
          if (responseText.trim()) {
            responseData = JSON.parse(responseText);
            errorMessage = responseData.message || errorMessage;
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse error response body:', parseError);
          // Use default error message if parsing fails
        }
        
        console.log('❌ Get exhibitor by ID failed:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          responseData
        });
        
        return {
          version: null,
          statusCode: response.status,
          message: errorMessage,
          isError: true,
          responseException: responseData?.responseException || null,
          result: {} as Exhibitor
        };
      }
      
      // Only try to parse JSON if response is ok
      const data = await response.json();
      console.log('✅ Get exhibitor by ID response data:', data);

      // Handle the API response structure mismatch
      // API returns result as an array, but frontend expects a single object
      if (data.result && Array.isArray(data.result) && data.result.length > 0) {
        // Extract the first exhibitor from the array
        const exhibitorData = data.result[0];
        
        // Transform the API data to match the frontend Exhibitor interface
        const transformedExhibitor: Exhibitor = {
          id: exhibitorData.id,
          firstName: exhibitorData.exhibitorToUserMaps?.[0]?.firstName || '',
          lastName: exhibitorData.exhibitorToUserMaps?.[0]?.lastName || '',
          email: exhibitorData.exhibitorToUserMaps?.[0]?.email || '',
          companyName: exhibitorData.companyName,
          phoneNumber: exhibitorData.telephone,
          address: exhibitorData.exhibitorAddress?.[0]?.addressLine1,
          city: exhibitorData.exhibitorAddress?.[0]?.city,
          country: exhibitorData.country,
          status: 'active',
          registrationDate: exhibitorData.createdDate,
          lastLoginDate: exhibitorData.modifiedDate !== '0001-01-01T00:00:00' ? exhibitorData.modifiedDate : undefined,
          
          // Additional fields from API
          jobTitle: exhibitorData.exhibitorToUserMaps?.[0]?.jobTitle,
          salutation: exhibitorData.exhibitorToUserMaps?.[0]?.salutation,
          middleName: exhibitorData.exhibitorToUserMaps?.[0]?.middleName,
          gender: exhibitorData.exhibitorToUserMaps?.[0]?.gender,
          dateOfBirth: exhibitorData.exhibitorToUserMaps?.[0]?.dateOfBirth,
          interests: exhibitorData.exhibitorToUserMaps?.[0]?.interest ? [exhibitorData.exhibitorToUserMaps[0].interest] : [],
          avatar: exhibitorData.companyLogoPath,
          
          // Custom fields
          industry: exhibitorData.companyType,
          boothNumber: exhibitorData.stand,
          boothSize: exhibitorData.hall,
          website: exhibitorData.webSite,
          companyType: exhibitorData.companyType,
          companyDescription: exhibitorData.exhibitorProfile?.[0]?.companyProfile,
          
          // Products and other data
          product: exhibitorData.product || [],
          brand: exhibitorData.brand || [],
          brochure: exhibitorData.brochure || [],
        };

        return {
          ...data,
          result: transformedExhibitor
        };
      } else if (data.result && Array.isArray(data.result) && data.result.length === 0) {
        // No exhibitor found
        return {
          version: null,
          statusCode: 404,
          message: `Exhibitor with ID ${exhibitorId} not found`,
          isError: true,
          responseException: null,
          result: {} as Exhibitor
        };
      }

      // If result is not an array, return as is (fallback)
      return data;
    } catch (error) {
      console.error('❌ Error getting exhibitor by ID:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: {} as Exhibitor
      };
    }
  }

  /**
   * Add or remove exhibitor from favorites (or visitor from favorites - same endpoint)
   */
  async addFavorites(identifier: string, payload: FavoritesRequest): Promise<FavoritesResponse> {
    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/Event/addFavorites`;
      const headers = this.getAuthHeaders();
      
      console.log('🔥 ADD FAVORITES API CALL STARTING');
      console.log('🔥 URL:', apiUrl);
      console.log('🔥 Payload:', payload);
      console.log('🔥 Headers:', headers);
      console.log('🔥 Base URL:', this.baseURL);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('✅ Add favorites response status:', response.status);
      console.log('✅ Add favorites response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('✅ Add favorites response data:', data);

      if (!response.ok) {
        return {
          version: "1.0.0.0",
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to update favorites`,
          isError: true,
          responseException: data.responseException || null,
          result: false
        };
      }

      return data;
    } catch (error) {
      console.error('Error updating favorites:', error);
      return {
        version: "1.0.0.0",
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: false
      };
    }
  }

  /**
   * Get user's current favorites
   */
  async getFavorites(identifier: string, visitorId: number): Promise<GetFavoritesResponse> {
    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/Event/getFavorites?visitorId=${visitorId}`;
      const headers = this.getAuthHeaders();
      
      console.log('🔍 GET FAVORITES API CALL STARTING');
      console.log('🔍 URL:', apiUrl);
      console.log('🔍 Visitor ID:', visitorId);
      console.log('🔍 Headers:', headers);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Get favorites response status:', response.status);
      
      const data = await response.json();
      console.log('✅ Get favorites response data:', data);

      if (!response.ok) {
        return {
          version: "1.0.0.0",
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to get favorites`,
          isError: true,
          responseException: data.responseException || null,
          result: []
        };
      }

      return data;
    } catch (error) {
      console.error('Error getting favorites:', error);
      return {
        version: "1.0.0.0",
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  }

  /**
   * Get visitor's favorite exhibitors with full details
   */
  async getVisitorFavorites(identifier: string, visitorId: number): Promise<VisitorFavoritesResponse> {
    try {
      // Call external backend API directly
      const apiUrl = `${this.baseURL}/api/${identifier}/RegisterUsers/getVisitorFavorite?visitorId=${visitorId}`;
      const headers = this.getAuthHeaders();
      
      console.log('🔍 GET VISITOR FAVORITES API CALL STARTING');
      console.log('🔍 URL:', apiUrl);
      console.log('🔍 Visitor ID:', visitorId);
      console.log('🔍 Headers:', headers);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Get visitor favorites response status:', response.status);
      
      const data = await response.json();
      console.log('✅ Get visitor favorites response data:', data);

      if (!response.ok) {
        return {
          version: null,
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to get visitor favorites`,
          isError: true,
          responseException: data.responseException || null,
          result: {
            id: 0,
            exhibitorId: 0,
            visitorId: visitorId,
            isFavorite: false,
            createdBy: 0,
            createdDate: '',
            modifiedBy: 0,
            modifiedDate: '',
            exhibitors: []
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Error getting visitor favorites:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: {
          id: 0,
          exhibitorId: 0,
          visitorId: visitorId,
          isFavorite: false,
          createdBy: 0,
          createdDate: '',
          modifiedBy: 0,
          modifiedDate: '',
          exhibitors: []
        }
      };
    }
  }

  /**
   * Get exhibitor's favorite visitors (which visitors an exhibitor has favorited)
   */
  async getExhibitorFavorites(identifier: string, exhibitorId: number): Promise<GetFavoritesResponse> {
    try {
      // Call external backend API directly  
      const apiUrl = `${this.baseURL}/api/${identifier}/Event/getFavorites?exhibitorId=${exhibitorId}`;
      const headers = this.getAuthHeaders();
      
      console.log('🔍 GET EXHIBITOR FAVORITES API CALL STARTING');
      console.log('🔍 URL:', apiUrl);
      console.log('🔍 Exhibitor ID:', exhibitorId);
      console.log('🔍 Headers:', headers);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Get exhibitor favorites response status:', response.status);
      
      const data = await response.json();
      console.log('✅ Get exhibitor favorites response data:', data);

      if (!response.ok) {
        return {
          version: "1.0.0.0",
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to get exhibitor favorites`,
          isError: true,
          responseException: data.responseException || null,
          result: []
        };
      }

      return data;
    } catch (error) {
      console.error('Error getting exhibitor favorites:', error);
      return {
        version: "1.0.0.0",
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  }

  /**
   * Get all favorite visitors for an exhibitor (detailed visitor information)
   */
  async getAllExhibitorFavorites(identifier: string, exhibitorId: number): Promise<ExhibitorFavoriteVisitorsResponse> {
    try {
      // Call external backend API directly  
      const apiUrl = `${this.baseURL}/api/${identifier}/ExhibitorOnboarding/getAllExhibitorFavorites?exhibitorId=${exhibitorId}`;
      const headers = this.getAuthHeaders();
      
      console.log('🔍 GET ALL EXHIBITOR FAVORITES API CALL STARTING');
      console.log('🔍 URL:', apiUrl);
      console.log('🔍 Exhibitor ID:', exhibitorId);
      console.log('🔍 Headers:', headers);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Get all exhibitor favorites response status:', response.status);
      
      const data = await response.json();
      console.log('✅ Get all exhibitor favorites response data:', data);

      if (!response.ok) {
        return {
          version: null,
          statusCode: response.status,
          message: data.message || `HTTP ${response.status}: Failed to get exhibitor favorite visitors`,
          isError: true,
          responseException: data.responseException || null,
          result: []
        };
      }

      return data;
    } catch (error) {
      console.error('Error getting exhibitor favorite visitors:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  }

  /**
   * Get visitor by ID
   */
  async getVisitorById(identifier: string, visitorId: number): Promise<any> {
    try {
      const apiUrl = `${this.baseURL}/api/${identifier}/RegisterUsers/getVisitorById?visitorId=${visitorId}`;
      const headers = this.getAuthHeaders();

      console.log('🔍 GET VISITOR BY ID API CALL STARTING');
      console.log('🔍 URL:', apiUrl);
      console.log('🔍 Visitor ID:', visitorId);
      console.log('🔍 Headers:', headers);
      console.log('🔍 Auth Token:', this.getAuthToken() ? 'Present' : 'Missing');
      console.log('🔍 Base URL:', this.baseURL);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Get visitor by ID response status:', response.status);
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to get visitor details`;
        let responseData = null;
        try {
          const responseText = await response.text();
          if (responseText.trim()) {
            responseData = JSON.parse(responseText);
            errorMessage = responseData.message || errorMessage;
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse error response body:', parseError);
        }
        return {
          version: null,
          statusCode: response.status,
          message: errorMessage,
          isError: true,
          responseException: responseData?.responseException || null,
          result: []
        };
      }
      const data = await response.json();
      console.log('✅ Get visitor by ID response data:', data);
      return data;
    } catch (error) {
      console.error('❌ Error getting visitor by ID:', error);
      return {
        version: null,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Network error',
        isError: true,
        responseException: error,
        result: []
      };
    }
  }
}

export const fieldMappingApi = new FieldMappingApiService();

// Debug function for testing API endpoints (available in browser console)
if (typeof window !== 'undefined') {
  (window as any).debugFieldMappingApi = {
    testGetAllExhibitors: async (identifier: string) => {
      console.log('🔍 Testing getAllExhibitors for identifier:', identifier);
      try {
        const result = await fieldMappingApi.getAllExhibitors(identifier);
        console.log('✅ Test successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
      }
    },
    
    testGetExhibitorById: async (identifier: string, exhibitorId: number) => {
      console.log('🔍 Testing getExhibitorById:', { identifier, exhibitorId });
      try {
        const result = await fieldMappingApi.getExhibitorById(identifier, exhibitorId);
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
    
    listAvailableExhibitors: async (identifier: string) => {
      console.log('🔍 Listing all exhibitors for identifier:', identifier);
      try {
        const result = await fieldMappingApi.getAllExhibitors(identifier);
        if (result.statusCode === 200 && result.result) {
          console.log('📋 Available exhibitors:', result.result.map(ex => ({
            id: ex.id,
            name: `${ex.firstName} ${ex.lastName}`,
            company: ex.companyName,
            email: ex.email
          })));
          return result.result;
        } else {
          console.log('❌ No exhibitors found or error:', result);
          return [];
        }
      } catch (error) {
        console.error('❌ Error listing exhibitors:', error);
        return [];
      }
    }
  };
  
  console.log('🔧 Debug functions available: window.debugFieldMappingApi');
} 