/**
 * Notification Component - Displays notifications in the top-right corner
 * Updated: Clean implementation without debug elements
 */
import React from 'react';
import { useNotification } from '../NotificationContext';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const NotificationComponent = () => {
  const { notifications, removeNotification } = useNotification();

  if (!notifications || notifications.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700';
      case 'error':
        return 'bg-red-50 border-red-300 dark:bg-red-900/30 dark:border-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700';
      default:
        return 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getBackgroundColor(notification.type)} border rounded-xl shadow-xl p-5 transition-all duration-300 ease-in-out transform hover:scale-105 backdrop-blur-sm`}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              {notification.title && (
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {notification.title}
                </h4>
              )}
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words">
                {notification.message}
              </p>
              {notification.timestamp && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 font-medium">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Close notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationComponent;