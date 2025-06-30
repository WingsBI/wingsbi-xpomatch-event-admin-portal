# Cookie-Based Authentication Implementation

## Overview

This implementation resolves the cross-domain authentication issue where users were getting logged in on production without proper authentication tokens. The solution replaces `localStorage`-based token storage with secure HTTP-only cookies.

## Problem

The original issue occurred because:
1. **localStorage is origin-specific**: Tokens stored on `localhost:3000` are not accessible on `https://xpomatch-dev-event-admin-portal.azurewebsites.net`
2. **State inconsistency**: The application showed users as "logged in" but API calls failed with 401 unauthorized errors
3. **Security vulnerability**: Tokens stored in localStorage are vulnerable to XSS attacks

## Solution

The new implementation uses:
1. **HTTP-Only Cookies**: Secure token storage that's inaccessible to client-side JavaScript
2. **Cross-domain compatibility**: Proper cookie settings for subdomain sharing
3. **Fallback mechanism**: localStorage as backup for iframe scenarios
4. **CORS configuration**: Proper headers for cross-origin requests

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

#### Logout Route (`logout/route.ts`)
- Clears all authentication cookies
- Ensures proper cleanup

### 2. Authentication Context (`/src/context/AuthContext.tsx`)

- **Cookie-first approach**: Checks cookies before localStorage
- **Automatic refresh**: Calls `/api/auth/me` to validate authentication
- **Graceful fallback**: Uses localStorage for iframe compatibility
- **Proper cleanup**: Clears both cookies and localStorage on logout

### 3. API Service (`/src/services/apiService.ts`)

- **Credentials included**: All requests include cookies (`withCredentials: true`)
- **Token fallback**: Uses cookies first, then localStorage
- **Auto-retry**: Automatically retries failed requests after token refresh
- **Error handling**: Redirects to login on authentication failures

### 4. Redux Integration (`/src/store/slices/authSlice.ts`)

- **Cookie restoration**: Restores auth state from cookies on app start
- **Dual storage**: Updates both cookies and localStorage for compatibility
- **Error handling**: Proper error states and recovery

### 5. Middleware (`middleware.ts`)

- **CORS handling**: Proper cross-origin headers
- **Route protection**: Automatic redirects for unauthenticated users
- **Preflight support**: Handles OPTIONS requests

### 6. Cookie Manager Utility (`/src/utils/cookieManager.ts`)

- **Centralized management**: Consistent cookie operations
- **Security defaults**: Proper settings for authentication cookies
- **Helper methods**: Easy-to-use functions for common operations

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
```

## Security Features

1. **HTTP-Only Tokens**: Main tokens are inaccessible to JavaScript
2. **Secure Cookies**: HTTPS-only in production
3. **SameSite Protection**: CSRF attack prevention
4. **Automatic Expiration**: Tokens expire after set time
5. **Secure Headers**: Proper CORS and security headers

## Migration from localStorage

The implementation maintains backward compatibility:

1. **Automatic migration**: Existing localStorage tokens are still read
2. **Gradual transition**: New logins use cookies, old sessions continue working
3. **Iframe support**: localStorage fallback for embedded contexts

## Troubleshooting

### Common Issues

1. **Cookies not set**: Check if domain and path are correct
2. **CORS errors**: Verify origin is in allowed list
3. **Authentication loops**: Clear all cookies and localStorage
4. **iframe issues**: Ensure localStorage fallback is working

### Debug Steps

1. Check browser dev tools → Application → Cookies
2. Verify CORS headers in Network tab
3. Check console for authentication errors
4. Test with cleared browser data

## Testing

### Local Testing

1. Login on `localhost:3000`
2. Navigate to production URL (if available)
3. Verify authentication persists
4. Test API calls work properly

### Production Testing

1. Deploy changes to production
2. Test cross-domain navigation
3. Verify cookie security settings
4. Test logout functionality

## Benefits

1. **Security**: HTTP-only cookies prevent XSS attacks
2. **Compatibility**: Works across subdomains and different environments
3. **User Experience**: Seamless authentication across domains
4. **Maintainability**: Centralized cookie management
5. **Standards Compliance**: Follows modern web security practices

## Next Steps

1. **Monitor**: Watch for authentication errors in production
2. **Optimize**: Fine-tune cookie expiration times
3. **Enhance**: Add refresh token rotation
4. **Scale**: Consider session management for high traffic 