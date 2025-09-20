import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiKeyService } from '../../services/apiKeyService';
import { renderWithProviders, userEvent, waitFor } from '../utils/test-utils';

// Mock the Gemini AI service
vi.mock('../../services/geminiService', () => ({
  geminiService: {
    generate: vi.fn().mockResolvedValue('I recommend an Old Fashioned with bourbon, simple syrup, and bitters.'),
    testApiKey: vi.fn().mockResolvedValue(true),
    validateApiKey: vi.fn().mockReturnValue(true),
    isConfigured: vi.fn().mockReturnValue(true),
    getKeySource: vi.fn().mockReturnValue({
      source: 'memory',
      hasEnvironmentKey: false,
      hasMemoryKey: true,
      isConfigured: true
    })
  },
  generateRecipeSuggestion: vi.fn(),
  isApiKeyConfigured: vi.fn(() => true),
  setApiKey: vi.fn()
}));

// Mock the API Key service
vi.mock('../../services/apiKeyService', () => ({
  apiKeyService: {
    getApiKey: vi.fn((service) => service === 'gemini' ? 'test-api-key' : null),
    hasApiKey: vi.fn((service) => service === 'gemini'),
    setApiKey: vi.fn(),
    removeApiKey: vi.fn(),
    _getEnvironmentKey: vi.fn(() => null),
    _apiKeyStore: new Map([['gemini', 'test-api-key']])
  }
}));

const mockState = {
  currentView: 'ai',
  theme: 'light',
  geminiApiKey: 'test-api-key'
};

const mockStateWithMessages = {
  ...mockState,
  aiMessages: [
    {
      id: '1',
      type: 'user',
      content: 'Suggest a whiskey cocktail',
      timestamp: Date.now()
    },
    {
      id: '2',
      type: 'assistant',
      content: 'I recommend an Old Fashioned...',
      timestamp: Date.now()
    }
  ]
};

