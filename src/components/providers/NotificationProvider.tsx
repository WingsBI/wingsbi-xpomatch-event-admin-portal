"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SignalRService from "@/lib/signalr";
import { ToastContainer } from "react-toastify";
import { getAuthToken, getUserData } from "@/utils/cookieManager";
import "react-toastify/dist/ReactToastify.css";
 
interface Props {
  children: React.ReactNode;
}
 
export default function NotificationProvider({ children }: Props) {
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    console.log("🚀 NotificationProvider: Auth state changed");
    console.log("🚀 NotificationProvider: isAuthenticated:", isAuthenticated);
    console.log("🚀 NotificationProvider: user:", user);
    
    // Check cookie-based authentication
    const cookieToken = getAuthToken();
    const cookieUserData = getUserData();
    console.log("🚀 NotificationProvider: JWT Token exists in cookies:", !!cookieToken);
    console.log("🚀 NotificationProvider: User data from cookies:", cookieUserData);

    // Only start SignalR when user is authenticated
    if (!isAuthenticated || !user) {
      console.log("NotificationProvider: Not authenticated, skipping SignalR connection");
      SignalRService.stop(); // Stop any existing connection
      setConnectionStatus("Disconnected");
      return;
    }

    const startSignalR = async () => {
      try {
        console.log("NotificationProvider: User authenticated, attempting to start SignalR...");
        
        // Double-check we have the required data from cookies
        const token = getAuthToken();
        const userData = getUserData();
        const userId = userData?.id;
        
        if (!token) {
          console.error("NotificationProvider: No token found in cookies even though user is authenticated");
          setConnectionStatus("Error - No Token");
          return;
        }

        console.log("NotificationProvider: Starting SignalR with token and userId from cookies:", !!token, userId);
        await SignalRService.start();
        const newStatus = SignalRService.getConnectionState();
        console.log("NotificationProvider: SignalR started with status:", newStatus);
        setConnectionStatus(newStatus);
        
        // Log connection info for debugging
        const connectionInfo = SignalRService.getConnectionInfo();
        console.log("NotificationProvider: Connection info:", connectionInfo);
      } catch (error) {
        console.error("NotificationProvider: Failed to start SignalR:", error);
        setConnectionStatus("Error");
      }
    };

    // Add a delay to ensure auth state is fully established
    const timer = setTimeout(() => {
      startSignalR();
    }, 500);

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      const currentStatus = SignalRService.getConnectionState();
      const isConnected = SignalRService.isConnected();
      console.log("NotificationProvider: Status check - State:", currentStatus, "Connected:", isConnected);
      setConnectionStatus(currentStatus);
    }, 5000);

    return () => {
      console.log("NotificationProvider: Cleaning up SignalR connection");
      clearTimeout(timer);
      clearInterval(statusInterval);
      SignalRService.stop();
      setConnectionStatus("Disconnected");
    };
  }, [isAuthenticated, user]); // React to auth changes
 
  return (
    <>
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          bottom: '20px',
          right: '20px',
          width: '350px',
        }}
        toastStyle={{
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minHeight: '60px',
        }}
      />
     
      {/* Debug connection status in development */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '10px',
            background: connectionStatus === 'Connected' ? '#4caf50' :
                       connectionStatus === 'Connecting' ? '#ff9800' :
                       connectionStatus === 'Reconnecting' ? '#ff9800' :
                       connectionStatus === 'Error' ? '#f44336' : '#9e9e9e',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            zIndex: 9999,
            fontFamily: 'monospace',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            maxWidth: '200px'
          }}
        >
          <div>SignalR: {connectionStatus}</div>
          {SignalRService.isConnected() && (
            <div style={{ fontSize: '10px', opacity: 0.8 }}>
              ID: {SignalRService.getConnectionId()?.substring(0, 8)}...
            </div>
          )}
          <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              onClick={async () => {
                console.log("Manual test button clicked");
                const result = await SignalRService.testConnection();
                console.log("Test result:", result);
              }}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Test Connection
            </button>
            <button
              onClick={() => {
                console.log("Test notification button clicked");
                SignalRService.testNotification();
              }}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Test Toast
            </button>
            <button
              onClick={() => {
                console.log("Log details button clicked");
                SignalRService.logConnectionDetails();
              }}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Log Details
            </button>
            <button
              onClick={() => {
                console.log("Simulate message button clicked");
                SignalRService.simulateMessage();
              }}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Simulate Msg
            </button>
          </div>
        </div>
      )}
    </>
  );
}