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
      const hubUrl = `https://localhost:7199/notificationHub`;

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
          headers: {
            'X-User-Id': userId
          },
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
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
    
    // Handle different data formats
    if (typeof data === "string") {
      // Simple string message
      message = data;
    } else if (data && typeof data === "object") {
      // Complex payload object
      if (data.Message && data.FromUserName) {
        message = data.Message;
        senderName = data.FromUserName;
      } else if (data.message) {
        message = data.message;
      } else {
        // Fallback: stringify the object
        message = JSON.stringify(data);
      }
    } else {
      // Fallback for any other type
      message = String(data);
    }
    
    // Create a simple HTML string for the notification
    const notificationHtml = `
      <div style="padding: 8px;">
        <div style="font-weight: 600; margin-bottom: 4px; color: #1976d2;">
          ${senderName}
        </div>
        <div style="font-size: 14px; line-height: 1.4;">
          ${message}
        </div>
      </div>
    `;
    
    toast.info(notificationHtml, {
      position: "top-right",
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minHeight: '60px',
        maxWidth: '350px',
      }
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