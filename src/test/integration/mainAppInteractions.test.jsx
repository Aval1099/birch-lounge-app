import { describe, it, beforeEach, expect, vi } from 'vitest';

import MainApp from '../../components/MainApp';
import { initialAppState } from '../../context/appReducer';
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from '../utils/test-utils';

vi.mock('../../hooks', async () => {
  const actual = await vi.importActual('../../hooks');
  return {
    ...actual,
    useMobileDetection: () => ({
      isMobile: false,
      isTouch: false,
      screenSize: 'lg',
    }),
  };
});

vi.mock('../../hooks/usePerformanceMonitoring', () => {
  const performanceStub = {
    isMonitoring: true,
    webVitals: {
      lcp: 1200,
      fid: 40,
      cls: 0.05,
      fcp: 900,
      ttfb: 250,
      inp: 80,
    },
    customMetrics: {
      apiResponseTimes: {},
      componentRenderTimes: {},
      searchResponseTimes: [],
      modalTimes: { open: [], close: [] },
      navigationTimes: {},
      memoryUsage: [],
      bundleLoadTimes: {},
    },
    currentSession: {
      sessionId: 'test-session',
      startTime: Date.now(),
      webVitals: {
        lcp: 1200,
        fid: 40,
        cls: 0.05,
        fcp: 900,
        ttfb: 250,
        inp: 80,
      },
      customMetrics: {
        apiResponseTimes: {},
        componentRenderTimes: {},
        searchResponseTimes: [],
        modalTimes: { open: [], close: [] },
        navigationTimes: {},
        memoryUsage: [],
        bundleLoadTimes: {},
      },
      alerts: [],
      userAgent: 'test-agent',
      viewport: { width: 1280, height: 720 },
    },
    getPerformanceScore: () => 95,
    getLatestAlerts: () => [],
    clearData: vi.fn(),
    generateReport: vi.fn(() => ({
      reportId: 'report-1',
      generatedAt: Date.now(),
      timeRange: { start: Date.now(), end: Date.now() },
      sessions: [],
      summary: {
        totalSessions: 0,
        averageWebVitals: {
          lcp: 0,
          fid: 0,
          cls: 0,
          fcp: 0,
          ttfb: 0,
          inp: 0,
        },
        alertCounts: {
          good: 0,
          'needs-improvement': 0,
          poor: 0,
        },
        topIssues: [],
        improvements: [],
      },
    })),
    recordMetric: vi.fn(),
    measureRender: () => () => {},
    measureApiCall: () => () => {},
    measureSearch: () => () => {},
    measureModal: () => () => {},
    measureNavigation: () => () => {},
    getPerformanceBudget: vi.fn(() => ({})),
    setPerformanceBudget: vi.fn(),
    getAlerts: vi.fn(() => []),
    addCustomMetric: vi.fn(),
    removeCustomMetric: vi.fn(),
  };

  return {
    usePerformanceMonitoring: () => performanceStub,
    useSearchPerformance: () => ({
      measureSearchCall: callback => callback(),
    }),
  };
});

vi.mock('../../services/hybridStorageService', () => {
  const init = vi.fn().mockResolvedValue(undefined);
  const load = vi.fn().mockResolvedValue(null);
  const save = vi.fn().mockResolvedValue(true);
  const forceSync = vi.fn().mockResolvedValue(true);
  const getSyncStatus = vi
    .fn()
    .mockReturnValue({ isConfigured: false, isOnline: false });
  const getUsageInfo = vi
    .fn()
    .mockReturnValue({ local: { size: 0 }, sync: {} });
  const clearAllData = vi.fn().mockResolvedValue(true);
  const isCloudSyncAvailable = vi.fn().mockReturnValue(false);

  return {
    hybridStorageService: {
      init,
      load,
      save,
      forceSync,
      getSyncStatus,
      getUsageInfo,
      clearAllData,
      isCloudSyncAvailable,
    },
    init,
    load,
    save,
    forceSync,
    getSyncStatus,
    getUsageInfo,
    clearAllData,
    isCloudSyncAvailable,
  };
});

const baseState = {
  ...initialAppState,
  isInitialized: true,
  modal: { ...initialAppState.modal },
  notification: { ...initialAppState.notification },
};

const renderMainApp = (overrides = {}) =>
  renderWithProviders(<MainApp />, {
    initialState: {
      ...baseState,
      ...overrides,
      modal: { ...baseState.modal, ...(overrides.modal || {}) },
      notification: {
        ...baseState.notification,
        ...(overrides.notification || {}),
      },
    },
  });

describe('MainApp UI interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles theme and service mode from the header controls', async () => {
    renderMainApp();

    const themeToggle = await screen.findByRole('button', {
      name: /switch to dark mode/i,
    });
    await userEvent.click(themeToggle);

    expect(
      screen.getByRole('button', { name: /switch to light mode/i })
    ).toBeInTheDocument();

    const serviceToggle = await screen.findByRole('button', {
      name: /^service mode$/i,
    });
    await userEvent.click(serviceToggle);

    const serviceIndicators =
      await screen.findAllByText(/service mode active/i);
    expect(serviceIndicators.length).toBeGreaterThan(0);

    const appContainer = screen.getByTestId('app-container');
    expect(appContainer.className).toContain('from-gray-900');

    await userEvent.click(serviceToggle);
    await waitFor(() => {
      expect(
        screen.queryByText(/service mode active/i)
      ).not.toBeInTheDocument();
    });
  });

  it('opens the settings and recipe modals from quick actions', async () => {
    renderMainApp();

    const settingsButton = await screen.findByRole('button', {
      name: /open settings/i,
    });
    await userEvent.click(settingsButton);

    expect(
      await screen.findByRole('heading', { name: /settings/i })
    ).toBeInTheDocument();

    const closeSettings = await screen.findByRole('button', {
      name: /close settings/i,
    });
    await userEvent.click(closeSettings);

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /settings/i })
      ).not.toBeInTheDocument();
    });

    const newRecipeButton = await screen.findByRole('button', {
      name: /new recipe/i,
    });
    await userEvent.click(newRecipeButton);

    expect(
      await screen.findByRole('heading', { name: /create new recipe/i })
    ).toBeInTheDocument();
  });

  it('navigates between recipe and management tabs', async () => {
    renderMainApp();

    const navButtons = await screen.findAllByRole('button', {
      name: /switch to .* tab/i,
    });
    const menuTab = navButtons.find(button =>
      button.textContent?.includes('Menus')
    );
    expect(menuTab, 'Menus tab button should exist').toBeDefined();
    if (menuTab) {
      await userEvent.click(menuTab);
    }

    expect(await screen.findByText(/menu builder/i)).toBeInTheDocument();

    const ingredientsTab = navButtons.find(button =>
      button.textContent?.includes('Ingredients')
    );
    expect(ingredientsTab, 'Ingredients tab button should exist').toBeDefined();
    if (ingredientsTab) {
      await userEvent.click(ingredientsTab);
    }

    expect(await screen.findByText(/add ingredient/i)).toBeInTheDocument();
  });
});
