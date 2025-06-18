# Authentication System Documentation

## Overview

This project now uses a unified authentication system that supports multiple user roles through a single login interface. All users (Event Admin, Visitor, Exhibitor) access the same login page and are routed to appropriate dashboards based on their role.

## Features

- **Single Login Page**: One login interface for all user types
- **Token-Based Authentication**: Secure JWT-like token system
- **Role-Based Routing**: Automatic redirection based on user role
- **Role-Based Dashboard**: Different content displayed based on user permissions
- **Session Management**: Persistent login state with automatic token refresh
- **Permission System**: Granular permissions per user role

## User Roles

### Event Admin
- **Route**: `/event-admin/dashboard` → redirects to `/dashboard`
- **Permissions**: 
  - `manage_events`
  - `manage_users`
  - `view_analytics`
- **Dashboard Features**:
  - Event Overview
  - Visitors Management
  - Exhibitors Management
  - Analytics & Reports
  - Event Settings

### Visitor
- **Route**: `/visitor/dashboard` → redirects to `/dashboard`
- **Permissions**:
  - `view_events`
  - `join_sessions`
- **Dashboard Features**:
  - Event Schedule
  - Exhibitor Directory
  - Networking
  - My Profile

### Exhibitor
- **Route**: `/exhibitor/dashboard` → redirects to `/dashboard`
- **Permissions**:
  - `manage_booth`
  - `view_visitors`
  - `upload_materials`
- **Dashboard Features**:
  - Booth Management
  - Visitor Interactions
  - Event Schedule
  - Analytics

## Demo Credentials

For testing purposes, use these credentials:

### Event Admin
- **Email**: `admin@event.com`
- **Password**: `admin123`
- **Event ID**: `EVT001`

### Visitor
- **Email**: `visitor@event.com`
- **Password**: `visitor123`
- **Event ID**: `EVT001`

### Exhibitor
- **Email**: `exhibitor@event.com`
- **Password**: `exhibitor123`
- **Event ID**: `EVT001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Request/Response Examples

#### Login Request
```json
{
  "email": "admin@event.com",
  "password": "admin123",
  "eventId": "EVT001"
}
```

#### Login Response
```json
{
  "success": true,
  "user": {
    "id": "1",
    "email": "admin@event.com",
    "firstName": "John",
    "lastName": "Admin",
    "role": "event-admin",
    "eventId": "EVT001",
    "permissions": ["manage_events", "manage_users", "view_analytics"]
  },
  "token": "token_...",
  "refreshToken": "refresh_...",
  "message": "Login successful"
}
```

## Usage

### 1. Basic Login Flow

```typescript
import { useAuth } from '@/context/AuthContext';

function LoginComponent() {
  const { login } = useAuth();
  
  const handleSubmit = async (credentials) => {
    const result = await login(credentials);
    if (result.success) {
      // User will be automatically redirected
    } else {
      console.error(result.error);
    }
  };
}
```

### 2. Protecting Routes

```typescript
import { useAuth } from '@/context/AuthContext';

function ProtectedComponent() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return <div>Welcome {user.firstName}!</div>;
}
```

### 3. Role-Based Access

```typescript
import { useAuth } from '@/context/AuthContext';

function RoleSpecificComponent() {
  const { user } = useAuth();
  
  return (
    <div>
      {user?.role === 'event-admin' && (
        <AdminPanel />
      )}
      {user?.role === 'visitor' && (
        <VisitorDashboard />
      )}
      {user?.role === 'exhibitor' && (
        <ExhibitorPanel />
      )}
    </div>
  );
}
```

### 4. Check Permissions

```typescript
import { useAuth } from '@/context/AuthContext';

function PermissionBasedComponent() {
  const { user } = useAuth();
  
  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) || false;
  };
  
  return (
    <div>
      {hasPermission('manage_events') && (
        <EventManagement />
      )}
    </div>
  );
}
```

## File Structure

```
src/
├── types/
│   └── auth.ts                 # Authentication type definitions
├── context/
│   └── AuthContext.tsx         # Authentication context provider
├── app/
│   ├── auth/
│   │   └── login/
│   │       └── page.tsx        # Common login page
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       │   └── route.ts    # Login API endpoint
│   │   │       └── me/
│   │   │           └── route.ts    # User profile API endpoint
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Unified dashboard
│   │   ├── event-admin/
│   │   │   └── dashboard/
│   │   │       └── page.tsx        # Event admin redirect
│   │   ├── visitor/
│   │   │   └── dashboard/
│   │   │       └── page.tsx        # Visitor redirect
│   │   └── exhibitor/
│   │       └── dashboard/
│   │           └── page.tsx        # Exhibitor redirect
│   └── components/
│       └── dashboard/
│           └── RoleBasedDashboard.tsx  # Role-aware dashboard component
└── components/
    └── dashboard/
        └── RoleBasedDashboard.tsx  # Role-aware dashboard component
```

## Authentication Flow

1. **User visits the application**
   - If not authenticated → redirected to `/auth/login`
   - If authenticated → redirected to `/dashboard`

2. **User submits login form**
   - Credentials sent to `/api/auth/login`
   - Server validates credentials
   - On success: token generated and user data returned
   - Client stores token and user data

3. **Role-based redirection**
   - Based on user role, redirect to appropriate route
   - All role-specific routes redirect to unified `/dashboard`

4. **Dashboard rendering**
   - `RoleBasedDashboard` component reads user role
   - Displays appropriate cards and navigation options
   - Different permissions enable/disable features

5. **Session management**
   - Token stored in localStorage
   - Auto-refresh on app load
   - Logout clears all stored data

## Security Considerations

1. **Token Management**
   - Tokens have expiration times
   - Refresh tokens for extended sessions
   - Automatic logout on token expiry

2. **Role Validation**
   - Server-side role validation
   - Client-side role checking for UI
   - Permission-based feature access

3. **Event Access Control**
   - Users tied to specific events
   - Event ID validation during login
   - Cross-event access prevention

## Customization

### Adding New Roles

1. Update `UserRole` type in `src/types/auth.ts`
2. Add role logic in `AuthContext.tsx`
3. Update `RoleBasedDashboard.tsx` with new role cards
4. Create role-specific routes if needed

### Adding New Permissions

1. Update user permissions in API mock data
2. Add permission checks in components
3. Update dashboard cards based on permissions

### Custom Authentication

Replace the mock authentication in `/api/auth/` endpoints with your actual authentication service:

1. Replace mock user database with real database calls
2. Implement proper JWT token generation
3. Add password hashing and validation
4. Integrate with your user management system

## Troubleshooting

### Common Issues

1. **Infinite redirect loops**
   - Check authentication state in useEffect dependencies
   - Ensure proper loading state handling

2. **Token not persisting**
   - Verify localStorage is available
   - Check token format and parsing

3. **Role-based features not showing**
   - Verify user permissions array
   - Check role string matching (case-sensitive)

4. **Login not working**
   - Check API endpoint responses
   - Verify credential format and validation

### Debug Tips

1. Enable console logging in AuthContext
2. Check localStorage for stored tokens
3. Test API endpoints directly
4. Verify user role and permissions in context 