'use client';

import React, { ReactNode } from 'react';
import { SimpleThemeProvider } from '@/context/SimpleThemeContext';

interface ThemeAwareLayoutProps {
  children: ReactNode;
  isEventAdmin?: boolean; // Simple boolean to indicate if user is Event Admin
  eventId?: string; // Event ID for Event Admin users
}

export function ThemeAwareLayout({ 
  children, 
  isEventAdmin = false,
  eventId 
}: ThemeAwareLayoutProps) {
  return (
    <SimpleThemeProvider isEventAdmin={isEventAdmin} eventId={eventId}>
      {children}
    </SimpleThemeProvider>
  );
}

export default ThemeAwareLayout; 