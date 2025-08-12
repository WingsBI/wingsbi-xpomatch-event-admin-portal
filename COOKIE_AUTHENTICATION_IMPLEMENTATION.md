# Cookie-Based Authentication Implementation

## Overview

This implementation resolves the cross-domain authentication issue where users were getting logged in on production without proper authentication tokens. The solution replaces `localStorage`-based token storage with secure HTTP-only cookies and implements strict validation to prevent automatic login with invalid tokens.

## Problems Solved

### 1. Cross-Domain Authentication Issue
The original issue occurred because:
1. **localStorage is origin-specific**: Tokens stored on `localhost:3000` are not accessible on `https://xpomatch-dev-event-admin-portal.azurewebsites.net`
2. **State inconsistency**: The application showed users as "logged in" but API calls failed with 401 unauthorized errors
3. **Security vulnerability**: Tokens stored in localStorage are vulnerable to XSS attacks

### 2. Automatic Login with Invalid Tokens
A critical issue was discovered where users were being automatically logged in when accessing the deployed link without proper authentication:
1. **Invalid token restoration**: The app was automatically restoring authentication state from old/expired tokens
2. **Insufficient validation**: No proper validation of stored tokens before considering users authenticated
3. **Missing user data validation**: Incomplete or corrupt user data was being accepted
4. **Redux Persist auto-restoration**: Redux Persist was automatically restoring auth state from localStorage, bypassing all validation

### 3. Root Cause - Redux Persist
The main culprit was **Redux Persist** automatically restoring authentication state:
- Redux Persist was configured to persist the 'auth' state in localStorage
- On app startup, it would automatically restore the auth state, making users appear "authenticated"
- This bypassed all token validation and security checks
- Users would be automatically redirected to dashboards without proper authentication

## Solution

The new implementation uses:
1. **HTTP-Only Cookies**: Secure token storage that's inaccessible to client-side JavaScript
2. **Strict Token Validation**: All stored tokens are validated with the server before being accepted
3. **User Data Validation**: Complete validation of user data structure and content
4. **Automatic Cleanup**: Invalid/expired tokens are automatically cleared
5. **No Auto-Restore**: Removed auth state from Redux Persist to prevent automatic login
6. **Manual Login Required**: Users must explicitly login through the form
7. **Cross-domain compatibility**: Proper cookie settings for subdomain sharing
8. **Fallback mechanism**: localStorage as backup for compatibility
9. **CORS configuration**: Proper headers for cross-origin requests

## Key Components

### 1. API Routes (`/src/app/api/auth/`)

#### Login Route (`login/route.ts`)
- Sets HTTP-only cookies for `auth-token` and `refresh-token`
- Sets accessible cookie for `user-data`
- Proper cookie security settings based on environment

#### Me Route (`me/route.ts`)
- Validates authentication from cookies
- Returns user data and token status
- Handles token expiration
- Performs strict validation of user data structure

#### Logout Route (`logout/route.ts`)
- Clears all authentication cookies
- Ensures proper cleanup

### 2. Authentication Context (`/src/context/AuthContext.tsx`)

- **Cookie-first approach**: Checks cookies before localStorage
- **Automatic refresh**: Calls `/api/auth/me` to validate authentication
- **Graceful fallback**: Uses localStorage for compatibility
- **Proper cleanup**: Clears both cookies and localStorage on logout

### 3. API Service (`/src/services/apiService.ts`)

- **Credentials included**: All requests include cookies (`withCredentials: true`)
- **Token fallback**: Uses cookies first, then localStorage
- **Auto-retry**: Automatically retries failed requests after token refresh
- **Error handling**: Redirects to login on authentication failures

### 4. Redux Integration (`/src/store/slices/authSlice.ts`)

- **Cookie restoration**: Restores auth state from cookies on app start
- **Strict validation**: Only accepts complete and valid user data
- **Dual storage**: Updates both cookies and localStorage for compatibility
- **Error handling**: Proper error states and recovery
- **Automatic cleanup**: Clears invalid data automatically

### 5. Middleware (`middleware.ts`)

- **CORS handling**: Proper cross-origin headers
- **Conservative route protection**: Only redirects when tokens are properly validated
- **Preflight support**: Handles OPTIONS requests

### 6. Authentication Utilities (`/src/utils/authUtils.ts`)

- **Centralized cleanup**: `clearAllAuthData()` function for consistent data clearing
- **User validation**: `isValidUserData()` for strict user data validation
- **Token validation**: `isValidTokenFormat()` for basic token format checking
- **Status checking**: `getAuthenticationStatus()` for comprehensive auth status

### 7. Redux Store Configuration (`/src/store/index.ts`)

- **Auth state not persisted**: Removed 'auth' from Redux Persist whitelist
- **Version bump**: Cleared any existing persisted auth state
- **Fresh auth required**: Users must authenticate fresh on each app visit

### 8. Main Page Protection (`/src/app/[identifier]/page.tsx`)

- **Strict validation**: Only accepts tokens that pass server validation
- **Complete user data**: Requires all user fields to be present and valid
- **Automatic cleanup**: Clears invalid data immediately
- **No automatic login**: Users must provide valid credentials
- **Redux persist cleanup**: Removes any old persisted auth state

## Configuration

### Environment Variables

```bash
# Production
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://your-production-domain.com

# Development
NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Cookie Settings

```typescript
const cookieOptions = {
  httpOnly: true,           // Prevent XSS attacks
  secure: isProduction,     // HTTPS only in production
  sameSite: 'lax',         // CSRF protection
  maxAge: 24 * 60 * 60,    // 24 hours
  path: '/',               // Available site-wide
};
```

### CORS Configuration

```typescript
// Allow credentials and proper origins
headers: {
  'Access-Control-Allow-Origin': 'https://your-domain.com',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
}
```

## Usage Examples

### Login Process

```typescript
// User logs in
const response = await login(credentials);

