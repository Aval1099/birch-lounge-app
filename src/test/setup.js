import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

import { expect, afterEach, vi } from 'vitest';

// Mock Supabase client before any imports
vi.mock('../services/supabaseClient', () => {
  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  };

  const mockClient = {
    supabase: {
      auth: mockAuth
    },
    isSupabaseConfigured: vi.fn().mockReturnValue(false),
    getCurrentUser: vi.fn().mockResolvedValue(null),
    signUp: vi.fn().mockResolvedValue({ success: false, error: 'Supabase not configured' }),
    signIn: vi.fn().mockResolvedValue({ success: false, error: 'Supabase not configured' }),
    signOut: vi.fn().mockResolvedValue({ success: false, error: 'Supabase not configured' }),
    onAuthStateChange: vi.fn().mockReturnValue(() => { })
  };

  return mockClient;
});

// Mock API Key Service before any imports
vi.mock('../services/apiKeyService', () => ({
  apiKeyService: {
    init: vi.fn(),
    setApiKey: vi.fn(),
    getApiKey: vi.fn(() => 'test-api-key'),
    removeApiKey: vi.fn(),
    rotateApiKey: vi.fn(),
    getAllApiKeys: vi.fn(() => ({})),
    clearAllApiKeys: vi.fn(),
    isApiKeyValid: vi.fn(() => true),
    getApiKeyInfo: vi.fn(() => ({
      exists: true,
      timestamp: Date.now(),
      expiration: Date.now() + 86400000
    })),
    _validateApiKeyFormat: vi.fn(() => true),
    _getEnvironmentKey: vi.fn(() => null),
    _loadEnvironmentKeys: vi.fn(),
    _apiKeyStore: new Map()
  }
}));

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Extend Vitest's expect with jest-axe matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock localStorage with proper handling for different data types
const localStorageMock = {
  getItem: vi.fn((key) => {
    // API key is stored as plain string (not JSON)
    if (key === 'gemini-api-key') return 'test-api-key';

    // Draft keys return null (no drafts in tests)
    if (key.startsWith('recipe-draft-')) return null;

    // Main app data is stored as JSON - return null to use default initial state
    if (key === 'birch-lounge-app-v2') return null;

    // Other keys return null by default
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: vi.fn()
}));

// Mock IndexedDB for PWA functionality
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  readyState: 'done',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

const mockIDBTransaction = {
  objectStore: vi.fn(() => mockIDBObjectStore),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  mode: 'readonly',
  db: null,
  error: null,
  oncomplete: null,
  onerror: null,
  onabort: null
};

const mockIDBObjectStore = {
  add: vi.fn(() => mockIDBRequest),
  put: vi.fn(() => mockIDBRequest),
  get: vi.fn(() => ({ ...mockIDBRequest, result: null })),
  getAll: vi.fn(() => ({ ...mockIDBRequest, result: [] })),
  delete: vi.fn(() => mockIDBRequest),
  clear: vi.fn(() => mockIDBRequest),
  count: vi.fn(() => ({ ...mockIDBRequest, result: 0 })),
  createIndex: vi.fn(),
  deleteIndex: vi.fn(),
  index: vi.fn(),
  openCursor: vi.fn(() => ({ ...mockIDBRequest, result: null })),
  openKeyCursor: vi.fn(() => ({ ...mockIDBRequest, result: null }))
};

const mockIDBDatabase = {
  createObjectStore: vi.fn(() => mockIDBObjectStore),
  deleteObjectStore: vi.fn(),
  transaction: vi.fn(() => mockIDBTransaction),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  name: 'test-db',
  version: 1,
  objectStoreNames: [],
  onabort: null,
  onclose: null,
  onerror: null,
  onversionchange: null
};

global.indexedDB = {
  open: vi.fn(() => ({
    ...mockIDBRequest,
    result: mockIDBDatabase,
    onupgradeneeded: null,
    onblocked: null
  })),
  deleteDatabase: vi.fn(() => mockIDBRequest),
  databases: vi.fn(() => Promise.resolve([])),
  cmp: vi.fn()
};

global.IDBKeyRange = {
  bound: vi.fn(),
  only: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn()
};
