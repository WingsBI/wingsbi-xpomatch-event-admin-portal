// Cookie management utilities for authentication

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

class CookieManager {
  private isServer = typeof window === 'undefined';
  
  /**
   * Set a cookie with proper options for cross-domain authentication
   */
  setCookie(name: string, value: string, options: CookieOptions = {}): void {
    if (this.isServer) {
      console.warn('CookieManager.setCookie called on server side');
      return;
    }

    const defaults: CookieOptions = {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60, // 24 hours
    };

    const finalOptions = { ...defaults, ...options };
    
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (finalOptions.maxAge) {
      cookieString += `; max-age=${finalOptions.maxAge}`;
    }
    
    if (finalOptions.expires) {
      cookieString += `; expires=${finalOptions.expires.toUTCString()}`;
    }
    
    if (finalOptions.path) {
      cookieString += `; path=${finalOptions.path}`;
    }
    
    if (finalOptions.domain) {
      cookieString += `; domain=${finalOptions.domain}`;
    }
    
    if (finalOptions.secure) {
      cookieString += '; secure';
    }
    
    if (finalOptions.sameSite) {
      cookieString += `; samesite=${finalOptions.sameSite}`;
    }
    
    if (finalOptions.httpOnly) {
      cookieString += '; httponly';
    }
    
    document.cookie = cookieString;
  }

  /**
   * Get a cookie value by name
   */
  getCookie(name: string): string | null {
    if (this.isServer) {
      return null;
    }

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    
    return null;
  }

  /**
   * Delete a cookie by setting it to expire in the past
   */
  deleteCookie(name: string, options: Partial<CookieOptions> = {}): void {
    if (this.isServer) {
      console.warn('CookieManager.deleteCookie called on server side');
      return;
    }

    this.setCookie(name, '', {
      ...options,
      maxAge: 0,
      expires: new Date(0),
    });
  }

  /**
   * Check if a cookie exists
   */
  hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }

  /**
   * Get all cookies as an object
   */
  getAllCookies(): Record<string, string> {
    if (this.isServer) {
      return {};
    }

    const cookies: Record<string, string> = {};
    
    document.cookie.split(';').forEach(cookie => {
      const [name, ...valueParts] = cookie.split('=');
      const value = valueParts.join('=');
      
      if (name && value) {
        cookies[name.trim()] = decodeURIComponent(value.trim());
      }
    });
    
    return cookies;
  }

  /**
   * Clear all authentication related cookies
   */
  clearAuthCookies(): void {
    const authCookies = ['auth-token', 'refresh-token', 'user-data'];
    
    authCookies.forEach(cookieName => {
      this.deleteCookie(cookieName);
    });
  }

  /**
   * Set authentication cookies with proper security settings
   */
  setAuthCookies(token: string, refreshToken: string, userData: any): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set auth token (httpOnly should be set server-side)
    this.setCookie('auth-token', token, {
      maxAge: 24 * 60 * 60, // 24 hours
      secure: isProduction,
      sameSite: 'lax',
    });
    
    // Set refresh token (httpOnly should be set server-side)
    this.setCookie('refresh-token', refreshToken, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: isProduction,
      sameSite: 'lax',
    });
    
    // Set user data (accessible to client)
    this.setCookie('user-data', JSON.stringify(userData), {
      maxAge: 24 * 60 * 60, // 24 hours
      secure: isProduction,
      sameSite: 'lax',
      httpOnly: false, // Allow client access
    });
  }

  /**
   * Get user data from cookie
   */
  getUserData(): any | null {
    const userDataStr = this.getCookie('user-data');
    
    if (!userDataStr) {
      return null;
    }
    
    try {
      return JSON.parse(userDataStr);
    } catch (error) {
      console.error('Failed to parse user data from cookie:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated based on cookies
   */
  isAuthenticated(): boolean {
    return this.hasCookie('auth-token') && this.hasCookie('user-data');
  }
}

// Create singleton instance
export const cookieManager = new CookieManager();

// Export individual functions for convenience
export const {
  setCookie,
  getCookie,
  deleteCookie,
  hasCookie,
  getAllCookies,
  clearAuthCookies,
  setAuthCookies,
  getUserData,
  isAuthenticated,
} = cookieManager;

export default cookieManager; 