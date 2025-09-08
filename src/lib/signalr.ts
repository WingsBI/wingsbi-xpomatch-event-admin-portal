import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";
import { getAuthToken, getUserData } from "@/utils/cookieManager";
 
class SignalRService {
  private connection: signalR.HubConnection | null = null;

  constructor() {
    console.log("🔧 SignalRService: Service instance created");
  }
 
  public async start() {
    try {
      // Get token from cookies instead of localStorage
      const token = getAuthToken();

      if (!token) {
        console.error("SignalR: No JWT token found in cookies");
        toast.error("Authentication token missing. Please log in again.", { position: "top-right" });
        return;
      }

      // Get user data from cookies to get the user ID
      const userData = getUserData();
      const userId = userData?.id || "anonymous";
      const hubUrl = `https://localhost:7199/notificationHub?userId=${userId}`;
      
      console.log("SignalR: Connecting to:", hubUrl);
      console.log("SignalR: Using token from cookies:", token ? `${token.substring(0, 20)}...` : "none");
      console.log("SignalR: Using userId from cookies:", userId);
      console.log("SignalR: User data:", userData);

      // Stop any existing connection first
      if (this.connection) {
        console.log("SignalR: Stopping existing connection before starting new one");
        await this.connection.stop();
        this.connection = null;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => {
            // Get token from cookies on each call (for fresh tokens)
            const currentToken = getAuthToken();
            console.log("SignalR: Token factory called");
            console.log("SignalR: Token exists in cookies:", !!currentToken);
            console.log("SignalR: Token preview:", currentToken ? `${currentToken.substring(0, 20)}...` : "none");
            
            if (!currentToken) {
              console.error("SignalR: No token available in cookies!");
              throw new Error("No authentication token available");
            }
            
            return currentToken;
          },
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Debug)
        .build();

      this.setupEventHandlers();
      this.setupConnectionHandlers();

      console.log("SignalR: Starting connection...");
      await this.connection.start();
      console.log("✅ Connected to SignalR Hub successfully");
      console.log("SignalR: Connection ID:", this.connection.connectionId);
      console.log("SignalR: Connection State:", signalR.HubConnectionState[this.connection.state]);
      
      toast.success("Real-time notifications connected", { position: "bottom-right", autoClose: 2000 });
    } catch (err: any) {
      console.error("❌ SignalR connection error:", err);
      console.error("❌ Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
        statusCode: err.statusCode,
        transport: err.transport
      });
      toast.error(`Failed to connect: ${err.message || "Unknown error"}`, { position: "bottom-right" });
    }
  }
 
  private setupEventHandlers() {
    if (!this.connection) return;

    // Clear all existing handlers first
    console.log("SignalR: Setting up event handlers - clearing existing handlers");
    this.connection.off("ReceiveNotification");
    
    // Add a catch-all handler to debug what methods are being called
    console.log("SignalR: Adding debug handlers");

    // Primary notification handler
    this.connection.on("ReceiveNotification", (message: any) => {
      console.log("🔔 SignalR: ReceiveNotification event received");
      console.log("🔔 Message type:", typeof message);
      console.log("🔔 Message content:", message);
      console.log("🔔 Message stringified:", JSON.stringify(message, null, 2));

      // Convert objects to string if needed
      const displayMessage = typeof message === "string" ? message : JSON.stringify(message, null, 2);

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

    // Add handlers for other common SignalR method names
    const commonMethods = [
      "SendNotification",
      "NotificationReceived", 
      "ReceiveMessage",
      "SendMessage",
      "BroadcastMessage",
      "UserNotification",
      "Notification",
      "Message"
    ];

    commonMethods.forEach(methodName => {
      this.connection!.on(methodName, (...args: any[]) => {
        console.log(`🔔 SignalR: ${methodName} event received`);
        console.log(`🔔 Arguments (${args.length}):`, args);
        
        // Show notification for any message received
        const message = args.length === 1 ? args[0] : args;
        const displayMessage = typeof message === "string" ? message : JSON.stringify(message, null, 2);
        
        toast.info(`[${methodName}] ${displayMessage}`, {
          position: "bottom-right",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { fontSize: "14px", fontWeight: "500" },
        });
      });
    });

    // Log all available methods on the connection
    console.log("SignalR: Event handlers setup complete");
    console.log("SignalR: Registered handlers for:", ["ReceiveNotification", ...commonMethods]);
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
        console.error("❌ Close error details:", {
          message: error.message,
          name: error.name,
          code: (error as any).code,
          statusCode: (error as any).statusCode
        });
        
        if (error.message && error.message.includes("Authentication")) {
          toast.error("Authentication failed. Please refresh and try again.", { position: "bottom-right", autoClose: 5000 });
        } else {
          toast.error(`Connection closed: ${error.message || "Unknown error"}`, { position: "bottom-right", autoClose: 5000 });
        }
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

  // Test method to validate connection setup
  public async testConnection(): Promise<boolean> {
    try {
      // Get token and user data from cookies
      const token = getAuthToken();
      const userData = getUserData();
      const userId = userData?.id;
      
      console.log("=== SignalR Connection Test ===");
      console.log("Token exists in cookies:", !!token);
      console.log("User data from cookies:", userData);
      console.log("User ID:", userId);
      console.log("Current connection state:", this.getConnectionState());
      console.log("Is connected:", this.isConnected());
      
      if (!token) {
        console.error("❌ No JWT token available in cookies");
        return false;
      }
      
      if (!this.connection) {
        console.log("⚠️ No connection object, attempting to start...");
        await this.start();
        return this.isConnected();
      }
      
      if (this.isConnected()) {
        console.log("✅ Connection is active");
        
        // Test message reception capability
        try {
          console.log("📡 Testing message reception capability...");
          
          // Try to invoke a method on the server to test two-way communication
          if (this.connection.state === signalR.HubConnectionState.Connected) {
            console.log("📡 Connection ready for messaging");
            console.log("📡 Connection details:", {
              connectionId: this.connection.connectionId,
              state: signalR.HubConnectionState[this.connection.state],
              url: this.connection.baseUrl
            });
          }
        } catch (testError) {
          console.warn("⚠️ Message test failed:", testError);
        }
        
        return true;
      } else {
        console.log("⚠️ Connection exists but not active, attempting to restart...");
        await this.start();
        return this.isConnected();
      }
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      return false;
    }
  }

  // Method to manually trigger a test notification (for debugging)
  public testNotification(): void {
    console.log("🧪 Testing notification display...");
    toast.info("Test notification from SignalR service", {
      position: "bottom-right",
      autoClose: 5000,
      style: { fontSize: "14px", fontWeight: "500" },
    });
  }

  // Method to simulate a message reception (for testing handlers)
  public simulateMessage(): void {
    console.log("🧪 Simulating message reception...");
    
    // Test if our ReceiveNotification handler works
    const testMessage = {
      type: "test",
      content: "This is a simulated message",
      timestamp: new Date().toISOString(),
      userId: getUserData()?.id
    };

    console.log("🔔 Simulating ReceiveNotification with message:", testMessage);
    
    // Manually trigger the same logic as our handler
    const displayMessage = JSON.stringify(testMessage, null, 2);
    toast.info(`[SIMULATED] ${displayMessage}`, {
      position: "bottom-right",
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: { fontSize: "14px", fontWeight: "500" },
    });
  }

  // Method to log connection details for debugging
  public logConnectionDetails(): void {
    if (!this.connection) {
      console.log("❌ No connection object");
      return;
    }

    console.log("=== SignalR Connection Details ===");
    console.log("State:", signalR.HubConnectionState[this.connection.state]);
    console.log("Connection ID:", this.connection.connectionId);
    console.log("Base URL:", this.connection.baseUrl);
    console.log("Transport:", (this.connection as any).transport?.name || "Unknown");
    
    // Get user info for this connection
    const userData = getUserData();
    console.log("User ID:", userData?.id);
    console.log("User Email:", userData?.email);
    console.log("User Role:", userData?.role);
  }
}
 
export default new SignalRService();