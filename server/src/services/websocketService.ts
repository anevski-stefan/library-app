import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';

interface ConnectedClient {
  userId: string;
  ws: WebSocket;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: ConnectedClient[] = [];

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      clientTracking: true,
      perMessageDeflate: false
    });

    console.log('WebSocket Server initialized');

    this.wss.on('connection', (ws: WebSocket, request: any) => {
      try {
        // Extract userId from URL parameters
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
          console.log('Connection rejected: No userId provided');
          ws.close();
          return;
        }

        // Remove any existing connections for this user
        this.clients = this.clients.filter(client => client.userId !== userId);

        // Store client connection
        this.clients.push({ userId, ws });
        console.log(`Client connected. UserId: ${userId}. Total clients: ${this.clients.length}`);

        // Send immediate confirmation
        ws.send(JSON.stringify({ type: 'CONNECTED', userId }));

        ws.on('close', () => {
          this.clients = this.clients.filter(client => client.ws !== ws);
          console.log(`Client disconnected. UserId: ${userId}. Total clients: ${this.clients.length}`);
        });

        ws.on('error', (error) => {
          console.error(`WebSocket error for user ${userId}:`, error);
        });

      } catch (error) {
        console.error('Error handling WebSocket connection:', error);
        ws.close();
      }
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket Server error:', error);
    });
  }

  sendNotification(userId: string, notification: any) {
    const client = this.clients.find(client => client.userId === userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify({
          type: 'NOTIFICATION',
          notification
        }));
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
      }
    }
  }
}

export const wsService = new WebSocketService();
export const sendWebSocketNotification = (userId: string, notification: any) => {
  wsService.sendNotification(userId, notification);
}; 