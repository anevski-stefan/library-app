import { addNotification } from '../features/notifications/notificationSlice';
import { store } from '../store';

export const showNotification = (notification: {
  title: string;
  message: string;
  type: string;
}) => {
  store.dispatch(
    addNotification({
      id: Date.now().toString(),
      ...notification,
      read: false,
      created_at: new Date().toISOString(),
    })
  );
}; 