# Heart Icon Role-Based Visibility Implementation

## Overview

This implementation ensures that heart icons (favorite buttons) are only displayed for visitor and exhibitor users, and are hidden for event-admin users. This is based on the JWT token data where event-admin users have `roleName: "event-admin"` and `roleid: "1"`.

## Implementation Details

### 1. Utility Function

Added a new utility function in `src/utils/authUtils.ts`:

```typescript
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
```

### 2. Modified Pages

#### A. Visitors Page (`src/app/iframe/visitors/page.tsx`)
- **Import**: Added `isEventAdmin` to imports
- **Condition**: Wrapped heart icon with `{!isEventAdmin() && (...)}`
- **Result**: Heart icon only shows for non-event-admin users

#### B. Exhibitors Page (`src/app/iframe/exhibitors/page.tsx`)
- **Import**: Added `isEventAdmin` to imports  
- **Condition**: Wrapped heart icon with `{!isEventAdmin() && (...)}`
- **Result**: Heart icon only shows for non-event-admin users

#### C. Favorites Page (`src/app/[identifier]/event-admin/favourites/page.tsx`)
- **Import**: Added `isEventAdmin` to imports
- **Visitor Heart Icons**: Wrapped with `{!isEventAdmin() && (...)}`
- **Exhibitor Heart Icons**: Modified conditions to include `!isEventAdmin()`
- **Result**: All heart icons hidden for event-admin users

## Token Structure

The implementation checks for event-admin users based on this JWT token structure:

```json
{
  "id": "1",
  "email": "preyas.magdum@wingsbi.com",
  "firstName": "Preyas",
  "middleName": "",
  "lastName": "Magdum",
  "gender": "",
  "salutation": "",
  "eventId": "291",
  "eventTitle": "",
  "roleid": "1",
  "roleName": "event-admin",
  "exhibitorid": "0",
  "nbf": 1752816481,
  "exp": 1752902881,
  "iat": 1752816481,
  "iss": "https://localhost:44300",
  "aud": "https://localhost:44300"
}
```

## Role Logic

- **Event Admin**: `roleName === 'event-admin'` AND `roleid === '1'` → Heart icons HIDDEN
- **Visitor**: `roleName === 'Visitor'` AND `roleid === '3'` → Heart icons SHOWN
- **Exhibitor**: `roleName === 'Exhibitor'` AND `roleid === '4'` → Heart icons SHOWN

## Testing

To test the implementation:

1. **Login as Event Admin**:
   - Use credentials with `roleName: "event-admin"` and `roleid: "1"`
   - Navigate to visitors/exhibitors directories
   - Verify heart icons are NOT visible

2. **Login as Visitor**:
   - Use credentials with `roleName: "Visitor"` and `roleid: "3"`
   - Navigate to exhibitors directory
   - Verify heart icons are visible and functional

3. **Login as Exhibitor**:
   - Use credentials with `roleName: "Exhibitor"` and `roleid: "4"`
   - Navigate to visitors directory
   - Verify heart icons are visible and functional

## Benefits

1. **Role-Based Access Control**: Heart icons are only available to users who should have access to favorites functionality
2. **Clean UI**: Event admin users see a cleaner interface without unnecessary heart icons
3. **Consistent Behavior**: Same logic applied across all pages (visitors, exhibitors, favorites)
4. **Maintainable**: Centralized role checking logic in utility function

## Future Enhancements

- Add role-based permissions for other UI elements
- Implement role-based API access control
- Add role validation on the server side
- Create role-based component wrappers for reusability 