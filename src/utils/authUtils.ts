// Authentication utilities for cleaning up stored data

/**
 * Clear all authentication data from both localStorage and cookies
 * This ensures that invalid/expired tokens don't cause automatic login
 */
export function clearAllAuthData() {
  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentEventIdentifier');
  }

  // Clear sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('currentEventIdentifier');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userEmail');
  }

  // Clear cookies by setting them to expire
  if (typeof document !== 'undefined') {
    const cookiesToClear = ['auth-token', 'refresh-token', 'user-data'];
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }

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
 * Get authentication status from various sources
 */
export function getAuthenticationStatus(): {
  hasLocalStorageToken: boolean;
  hasCookie: boolean;
  hasUserData: boolean;
  isValid: boolean;
} {
  const localStorageToken = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('jwtToken') || localStorage.getItem('authToken'))
    : null;
  
  const userDataStr = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('user')
    : null;

  let userDataValid = false;
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      userDataValid = isValidUserData(userData);
    } catch {
      userDataValid = false;
    }
  }

  const hasCookie = typeof document !== 'undefined' 
    ? document.cookie.includes('auth-token=')
    : false;

  const hasValidToken = localStorageToken ? isValidTokenFormat(localStorageToken) : false;

  return {
    hasLocalStorageToken: !!localStorageToken,
    hasCookie,
    hasUserData: !!userDataStr,
    isValid: hasValidToken && userDataValid
  };
}

/**
 * Get current user data from localStorage
 */
export function getCurrentUser(): { id: string; email: string; role: string } | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const userDataStr = localStorage.getItem('user');
    if (!userDataStr) {
      return null;
    }

    const userData = JSON.parse(userDataStr);
    if (!isValidUserData(userData)) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role
    };
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
}

/**
 * Get current user ID as number for API calls
 */
export function getCurrentUserId(): number | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const userDataStr = localStorage.getItem('user');
    console.log('Raw user data from localStorage:', userDataStr);
    
    if (!userDataStr) {
      console.log('No user data found in localStorage');
      return null;
    }

    const userData = JSON.parse(userDataStr);
    console.log('Parsed user data:', userData);
    
    if (!userData || !userData.id) {
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
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
    if (!token) {
      console.log('No JWT token found in localStorage');
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

    // Look for exhibitor ID in token - it might be stored as exhibitorId, userId, or id
    const exhibitorId = tokenData.exhibitorId || tokenData.userId || tokenData.id || tokenData.sub;
    
    if (!exhibitorId) {
      console.log('No exhibitor ID found in token data:', tokenData);
      return null;
    }

    const parsedId = parseInt(exhibitorId, 10);
    console.log('Extracted exhibitor ID from token:', parsedId);
    
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

    // Look for visitor ID in token - it might be stored as visitorId, userId, or id
    const visitorId = tokenData.visitorId || tokenData.userId || tokenData.id || tokenData.sub;
    
    if (!visitorId) {
      console.log('No visitor ID found in token data:', tokenData);
      return null;
    }

    const parsedId = parseInt(visitorId, 10);
    console.log('Extracted visitor ID from token:', parsedId);
    
    return isNaN(parsedId) ? null : parsedId;
  } catch (error) {
    console.error('Error getting current visitor ID:', error);
    return null;
  }
} 