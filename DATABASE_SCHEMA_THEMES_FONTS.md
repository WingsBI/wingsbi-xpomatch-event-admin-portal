# Database Schema for Themes and Fonts Metadata

## Themes Metadata Table

### `themes` Table Structure

```sql
CREATE TABLE themes (
    -- Primary identification
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    theme_key VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'corporate', 'ocean-blue'
    name VARCHAR(100) NOT NULL, -- e.g., 'Executive Gray', 'Ocean Blue'
    
    -- Visual metadata
    description TEXT, -- Detailed description
    preview_color VARCHAR(7) NOT NULL, -- Hex color for preview (e.g., '#374151')
    category VARCHAR(50) DEFAULT 'professional', -- 'professional', 'modern', 'classic'
    
    -- Theme configuration (JSON)
    primary_colors JSON, -- {"main": "#374151", "light": "#6b7280", "dark": "#1f2937"}
    secondary_colors JSON, -- {"main": "#d97706", "light": "#f59e0b", "dark": "#92400e"}
    background_colors JSON, -- {"default": "#f9fafb", "paper": "#ffffff"}
    text_colors JSON, -- {"primary": "#111827", "secondary": "#4b5563"}
    
    -- Theme properties
    mode ENUM('light', 'dark') DEFAULT 'light',
    border_radius INT DEFAULT 8, -- in pixels
    elevation_shadows JSON, -- Shadow configurations
    
    -- Component overrides (JSON)
    component_overrides JSON, -- MUI component style overrides
    
    -- Management metadata
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    version VARCHAR(10) DEFAULT '1.0',
    
    -- Organization & Access
    organization_id VARCHAR(36), -- For multi-tenant systems
    access_level ENUM('public', 'organization', 'admin') DEFAULT 'public',
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    
    -- Audit fields
    created_by VARCHAR(36), -- User ID who created this theme
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36), -- User ID who last updated
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_theme_key (theme_key),
    INDEX idx_category (category),
    INDEX idx_organization (organization_id),
    INDEX idx_active (is_active),
    INDEX idx_usage (usage_count DESC)
);
```

### Sample Theme Record

