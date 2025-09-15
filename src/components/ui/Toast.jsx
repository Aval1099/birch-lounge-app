import React, { memo, useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActionType } from '../../constants';

/**
 * Toast Notification Component - Better user feedback
 */
const Toast = memo(() => {
  const { state, dispatch } = useApp();
  const { notification } = state;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification.message) {
      setIsVisible(true);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification.message]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: { message: null, type: null }
      });
    }, 300); // Wait for animation
  };

  if (!notification.message) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4 bg-white dark:bg-gray-800 shadow-lg";
    switch (notification.type) {
      case 'success':
        return `${baseStyles} border-green-500`;
      case 'error':
        return `${baseStyles} border-red-500`;
      case 'warning':
        return `${baseStyles} border-yellow-500`;
      default:
        return `${baseStyles} border-blue-500`;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`${getStyles()} rounded-lg p-4 max-w-sm transition-all duration-300 transform ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {notification.message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

Toast.displayName = 'Toast';

export default Toast;
