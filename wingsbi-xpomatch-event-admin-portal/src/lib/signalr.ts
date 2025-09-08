import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";

class SignalRService {
  private connection: signalR.HubConnection | null = null;

  public async start() {
    try {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("SignalR: No JWT token found in localStorage");
        toast.error("Authentication token missing. Please log in again.", { position: "top-right" });
        return;
      }

      console.log("SignalR: Connecting...");

      const userId = localStorage.getItem("userId") || "anonymous";

      this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`https://localhost:7199/notificationHub?userId=${userId}`, {
        accessTokenFactory: async () => localStorage.getItem("jwtToken") || "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

      this.setupEventHandlers();
      this.setupConnectionHandlers();

      await this.connection.start();
      console.log("✅ Connected to SignalR Hub");
      toast.success("Real-time notifications connected", { position: "bottom-right", autoClose: 2000 });
    } catch (err: any) {
      console.error("❌ SignalR error:", err);
      toast.error(`Failed to connect: ${err.message || "Unknown error"}`, { position: "bottom-right" });
    }
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    // Remove any previous handlers to prevent duplicates
    this.connection.off("ReceiveNotification");

    // Generic notification: display whatever backend sends
    this.connection.on("ReceiveNotification", (message: any) => {
      console.log("Notification received:", message);

      // Convert objects to string if needed
      const displayMessage = typeof message === "string" ? message : JSON.stringify(message);

      toast.info(displayMessage, {
        position: "bottom-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: { fontSize: "14px", fontWeight: "500" },
      });
    });
  }

  private setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.onreconnecting((error) => {
      console.warn("⚠️ SignalR reconnecting...", error);
      toast.warning("Connection lost, reconnecting...", { position: "bottom-right", autoClose: 3000 });
    });

    this.connection.onreconnected((connectionId) => {
      console.log("✅ SignalR reconnected:", connectionId);
      toast.success("Reconnected to notifications", { position: "bottom-right", autoClose: 2000 });
    });

    this.connection.onclose((error) => {
      console.error("❌ SignalR connection closed", error);
      if (error) {
        toast.error(`Connection closed: ${error.message || "Unknown error"}`, { position: "bottom-right", autoClose: 5000 });
      }
    });
  }

  public stop() {
    if (this.connection) {
      console.log("SignalR: Stopping connection");
      this.connection
        .stop()
        .then(() => {
          console.log("SignalR: Connection stopped");
          this.connection = null;
        })
        .catch((err) => {
          console.error("SignalR: Error stopping connection:", err);
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

  public getConnectionInfo(): any {
    if (!this.connection) return { state: "No Connection", connectionId: null };
    return {
      state: signalR.HubConnectionState[this.connection.state],
      connectionId: this.connection.connectionId,
      baseUrl: this.connection.baseUrl,
    };
  }
}

export default new SignalRService();
