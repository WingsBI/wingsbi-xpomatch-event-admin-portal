"use client";

import { useEffect, useState } from "react";
import SignalRService from "@/lib/signalr";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Props {
  children: React.ReactNode;
}

export default function NotificationProvider({ children }: Props) {
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");

  useEffect(() => {
    console.log("🚀 NotificationProvider: Starting SignalR connection");

    const startSignalR = async () => {
      try {
        await SignalRService.start();
        setConnectionStatus(SignalRService.getConnectionState());
      } catch (error) {
        console.error("NotificationProvider: Failed to start SignalR:", error);
        setConnectionStatus("Error");
      }
    };

    startSignalR();

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      const currentStatus = SignalRService.getConnectionState();
      setConnectionStatus(currentStatus);
    }, 5000);

    return () => {
      console.log("NotificationProvider: Cleaning up SignalR connection");
      clearInterval(statusInterval);
      SignalRService.stop();
      setConnectionStatus("Disconnected");
    };
  }, []);

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
            bottom: '100px', // Moved up to avoid conflict with notifications
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
        </div>
      )}
    </>
  );
}