// Cookies are automatically set by the API
// No need to manually store tokens
```

### API Requests

```typescript
// Cookies are automatically included
const data = await apiService.get('/some-endpoint');

// If token expires, automatic refresh is attempted
```

### Logout Process

```typescript
// Clears both cookies and localStorage
await logout();

// User is redirected to login page
```

### Checking Authentication

```typescript
// Using cookie manager
if (cookieManager.isAuthenticated()) {
  // User is logged in
}

// Using context
const { isAuthenticated } = useAuth();

// Using utilities for detailed status
const authStatus = getAuthenticationStatus();
if (authStatus.isValid) {
  // User has valid authentication
}
```

## Security Features

1. **HTTP-Only Tokens**: Main tokens are inaccessible to JavaScript
2. **Secure Cookies**: HTTPS-only in production
3. **SameSite Protection**: CSRF attack prevention
4. **Automatic Expiration**: Tokens expire after set time
5. **Secure Headers**: Proper CORS and security headers
6. **Strict Validation**: Server-side token and user data validation
7. **Automatic Cleanup**: Invalid data is immediately cleared

## Testing the Fix

### Verify No Automatic Login

1. **Clear all browser data**:
   - Open browser dev tools → Application → Storage
   - Clear all localStorage, sessionStorage, and cookies
   - Or use incognito/private browsing mode

2. **Access the deployed link directly**:
   - Go to `https://xpomatch-dev-event-admin-portal.azurewebsites.net/AUTO/event-admin/dashboard`
   - **Expected**: You should be redirected to the login page
   - **Expected**: You should NOT be automatically logged in

3. **Test with old persisted data**:
   - The app will automatically clear any old persisted auth state
   - Check console for "Clearing old persisted auth state for security" message
   - **Expected**: No automatic login occurs

4. **Test direct identifier URL**:
   - Go to `https://xpomatch-dev-event-admin-portal.azurewebsites.net/AUTO`
   - **Expected**: You should see the login form, NOT be redirected to dashboard
   - **Expected**: You must enter credentials to proceed

5. **Test proper login flow**:
   - Login with valid credentials on localhost
   - Navigate to production URL
   - **Expected**: Authentication should persist properly with valid cookies

### Verify Cross-Domain Authentication

1. **Login on localhost**:
   - Go to `http://localhost:3000/AUTO/auth/event-admin/login`
   - Login with valid credentials
   - Check that cookies are set in dev tools

2. **Navigate to production**:
   - Go to production URL
   - **Expected**: Should remain authenticated
   - **Expected**: API calls should work without 401 errors

## Migration from localStorage

The implementation maintains backward compatibility:

1. **Automatic migration**: Existing localStorage tokens are validated before use
2. **Gradual transition**: New logins use cookies, old sessions are validated
3. **Compatibility support**: localStorage fallback for embedded contexts
4. **Automatic cleanup**: Invalid data is cleared automatically

## Troubleshooting

### Common Issues

1. **Automatic login issue**: Clear all browser data and test in incognito mode
2. **Cookies not set**: Check if domain and path are correct
3. **CORS errors**: Verify origin is in allowed list
4. **Authentication loops**: Clear all cookies and localStorage
5. **compatibility issues**: Ensure localStorage fallback is working

### Debug Steps

1. Check browser dev tools → Application → Cookies
2. Verify CORS headers in Network tab
3. Check console for authentication errors
4. Test with cleared browser data
5. Check authentication status with `getAuthenticationStatus()`

### Debug Commands (Browser Console)

```javascript
// Check authentication status
getAuthenticationStatus()

// Clear all auth data
clearAllAuthData()

// Check if user data is valid
isValidUserData(JSON.parse(localStorage.getItem('user')))
```

## Benefits

1. **Security**: HTTP-only cookies prevent XSS attacks
2. **Reliability**: Strict validation prevents automatic login with invalid tokens
3. **Compatibility**: Works across subdomains and different environments
4. **User Experience**: Seamless authentication across domains (only when properly authenticated)
5. **Maintainability**: Centralized authentication management
6. **Standards Compliance**: Follows modern web security practices
7. **No false positives**: Users are only considered authenticated when they have valid, verified credentials

## Deployment

### Critical Changes to Deploy

These changes fix the automatic login security issue and MUST be deployed:

1. **Redux Persist Configuration** (`src/store/index.ts`):
   - Removed 'auth' from persist whitelist
   - Bumped version to clear old persisted state

2. **Main Page Logic** (`src/app/[identifier]/page.tsx`):
   - Strict redirect logic (only after form submission)
   - No automatic auth restoration
   - Old persisted state cleanup

3. **Auth Utilities** (`src/utils/authUtils.ts`):
   - Validation functions for user data and tokens
   - Centralized cleanup function

4. **Updated Middleware** (`middleware.ts`):
   - More conservative token validation

### Deployment Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Test locally** to ensure no automatic login occurs

3. **Deploy to production** using your deployment method

4. **Verify fix** by testing the scenarios in the "Testing the Fix" section

## Next Steps

1. **Monitor**: Watch for authentication errors in production
2. **Verify**: Confirm no users are automatically logged in after deployment
3. **Optimize**: Fine-tune cookie expiration times
4. **Enhance**: Add refresh token rotation
5. **Scale**: Consider session management for high traffic
6. **Security**: Regular token validation and cleanup 