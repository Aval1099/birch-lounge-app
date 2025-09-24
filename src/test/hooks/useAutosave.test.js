import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useAutosave, useRecipeAutosave } from '../../hooks/useAutosave';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('useAutosave', () => {
  let mockSaveFunction;

  beforeEach(() => {
    mockSaveFunction = vi.fn().mockResolvedValue();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useAutosave({ name: 'test' }, mockSaveFunction)
    );

    expect(result.current.autosaveStatus).toBe('idle');
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isAutosaveEnabled).toBe(true);
  });

  it('should detect unsaved changes when data changes', () => {
    const initialData = { name: 'test' };
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave(data, mockSaveFunction, { skipInitial: false }),
      { initialProps: { data: initialData } }
    );

    // Change data
    const newData = { name: 'test changed' };
    rerender({ data: newData });

    // Should detect changes immediately
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should trigger autosave after delay when data changes', async () => {
    const initialData = { name: 'test' };
    const { result: _result, rerender } = renderHook(
      ({ data }) => useAutosave(data, mockSaveFunction, { delay: 100, skipInitial: false }),
      { initialProps: { data: initialData } }
    );

    // Change data
    const newData = { name: 'test changed' };
    rerender({ data: newData });

    // Should not save immediately
    expect(mockSaveFunction).not.toHaveBeenCalled();

    // Fast-forward time and wait for autosave
    await act(async () => {
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
    });

    expect(mockSaveFunction).toHaveBeenCalledWith(newData);
  }, 10000);

  it('should handle save errors gracefully', async () => {
    const mockError = new Error('Save failed');
    const failingSaveFunction = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useAutosave({ name: 'test' }, failingSaveFunction)
    );

    // Manually trigger save to test error handling
    await act(async () => {
      try {
        await result.current.saveNow();
      } catch (error) {
        // Expected to fail
      }
    });

    expect(result.current.autosaveStatus).toBe('error');
    expect(result.current.error).toBe(mockError);
  });

  it('should allow manual save', async () => {
    const testData = { name: 'test' };
    const { result } = renderHook(() =>
      useAutosave(testData, mockSaveFunction)
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(mockSaveFunction).toHaveBeenCalledWith(testData);
  });

  it('should reset autosave state', () => {
    const { result } = renderHook(() =>
      useAutosave({ name: 'test' }, mockSaveFunction)
    );

    act(() => {
      result.current.resetAutosave();
    });

    expect(result.current.autosaveStatus).toBe('idle');
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useRecipeAutosave', () => {
  let mockRecipeData;

  beforeEach(() => {
    mockRecipeData = {
      id: 'recipe-1',
      name: 'Test Recipe',
      ingredients: []
    };
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should save draft to localStorage', async () => {
    const { result } = renderHook(() =>
      useRecipeAutosave(mockRecipeData, mockRecipeData.id)
    );

    // Manually save draft
    await act(async () => {
      await result.current.saveNow();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'recipe-draft-recipe-1',
      expect.stringContaining('"name":"Test Recipe"')
    );
  });

  it('should load existing draft', () => {
    const draftData = {
      ...mockRecipeData,
      name: 'Draft Recipe',
      isDraft: true,
      lastModified: Date.now()
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(draftData));

    const { result } = renderHook(() =>
      useRecipeAutosave(mockRecipeData, mockRecipeData.id)
    );

    const loadedDraft = result.current.loadDraft();
    expect(loadedDraft.name).toBe('Draft Recipe');
    expect(loadedDraft.isDraft).toBe(true);
  });

  it('should clear draft from localStorage', () => {
    const { result } = renderHook(() =>
      useRecipeAutosave(mockRecipeData, mockRecipeData.id)
    );

    act(() => {
      result.current.clearDraft();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('recipe-draft-recipe-1');
  });

  it('should check if draft exists', () => {
    localStorageMock.getItem.mockReturnValue('{"name":"Draft"}');

    const { result } = renderHook(() =>
      useRecipeAutosave(mockRecipeData, mockRecipeData.id)
    );

    expect(result.current.hasDraft()).toBe(true);

    localStorageMock.getItem.mockReturnValue(null);
    expect(result.current.hasDraft()).toBe(false);
  });
});
