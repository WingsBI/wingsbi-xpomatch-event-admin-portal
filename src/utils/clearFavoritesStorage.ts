/**
 * Utility to clear localStorage favorites data
 * This ensures a clean transition from localStorage to API-based favorites
 */
export const clearFavoritesStorage = () => {
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Find and remove all favorites-related keys
    const favoritesKeys = keys.filter(key => 
      key.includes('favorites_') || 
      key.includes('visitor_favorites_') ||
      key.includes('exhibitor_favorites_')
    );
    
    favoritesKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed localStorage key: ${key}`);
    });
    
    console.log(`✅ Cleared ${favoritesKeys.length} favorites-related localStorage items`);
    return favoritesKeys.length;
  } catch (error) {
    console.error('Error clearing favorites storage:', error);
    return 0;
  }
};

/**
 * Check if there are any favorites in localStorage that should be migrated
 */
export const hasLegacyFavoritesData = (): boolean => {
  try {
    const keys = Object.keys(localStorage);
    return keys.some(key => 
      key.includes('favorites_') || 
      key.includes('visitor_favorites_') ||
      key.includes('exhibitor_favorites_')
    );
  } catch (error) {
    console.error('Error checking legacy favorites data:', error);
    return false;
  }
}; 