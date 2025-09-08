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
    // Only start SignalR when user is authenticated
    if (!isAuthenticated || !user) {
      SignalRService.stop();
      setConnectionStatus("Disconnected");
      return;
    }

    const startSignalR = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setConnectionStatus("Error - No Token");
          return;
        }

        await SignalRService.start();
        setConnectionStatus(SignalRService.getConnectionState());
      } catch (error) {
        console.error("Failed to start SignalR:", error);
        setConnectionStatus("Error");
      }
    };

    const timer = setTimeout(() => {
      startSignalR();
    }, 500);

    const statusInterval = setInterval(() => {
      setConnectionStatus(SignalRService.getConnectionState());
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(statusInterval);
      SignalRService.stop();
      setConnectionStatus("Disconnected");
    };
  }, [isAuthenticated, user]);
 
  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
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
          top: '20px',
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
    </>
  );
}