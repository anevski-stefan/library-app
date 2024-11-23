import { showNotification } from './notificationService';
import { store } from '../store';
import { fetchNotifications } from '../features/notifications/notificationSlice';

class WebSocketService {
  private socket: WebSocket | null = null;

  connect(userId: string) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    this.socket = new WebSocket(`${wsUrl}/ws?userId=${userId}`);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'NOTIFICATION') {
        showNotification(data.notification);
        store.dispatch(fetchNotifications());
      }
    };

    this.socket.onclose = () => {
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connect(userId), 5000);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService(); 