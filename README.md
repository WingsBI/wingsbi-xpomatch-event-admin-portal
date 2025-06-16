# AI Matchmaking Platform

A comprehensive event management and AI-powered matchmaking platform built with Next.js.

## Features

### IT Admin Module
- Login and authentication
- Create and manage events
- Generate event IDs
- Manage event administrators
- Send invitation emails

### Event Admin Module
- Secure login with credentials
- View and edit event details
- Manage visitor and exhibitor data
- Upload Excel files for bulk data import
- Add custom attributes for visitors/exhibitors
- View onboarded users in card/tile format
- Set custom marketing abbreviations
- Send invitations to participants

### Visitor/Exhibitor Module
- Separate login portals
- Profile management
- AI-powered matchmaking

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI Library**: Material-UI (MUI) v5
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **Email**: Nodemailer
- **File Processing**: XLSX for Excel handling
- **Forms**: React Hook Form
- **Language**: TypeScript

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── it-admin/          # IT Admin dashboard
│   ├── event-admin/       # Event Admin dashboard
│   ├── visitor/           # Visitor portal
│   ├── exhibitor/         # Exhibitor portal
│   ├── iframe/            # SSR iframe pages
│   └── api/               # API routes
├── components/            # Reusable components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key
   EMAIL_SERVER=your_email_server
   EMAIL_FROM=your_email_address
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Features Implementation

- **Server-Side Rendering**: All iframe content is server-side rendered for optimal performance
- **Role-Based Access**: Separate dashboards for IT Admin, Event Admin, Visitors, and Exhibitors
- **Dynamic Attributes**: Custom field management for events and participants
- **Bulk Import**: Excel file upload and processing for participant data
- **Real-time Updates**: Live participant cards and status updates
- **AI Integration**: Ready for AI matchmaking algorithms implementation 