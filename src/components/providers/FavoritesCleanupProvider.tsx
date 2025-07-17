"use client";

import { useEffect } from 'react';
import { clearFavoritesStorage, hasLegacyFavoritesData } from '@/utils/clearFavoritesStorage';

/**
 * Provider component that cleans up legacy localStorage favorites data
 * This ensures a clean transition from localStorage to API-based favorites
 */
export default function FavoritesCleanupProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if there's legacy favorites data
    if (hasLegacyFavoritesData()) {
      console.log('🧹 Found legacy favorites data in localStorage, cleaning up...');
      const clearedCount = clearFavoritesStorage();
      
      if (clearedCount > 0) {
        console.log(`✅ Migration complete: ${clearedCount} localStorage items cleared`);
        console.log('🔄 Favorites are now managed via API only');
      }
    } else {
      console.log('✅ No legacy favorites data found, using API-based favorites');
    }
  }, []);

  return <>{children}</>;
} 