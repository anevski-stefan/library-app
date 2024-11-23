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
    default:
      return '📢';
  }
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

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await dispatch(markAsRead(notification.id));
    }

    if (notification.type === 'book_request' && notification.bookRequestId) {
      navigate('/requests');
    } else if (notification.type === 'overdue' && notification.borrowId) {
      navigate('/borrowing-history');
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
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800"
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
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
          <div className="border-b border-gray-200">
            <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </button>
              )}
            </div>
          </div>
          <div className="py-2">
            {notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <span className="text-xl mr-2">
                      {getNotificationEmoji(notification.type)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
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