import { fieldMappingApi, type FavoritesRequest, type AddExhibitorFavouriteRequest } from '@/services/fieldMappingApi';
import { getCurrentVisitorId, getCurrentExhibitorId } from '@/utils/authUtils';

/**
 * Utility class for managing favorites with API-based synchronization
 */
export class FavoritesManager {
  /**
   * Check if an exhibitor is favorited by a visitor
   */
  static async checkExhibitorFavoriteStatus(identifier: string, exhibitorId: string): Promise<boolean> {
    try {
      let currentUserId = getCurrentVisitorId();
      if (!currentUserId) {
        console.log('🔍 No visitor ID found, using default ID 1 for favorites check');
        currentUserId = 1;
      }

      const response = await fieldMappingApi.getVisitorFavorites(identifier, currentUserId);
      
      if (response.statusCode === 200 && response.result?.exhibitors) {
        const targetExhibitorId = parseInt(exhibitorId, 10);
        return response.result.exhibitors.some(
          (favExhibitor: any) => favExhibitor.id === targetExhibitorId
        );
      }
      
      return false;
    } catch (error) {
      console.error('Error checking exhibitor favorite status:', error);
      return false;
    }
  }

  /**
   * Check if a visitor is favorited by an exhibitor
   */
  static async checkVisitorFavoriteStatus(identifier: string, visitorId: string): Promise<boolean> {
    try {
      let currentExhibitorId = getCurrentExhibitorId();
      if (!currentExhibitorId) {
        console.log('🔍 No exhibitor ID found in token, cannot check favorite status');
        return false;
      }

      console.log('🔍 Checking favorite status for visitor', visitorId, 'by exhibitor', currentExhibitorId);
      const response = await fieldMappingApi.getAllExhibitorFavorites(identifier, currentExhibitorId);
      
      console.log('🔍 API response status:', response.statusCode);
      console.log('🔍 API response data:', response.result);
      
      if (response.statusCode === 200 && response.result) {
        const targetVisitorId = parseInt(visitorId, 10);
        const isFavorited = response.result.some(
          (favorite: any) => favorite.visitorId === targetVisitorId && favorite.isFavorite
        );
        console.log('🔍 Is visitor', visitorId, 'favorited by exhibitor', currentExhibitorId, ':', isFavorited);
        return isFavorited;
      }
      
      console.log('🔍 API returned error or no data');
      return false;
    } catch (error) {
      console.error('Error checking visitor favorite status:', error);
      return false;
    }
  }

  /**
   * Toggle exhibitor favorite status for a visitor
   */
  static async toggleExhibitorFavorite(identifier: string, exhibitorId: string, currentStatus: boolean): Promise<boolean> {
    try {
      let currentUserId = getCurrentVisitorId();
      if (!currentUserId) {
        console.log('🔍 No visitor ID found, using default ID 1 for favorites toggle');
        currentUserId = 1;
      }

      const payload: FavoritesRequest = {
        visitorId: currentUserId,
        exhibitorId: parseInt(exhibitorId, 10),
        isFavorite: !currentStatus
      };

      const response = await fieldMappingApi.addFavorites(identifier, payload);
      
      if (response.statusCode === 200 && response.result) {
        console.log(`✅ Successfully ${!currentStatus ? 'added' : 'removed'} exhibitor from favorites`);
        return !currentStatus;
      } else {
        console.error('Failed to toggle exhibitor favorite:', response.message);
        return currentStatus; // Return current status if API failed
      }
    } catch (error) {
      console.error('Error toggling exhibitor favorite:', error);
      return currentStatus; // Return current status if error occurred
    }
  }

  /**
   * Toggle visitor favorite status for an exhibitor
   */
  static async toggleVisitorFavorite(identifier: string, visitorId: string, currentStatus: boolean): Promise<boolean> {
    try {
      let currentExhibitorId = getCurrentExhibitorId();
      if (!currentExhibitorId) {
        console.log('🔍 No exhibitor ID found in token, cannot toggle favorite');
        return currentStatus; // Return current status if no exhibitor ID
      }

      console.log('🔍 Using exhibitor ID from token:', currentExhibitorId);
      console.log('🔍 Toggling favorite for visitor ID:', visitorId);

      const payload: FavoritesRequest = {
        visitorId: parseInt(visitorId, 10),
        exhibitorId: currentExhibitorId,
        isFavorite: !currentStatus
      };

      console.log('🔍 API payload:', payload);

      const response = await fieldMappingApi.addFavorites(identifier, payload);
      
      if (response.statusCode === 200 && response.result) {
        console.log(`✅ Successfully ${!currentStatus ? 'added' : 'removed'} visitor from favorites`);
        return !currentStatus;
      } else {
        console.error('Failed to toggle visitor favorite:', response.message);
        return currentStatus; // Return current status if API failed
      }
    } catch (error) {
      console.error('Error toggling visitor favorite:', error);
      return currentStatus; // Return current status if error occurred
    }
  }

