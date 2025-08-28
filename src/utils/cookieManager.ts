import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_CONFIG = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const, // CSRF protection
  path: '/', // Available across the site
};

// Cookie names
export const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
  USER_DATA: 'user-data',
  EVENT_IDENTIFIER: 'event-identifier',
  USER_ROLE: 'user-role',
  USER_EMAIL: 'user-email',
} as const;

/**
 * Set a cookie with secure defaults
 */
export function setCookie(name: string, value: any, options?: any) {
  try {
    const cookieValue = typeof value === 'string' ? value : JSON.stringify(value);
    Cookies.set(name, cookieValue, { ...COOKIE_CONFIG, ...options });
  } catch (error) {
    console.warn(`Failed to set cookie ${name}:`, error);
  }
}

/**
 * Get a cookie value
 */
export function getCookie(name: string): any {
  try {
    const value = Cookies.get(name);
    if (!value) return null;
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.warn(`Failed to get cookie ${name}:`, error);
    return null;
  }
}

/**
 * Remove a cookie
 */
export function removeCookie(name: string, options?: any) {
  try {
    Cookies.remove(name, { ...COOKIE_CONFIG, ...options });
  } catch (error) {
    console.warn(`Failed to remove cookie ${name}:`, error);
  }
}

/**
 * Clear all authentication cookies
 */
export function clearAllAuthCookies() {
  Object.values(COOKIE_NAMES).forEach(cookieName => {
    removeCookie(cookieName);
  });
  console.log('All authentication cookies cleared');
}

/**
 * Set authentication token
 */
export function setAuthToken(token: string) {
  setCookie(COOKIE_NAMES.AUTH_TOKEN, token);
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  return getCookie(COOKIE_NAMES.AUTH_TOKEN);
}

/**
 * Set refresh token
 */
export function setRefreshToken(token: string) {
  setCookie(COOKIE_NAMES.REFRESH_TOKEN, token);
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  return getCookie(COOKIE_NAMES.REFRESH_TOKEN);
}

/**
 * Set user data
 */
export function setUserData(userData: any) {
  setCookie(COOKIE_NAMES.USER_DATA, userData);
}

/**
 * Get user data
 */
export function getUserData(): any {
  return getCookie(COOKIE_NAMES.USER_DATA);
}

/**
 * Set event identifier
 */
export function setEventIdentifier(identifier: string) {
  setCookie(COOKIE_NAMES.EVENT_IDENTIFIER, identifier);
}

/**
 * Get event identifier
 */
export function getEventIdentifier(): string | null {
  return getCookie(COOKIE_NAMES.EVENT_IDENTIFIER);
}

/**
 * Set user role
 */
export function setUserRole(role: string) {
  setCookie(COOKIE_NAMES.USER_ROLE, role);
}

/**
 * Get user role
 */
export function getUserRole(): string | null {
  return getCookie(COOKIE_NAMES.USER_ROLE);
}

/**
 * Set user email
 */
export function setUserEmail(email: string) {
  setCookie(COOKIE_NAMES.USER_EMAIL, email);
}

/**
 * Get user email
 */
export function getUserEmail(): string | null {
  return getCookie(COOKIE_NAMES.USER_EMAIL);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  const userData = getUserData();
  return !!(token && userData);
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): number | null {
  try {
    const userData = getUserData();
    if (!userData || !userData.id) return null;
    
    const userId = parseInt(userData.id, 10);
    return isNaN(userId) ? null : userId;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

/**
 * Decode JWT token
 */
export function decodeJWTToken(): any | null {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Get current exhibitor ID from JWT token
 */
export function getCurrentExhibitorId(): number | null {
  try {
    const tokenData = decodeJWTToken();
    if (!tokenData || tokenData.roleName !== 'Exhibitor') return null;

    const exhibitorId = tokenData.exhibitorId || tokenData.exhibitorid || tokenData.userId || tokenData.id || tokenData.sub;
    if (!exhibitorId) return null;

    const parsedId = parseInt(exhibitorId, 10);
    return isNaN(parsedId) ? null : parsedId;
  } catch (error) {
    console.error('Error getting current exhibitor ID:', error);
    return null;
  }
}

/**
 * Get current visitor ID from JWT token
 */
export function getCurrentVisitorId(): number | null {
  try {
    const tokenData = decodeJWTToken();
    if (!tokenData || tokenData.roleName !== 'Visitor') return null;

    const visitorId = tokenData.visitorId || tokenData.visitorid || tokenData.userId || tokenData.id || tokenData.sub;
    if (!visitorId) return null;

    const parsedId = parseInt(visitorId, 10);
    return isNaN(parsedId) ? null : parsedId;
  } catch (error) {
    console.error('Error getting current visitor ID:', error);
    return null;
  }
}

/**
 * Check if current user is an event-admin
 */
export function isEventAdmin(): boolean {
  try {
    const tokenData = decodeJWTToken();
    if (!tokenData) return false;

    return tokenData.roleName === 'event-admin' && tokenData.roleid === '1';
  } catch (error) {
    console.error('Error checking if user is event-admin:', error);
    return false;
  }
}

 