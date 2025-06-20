# Role-Based Navigation Implementation

## Overview
This implementation provides role-based navigation and access control for the event admin portal. Users are automatically redirected to appropriate pages based on their role and can only access pages they have permission to view.

## Role-Based Landing Pages

### 🎯 **Visitor Role**
- **Landing Page**: `/{identifier}/event-admin/visitors`
- **Accessible Pages**:
  - Visitors List: `/{identifier}/event-admin/visitors`
  - Visitors Matching: `/{identifier}/event-admin/visitors/matching`
  - Exhibitors List: `/{identifier}/event-admin/exhibitors`
  - Exhibitors Matching: `/{identifier}/event-admin/exhibitors/matching`

### 🏢 **Exhibitor Role**
- **Landing Page**: `/{identifier}/event-admin/exhibitors`
- **Accessible Pages**:
  - Visitors List: `/{identifier}/event-admin/visitors`
  - Visitors Matching: `/{identifier}/event-admin/visitors/matching`
  - Exhibitors List: `/{identifier}/event-admin/exhibitors`
  - Exhibitors Matching: `/{identifier}/event-admin/exhibitors/matching`

### 👨‍💼 **Event Admin Role**
- **Landing Page**: `/{identifier}/event-admin/dashboard`
- **Accessible Pages**: All pages (full access)

### 🔧 **IT Admin Role**
- **Landing Page**: `/{identifier}/it-admin/dashboard`
- **Accessible Pages**: IT admin specific pages

## Implementation Details

### 1. **Login Redirection** (`src/app/[identifier]/page.tsx`)
- Users are automatically redirected based on their role after successful login
- Logic implemented in lines 120-135 of the login page

### 2. **Navigation Menu** (`src/components/layouts/ResponsiveDashboardLayout.tsx`)
- Modified `getNavigationItems` function (lines 75-100)
- Visitors and exhibitors only see 2 navigation items:
  - Visitors (with submenu)
  - Exhibitors (with submenu)

### 3. **Route Protection** (`src/components/common/RoleBasedRoute.tsx`)
- New component that guards routes based on user roles
- Automatically redirects unauthorized users to their appropriate landing pages
- Applied to dashboard page to prevent visitor/exhibitor access

### 4. **Brand Display** (`src/components/layouts/ResponsiveDashboardLayout.tsx`)
- Shows role-appropriate labels in the header:
  - "Visitor Portal" for visitors
  - "Exhibitor Portal" for exhibitors
  - "Event Administrator" for event admins
  - "IT Administrator" for IT admins

## Testing Instructions

### Test Scenario 1: Visitor Login
1. Login with visitor credentials
2. **Expected**: User lands on `/{identifier}/event-admin/visitors`
3. **Expected**: Navigation only shows "Visitors" and "Exhibitors" menu items
4. **Expected**: Header shows "Visitor Portal"
5. Try accessing `/{identifier}/event-admin/dashboard` directly
6. **Expected**: Automatically redirected back to visitors page

### Test Scenario 2: Exhibitor Login
1. Login with exhibitor credentials
2. **Expected**: User lands on `/{identifier}/event-admin/exhibitors`
3. **Expected**: Navigation only shows "Visitors" and "Exhibitors" menu items
4. **Expected**: Header shows "Exhibitor Portal"
5. Try accessing `/{identifier}/event-admin/dashboard` directly
6. **Expected**: Automatically redirected back to exhibitors page

### Test Scenario 3: Event Admin Login
1. Login with event admin credentials
2. **Expected**: User lands on `/{identifier}/event-admin/dashboard`
3. **Expected**: Navigation shows all menu items (Dashboard, Event Details, Visitors, Exhibitors, Settings)
4. **Expected**: Header shows "Event Administrator"
5. Can access all pages without restrictions

## Files Modified

1. **`src/components/layouts/ResponsiveDashboardLayout.tsx`**
   - Updated `getNavigationItems` function for role-based navigation
   - Updated brand display for role-appropriate labels

2. **`src/app/[identifier]/page.tsx`**
   - Login redirect logic already existed and works correctly

3. **`src/components/common/RoleBasedRoute.tsx`** (NEW)
   - Route guard component for protecting pages

4. **`src/app/[identifier]/event-admin/dashboard/page.tsx`**
   - Added route protection using `RoleBasedRoute` component

## Security Features

✅ **Navigation Restriction**: Menu only shows allowed pages
✅ **Direct URL Protection**: Users can't access unauthorized pages by typing URLs
✅ **Automatic Redirection**: Users are redirected to appropriate pages based on role
✅ **Role-Based Landing**: Different roles land on different pages after login

## Usage Example

```tsx
// Protect a page that only event-admin and it-admin can access
<RoleBasedRoute allowedRoles={['event-admin', 'it-admin']}>
  <YourPageContent />
</RoleBasedRoute>

// Protect a page with custom redirect
<RoleBasedRoute 
  allowedRoles={['event-admin']} 
  redirectPath="/custom-redirect"
>
  <YourPageContent />
</RoleBasedRoute>
```

## Notes

- The system maintains all existing functionality for event admins and IT admins
- Visitors and exhibitors have a simplified, focused experience
- All route protection happens client-side with automatic redirects
- The implementation is scalable and can easily accommodate new roles 