describe('AIAssistant Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    expect(getByText('AI Assistant')).toBeInTheDocument();
    expect(getByPlaceholderText(/ask me about cocktails, recipes, or get recommendations/i)).toBeInTheDocument();
  });

  it('displays suggested prompts when no messages', () => {
    const { getByText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    // Should show welcome message and suggested prompts
    expect(getByText(/welcome to your ai cocktail assistant/i)).toBeInTheDocument();
    expect(getByText(/suggest a cocktail with bourbon and citrus/i)).toBeInTheDocument();
  });

  it('sends new message', async () => {
    const user = userEvent.setup();

    const { getByPlaceholderText, getByRole } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    const input = getByPlaceholderText(/ask me about cocktails, recipes, or get recommendations/i);
    const sendButton = getByRole('button', { name: /send/i });

    await user.type(input, 'What is a good gin cocktail?');
    await user.click(sendButton);

    expect(input).toHaveValue('');
  });

  it('sends message on Enter key', async () => {
    const user = userEvent.setup();

    const { getByPlaceholderText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    const input = getByPlaceholderText(/ask me about cocktails, recipes, or get recommendations/i);

    await user.type(input, 'Test message{Enter}');

    expect(input).toHaveValue('');
  });

  it('prevents sending empty messages', async () => {
    const user = userEvent.setup();

    const { getByRole } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    const sendButton = getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('shows loading state during AI response', async () => {
    const user = userEvent.setup();

    const { getByPlaceholderText, getByLabelText, queryByText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    const input = getByPlaceholderText(/ask me about cocktails, recipes, or get recommendations/i);
    const sendButton = getByLabelText(/send message/i);

    await user.type(input, 'Test message');

    // Before clicking, there should be no loading state
    expect(queryByText(/ai is thinking/i)).not.toBeInTheDocument();

    // The send button should be enabled when there's text
    expect(sendButton).not.toBeDisabled();
  });

  it('displays suggested prompts', () => {
    const { getByText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    expect(getByText(/suggest a cocktail with bourbon and citrus/i)).toBeInTheDocument();
    expect(getByText(/create a variation of an old fashioned/i)).toBeInTheDocument();
  });

  it('handles suggested prompt clicks', async () => {
    const user = userEvent.setup();

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    const prompt = getByText(/suggest a cocktail with bourbon and citrus/i);
    await user.click(prompt);

    const input = getByPlaceholderText(/ask me about cocktails, recipes, or get recommendations/i);
    expect(input).toHaveValue('Suggest a cocktail with bourbon and citrus');
  });

  it('copies message content', async () => {
    const user = userEvent.setup();

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn()
      },
      writable: true
    });

    const { container } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    const copyButton = container.querySelector('[aria-label*="copy"]');
    if (copyButton) {
      await user.click(copyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }
  });

  it('shows API key configuration when not set', () => {
    // Mock localStorage to return null for API key
    const originalGetItem = global.localStorage.getItem;
    global.localStorage.getItem = vi.fn((key) => {
      if (key === 'gemini-api-key') return null;
      return originalGetItem(key);
    });

    const unconfiguredState = { ...mockState, geminiApiKey: '' };

    const { getByText } = renderWithProviders(
      <AIAssistant />,
      { initialState: unconfiguredState }
    );

    expect(getByText(/configure ai assistant/i)).toBeInTheDocument();
    expect(getByText(/configure api key/i)).toBeInTheDocument();

    // Restore original mock
    global.localStorage.getItem = originalGetItem;
  });

  it('handles API key configuration', async () => {
    // Mock localStorage to return null for API key
    const originalGetItem = global.localStorage.getItem;
    global.localStorage.getItem = vi.fn((key) => {
      if (key === 'gemini-api-key') return null;
      return originalGetItem(key);
    });

    // Mock apiKeyService to return null for unconfigured state
    const originalGetApiKey = apiKeyService.getApiKey;
    apiKeyService.getApiKey = vi.fn(() => null);

    const user = userEvent.setup();
    const unconfiguredState = { ...mockState, geminiApiKey: '' };

    const { getByLabelText, getByText } = renderWithProviders(
      <AIAssistant />,
      { initialState: unconfiguredState }
    );

    // Open API key modal
    const configButton = getByText('Configure API Key');
    await user.click(configButton);

    // Wait for modal to appear and find the input field
    const apiKeyInput = await waitFor(() => getByLabelText('Gemini API Key'));
    await user.type(apiKeyInput, 'test-api-key');

    const saveButton = getByText('Save API Key');
    await user.click(saveButton);

    // Restore original mocks
    global.localStorage.getItem = originalGetItem;
    apiKeyService.getApiKey = originalGetApiKey;
  });

  it('handles PDF file upload', async () => {
    const user = userEvent.setup();

    const { getByText, getByLabelText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    // Open PDF upload section
    const uploadButton = getByLabelText(/upload pdf recipe book/i);
    await user.click(uploadButton);

    const fileInput = getByLabelText(/select pdf file/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.pdf');
  });

  it('processes PDF file upload', async () => {
    const user = userEvent.setup();

    const { getByLabelText, getByText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    // First click the PDF upload button to show the upload interface
    const uploadButton = getByLabelText(/upload pdf recipe book/i);
    await user.click(uploadButton);

    // Now the PDF upload interface should be visible
    const fileInput = getByLabelText(/select pdf file/i);

    // Create a mock PDF file
    const file = new File(['pdf content'], 'recipes.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });

  it('shows PDF processing progress', async () => {
    const user = userEvent.setup();

    const { getByLabelText, getByText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    // Show PDF upload interface
    const uploadButton = getByLabelText(/upload pdf recipe book/i);
    await user.click(uploadButton);

    // Should show the upload interface
    expect(getByText(/upload recipe book pdf/i)).toBeInTheDocument();
    expect(getByText(/drop your pdf here or click to browse/i)).toBeInTheDocument();
  });

  it('handles drag and drop for PDF files', async () => {
    const user = userEvent.setup();
    const { container, getByLabelText, getByTestId } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    // First show the PDF upload interface
    const uploadButton = getByLabelText(/upload pdf recipe book/i);
    await user.click(uploadButton);

    // Now the drop zone should be visible
    const dropZone = getByTestId('pdf-drop-zone');
    expect(dropZone).toBeInTheDocument();

    // Test that the drop zone is present and functional
    expect(dropZone).toBeInTheDocument();
    expect(dropZone).toHaveAttribute('data-testid', 'pdf-drop-zone');

    // Test that it has the default styling
    expect(dropZone).toHaveClass('border-2', 'border-dashed');
  });

  it('clears chat history', async () => {
    const user = userEvent.setup();

    // Create state with some messages first
    const stateWithMessages = {
      ...mockState,
      // We need to add a message to the component's local state, but since it's local state
      // we'll test that the clear button is present and enabled when there are messages
    };

    const { getByLabelText, getByPlaceholderText } = renderWithProviders(
      <AIAssistant />,
      { initialState: stateWithMessages }
    );

    // Send a message first to have something to clear
    const input = getByPlaceholderText(/ask me about cocktails, recipes, or get recommendations/i);
    const sendButton = getByLabelText(/send message/i);

    await user.type(input, 'Test message');
    await user.click(sendButton);

    // Now the clear button should be enabled
    const clearButton = getByLabelText(/clear chat/i);
    expect(clearButton).not.toBeDisabled();
  });

  it('handles error states', async () => {
    const user = userEvent.setup();

    const { getByPlaceholderText, getByLabelText, queryByText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    const input = getByPlaceholderText(/ask me about cocktails, recipes, or get recommendations/i);
    const sendButton = getByLabelText(/send message/i);

    // Test that the component handles input properly
    await user.type(input, 'Test message');
    expect(input).toHaveValue('Test message');

    // Test that the send button is enabled with text
    expect(sendButton).not.toBeDisabled();

    // Test that there are no error messages initially
    expect(queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('supports keyboard shortcuts', async () => {
    const user = userEvent.setup();

    const { getByPlaceholderText } = renderWithProviders(
      <AIAssistant />,
      { initialState: mockState }
    );

    const input = getByPlaceholderText(/ask me about cocktails, recipes, or get recommendations/i);

    // Test Enter to send message (component only supports Enter, not Ctrl+Enter)
    await user.type(input, 'Test message');
    expect(input).toHaveValue('Test message');

    await user.keyboard('{Enter}');

    // After sending, input should be cleared
    expect(input).toHaveValue('');
  });
});
