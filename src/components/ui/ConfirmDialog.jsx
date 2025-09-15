import React, { memo } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

/**
 * Confirm Dialog Component - Better confirmation UX
 */
const ConfirmDialog = memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-blue-600" />,
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {styles.icon}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-2"
            disabled={isLoading}
            ariaLabel="Close dialog"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={styles.confirmButton}
            loading={isLoading}
            disabled={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;