  /**
   * Get all favorite exhibitors for a visitor
   */
  static async getVisitorFavoriteExhibitors(identifier: string): Promise<any[]> {
    try {
      let currentUserId = getCurrentVisitorId();
      if (!currentUserId) {
        console.log('🔍 No visitor ID found, using default ID 1 for favorites');
        currentUserId = 1;
      }

      const response = await fieldMappingApi.getVisitorFavorites(identifier, currentUserId);
      
      if (response.statusCode === 200 && response.result?.exhibitors) {
        return response.result.exhibitors;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting visitor favorite exhibitors:', error);
      return [];
    }
  }

  /**
   * Get all favorite visitors for an exhibitor
   */
  static async getExhibitorFavoriteVisitors(identifier: string): Promise<any[]> {
    try {
      let currentExhibitorId = getCurrentExhibitorId();
      if (!currentExhibitorId) {
        console.log('🔍 No exhibitor ID found in token, cannot get favorite visitors');
        return [];
      }

      console.log('🔍 Getting favorite visitors for exhibitor ID:', currentExhibitorId);

      const response = await fieldMappingApi.getAllExhibitorFavorites(identifier, currentExhibitorId);
      
      if (response.statusCode === 200 && response.result) {
        const favorites = response.result.filter((favorite: any) => favorite.isFavorite);
        console.log('✅ Found', favorites.length, 'favorite visitors for exhibitor', currentExhibitorId);
        return favorites;
      }
      
      console.log('📦 No favorite visitors found or API error');
      return [];
    } catch (error) {
      console.error('Error getting exhibitor favorite visitors:', error);
      return [];
    }
  }

  /**
   * Toggle exhibitor favorite status for another exhibitor (exhibitor-to-exhibitor favorites)
   */
  static async toggleExhibitorToExhibitorFavorite(identifier: string, targetExhibitorId: string, currentStatus: boolean): Promise<boolean> {
    try {
      let currentExhibitorId = getCurrentExhibitorId();
      if (!currentExhibitorId) {
        console.log('🔍 No exhibitor ID found in token, cannot toggle exhibitor favorite');
        return currentStatus; // Return current status if no exhibitor ID
      }

      console.log('🔍 Exhibitor', currentExhibitorId, 'toggling favorite for exhibitor', targetExhibitorId);

      const payload: AddExhibitorFavouriteRequest = {
        likedByExhibitorId: currentExhibitorId,
        likedExhibitorId: parseInt(targetExhibitorId, 10),
        isFavourite: !currentStatus
      };

      console.log('🔍 Exhibitor-to-exhibitor favorite API payload:', payload);

      console.log('🔍 Making API call to addExhibitorFavorite...');
      
      // Add timeout wrapper to detect hanging API calls
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('API call timeout after 30 seconds')), 30000)
      );
      
      const response = await Promise.race([
        fieldMappingApi.addExhibitorFavorite(identifier, payload),
        timeoutPromise
      ]);
      
      console.log('🔍 API call completed, response received:', !!response);
      
      console.log('🔍 addExhibitorFavorite API response:', response);
      console.log('🔍 Response statusCode:', response.statusCode);
      console.log('🔍 Response result:', response.result);
      console.log('🔍 Expected new status:', !currentStatus);
      
      if (response.statusCode === 200) {
        console.log(`✅ Successfully ${!currentStatus ? 'added' : 'removed'} exhibitor from exhibitor favorites`);
        console.log('✅ Returning new status:', !currentStatus);
        return !currentStatus;
      } else {
        console.error('Failed to toggle exhibitor-to-exhibitor favorite:', response.message);
        console.error('Full response:', response);
        return currentStatus; // Return current status if API failed
      }
    } catch (error) {
      console.error('Error toggling exhibitor-to-exhibitor favorite:', error);
      return currentStatus; // Return current status if error occurred
    }
  }

  /**
   * Get all favorite exhibitors for an exhibitor (exhibitor-to-exhibitor favorites)
   */
  static async getExhibitorFavoriteExhibitors(identifier: string): Promise<any[]> {
    try {
      let currentExhibitorId = getCurrentExhibitorId();
      if (!currentExhibitorId) {
        console.log('🔍 No exhibitor ID found in token, cannot get favorite exhibitors');
        return [];
      }

      console.log('🔍 Getting favorite exhibitors for exhibitor ID:', currentExhibitorId);

      const response = await fieldMappingApi.getFavouritedExhibitors(identifier, currentExhibitorId);
      
      console.log('🔍 getFavouritedExhibitors response:', response);
      console.log('🔍 Response statusCode:', response.statusCode);
      console.log('🔍 Response result:', response.result);
      
      if (response.statusCode === 200 && response.result) {
        console.log('✅ Found', response.result.length, 'favorite exhibitors for exhibitor', currentExhibitorId);
        console.log('✅ Favorite exhibitors data:', response.result);
        return response.result;
      }
      
      console.log('📦 No favorite exhibitors found or API error');
      return [];
    } catch (error) {
      console.error('Error getting exhibitor favorite exhibitors:', error);
      return [];
    }
  }

  /**
   * Check if an exhibitor is favorited by another exhibitor (exhibitor-to-exhibitor favorites)
   * Now uses the getFavouritedExhibitors API to check status
   */
  static async checkExhibitorToExhibitorFavoriteStatus(identifier: string, targetExhibitorId: string): Promise<boolean> {
    try {
      const favoriteExhibitors = await this.getExhibitorFavoriteExhibitors(identifier);
      const targetId = parseInt(targetExhibitorId, 10);
      return favoriteExhibitors.some((exhibitor: any) => exhibitor.id === targetId);
    } catch (error) {
      console.error('Error checking exhibitor-to-exhibitor favorite status:', error);
      return false;
    }
  }
} 