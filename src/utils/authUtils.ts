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
  const validRoles = ['event-admin', 'it-admin', 'visitor', 'exhibitor'];
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

  // Check if it starts with expected prefix (adjust based on your token format)
  if (!token.startsWith('token_')) {
    return false;
  }

  // Check minimum length
  if (token.length < 20) {
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