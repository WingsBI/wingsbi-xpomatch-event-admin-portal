/**
 * Utility to clear localStorage favorites data
 * This ensures a clean transition from localStorage to API-based favorites
 */
export const clearFavoritesStorage = () => {
  // No longer using localStorage for favorites; keep as noop for backward compatibility
  console.log('Favorites are stored via API; no localStorage to clear');
  return 0;
};

/**
 * Check if there are any favorites in localStorage that should be migrated
 */
export const hasLegacyFavoritesData = (): boolean => false;