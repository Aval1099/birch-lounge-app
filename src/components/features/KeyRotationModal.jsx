import React, { memo, useCallback, useState } from 'react';

import { apiKeyService } from '../../services/apiKeyService';
import { geminiService } from '../../services/geminiService';

/**
 * Key Rotation Modal Component
 *
 * Provides a secure interface for rotating API keys without service interruption
 */
const KeyRotationModal = memo(({ onClose, serviceName = 'gemini' }) => {
  const [currentKeyInfo, setCurrentKeyInfo] = useState(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [confirmNewKey, setConfirmNewKey] = useState('');
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStep, setRotationStep] = useState('confirm'); // confirm, validate, success
  const [validationResult, setValidationResult] = useState(null);

  // Load current key information on mount
  React.useEffect(() => {
    const rotationInfo = apiKeyService.getKeyRotationInfo(serviceName);
    const keySource = geminiService.getKeySource();

    setCurrentKeyInfo({
      rotationInfo,
      keySource,
      hasKey: apiKeyService.hasApiKey(serviceName)
    });
  }, [serviceName]);

  const handleRotateKey = useCallback(async (e) => {
    e.preventDefault();
    setIsRotating(true);

    try {
      // Step 1: Validate new key format
      if (!geminiService.validateApiKey(newApiKey)) {
        throw new Error('New API key format is invalid');
      }

      // Step 2: Test the new key with a simple request
      const isValid = await geminiService.testApiKey(newApiKey);
      if (!isValid) {
        throw new Error('New API key failed validation test');
      }

      // Step 3: Perform the rotation
      const success = apiKeyService.rotateApiKey(serviceName, newApiKey);
      if (!success) {
        throw new Error('Failed to rotate API key');
      }

      setRotationStep('success');
      setValidationResult({
        success: true,
        message: 'API key rotated successfully'
      });

    } catch (error) {
      console.error('Key rotation failed:', error);
      setValidationResult({
        success: false,
        message: error.message || 'Key rotation failed'
      });
      setRotationStep('validate');
    } finally {
      setIsRotating(false);
    }
  }, [serviceName, newApiKey]);

  const handleReset = useCallback(() => {
    setNewApiKey('');
    setConfirmNewKey('');
    setValidationResult(null);
    setRotationStep('confirm');
  }, []);

  const isFormValid = newApiKey &&
    newApiKey === confirmNewKey &&
    newApiKey.length > 20 &&
    !isRotating;

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Key Rotation Notice
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Rotating your API key will replace the current key with a new one.
              Make sure you have the new key ready before proceeding.
            </p>
          </div>
        </div>
      </div>

      {currentKeyInfo?.rotationInfo?.lastRotated && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Current Key Information
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>Last rotated: {new Date(currentKeyInfo.rotationInfo.lastRotated).toLocaleString()}</p>
            <p>Key age: {Math.round(currentKeyInfo.rotationInfo.keyAge / (1000 * 60 * 60 * 24))} days</p>
            <p>Source: {currentKeyInfo.keySource.source}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleRotateKey} className="space-y-4">
        <div>
          <Input
            label="New API Key"
            type="password"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            placeholder="Enter your new Gemini API key"
            maxLength={200}
            required
          />
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Get your new API key from{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        <div>
          <Input
            label="Confirm New API Key"
            type="password"
            value={confirmNewKey}
            onChange={(e) => setConfirmNewKey(e.target.value)}
            placeholder="Confirm your new API key"
            maxLength={200}
            required
          />
          {newApiKey && confirmNewKey && newApiKey !== confirmNewKey && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              API keys do not match
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            disabled={isRotating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isRotating}
            disabled={!isFormValid}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Rotate Key
          </Button>
        </div>
      </form>
    </div>
  );

  const renderValidationStep = () => (
    <div className="space-y-6">
      {validationResult && (
        <div className={`rounded-lg p-4 ${validationResult.success
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
          <div className="flex items-start gap-3">
            {validationResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                {validationResult.success ? 'Success' : 'Error'}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {validationResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          onClick={validationResult.success ? onClose : handleReset}
          variant={validationResult.success ? 'primary' : 'ghost'}
        >
          {validationResult.success ? 'Done' : 'Try Again'}
        </Button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Key Rotation Successful
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your API key has been successfully rotated. The new key is now active and secure.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Next Steps
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Your old API key has been securely replaced</li>
          <li>• All AI features will now use the new key</li>
          <li>• Consider revoking the old key in your Google AI Studio dashboard</li>
          <li>• Test the AI features to ensure everything works correctly</li>
        </ul>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          onClick={onClose}
          variant="primary"
        >
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="key-rotation-modal-title"
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="key-rotation-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Rotate API Key
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-2"
            ariaLabel="Close modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {rotationStep === 'confirm' && renderConfirmationStep()}
          {rotationStep === 'validate' && renderValidationStep()}
          {rotationStep === 'success' && renderSuccessStep()}
        </div>
      </div>
    </div>
  );
});

KeyRotationModal.displayName = 'KeyRotationModal';

export default KeyRotationModal;
