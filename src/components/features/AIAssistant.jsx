
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { ActionType } from '../../constants';
import { useApp } from '../../hooks/useApp';
import { apiKeyService } from '../../services/apiKeyService';
import { geminiService } from '../../services/geminiService';
import { processPDFRecipeBook } from '../../services/pdfService';


/**
 * AI Assistant Component - Gemini AI integration for recipe suggestions and variations
 */
const AIAssistant = memo(() => {
  const { state, dispatch } = useApp();
  const { geminiApiKey } = state;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showKeyRotationModal, setShowKeyRotationModal] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState({
    isProcessing: false,
    stage: '',
    progress: 0,
    currentPage: 0,
    totalPages: 0,
    recipesFound: 0
  });
  const [dragActive, setDragActive] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if API key is configured
  const isConfigured = Boolean(geminiApiKey);

  // PDF Processing Functions with Error Boundary
  const handlePDFUpload = useCallback(async (file) => {
    if (!file || !isConfigured) return;

    const processWithBoundary = async () => {
      setPdfProcessing({
        isProcessing: true,
        stage: 'extracting',
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        recipesFound: 0
      });

      try {
        const result = await processPDFRecipeBook(file, (progress) => {
          setPdfProcessing(prev => ({
            ...prev,
            ...progress
          }));
        });

        if (result.success) {
          // Add recipes to the app state
          result.recipes.forEach(recipe => {
            dispatch({
              type: ActionType.ADD_RECIPE,
              payload: recipe
            });
          });

          // Add success message to chat
          const successMessage = {
            id: Date.now(),
            type: 'assistant',
            content: `🎉 ${result.message}\n\nI've successfully imported ${result.totalRecipes} recipes into your collection. You can now find them in your recipe library!`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, successMessage]);

          // Show success notification
          dispatch({
            type: ActionType.SET_NOTIFICATION,
            payload: {
              message: `Successfully imported ${result.totalRecipes} recipes from PDF`,
              type: 'success'
            }
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        // Add error message to chat with enhanced error context
        const errorContext = {
          type: error.name || 'PDFProcessingError',
          message: error.message || 'Unknown PDF processing error',
          stack: error.stack,
          timestamp: new Date().toISOString()
        };

        const errorMessage = {
          id: Date.now(),
          type: 'assistant',
          content: `❌ Sorry, I encountered an error while processing your PDF: ${errorContext.message}\n\nError Type: ${errorContext.type}\n\nPlease make sure the PDF contains readable text and try again.`,
          timestamp: new Date(),
          errorContext
        };
        setMessages(prev => [...prev, errorMessage]);

        // Show error notification with enhanced context
        dispatch({
          type: ActionType.SET_NOTIFICATION,
          payload: {
            message: `Failed to process PDF: ${error.message}`,
            type: 'error'
          }
        });
      } finally {
        setPdfProcessing({
          isProcessing: false,
          stage: '',
          progress: 0,
          currentPage: 0,
          totalPages: 0,
          recipesFound: 0
        });
        setShowPDFUpload(false);
      }
    };

    // Wrap PDF processing with error boundary
    try {
      await processWithBoundary();
    } catch (boundaryError) {
      console.error('PDF Processing Error Boundary caught:', boundaryError);
      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: 'PDF processing failed due to a system error. Please try again.',
          type: 'error'
        }
      });
    }
  }, [isConfigured, dispatch]);

  // File input change handler
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePDFUpload(file);
    }
  }, [handlePDFUpload]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type === 'application/pdf') {
      handlePDFUpload(files[0]);
    }
  }, [handlePDFUpload]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading || !isConfigured) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await geminiService.generate(
        geminiApiKey,
        inputMessage.trim(),
        false
      );

      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Assistant error:', error);

      // Enhanced error context preservation
      const errorContext = {
        type: error.name || 'AIProcessingError',
        message: error.message || 'Unknown AI processing error',
        stack: error.stack,
        timestamp: new Date().toISOString(),
        inputLength: inputMessage?.length || 0,
        isConfigured,
        hasApiKey: !!geminiApiKey
      };

      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Sorry, I encountered an error while processing your request: ${errorContext.message}\n\nError Type: ${errorContext.type}\n\nPlease try again.`,
        timestamp: new Date(),
        errorContext
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, isConfigured, geminiApiKey]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleClearChat = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
    }
  }, []);

  const handleCopyMessage = useCallback(async (messageId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, []);

  const suggestedPrompts = [
    "Suggest a cocktail with bourbon and citrus",
    "Create a variation of an Old Fashioned",
    "What's a good summer cocktail with gin?",
    "Help me create a cocktail menu for a dinner party",
    "Suggest cocktails that pair with spicy food"
  ];

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              AI Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Get personalized cocktail recommendations and recipe suggestions
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Configure AI Assistant
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              To use the AI Assistant, you need to configure your Gemini API key.
            </p>
            <Button
              onClick={() => setShowApiKeyModal(true)}
              variant="primary"
              ariaLabel="Configure API key"
            >
              <Settings className="w-4 h-4" />
              Configure API Key
            </Button>
          </div>
        </div>

        {showApiKeyModal && (
          <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get personalized cocktail recommendations and recipe suggestions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowApiKeyModal(true)}
            variant="ghost"
            ariaLabel="API settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowKeyRotationModal(true)}
            variant="ghost"
            disabled={!isConfigured}
            ariaLabel="Rotate API key"
            title="Rotate API key for enhanced security"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowPDFUpload(!showPDFUpload)}
            variant="ghost"
            disabled={!isConfigured}
            ariaLabel="Upload PDF recipe book"
          >
            <BookOpen className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleClearChat}
            variant="ghost"
            disabled={messages.length === 0}
            ariaLabel="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Upload Section */}
      {showPDFUpload && isConfigured && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Upload Recipe Book PDF
            </h3>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload a PDF file containing cocktail recipes and I'll extract them automatically using AI.
            The recipes will be added to your collection.
          </p>

          {!pdfProcessing.isProcessing ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-amber-400'
                }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-testid="pdf-drop-zone"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Drop your PDF here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Supports PDF files up to 50MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Select PDF file"
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select PDF File
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <LoadingSpinner size="sm" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Processing PDF...
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {pdfProcessing.stage === 'extracting'
                      ? `Extracting text from page ${pdfProcessing.currentPage} of ${pdfProcessing.totalPages}`
                      : `Parsing recipes (${pdfProcessing.recipesFound} found)`
                    }
                  </span>
                  <span className="font-medium">{pdfProcessing.progress}%</span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pdfProcessing.progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Welcome to your AI Cocktail Assistant!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ask me anything about cocktails, recipes, or get personalized recommendations.
              </p>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Try these suggestions:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(prompt)}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCopy={handleCopyMessage}
                copiedMessageId={copiedMessageId}
              />
            ))
          )}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin text-amber-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about cocktails, recipes, or get recommendations..."
                rows={2}
                maxLength={1000}
                disabled={isLoading}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              variant="primary"
              ariaLabel="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {showApiKeyModal && (
        <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />
      )}

      {showKeyRotationModal && (
        <KeyRotationModal onClose={() => setShowKeyRotationModal(false)} />
      )}
    </div>
  );
});

/**
 * Message Bubble Component
 */
const MessageBubble = memo(({ message, onCopy, copiedMessageId }) => {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUser
        ? 'bg-blue-500'
        : isError
          ? 'bg-red-500'
          : 'bg-amber-500'
        }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`rounded-lg p-3 ${isUser
          ? 'bg-blue-500 text-white'
          : isError
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-gray-100 dark:bg-gray-700'
          }`}>
          <div className={`whitespace-pre-wrap ${isError ? 'text-red-700 dark:text-red-300' : ''
            }`}>
            {message.content}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {message.timestamp.toLocaleTimeString()}
          </span>

          {!isUser && (
            <Button
              onClick={() => onCopy(message.id, message.content)}
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              ariaLabel="Copy message"
            >
              {copiedMessageId === message.id ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * API Key Configuration Modal
 */
const ApiKeyModal = memo(({ onClose }) => {
  const { state, dispatch } = useApp();
  const [apiKey, setApiKey] = useState(state.geminiApiKey || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get key source information
  const keySource = geminiService.getKeySource();

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Test the API key if provided
      if (apiKey.trim()) {
        await geminiService.testApiKey(apiKey.trim());
      }

      // Store API key securely
      if (apiKey.trim()) {
        apiKeyService.setApiKey('gemini', apiKey.trim());
      } else {
        apiKeyService.removeApiKey('gemini');
      }

      // Update the app state
      dispatch({
        type: ActionType.SET_GEMINI_API_KEY,
        payload: apiKey.trim()
      });

      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: apiKey.trim() ? 'API key saved successfully!' : 'API key removed.',
          type: 'success'
        }
      });

      onClose();
    } catch (error) {
      console.error('API key validation error:', error);
      dispatch({
        type: ActionType.SET_NOTIFICATION,
        payload: {
          message: 'Invalid API key. Please check and try again.',
          type: 'error'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [apiKey, dispatch, onClose]);

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
      aria-labelledby="api-key-modal-title"
      tabIndex={-1}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="api-key-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Configure Gemini API Key
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

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Security Information */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Secure API Key Storage
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your API key is now stored securely in memory only, not in localStorage.
                  This prevents XSS attacks from accessing your sensitive credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Key Source Information */}
          {keySource.hasEnvironmentKey && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Environment Variable Detected
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    API key is loaded from VITE_GEMINI_API_KEY environment variable.
                    This is the most secure method.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Input
              label="Gemini API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              maxLength={200}
              disabled={keySource.hasEnvironmentKey}
            />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Get your API key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Google AI Studio
              </a>
              {keySource.hasEnvironmentKey && (
                <span className="block text-amber-600 dark:text-amber-400 mt-1">
                  Environment variable is active - manual input disabled for security.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Save API Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

AIAssistant.displayName = 'AIAssistant';
MessageBubble.displayName = 'MessageBubble';
ApiKeyModal.displayName = 'ApiKeyModal';

export default AIAssistant;
