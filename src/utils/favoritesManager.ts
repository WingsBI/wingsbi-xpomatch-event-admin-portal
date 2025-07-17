import { fieldMappingApi, type FavoritesRequest } from '@/services/fieldMappingApi';
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
} 