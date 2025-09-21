/**
 * @vitest-environment jsdom
 */

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AIAssistant from '../../components/features/AIAssistant';
import { processPDFRecipeBook } from '../../services/pdfService';
import { renderWithProviders } from '../utils/test-utils';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key) => {
    // API key is stored as plain string, not JSON
    if (key === 'gemini-api-key') return 'test-api-key';

    // Draft keys return null (no drafts in tests)
    if (key.startsWith('recipe-draft-')) return null;

    // Main app data is stored as JSON - include API key in state
    if (key === 'birch-lounge-app-v2') return JSON.stringify({
      geminiApiKey: 'test-api-key',
      currentView: 'ai',
      theme: 'light',
      recipes: [],
      aiMessages: []
    });

    // Other keys return null by default
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock the services
vi.mock('../../services/geminiService', () => ({
  geminiService: {
    generate: vi.fn().mockResolvedValue('AI response'),
    validateApiKey: vi.fn().mockReturnValue(true),
    testApiKey: vi.fn().mockResolvedValue(true),
    isConfigured: vi.fn().mockReturnValue(true),
    getKeySource: vi.fn().mockReturnValue({
      source: 'memory',
      hasEnvironmentKey: false,
      hasMemoryKey: true,
      isConfigured: true
    })
  }
}));

vi.mock('../../services/storageService', () => ({
  storageService: {
    load: vi.fn(() => null), // Return null to use default initial state
    save: vi.fn(() => true),
    clearAllData: vi.fn(),
    getUsageInfo: vi.fn(() => ({ sizeInBytes: 0, sizeInKB: '0 KB', sizeInMB: '0 MB', lastSaved: null }))
  }
}));

vi.mock('../../services/pdfService', () => ({
  processPDFRecipeBook: vi.fn()
}));

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

const renderWithProvider = (component) => {
  return renderWithProviders(component, { initialState: mockState });
};

describe('AIAssistant PDF Upload Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage with API key - use the same mock as above
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  it('shows PDF upload button when API key is configured', () => {
    renderWithProvider(<AIAssistant />);

    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).not.toBeDisabled();
  });

  it('shows configure API key button when API key is not configured', () => {
    const unconfiguredState = { ...mockState, geminiApiKey: '' };

    const { getByRole, queryByRole } = renderWithProviders(
      <AIAssistant />,
      { initialState: unconfiguredState }
    );

    const configureButton = getByRole('button', { name: /configure api key/i });
    expect(configureButton).toBeInTheDocument();
    expect(queryByRole('button', { name: /upload pdf recipe book/i })).not.toBeInTheDocument();
  });

  it('shows PDF upload section when upload button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProvider(<AIAssistant />);

    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });

    await act(async () => {
      await user.click(uploadButton);
    });

    expect(screen.getByText('Upload Recipe Book PDF')).toBeInTheDocument();
    expect(screen.getByText(/Drop your PDF here or click to browse/)).toBeInTheDocument();
    expect(screen.getByText(/Supports PDF files up to 50MB/)).toBeInTheDocument();
  });

  it('hides PDF upload section when upload button is clicked again', async () => {
    const user = userEvent.setup();

    renderWithProvider(<AIAssistant />);

    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });

    // Show upload section
    await user.click(uploadButton);
    expect(screen.getByText('Upload Recipe Book PDF')).toBeInTheDocument();

    // Hide upload section
    await user.click(uploadButton);
    expect(screen.queryByText('Upload Recipe Book PDF')).not.toBeInTheDocument();
  });

  it('processes PDF file when uploaded via file input', async () => {
    const user = userEvent.setup();
    const mockRecipes = [
      { id: '1', name: 'Test Recipe', ingredients: [] }
    ];

    processPDFRecipeBook.mockResolvedValue({
      success: true,
      recipes: mockRecipes,
      totalPages: 5,
      totalRecipes: 1,
      message: 'Successfully extracted 1 recipes from 5 pages'
    });

    renderWithProvider(<AIAssistant />);

    // Open PDF upload section
    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });
    await user.click(uploadButton);

    // Create a mock PDF file
    const file = new File(['test'], 'recipes.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/select pdf file/i);

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(processPDFRecipeBook).toHaveBeenCalledWith(file, expect.any(Function));
    });
  });

  it('shows success message after successful PDF processing', async () => {
    const user = userEvent.setup();
    const mockRecipes = [
      { id: '1', name: 'Old Fashioned', ingredients: [] },
      { id: '2', name: 'Manhattan', ingredients: [] }
    ];

    processPDFRecipeBook.mockResolvedValue({
      success: true,
      recipes: mockRecipes,
      totalPages: 10,
      totalRecipes: 2,
      message: 'Successfully extracted 2 recipes from 10 pages'
    });

    renderWithProvider(<AIAssistant />);

    // Open PDF upload section and upload file
    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });
    await user.click(uploadButton);

    const file = new File(['test'], 'recipes.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/select pdf file/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/Successfully extracted 2 recipes from 10 pages/)).toBeInTheDocument();
      expect(screen.getByText(/I've successfully imported 2 recipes into your collection/)).toBeInTheDocument();
    });
  });

  it('shows error message when PDF processing fails', async () => {
    const user = userEvent.setup();

    processPDFRecipeBook.mockResolvedValue({
      success: false,
      error: 'Failed to parse PDF file',
      recipes: []
    });

    renderWithProvider(<AIAssistant />);

    // Open PDF upload section and upload file
    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });
    await user.click(uploadButton);

    const file = new File(['test'], 'recipes.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/select pdf file/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error while processing your PDF/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to parse PDF file/)).toBeInTheDocument();
    });
  });

  it('shows processing progress during PDF upload', async () => {
    const user = userEvent.setup();
    let progressCallback;

    processPDFRecipeBook.mockImplementation((file, callback) => {
      progressCallback = callback;
      return new Promise(resolve => {
        setTimeout(() => {
          // Simulate progress updates
          callback({ stage: 'extracting', progress: 25, currentPage: 1, totalPages: 4 });
          setTimeout(() => {
            callback({ stage: 'extracting', progress: 50, currentPage: 2, totalPages: 4 });
            setTimeout(() => {
              callback({ stage: 'parsing', progress: 75, recipesFound: 2 });
              setTimeout(() => {
                callback({ stage: 'parsing', progress: 100, recipesFound: 3 });
                resolve({
                  success: true,
                  recipes: [],
                  totalPages: 4,
                  totalRecipes: 3,
                  message: 'Success'
                });
              }, 25);
            }, 25);
          }, 25);
        }, 25);
      });
    });

    renderWithProvider(<AIAssistant />);

    // Open PDF upload section and upload file
    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });
    await user.click(uploadButton);

    const file = new File(['test'], 'recipes.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/select pdf file/i);
    await user.upload(fileInput, file);

    // Check for processing UI
    await waitFor(() => {
      expect(screen.getByText('Processing PDF...')).toBeInTheDocument();
    });

    // Check for progress updates
    await waitFor(() => {
      expect(screen.getByText(/Extracting text from page/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Parsing recipes/)).toBeInTheDocument();
    });
  });

  it('supports drag and drop for PDF files', async () => {
    const user = userEvent.setup();

    renderWithProvider(<AIAssistant />);

    // Open PDF upload section
    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });
    await user.click(uploadButton);

    const dropZone = screen.getByTestId('pdf-drop-zone');

    // Test drag enter
    fireEvent.dragEnter(dropZone);
    expect(dropZone).toHaveClass('border-amber-500');

    // Test drag leave
    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass('border-amber-500');

    // Test drag over
    fireEvent.dragOver(dropZone);

    // Test drop with PDF file
    const file = new File(['test'], 'recipes.pdf', { type: 'application/pdf' });
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file]
      }
    });

    processPDFRecipeBook.mockResolvedValue({
      success: true,
      recipes: [],
      totalPages: 1,
      totalRecipes: 0,
      message: 'No recipes found'
    });

    fireEvent(dropZone, dropEvent);

    await waitFor(() => {
      expect(processPDFRecipeBook).toHaveBeenCalledWith(file, expect.any(Function));
    });
  });

  it('ignores non-PDF files in drag and drop', async () => {
    const user = userEvent.setup();

    renderWithProvider(<AIAssistant />);

    // Open PDF upload section
    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });
    await user.click(uploadButton);

    const dropZone = screen.getByTestId('pdf-drop-zone');

    // Test drop with non-PDF file
    const file = new File(['test'], 'recipes.txt', { type: 'text/plain' });
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file]
      }
    });

    fireEvent(dropZone, dropEvent);

    // Should not call processPDFRecipeBook
    expect(processPDFRecipeBook).not.toHaveBeenCalled();
  });

  it('hides upload section after successful processing', async () => {
    const user = userEvent.setup();

    processPDFRecipeBook.mockResolvedValue({
      success: true,
      recipes: [],
      totalPages: 1,
      totalRecipes: 0,
      message: 'Success'
    });

    renderWithProvider(<AIAssistant />);

    // Open PDF upload section and upload file
    const uploadButton = screen.getByRole('button', { name: /upload pdf recipe book/i });
    await user.click(uploadButton);

    expect(screen.getByText('Upload Recipe Book PDF')).toBeInTheDocument();

    const file = new File(['test'], 'recipes.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/select pdf file/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.queryByText('Upload Recipe Book PDF')).not.toBeInTheDocument();
    });
  });
});
