// lib/signalRService.ts

import { HubConnection, HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";
import { toast } from "react-toastify";

class SignalRService {
  private connection: HubConnection | null = null;

  public async start(userToken: string) {
    // Validate token before attempting connection
    if (!userToken || userToken.trim() === "") {
      console.error("SignalR: No valid token provided. Cannot establish connection.");
      toast.error("Authentication token missing. Please log in again.", { position: "top-right" });
      return;
    }

    console.log("SignalR: Attempting to connect with token:", userToken.substring(0, 20) + "...");

    this.connection = new HubConnectionBuilder()
      .withUrl("https://xpomatch-dev-event-admin-api.azurewebsites.net/notificationHub", {
        accessTokenFactory: () => {
          console.log("SignalR: Token factory called, providing token");
          return userToken;
        },
        // Try to handle CORS issues
        skipNegotiation: false,
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents,
        headers: {
          "Access-Control-Allow-Credentials": "true"
        }
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.previousRetryCount === 0) {
            return 0; // Retry immediately the first time
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        }
      })
      .build();

    // Set up event handlers for different notification types
    this.setupEventHandlers();

    // Set up connection event handlers
    this.setupConnectionHandlers();

    try {
      await this.connection.start();
      console.log("SignalR: Successfully connected to notification hub");
      toast.success("Real-time notifications connected", { position: "top-right", autoClose: 2000 });
    } catch (err) {
      console.error("SignalR Connection Error:", err);
      toast.error("Failed to connect to real-time notifications", { position: "top-right" });
    }
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    // Generic notification handler (fallback)
    this.connection.on("ReceiveNotification", (message: string) => {
      console.log("SignalR: Generic notification received:", message);
      toast.info(message, { position: "top-right" });
    });

    // Specific event handlers for different notification types
    this.connection.on("LikeReceived", (data: any) => {
      console.log("SignalR: Like notification received:", data);
      const message = data.message || `Someone liked your profile!`;
      toast.success(message, { position: "top-right", autoClose: 5000 });
    });

    this.connection.on("MeetingInviteReceived", (data: any) => {
      console.log("SignalR: Meeting invite received:", data);
      const message = data.message || `You have received a new meeting invitation!`;
      toast.info(message, { position: "top-right", autoClose: 7000 });
    });

    this.connection.on("MeetingApproved", (data: any) => {
      console.log("SignalR: Meeting approved:", data);
      const message = data.message || `Your meeting request has been approved!`;
      toast.success(message, { position: "top-right", autoClose: 5000 });
    });

    this.connection.on("MeetingRejected", (data: any) => {
      console.log("SignalR: Meeting rejected:", data);
      const message = data.message || `Your meeting request has been declined.`;
      toast.warning(message, { position: "top-right", autoClose: 5000 });
    });

    this.connection.on("MeetingRescheduled", (data: any) => {
      console.log("SignalR: Meeting rescheduled:", data);
      const message = data.message || `A meeting has been rescheduled.`;
      toast.info(message, { position: "top-right", autoClose: 6000 });
    });

    // Additional handlers for other notification types
    this.connection.on("MatchFound", (data: any) => {
      console.log("SignalR: Match found:", data);
      const message = data.message || `You have a new match!`;
      toast.success(message, { position: "top-right", autoClose: 5000 });
    });

    this.connection.on("ProfileViewed", (data: any) => {
      console.log("SignalR: Profile viewed:", data);
      const message = data.message || `Someone viewed your profile!`;
      toast.info(message, { position: "top-right", autoClose: 4000 });
    });
  }

  private setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.onreconnecting((error) => {
      console.warn("SignalR: Connection lost, attempting to reconnect...", error);
      toast.warning("Connection lost, reconnecting...", { position: "top-right", autoClose: 3000 });
    });

    this.connection.onreconnected((connectionId) => {
      console.log("SignalR: Successfully reconnected with connection ID:", connectionId);
      toast.success("Reconnected to notifications", { position: "top-right", autoClose: 2000 });
    });

    this.connection.onclose((error) => {
      console.error("SignalR: Connection closed", error);
      if (error) {
        toast.error("Notification connection closed", { position: "top-right" });
      }
    });
  }

  public stop() {
    if (this.connection) {
      console.log("SignalR: Stopping connection");
      this.connection.stop();
      this.connection = null;
    }
  }

  public getConnectionState(): string {
    return this.connection?.state || "Disconnected";
  }

  public isConnected(): boolean {
    return this.connection?.state === "Connected";
  }
}

export default new SignalRService();