```json
{
  "id": "theme-001",
  "theme_key": "corporate",
  "name": "Executive Gray",
  "description": "Professional corporate theme with neutral tones perfect for business applications",
  "preview_color": "#374151",
  "category": "professional",
  "primary_colors": {
    "main": "#374151",
    "light": "#6b7280", 
    "dark": "#1f2937"
  },
  "secondary_colors": {
    "main": "#d97706",
    "light": "#f59e0b",
    "dark": "#92400e"
  },
  "background_colors": {
    "default": "#f9fafb",
    "paper": "#ffffff"
  },
  "text_colors": {
    "primary": "#111827",
    "secondary": "#4b5563"
  },
  "mode": "light",
  "border_radius": 8,
  "component_overrides": {
    "MuiButton": {
      "styleOverrides": {
        "root": {
          "textTransform": "none",
          "fontWeight": 500
        }
      }
    }
  },
  "is_active": true,
  "is_default": false,
  "version": "1.2",
  "organization_id": "org-123",
  "access_level": "public",
  "usage_count": 150,
  "created_by": "admin-001",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Fonts Metadata Table

### `fonts` Table Structure

```sql
CREATE TABLE fonts (
    -- Primary identification
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    font_key VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'inter', 'nunito-sans'
    name VARCHAR(100) NOT NULL, -- e.g., 'Inter', 'Nunito Sans'
    
    -- Font details
    font_family VARCHAR(255) NOT NULL, -- CSS font-family string
    fallback_fonts VARCHAR(255), -- Fallback font list
    display_name VARCHAR(100), -- For UI display
    
    -- Font characteristics
    category VARCHAR(50) DEFAULT 'sans-serif', -- 'sans-serif', 'serif', 'monospace'
    weight_variants JSON, -- Available weights: [300, 400, 500, 600, 700]
    style_variants JSON, -- Available styles: ['normal', 'italic']
    
    -- Loading configuration
    cdn_url VARCHAR(500), -- Google Fonts or other CDN URL
    local_files JSON, -- Local font file paths
    font_display VARCHAR(20) DEFAULT 'swap', -- CSS font-display property
    
    -- Font metrics
    line_height_ratio DECIMAL(3,2) DEFAULT 1.5, -- Default line height
    letter_spacing DECIMAL(4,3) DEFAULT 0.0, -- Default letter spacing in em
    
    -- License and legal
    license_type VARCHAR(50), -- 'Open Source', 'Commercial', 'Free'
    license_url VARCHAR(500), -- URL to license details
    attribution_required BOOLEAN DEFAULT false,
    
    -- Loading performance
    file_size_kb INT, -- Approximate file size
    load_priority INT DEFAULT 5, -- 1-10, higher = more important
    
    -- Compatibility
    browser_support JSON, -- Browser compatibility info
    language_support JSON, -- Supported languages/character sets
    
    -- Management metadata
    is_active BOOLEAN DEFAULT true,
    is_system_font BOOLEAN DEFAULT false, -- Built-in system font
    version VARCHAR(10) DEFAULT '1.0',
    
    -- Organization & Access
    organization_id VARCHAR(36),
    access_level ENUM('public', 'organization', 'admin') DEFAULT 'public',
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    
    -- Audit fields
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_font_key (font_key),
    INDEX idx_category (category),
    INDEX idx_organization (organization_id),
    INDEX idx_active (is_active),
    INDEX idx_usage (usage_count DESC)
);
```

### Sample Font Record

```json
{
  "id": "font-001",
  "font_key": "inter",
  "name": "Inter",
  "font_family": "\"Inter\", \"Roboto\", \"Helvetica\", \"Arial\", sans-serif",
  "fallback_fonts": "\"Roboto\", \"Helvetica\", \"Arial\", sans-serif",
  "display_name": "Inter",
  "category": "sans-serif",
  "weight_variants": [300, 400, 500, 600, 700],
  "style_variants": ["normal", "italic"],
  "cdn_url": "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  "local_files": {
    "woff2": "/fonts/inter/inter-variable.woff2",
    "woff": "/fonts/inter/inter-variable.woff"
  },
  "font_display": "swap",
  "line_height_ratio": 1.5,
  "letter_spacing": 0.0,
  "license_type": "Open Source",
  "license_url": "https://scripts.sil.org/OFL",
  "attribution_required": false,
  "file_size_kb": 45,
  "load_priority": 8,
  "browser_support": {
    "chrome": "4+",
    "firefox": "3.5+",
    "safari": "3.1+",
    "edge": "12+"
  },
  "language_support": ["latin", "latin-ext", "cyrillic"],
  "is_active": true,
  "is_system_font": false,
  "version": "3.19",
  "organization_id": "org-123",
  "access_level": "public",
  "usage_count": 89,
  "created_by": "admin-001",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Event Theme Assignments Table

### `event_theme_configs` Table Structure

```sql
CREATE TABLE event_theme_configs (
    -- Primary identification
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    event_id VARCHAR(255) NOT NULL,
    
    -- Theme assignment
    theme_id VARCHAR(36) NOT NULL, -- FK to themes.id
    font_id VARCHAR(36) NOT NULL, -- FK to fonts.id
    
    -- Cached values for performance
    theme_key VARCHAR(50) NOT NULL, -- Cached from themes table
    font_key VARCHAR(50) NOT NULL, -- Cached from fonts table
    theme_name VARCHAR(100) NOT NULL, -- Cached for emails/display
    font_name VARCHAR(100) NOT NULL, -- Cached for emails/display
    
    -- Assignment metadata
    assignment_reason VARCHAR(255), -- Why this theme was assigned
    notes TEXT, -- Additional notes from IT Admin
    
    -- Status and lifecycle
    status ENUM('assigned', 'active', 'overridden', 'expired') DEFAULT 'assigned',
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP NULL, -- Optional expiration
    
    -- Assignment tracking
    assigned_by VARCHAR(36) NOT NULL, -- IT Admin user ID
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_applied_at TIMESTAMP NULL, -- When Event Admin last used it
    
    -- Change tracking
    previous_theme_id VARCHAR(36), -- Previous theme before this assignment
    previous_font_id VARCHAR(36), -- Previous font before this assignment
    change_reason VARCHAR(255), -- Reason for change
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints and indexes
    UNIQUE KEY unique_event_theme (event_id),
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE RESTRICT,
    FOREIGN KEY (font_id) REFERENCES fonts(id) ON DELETE RESTRICT,
    INDEX idx_event_id (event_id),
    INDEX idx_theme_id (theme_id),
    INDEX idx_font_id (font_id),
    INDEX idx_assigned_by (assigned_by),
    INDEX idx_status (status),
    INDEX idx_effective_dates (effective_from, effective_until)
);
```

