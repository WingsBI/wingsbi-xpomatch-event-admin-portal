// Alternative SignalR service with different CORS handling approaches

import { HubConnection, HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";
import { toast } from "react-toastify";

class AlternativeSignalRService {
  private connection: HubConnection | null = null;

  public async startWithSkipNegotiation(userToken: string) {
    console.log("🔄 Trying SignalR with skipNegotiation: true");
    
    this.connection = new HubConnectionBuilder()
      .withUrl("https://xpomatch-dev-event-admin-api.azurewebsites.net/notificationHub", {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
        accessTokenFactory: () => userToken,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    this.setupEventHandlers();
    this.setupConnectionHandlers();

    try {
      await this.connection.start();
      console.log("✅ SignalR connected with skipNegotiation");
      toast.success("Real-time notifications connected (alternative method)", { position: "top-right" });
      return true;
    } catch (err) {
      console.error("❌ SignalR skipNegotiation failed:", err);
      return false;
    }
  }

  public async startWithServerSentEvents(userToken: string) {
    console.log("🔄 Trying SignalR with Server-Sent Events only");
    
    this.connection = new HubConnectionBuilder()
      .withUrl("https://xpomatch-dev-event-admin-api.azurewebsites.net/notificationHub", {
        transport: HttpTransportType.ServerSentEvents,
        accessTokenFactory: () => userToken,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    this.setupEventHandlers();
    this.setupConnectionHandlers();

    try {
      await this.connection.start();
      console.log("✅ SignalR connected with Server-Sent Events");
      toast.success("Real-time notifications connected (SSE)", { position: "top-right" });
      return true;
    } catch (err) {
      console.error("❌ SignalR Server-Sent Events failed:", err);
      return false;
    }
  }

  public async startWithLongPolling(userToken: string) {
    console.log("🔄 Trying SignalR with Long Polling");
    
    this.connection = new HubConnectionBuilder()
      .withUrl("https://xpomatch-dev-event-admin-api.azurewebsites.net/notificationHub", {
        transport: HttpTransportType.LongPolling,
        accessTokenFactory: () => userToken,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    this.setupEventHandlers();
    this.setupConnectionHandlers();

    try {
      await this.connection.start();
      console.log("✅ SignalR connected with Long Polling");
      toast.success("Real-time notifications connected (polling)", { position: "top-right" });
      return true;
    } catch (err) {
      console.error("❌ SignalR Long Polling failed:", err);
      return false;
    }
  }

  public async tryAllMethods(userToken: string): Promise<boolean> {
    console.log("🔄 Trying all SignalR connection methods...");

    // Method 1: Skip negotiation with WebSockets
    if (await this.startWithSkipNegotiation(userToken)) {
      return true;
    }

    // Method 2: Server-Sent Events
    if (await this.startWithServerSentEvents(userToken)) {
      return true;
    }

    // Method 3: Long Polling (most compatible)
    if (await this.startWithLongPolling(userToken)) {
      return true;
    }

    console.error("❌ All SignalR connection methods failed");
    toast.error("Could not establish real-time connection", { position: "top-right" });
    return false;
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    // All the same event handlers as the main service
    this.connection.on("ReceiveNotification", (message: string) => {
      console.log("SignalR: Generic notification received:", message);
      toast.info(message, { position: "top-right" });
    });

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
      console.log("SignalR: Stopping alternative connection");
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

export default new AlternativeSignalRService();
