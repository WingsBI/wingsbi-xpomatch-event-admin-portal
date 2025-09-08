import React from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";
import { getAuthToken, getUserData } from "@/utils/cookieManager";

interface NotificationPayload {
  FromUserId: number;
  FromUserName: string;
  Message: string;
  Timestamp: string;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;

  public async start() {
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const userData = getUserData();
      const userId = userData?.id || "anonymous";
      const hubUrl = `https://xpomatch-dev-event-admin-api.azurewebsites.net/notificationHub`;

      // Stop any existing connection first
      if (this.connection) {
        await this.connection.stop();
        this.connection = null;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => {
            const currentToken = getAuthToken();
            if (!currentToken) {
              throw new Error("No authentication token available");
            }
            return currentToken;
          },
          // The server reads the JWT from the access_token query string.
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.ServerSentEvents |
            signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Debug)
        .build();

      await this.connection.start();
      console.log("✅ SignalR connected");
      this.setupEventHandlers();
      this.setupConnectionHandlers();
    } catch (err: any) {
      console.error("SignalR connection error:", err);
    }
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    this.connection.off("ReceiveNotification");

    this.connection.on("ReceiveNotification", (data: any) => {
      this.displayNotification(data);
    });
  }

  private displayNotification(data: any) {
    let message = "";
    let senderName = "System";
    let timestamp: string | undefined;

    // Normalize payload from backend (supports string or object with { FromUserName, Message, Timestamp })
    if (typeof data === "string") {
      message = data;
    } else if (data && typeof data === "object") {
      if (data.Message && (data.FromUserName || data.FromUserId)) {
        message = String(data.Message);
        senderName = String(data.FromUserName || `User ${data.FromUserId}`);
        timestamp = data.Timestamp ? new Date(data.Timestamp).toLocaleString() : undefined;
      } else if (data.message) {
        message = String(data.message);
        senderName = String((data as any).senderName || senderName);
      } else {
        message = JSON.stringify(data);
      }
    } else {
      message = String(data);
    }

    const content = (
      <div style={{ padding: "8px" }}>
        <div style={{ fontWeight: 600, marginBottom: "4px", color: "#1976d2" }}>{senderName}</div>
        <div style={{ fontSize: "14px", lineHeight: 1.4 }}>{message}</div>
        {timestamp && (
          <div style={{ marginTop: "6px", fontSize: "12px", color: "#666" }}>{timestamp}</div>
        )}
      </div>
    );

    toast.info(content, {
      position: "top-right",
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        background: "#ffffff",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        minHeight: "60px",
        maxWidth: "350px",
      },
    });
  }

  private setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.onreconnecting((error) => {
      console.warn("SignalR reconnecting...", error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log("✅ SignalR reconnected");
    });

    this.connection.onclose((error) => {
      console.log("❌ SignalR disconnected");
    });
  }

  public stop(): void {
    if (this.connection) {
      this.connection
        .stop()
        .then(() => {
          this.connection = null;
        })
        .catch((err) => {
          console.error("Error stopping SignalR connection:", err);
          this.connection = null;
        });
    }
  }

  public getConnectionState(): string {
    return this.connection ? signalR.HubConnectionState[this.connection.state] : "Disconnected";
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  public getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }
}

export default new SignalRService();


