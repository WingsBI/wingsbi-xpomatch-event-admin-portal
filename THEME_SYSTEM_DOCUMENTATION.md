# Event Admin Theme System Documentation

## Overview

This system allows **Event Administrators** to receive default themes assigned by IT Administrators from a separate system, and then **customize them as needed**. The Event Admin application fetches the assigned theme configuration as a starting point, but allows full theme and font customization.

## System Flow

```
IT Admin (Different Project) → Assigns Default Theme → Backend API → Event Admin Fetches → Default Applied → Event Admin Can Customize
```

## Key Features

1. **Default Theme Assignment**: IT Admin sets a default theme for the Event Admin
2. **Full Customization**: Event Admin can change themes and fonts freely
3. **Starting Point**: Assigned theme serves as the initial configuration
4. **Session Persistence**: Changes are saved locally for the session
5. **API-Driven Options**: Themes and fonts are fetched from backend APIs

## Architecture Components

### 1. Frontend Components

#### `SimpleThemeContext` (Modified)
- **Purpose**: Manages theme state and applies themes
- **Features**:
  - Fetches assigned theme configuration as starting point for Event Admins
  - Allows full theme customization for all users including Event Admins
  - Maintains backward compatibility for other user roles

#### `SimpleThemeSelector` (Modified)
- **Purpose**: Interactive theme selection interface
- **Features**:
  - Fully interactive for all users including Event Admins
  - Shows helpful notice about default theme from IT Admin
  - Displays assigned theme details when available

#### `ThemeAwareLayout` (New)
- **Purpose**: Wrapper component that provides theme context
- **Features**:
  - Simple boolean flag for Event Admin detection
  - Passes event ID for fetching default theme

### 2. Backend API Routes

#### `GET /api/themes/available`
- **Purpose**: Fetch available themes for customization
- **Response**: Array of `AvailableTheme` objects

#### `GET /api/fonts/available`
- **Purpose**: Fetch available fonts for customization
- **Response**: Array of `AvailableFont` objects

#### `GET /api/events/[eventId]/theme`
- **Purpose**: Event Admin fetches assigned default theme configuration
- **Response**: `ThemeConfig` object or 404 if not assigned

### 3. Database Schema (Managed by IT Admin Project)

The default theme data is stored in the IT Admin project's database:

```sql
-- Event Theme Configuration Table
CREATE TABLE event_theme_configs (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    theme_key VARCHAR(50) NOT NULL,
    font_key VARCHAR(50) NOT NULL,
    theme_name VARCHAR(100) NOT NULL,
    font_name VARCHAR(100) NOT NULL,
    created_by VARCHAR(36) NOT NULL, -- IT Admin ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## TypeScript Interfaces

```typescript
// Core theme configuration from IT Admin (used as default)
interface ThemeConfig {
  id: string;
  eventId: string;
  themeKey: string;
  fontKey: string;
  themeName: string;
  fontName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // IT Admin ID from different project
}

// Available themes for customization
interface AvailableTheme {
  key: string;
  name: string;
  description: string;
  preview: string; // Hex color for preview
}

// Available fonts for customization
interface AvailableFont {
  key: string;
  name: string;
  fontFamily: string; // CSS font-family value
}

// Event Admin theme settings
interface EventAdminThemeSettings {
  isThemeAssigned: boolean;
  themeConfig?: ThemeConfig;
  canChangeTheme: boolean; // Always true - everyone can customize
}
```

## Available Themes & Fonts

### Themes (5 Professional Options)
1. **Ocean Blue** (`default`) - Professional blue theme
2. **Executive Gray** (`corporate`) - Corporate neutral tones
3. **Forest Professional** (`green`) - Fresh green theme
4. **Teal Professional** (`teal`) - Modern teal theme
5. **Sunset Professional** (`orange`) - Warm orange theme

### Fonts (7 Options)
1. **Nunito Sans** (`nunitosans`) - Default font
2. **Inter** (`inter`) - Modern sans-serif
3. **Roboto** (`roboto`) - Google's material design font
4. **Poppins** (`poppins`) - Geometric sans-serif
5. **Montserrat** (`montserrat`) - Urban sans-serif
6. **Open Sans** (`opensans`) - Humanist sans-serif
7. **Lato** (`lato`) - Humanist sans-serif

## Implementation Guide

### 1. Update Your Main Layout

```tsx
// app/layout.tsx
import { ThemeAwareLayout } from '@/components/layouts/ThemeAwareLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Determine if current user is Event Admin and get event ID
  const isEventAdmin = true; // Get from your auth system
  const eventId = 'event-123'; // Get from session/auth/context

  return (
    <html lang="en">
      <body>
        <ThemeAwareLayout isEventAdmin={isEventAdmin} eventId={eventId}>
          {children}
        </ThemeAwareLayout>
      </body>
    </html>
  );
}
```

### 2. Use Theme Selector in Your UI

```tsx
// In your dashboard header or settings
import { SimpleThemeSelector } from '@/components/theme/SimpleThemeSelector';

