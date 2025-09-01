import { clearAllAuthCookies, getAuthToken, getUserData } from '@/utils/cookieManager';

// Authentication utilities for cleaning up stored data

/**
 * Clear all authentication data from cookies
 * This ensures that invalid/expired tokens don't cause automatic login
 */
export function clearAllAuthData() {
  // Clear all authentication cookies
  clearAllAuthCookies();

  // No sessionStorage usage

  console.log('All authentication data cleared');
}

/**
 * Check if user data is complete and valid
 */
export function isValidUserData(user: any): boolean {
  if (!user || typeof user !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['id', 'email', 'role'];
  for (const field of requiredFields) {
    if (!user[field] || typeof user[field] !== 'string' || user[field].trim() === '') {
      return false;
    }
  }

  // Check valid roles
  const validRoles = ['event-admin', 'visitor', 'exhibitor'];
  if (!validRoles.includes(user.role)) {
    return false;
  }

  // Check email format (basic validation)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user.email)) {
    return false;
  }

  return true;
}

/**
 * Validate if a token is properly formatted (basic check)
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Check if it's a JWT token (has 3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    return false;
  }

  // Check minimum length for each part
  if (tokenParts.some(part => part.length < 4)) {
    return false;
  }

  // Check if the first part looks like a JWT header (base64 encoded)
  try {
    const header = JSON.parse(atob(tokenParts[0]));
    if (!header.alg || !header.typ) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Get authentication status from cookies
 */
export function getAuthenticationStatus(): {
  hasLocalStorageToken: boolean;
  hasCookie: boolean;
  hasUserData: boolean;
  isValid: boolean;
} {
  const token = getAuthToken();
  const userData = getUserData();

  let userDataValid = false;
  if (userData) {
    userDataValid = isValidUserData(userData);
  }

  const hasValidToken = token ? isValidTokenFormat(token) : false;

  return {
    hasLocalStorageToken: !!token, // Keep for backward compatibility
    hasCookie: !!token,
    hasUserData: !!userData,
    isValid: hasValidToken && userDataValid
  };
}

/**
 * Get current user data from cookies
 */
export function getCurrentUser(): { id: string; email: string; role: string } | null {
  try {
    const userData = getUserData();
    if (!userData || !isValidUserData(userData)) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role
    };
  } catch (error) {
    console.error('Error getting user data from cookies:', error);
    return null;
  }
}

/**
 * Get current user ID as number for API calls
 */
export function getCurrentUserId(): number | null {
  try {
    const userData = getUserData();
    console.log('Raw user data from cookies:', userData);
    
    if (!userData) {
      console.log('No user data found in cookies');
      return null;
    }

    console.log('Parsed user data:', userData);
    
    if (!userData.id) {
      console.log('User data missing or no ID found');
      return null;
    }

    const userId = parseInt(userData.id, 10);
    console.log('Parsed user ID:', userId);
    
    return isNaN(userId) ? null : userId;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

/**
 * Decode JWT token to get token data
 */
export function decodeJWTToken(): any | null {
  try {
    const token = getAuthToken();
    if (!token) {
      console.log('No JWT token found in cookies');
      return null;
    }

    // Decode JWT token
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.log('Invalid token format');
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const tokenData = JSON.parse(jsonPayload);
    console.log('Decoded JWT token data:', tokenData);
    
    return tokenData;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Get current exhibitor ID from JWT token (for exhibitors liking visitors)
 */
export function getCurrentExhibitorId(): number | null {
  try {
    const tokenData = decodeJWTToken();
    if (!tokenData) {
      console.log('No token data available');
      return null;
    }

    // Check if user is an exhibitor
    if (tokenData.roleName !== 'Exhibitor') {
      console.log('Current user is not an exhibitor:', tokenData.roleName);
      return null;
    }

    // Look for exhibitor ID in token - check both camelCase and lowercase versions
    const exhibitorId = tokenData.exhibitorId || tokenData.exhibitorid || tokenData.userId || tokenData.id || tokenData.sub;
    
    if (!exhibitorId) {
      console.log('No exhibitor ID found in token data:', tokenData);
      return null;
    }

    const parsedId = parseInt(exhibitorId, 10);
    console.log('Extracted exhibitor ID from token:', parsedId, 'from field:', exhibitorId);
    
    return isNaN(parsedId) ? null : parsedId;
  } catch (error) {
    console.error('Error getting current exhibitor ID:', error);
    return null;
  }
}

/**
 * Get current visitor ID from JWT token (for visitors liking exhibitors)
 */
export function getCurrentVisitorId(): number | null {
  try {
    const tokenData = decodeJWTToken();
    if (!tokenData) {
      console.log('No token data available');
      return null;
    }

    // Check if user is a visitor
    if (tokenData.roleName !== 'Visitor') {
      console.log('Current user is not a visitor:', tokenData.roleName);
      return null;
    }

    // Look for visitor ID in token - check both camelCase and lowercase versions
    const visitorId = tokenData.visitorId || tokenData.visitorid || tokenData.userId || tokenData.id || tokenData.sub;
    
    if (!visitorId) {
      console.log('No visitor ID found in token data:', tokenData);
      return null;
    }

    const parsedId = parseInt(visitorId, 10);
    console.log('Extracted visitor ID from token:', parsedId, 'from field:', visitorId);
    
    return isNaN(parsedId) ? null : parsedId;
  } catch (error) {
    console.error('Error getting current visitor ID:', error);
    return null;
  }
} 

/**
 * Get current event admin ID from JWT token
 */
export function getCurrentEventAdminId(): number | null {
  try {
    const tokenData = decodeJWTToken();
    if (!tokenData) {
      console.log('No token data available');
      return null;
    }

    // Check if user is an event-admin
    if (tokenData.roleName !== 'event-admin') {
      console.log('Current user is not an event-admin:', tokenData.roleName);
      return null;
    }

    // Look for event admin ID in token - check both camelCase and lowercase versions
    const eventAdminId = tokenData.userId || tokenData.id || tokenData.sub;
    
    if (!eventAdminId) {
      console.log('No event admin ID found in token data:', tokenData);
      return null;
    }

    const parsedId = parseInt(eventAdminId, 10);
    console.log('Extracted event admin ID from token:', parsedId, 'from field:', eventAdminId);
    
    return isNaN(parsedId) ? null : parsedId;
  } catch (error) {
    console.error('Error getting current event admin ID:', error);
    return null;
  }
}

/**
 * Check if current user is an event-admin
 */
export function isEventAdmin(): boolean {
  try {
    const tokenData = decodeJWTToken();
    if (!tokenData) {
      console.log('No token data available for role check');
      return false;
    }

    // Check if user is an event-admin based on roleName and roleid
    const isEventAdmin = tokenData.roleName === 'event-admin' && tokenData.roleid === '1';
    
    console.log('Role check - roleName:', tokenData.roleName, 'roleid:', tokenData.roleid, 'isEventAdmin:', isEventAdmin);
    
    return isEventAdmin;
  } catch (error) {
    console.error('Error checking if user is event-admin:', error);
    return false;
  }
} 