import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  Wifi,
  Zap,
  CheckCircle
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/useOffline';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface PWAInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
  autoShow?: boolean;
}

/**
 * PWA Install Prompt Component
 * Guides users through installing the app as a PWA
 */
export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  isOpen,
  onClose,
  autoShow = false
}) => {
  const [installing, setInstalling] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const benefits = [
    {
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      title: 'Faster Loading',
      description: 'App loads instantly from your device'
    },
    {
      icon: <Wifi className="w-5 h-5 text-green-500" />,
      title: 'Works Offline',
      description: 'Access your recipes without internet'
    },
    {
      icon: <Smartphone className="w-5 h-5 text-purple-500" />,
      title: 'Native Experience',
      description: 'Feels like a native mobile app'
    },
    {
      icon: <Monitor className="w-5 h-5 text-orange-500" />,
      title: 'Desktop Integration',
      description: 'Add to taskbar and start menu'
    }
  ];

  if (isInstalled) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="App Installed">
        <div className="text-center py-6">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Successfully Installed!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Birch Lounge has been installed on your device. You can now access it from your home screen or app menu.
          </p>
          <Button onClick={onClose} variant="primary">
            Get Started
          </Button>
        </div>
      </Modal>
    );
  }

  if (!isInstallable && !autoShow) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install Birch Lounge">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
            <Download className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Install Birch Lounge
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Get the full app experience with offline access and faster performance
          </p>
        </div>

        {/* Benefits Toggle */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBenefits(!showBenefits)}
            className="text-blue-600 dark:text-blue-400"
          >
            {showBenefits ? 'Hide' : 'Show'} Benefits
          </Button>
        </div>

        {/* Benefits List */}
        {showBenefits && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-3">
                  {benefit.icon}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Installation Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How it works:
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>1. Click "Install App" below</li>
            <li>2. Confirm installation in the browser prompt</li>
            <li>3. Find the app on your home screen or app menu</li>
            <li>4. Enjoy faster loading and offline access!</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleInstall}
            variant="primary"
            disabled={installing || !isInstallable}
            className="flex-1"
            icon={installing ? undefined : Download}
          >
            {installing ? 'Installing...' : 'Install App'}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="px-6"
          >
            Maybe Later
          </Button>
        </div>

        {/* Browser Support Note */}
        {!isInstallable && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Installation is not available in this browser. Try Chrome, Edge, or Safari for the best experience.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
