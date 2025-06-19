const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

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
    // First try to get from localStorage
    const token = localStorage.getItem('jwtToken');
    if (token) {
      return token;
    }

    // If not in localStorage, could also try to get from Redux store
    // but localStorage is more reliable for this use case
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
}

export const fieldMappingApi = new FieldMappingApiService(); 