## Usage Analytics Tables

### `theme_usage_analytics` Table

```sql
CREATE TABLE theme_usage_analytics (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- What was used
    theme_id VARCHAR(36) NOT NULL,
    font_id VARCHAR(36),
    
    -- Who used it
    user_id VARCHAR(36),
    event_id VARCHAR(255),
    user_role ENUM('event-admin', 'visitor', 'exhibitor', 'it-admin'),
    
    -- Usage context
    session_id VARCHAR(100), -- Browser session
    ip_address VARCHAR(45), -- For geographic analytics
    user_agent TEXT, -- Browser/device info
    
    -- Usage details
    action_type ENUM('applied', 'changed', 'previewed', 'reverted'),
    source ENUM('default-assignment', 'manual-selection', 'api'),
    duration_minutes INT, -- How long theme was active
    
    -- Performance metrics
    load_time_ms INT, -- Time to apply theme
    page_views INT DEFAULT 1, -- Pages viewed with this theme
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    
    -- Indexes
    FOREIGN KEY (theme_id) REFERENCES themes(id),
    FOREIGN KEY (font_id) REFERENCES fonts(id),
    INDEX idx_theme_usage (theme_id, started_at),
    INDEX idx_user_usage (user_id, started_at),
    INDEX idx_event_usage (event_id, started_at)
);
```

## API Response Models

### Theme API Response Model

```typescript
interface ThemeMetadata {
  // Basic info
  id: string;
  themeKey: string;
  name: string;
  description: string;
  previewColor: string;
  category: string;
  
  // Visual configuration
  primaryColors: {
    main: string;
    light: string;
    dark: string;
  };
  secondaryColors: {
    main: string;
    light: string;
    dark: string;
  };
  backgroundColors: {
    default: string;
    paper: string;
  };
  textColors: {
    primary: string;
    secondary: string;
  };
  
  // Theme properties
  mode: 'light' | 'dark';
  borderRadius: number;
  componentOverrides: Record<string, any>;
  
  // Management
  isActive: boolean;
  isDefault: boolean;
  version: string;
  usageCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### Font API Response Model

```typescript
interface FontMetadata {
  // Basic info
  id: string;
  fontKey: string;
  name: string;
  fontFamily: string;
  displayName: string;
  category: string;
  
  // Font characteristics
  weightVariants: number[];
  styleVariants: string[];
  
  // Loading
  cdnUrl?: string;
  localFiles?: Record<string, string>;
  fontDisplay: string;
  
  // Typography
  lineHeightRatio: number;
  letterSpacing: number;
  
  // License
  licenseType: string;
  licenseUrl?: string;
  attributionRequired: boolean;
  
  // Performance
  fileSizeKb: number;
  loadPriority: number;
  
  // Compatibility
  browserSupport: Record<string, string>;
  languageSupport: string[];
  
