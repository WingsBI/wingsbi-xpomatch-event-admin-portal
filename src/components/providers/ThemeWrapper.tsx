'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ApiThemeProvider } from '@/context/ApiThemeContext';

interface ThemeWrapperProps {
  children: ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const pathname = usePathname();
  const [identifier, setIdentifier] = useState<string | null>(null);

  useEffect(() => {
    // Extract identifier from URL path
    // URL format: /[identifier]/event-admin/...
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      setIdentifier(pathParts[0]);
    }
  }, [pathname]);

  // If no identifier found, render children without theme provider
  if (!identifier) {
    return <>{children}</>;
  }

  return (
    <ApiThemeProvider identifier={identifier}>
      {children}
    </ApiThemeProvider>
  );
} 