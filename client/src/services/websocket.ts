import { showNotification } from './notificationService';
import { store } from '../store';
import { fetchNotifications } from '../features/notifications/notificationSlice';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  connect(userId: string) {
    // Clear any existing connection first
    this.disconnect();

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    
    try {
      console.log(`Attempting to connect to WebSocket for user ${userId}`);
      this.socket = new WebSocket(`${wsUrl}/ws?userId=${userId}`);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          switch (data.type) {
            case 'CONNECTED':
              console.log('WebSocket connection confirmed for user:', data.userId);
              break;
            case 'NOTIFICATION':
              showNotification(data.notification);
              store.dispatch(fetchNotifications());
              break;
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.handleReconnect(userId);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.handleReconnect(userId);
    }
  }

  private handleReconnect(userId: string) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect(userId);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      // Only close if not already closing or closed
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }
}

export const wsService = new WebSocketService(); 