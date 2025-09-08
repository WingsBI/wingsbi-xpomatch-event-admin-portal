# SignalR Debugging Guide

## Issues Fixed

### 1. **Token Retrieval Issue** ✅ FIXED
- **Problem**: Your layouts were using `localStorage.getItem("jwt")` but your app uses cookie-based authentication
- **Solution**: Updated both `ResponsiveDashboardLayout.tsx` and `DashboardLayout.tsx` to use `getAuthToken()` from `cookieManager.ts`

### 2. **Basic SignalR Implementation** ✅ ENHANCED  
- **Added**: Comprehensive event handlers for likes, meeting invites, approvals, rejections, and reschedules
- **Added**: Better error handling and connection management
- **Added**: Automatic reconnection with exponential backoff

### 3. **Debug Capabilities** ✅ ADDED
- **Added**: Connection status indicator in development mode
- **Added**: Comprehensive logging throughout the SignalR lifecycle
- **Added**: Browser console debugging utilities

## How to Debug SignalR

### 1. **Check Connection Status**
In development mode, you'll see a status indicator in the bottom-right corner showing:
- 🟢 **Connected**: SignalR is working properly
- 🟠 **Connecting**: SignalR is attempting to connect
- 🔴 **Disconnected/Error**: There's an issue
- ⚪ **No Token**: User is not authenticated

### 2. **Console Debugging**
Open browser DevTools console and use these commands:
```javascript
// Test connection status
signalRDebug.test()

// Get detailed connection info
signalRDebug.details()

// Force reconnection
signalRDebug.reconnect()

// Quick status check
signalRDebug.status()
```

### 3. **Check Console Logs**
Look for these log messages:
- `NotificationProvider: Token provided: Yes/No`
- `SignalR: Attempting to connect with token:`
- `SignalR: Successfully connected to notification hub`
- `SignalR: [Event] notification received:`

## Event Handlers Added

Your SignalR now listens for these specific events:

1. **`LikeReceived`** - When someone likes your profile
2. **`MeetingInviteReceived`** - New meeting invitations
3. **`MeetingApproved`** - Meeting requests approved
4. **`MeetingRejected`** - Meeting requests declined  
5. **`MeetingRescheduled`** - Meeting time changes
6. **`MatchFound`** - New matches found
7. **`ProfileViewed`** - Profile views
8. **`ReceiveNotification`** - Generic fallback for other notifications

## Troubleshooting Steps

### If SignalR Still Doesn't Work:

1. **Check Authentication**
   ```javascript
   // In browser console
   signalRDebug.details()
   ```
   - Verify token exists and is valid
   - Check token expiration date

2. **Verify Backend Hub URL**
   - Current URL: `https://xpomatch-dev-event-admin-api.azurewebsites.net/notificationHub`
   - Ensure this endpoint is correct and accessible

3. **Check Backend Event Names**
   - The frontend expects events like `LikeReceived`, `MeetingInviteReceived`, etc.
   - Verify your backend is sending these exact event names

4. **Network Issues**
   - Check browser Network tab for WebSocket connections
   - Look for any CORS or authentication errors

5. **Backend Authentication**
   - Ensure the backend SignalR hub accepts JWT tokens in the `accessTokenFactory`
   - Verify the JWT token contains the correct user information

## Backend Considerations

Make sure your backend SignalR hub:

1. **Accepts JWT Authentication**:
   ```csharp
   // Example C# hub configuration
   services.AddSignalR();
   services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
       .AddJwtBearer(options => { /* JWT config */ });
   ```

2. **Sends Events with Correct Names**:
   ```csharp
   // Example C# hub methods
   await Clients.User(userId).SendAsync("LikeReceived", notificationData);
   await Clients.User(userId).SendAsync("MeetingInviteReceived", meetingData);
   ```

3. **Maps Users to Connections**:
   - The hub should be able to identify which user to send notifications to
   - Usually done by JWT claims (userId, email, etc.)

## Next Steps

1. **Test the Connection**: Open your app and check the status indicator
2. **Use Console Commands**: Try the debug utilities in browser console  
3. **Monitor Logs**: Watch console logs for connection attempts and errors
4. **Test with Backend**: Have your backend team send test notifications to verify the event names match

The main issue was the token retrieval - SignalR should now connect properly with your authenticated users!