function DashboardHeader() {
  return (
    <AppBar>
      <Toolbar>
        <Typography variant="h6">Event Dashboard</Typography>
        {/* Fully interactive theme selector for all users */}
        <SimpleThemeSelector variant="icon" />
      </Toolbar>
    </AppBar>
  );
}
```

### 3. API Response Examples

#### Default Theme Configuration: `/api/events/event-123/theme`

```json
{
  "id": "theme-config-1",
  "eventId": "event-123",
  "themeKey": "corporate",
  "fontKey": "inter",
  "themeName": "Executive Gray",
  "fontName": "Inter",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "createdBy": "it-admin-user-id"
}
```

If no default theme is assigned, return `404 Not Found`.

#### Available Themes: `/api/themes/available`

```json
[
  {
    "key": "default",
    "name": "Ocean Blue",
    "description": "Professional blue theme with clean design",
    "preview": "#1976d2"
  },
  {
    "key": "corporate",
    "name": "Executive Gray", 
    "description": "Professional corporate theme with neutral tones",
    "preview": "#374151"
  }
  // ... more themes
]
```

#### Available Fonts: `/api/fonts/available`

```json
[
  {
    "key": "nunitosans",
    "name": "Nunito Sans",
    "fontFamily": "\"Nunito Sans\", \"Roboto\", \"Helvetica\", \"Arial\", sans-serif"
  },
  {
    "key": "inter",
    "name": "Inter",
    "fontFamily": "\"Inter\", \"Roboto\", \"Helvetica\", \"Arial\", sans-serif"
  }
  // ... more fonts
]
```

### 4. Environment Variables

```env
# Add to your .env file
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## How It Works

### For Event Admin Users:
1. **Login**: Event Admin logs into the dashboard
2. **Default Fetch**: App automatically calls `/api/events/{eventId}/theme` for default theme
3. **Default Apply**: If default theme exists, it's automatically applied as starting point
4. **Full Customization**: Event Admin can change themes and fonts freely using available options
5. **Session Persistence**: Changes are saved to localStorage for the current session
6. **Fallback**: If no default assigned, uses app default theme (Ocean Blue)

### For Other Users (Visitors, Exhibitors):
1. **Local Storage**: Themes are saved/loaded from localStorage
2. **Full Control**: Can change themes and fonts freely
3. **Independent**: Not affected by Event Admin default assignments

## User Experience

### Event Admin with Assigned Default Theme:
- ✅ Sees assigned default theme automatically applied on first login
- ✅ Can customize theme and font freely from available options
- ✅ Views default theme details in selector dialog
- ✅ Changes are saved for current session
- ℹ️ Sees "Default Theme from IT Administrator" notice with customization capability

### Event Admin without Assigned Default Theme:
- ✅ Uses app default theme (Ocean Blue) as starting point
- ✅ Can customize theme and font freely from available options
- ✅ Full theme customization available
- ℹ️ No special notices, works like regular theme selector

### Other Users:
- ✅ Full theme customization available (same as before)
- ✅ Themes saved to localStorage
- ✅ Independent of Event Admin settings

## API Implementation Examples

### Get Available Themes
```typescript
// src/app/api/themes/available/route.ts
export async function GET() {
  return NextResponse.json([
    {
      key: 'default',
      name: 'Ocean Blue',
      description: 'Professional blue theme with clean design',
      preview: '#1976d2',
    },
    // ... more themes
  ]);
}
```

### Get Available Fonts
```typescript
// src/app/api/fonts/available/route.ts
export async function GET() {
  return NextResponse.json([
    {
      key: 'nunitosans',
      name: 'Nunito Sans',
      fontFamily: '"Nunito Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    // ... more fonts
  ]);
}
```

### Get Default Theme Configuration
```typescript
// src/app/api/events/[eventId]/theme/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    
    // Fetch from your backend API or database
    const themeConfig = await fetchDefaultThemeFromDatabase(eventId);
    
    if (!themeConfig) {
      return NextResponse.json(null, { status: 404 });
    }
    
    return NextResponse.json(themeConfig);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch default theme configuration' },
      { status: 500 }
    );
  }
}
```

## Troubleshooting

### Common Issues

1. **Default theme not applying**
   - Check if `eventId` is correctly passed to `ThemeAwareLayout`
   - Verify API endpoint returns valid theme data
   - Check browser network tab for API errors

2. **API returns 404 for default theme**
   - Normal behavior when no default theme is assigned
   - App will use built-in default theme (Ocean Blue)

3. **Theme customization not working**
   - Ensure theme/font options are available from APIs
   - Check browser console for API call errors
   - Verify theme selector is not in loading state

### Debug Tips

Enable console logging to see theme operations:
```typescript
// Check browser console for:
// - "Error fetching theme configuration" messages
// - Network tab for API call status
// - LocalStorage for saved theme preferences
```

## Benefits

1. **Guided Starting Point**: IT Admin provides professional default theme
2. **Full Flexibility**: Event Admin can customize as needed for their event
3. **Professional Defaults**: Even without customization, themes look professional
4. **Session Persistence**: Customizations are remembered during the session
5. **API-Driven**: Theme and font options come from backend for consistency
6. **Backward Compatible**: Other user types maintain full theme control

## Theme Behavior Summary

| User Type | Default Theme Source | Can Customize | Persistence |
|-----------|---------------------|---------------|-------------|
| Event Admin (with assigned default) | IT Admin assignment | ✅ Yes | Session (localStorage) |
| Event Admin (no assigned default) | App default (Ocean Blue) | ✅ Yes | Session (localStorage) |
| Other Users | localStorage or app default | ✅ Yes | Permanent (localStorage) |

This approach provides the perfect balance between IT Admin control and Event Admin flexibility! 🎨 