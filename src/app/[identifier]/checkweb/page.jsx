"use client";
import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

const Page = () => {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);


  console.log("messages", messages);
  
  useEffect(() => {
    let isMounted = true;
    
    const connect = async () => {
      // Stop existing connection if any
      if (connection) {
        await connection.stop();
        setConnection(null);
      }

      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7199/notificationHub", {
          accessTokenFactory: () =>
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJlbWFpbCI6ImpvaG5zb25qb3NodWFAZXhhbXBsZS5vcmciLCJmaXJzdE5hbWUiOiJKZW5uaWZlciIsIm1pZGRsZU5hbWUiOiIiLCJsYXN0TmFtZSI6IktoYW4iLCJnZW5kZXIiOiJNYWxlIiwic2FsdXRhdGlvbiI6Ik1yLiIsImV2ZW50SWQiOiIwIiwiZXZlbnRUaXRsZSI6IiIsInJvbGVpZCI6IjMiLCJyb2xlTmFtZSI6IkV4aGliaXRvciIsImV4aGliaXRvcmlkIjoiMSIsIm5iZiI6MTc1NzMxNTQzOCwiZXhwIjoxNzU3NDAxODM4LCJpYXQiOjE3NTczMTU0MzgsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjQ0MzAwIiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzMDAifQ.Z0ZEVd_7OCsnx91YfSASZ_Z2o3IyH1oWncl4BVz1x2I",
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      // Add connection event handlers
      newConnection.onreconnecting((error) => {
        console.log("🔄 SignalR reconnecting...", error);
      });

      newConnection.onreconnected((connectionId) => {
        console.log("✅ SignalR reconnected with ID:", connectionId);
      });

      newConnection.onclose((error) => {
        console.log("❌ SignalR connection closed", error);
        if (isMounted) {
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (isMounted) {
              console.log("🔄 Attempting to reconnect...");
              connect();
            }
          }, 5000);
        }
      });

      try {
        await newConnection.start();
        console.log("✅ Connected to SignalR Hub");
        console.log("🔗 Connection ID:", newConnection.connectionId);

        newConnection.on("ReceiveNotification", (msg) => {
          console.log("📩 Notification received:", msg);
          if (isMounted) {
            setMessages((prev) => [...prev, JSON.stringify(msg)]);
          }
        });

        if (isMounted) {
          setConnection(newConnection);
        }
      } catch (err) {
        console.error("❌ Connection failed:", err);
        if (isMounted) {
          // Retry connection after delay
          setTimeout(() => {
            if (isMounted) {
              console.log("🔄 Retrying connection...");
              connect();
            }
          }, 3000);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (connection) {
        connection.stop();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const sendMessage = async () => {
    if (connection) {
      try {
        const randomMessage =
          "Hello from frontend at " + new Date().toLocaleTimeString();
        await connection.invoke("SendMessage", randomMessage); // depends on your hub method
        console.log("➡️ Sent:", randomMessage);
      } catch (err) {
        console.error("❌ Send failed:", err);
      }
    }
  };

  const reconnect = async () => {
    console.log("🔄 Manual reconnect triggered");
    if (connection) {
      await connection.stop();
    }
    setConnection(null);
    setMessages([]);
    
    // Trigger reconnection
    const connect = async () => {
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7199/notificationHub", {
          accessTokenFactory: () =>
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJlbWFpbCI6ImpvaG5zb25qb3NodWFAZXhhbXBsZS5vcmciLCJmaXJzdE5hbWUiOiJKZW5uaWZlciIsIm1pZGRsZU5hbWUiOiIiLCJsYXN0TmFtZSI6IktoYW4iLCJnZW5kZXIiOiJNYWxlIiwic2FsdXRhdGlvbiI6Ik1yLiIsImV2ZW50SWQiOiIwIiwiZXZlbnRUaXRsZSI6IiIsInJvbGVpZCI6IjMiLCJyb2xlTmFtZSI6IkV4aGliaXRvciIsImV4aGliaXRvcmlkIjoiMSIsIm5iZiI6MTc1NzMxNTQzOCwiZXhwIjoxNzU3NDAxODM4LCJpYXQiOjE3NTczMTU0MzgsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjQ0MzAwIiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzMDAifQ.Z0ZEVd_7OCsnx91YfSASZ_Z2o3IyH1oWncl4BVz1x2I",
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      try {
        await newConnection.start();
        console.log("✅ Manual reconnect successful");
        newConnection.on("ReceiveNotification", (msg) => {
          console.log("📩 Notification received:", msg);
          setMessages((prev) => [...prev, JSON.stringify(msg)]);
        });
        setConnection(newConnection);
      } catch (err) {
        console.error("❌ Manual reconnect failed:", err);
      }
    };
    
    connect();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">📡 SignalR Test</h2>
      <div className="flex gap-4 mb-4">
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
        >
          Send Random Message
        </button>
        <button
          onClick={reconnect}
          className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700"
        >
          Reconnect
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-gray-100 rounded-md">
        <p className="text-sm">
          <strong>Connection Status:</strong> {connection ? "✅ Connected" : "❌ Disconnected"}
        </p>
        {connection && (
          <p className="text-sm">
            <strong>Connection ID:</strong> {connection.connectionId || "Loading..."}
          </p>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {messages.map((msg, idx) => (
          <li key={idx} className="p-2 border rounded-md">
            📩 {msg}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Page;