  // Management
  isActive: boolean;
  isSystemFont: boolean;
  version: string;
  usageCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

## Indexes and Performance Considerations

### Recommended Indexes

```sql
-- Themes table indexes
CREATE INDEX idx_themes_lookup ON themes(theme_key, is_active);
CREATE INDEX idx_themes_category_active ON themes(category, is_active);
CREATE INDEX idx_themes_organization_access ON themes(organization_id, access_level);
CREATE INDEX idx_themes_usage_popular ON themes(usage_count DESC, is_active);

-- Fonts table indexes  
CREATE INDEX idx_fonts_lookup ON fonts(font_key, is_active);
CREATE INDEX idx_fonts_category_active ON fonts(category, is_active);
CREATE INDEX idx_fonts_organization_access ON fonts(organization_id, access_level);
CREATE INDEX idx_fonts_performance ON fonts(load_priority DESC, file_size_kb);

-- Event assignments indexes
CREATE INDEX idx_assignments_event_status ON event_theme_configs(event_id, status);
CREATE INDEX idx_assignments_theme_active ON event_theme_configs(theme_id, status);
CREATE INDEX idx_assignments_assigned_by_date ON event_theme_configs(assigned_by, assigned_at);

-- Analytics indexes
CREATE INDEX idx_analytics_theme_date ON theme_usage_analytics(theme_id, started_at DESC);
CREATE INDEX idx_analytics_user_date ON theme_usage_analytics(user_id, started_at DESC);
CREATE INDEX idx_analytics_event_date ON theme_usage_analytics(event_id, started_at DESC);
```

## Data Seeding Examples

### Insert Sample Themes

```sql
-- Ocean Blue theme
INSERT INTO themes (
  theme_key, name, description, preview_color, category,
  primary_colors, secondary_colors, background_colors, text_colors,
  mode, is_default, version, created_by
) VALUES (
  'default', 'Ocean Blue', 'Professional blue theme with clean design', '#1976d2', 'professional',
  '{"main": "#1976d2", "light": "#42a5f5", "dark": "#1565c0"}',
  '{"main": "#00acc1", "light": "#4dd0e1", "dark": "#00838f"}',
  '{"default": "#f8fafc", "paper": "#ffffff"}',
  '{"primary": "#1a202c", "secondary": "#4a5568"}',
  'light', true, '1.0', 'system'
);

-- Corporate Gray theme
INSERT INTO themes (
  theme_key, name, description, preview_color, category,
  primary_colors, secondary_colors, background_colors, text_colors,
  mode, version, created_by
) VALUES (
  'corporate', 'Executive Gray', 'Professional corporate theme with neutral tones', '#374151', 'professional',
  '{"main": "#374151", "light": "#6b7280", "dark": "#1f2937"}',
  '{"main": "#d97706", "light": "#f59e0b", "dark": "#92400e"}',
  '{"default": "#f9fafb", "paper": "#ffffff"}',
  '{"primary": "#111827", "secondary": "#4b5563"}',
  'light', '1.0', 'system'
);
```

### Insert Sample Fonts

```sql
-- Inter font
INSERT INTO fonts (
  font_key, name, font_family, category, 
  weight_variants, style_variants,
  cdn_url, font_display, license_type,
  file_size_kb, load_priority, version, created_by
) VALUES (
  'inter', 'Inter', "\"Inter\", \"Roboto\", \"Helvetica\", \"Arial\", sans-serif", 'sans-serif',
  '[300, 400, 500, 600, 700]', '["normal", "italic"]',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'swap', 'Open Source', 45, 8, '3.19', 'system'
);

-- Nunito Sans font
INSERT INTO fonts (
  font_key, name, font_family, category,
  weight_variants, style_variants,
  cdn_url, font_display, license_type,
  file_size_kb, load_priority, version, created_by, is_default
) VALUES (
  'nunitosans', 'Nunito Sans', "\"Nunito Sans\", \"Roboto\", \"Helvetica\", \"Arial\", sans-serif", 'sans-serif',
  '[300, 400, 500, 600, 700]', '["normal", "italic"]',
  'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&display=swap',
  'swap', 'Open Source', 38, 9, '3.0', 'system', true
);
```

This comprehensive metadata structure allows you to:

1. **Manage themes and fonts** with full configuration details
2. **Track usage and analytics** for optimization
3. **Control access** by organization/user level
4. **Maintain version history** and audit trails
5. **Optimize performance** with proper indexing
6. **Support multi-tenancy** with organization-level data 