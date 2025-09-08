// SignalR debugging utilities

import SignalRService from "@/lib/signalr";
import { getAuthToken } from "@/utils/cookieManager";

/**
 * Debug utility to test SignalR connection manually
 */
export class SignalRDebugger {
  
  /**
   * Test the current SignalR connection status
   */
  static testConnection(): void {
    console.log("=== SignalR Connection Test ===");
    console.log("Connection State:", SignalRService.getConnectionState());
    console.log("Is Connected:", SignalRService.isConnected());
    
    const token = getAuthToken();
    console.log("Current Token:", token ? `${token.substring(0, 20)}...` : "No token found");
    
    if (!token) {
      console.error("❌ No authentication token found. User may not be logged in.");
      return;
    }
    
    if (!SignalRService.isConnected()) {
      console.warn("⚠️ SignalR is not connected. Attempting to reconnect...");
      SignalRService.start(token);
    } else {
      console.log("✅ SignalR is connected and ready to receive notifications");
    }
  }
  
  /**
   * Log detailed connection information
   */
  static logConnectionDetails(): void {
    console.log("=== SignalR Connection Details ===");
    const token = getAuthToken();
    
    if (token) {
      try {
        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("User ID:", payload.userId || payload.id);
        console.log("User Email:", payload.email);
        console.log("User Role:", payload.role || payload.roleName);
        console.log("Token Expiry:", new Date(payload.exp * 1000).toLocaleString());
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
    
    console.log("Hub URL:", "https://xpomatch-dev-event-admin-api.azurewebsites.net/notificationHub");
    console.log("Current State:", SignalRService.getConnectionState());
  }
  
  /**
   * Force reconnection with current token
   */
  static async forceReconnect(): Promise<void> {
    console.log("🔄 Forcing SignalR reconnection...");
    
    // Stop current connection
    SignalRService.stop();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get fresh token and reconnect
    const token = getAuthToken();
    if (token) {
      await SignalRService.start(token);
      console.log("Reconnection attempt completed. New state:", SignalRService.getConnectionState());
    } else {
      console.error("No token available for reconnection");
    }
  }

  /**
   * Try alternative connection methods to bypass CORS
   */
  static async tryAlternativeMethods(): Promise<void> {
    console.log("🔄 Trying alternative SignalR connection methods...");
    
    // Stop current connection
    SignalRService.stop();
    
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get token and try alternative methods
    
  }
}

// Global debug functions for browser console
if (typeof window !== 'undefined') {
  (window as any).signalRDebug = {
    test: () => SignalRDebugger.testConnection(),
    details: () => SignalRDebugger.logConnectionDetails(),
    reconnect: () => SignalRDebugger.forceReconnect(),
    alternative: () => SignalRDebugger.tryAlternativeMethods(),
    status: () => console.log("SignalR Status:", SignalRService.getConnectionState())
  };
  
  console.log("🔧 SignalR Debug utilities loaded. Available commands:");
  console.log("  - signalRDebug.test() - Test current connection");
  console.log("  - signalRDebug.details() - Show connection details");  
  console.log("  - signalRDebug.reconnect() - Force reconnection");
  console.log("  - signalRDebug.alternative() - Try alternative connection methods");
  console.log("  - signalRDebug.status() - Show current status");
}
