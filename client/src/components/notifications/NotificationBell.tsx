import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotifications, markAsRead, clearAllNotifications } from '../../features/notifications/notificationSlice';
import { useNavigate } from 'react-router-dom';

const getNotificationEmoji = (type: string) => {
  switch (type) {
    case 'book_request':
      return '📚';
    case 'overdue':
      return '⚠️';
    case 'reminder':
      return '⏰';
    case 'return':
      return '✅';
    case 'request_approved':
      return '✅';
    case 'request_rejected':
      return '❌';
    case 'acquisition_started':
      return '🔄';
    case 'acquisition_completed':
      return '✨';
    default:
      return '📢';
  }
};

// Add this helper function to check if notification is clickable
const isClickableNotification = (type: string) => {
  return ['book_request', 'request_approved', 'request_rejected'].includes(type);
};

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark all as read when opening the bell
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        await dispatch(markAsRead(notification.id));
      }
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!isClickableNotification(notification.type)) {
      return; // Early return for non-clickable notifications
    }

    if (!notification.read) {
      await dispatch(markAsRead(notification.id));
    }

    if (notification.bookRequestId) {
      navigate('/requests');
    }

    setIsOpen(false);
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent notification click handler
    if (window.confirm('Are you sure you want to clear all notifications? This cannot be undone.')) {
      setIsClearing(true);
      try {
        await dispatch(clearAllNotifications()).unwrap();
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-amber-600 transition-colors duration-200"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-amber-500 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-lg shadow-xl overflow-hidden z-50 max-h-[80vh] overflow-y-auto border border-gray-100">
          <div className="border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-sm px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="text-sm text-amber-600 hover:text-amber-800 disabled:opacity-50 transition-colors duration-200"
                >
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-4xl mb-4">📬</div>
                <div className="text-gray-500">No notifications</div>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-6 py-4 ${
                    isClickableNotification(notification.type)
                      ? 'hover:bg-amber-50 cursor-pointer'
                      : ''
                  } transition-colors duration-200 ${
                    !notification.read ? 'bg-amber-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationEmoji(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center">
                        <svg 
                          className="w-3 h-3 mr-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 