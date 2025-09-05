"use client";

import { useEffect, useState } from "react";
import SignalRService from "@/lib/signalr";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Load debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import("@/utils/signalrDebug");
}

interface Props {
  token: string;
  children: React.ReactNode;
}

export default function NotificationProvider({ token, children }: Props) {
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");

  console.log("🚀 NotificationProvider RENDERED with token:", token ? "YES" : "NO");

  useEffect(() => {
    // Debug: Log token availability
    console.log("🔍 NotificationProvider useEffect triggered");
    console.log("🔍 NotificationProvider: Token provided:", token ? "Yes" : "No");
    console.log("🔍 NotificationProvider: Token length:", token ? token.length : 0);
    if (token) {
      console.log("🔍 NotificationProvider: Token preview:", token.substring(0, 20) + "...");
    }

    // Only start SignalR if we have a valid token
    if (token && token.trim() !== "") {
      const startSignalR = async () => {
        try {
          await SignalRService.start(token);
          setConnectionStatus(SignalRService.getConnectionState());
          
          // Check connection status periodically
          const statusInterval = setInterval(() => {
            const currentStatus = SignalRService.getConnectionState();
            setConnectionStatus(currentStatus);
          }, 5000);

          return () => {
            clearInterval(statusInterval);
          };
        } catch (error) {
          console.error("NotificationProvider: Failed to start SignalR:", error);
          setConnectionStatus("Error");
        }
      };

      startSignalR();
    } else {
      console.warn("NotificationProvider: No valid token provided, SignalR not started");
      setConnectionStatus("No Token");
    }

    return () => {
      console.log("NotificationProvider: Stopping SignalR connection");
      SignalRService.stop();
      setConnectionStatus("Disconnected");
    };
  }, [token]);

  return (
    <>
      {children}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Debug connection status in development */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: connectionStatus === 'Connected' ? '#4caf50' : 
                       connectionStatus === 'Connecting' ? '#ff9800' : 
                       connectionStatus === 'No Token' ? '#9e9e9e' : '#f44336',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999,
            fontFamily: 'monospace'
          }}
        >
          SignalR: {connectionStatus}
        </div>
      )}
    </>
  );
}