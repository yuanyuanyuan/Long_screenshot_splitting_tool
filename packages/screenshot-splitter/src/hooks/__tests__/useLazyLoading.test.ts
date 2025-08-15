import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLazyLoading } from '../useLazyLoading';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

// @ts-ignore
window.IntersectionObserver = mockIntersectionObserver;

describe('useLazyLoading', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();
    
    mockIntersectionObserver.mockReturnValue({
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useLazyLoading());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.hasLoaded).toBe(false);
    expect(result.current.ref.current).toBe(null);
  });

  it('should initialize with custom options', () => {
    const options = {
      threshold: 0.5,
      rootMargin: '10px',
      triggerOnce: false,
    };

    renderHook(() => useLazyLoading(options));

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.5,
        rootMargin: '10px',
      })
    );
  });

  it('should observe element when ref is set', () => {
    const { result } = renderHook(() => useLazyLoading());
    const mockElement = document.createElement('div');

    act(() => {
      // @ts-ignore
      result.current.ref.current = mockElement;
    });

    expect(mockObserve).toHaveBeenCalledWith(mockElement);
  });

  it('should handle intersection callback correctly', () => {
    let intersectionCallback: IntersectionObserverCallback;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    });

    const { result } = renderHook(() => useLazyLoading());
    const mockElement = document.createElement('div');

    act(() => {
      // @ts-ignore
      result.current.ref.current = mockElement;
    });

    // Simulate intersection
    const mockEntry = {
      isIntersecting: true,
      target: mockElement,
    } as IntersectionObserverEntry;

    act(() => {
      intersectionCallback([mockEntry], {} as IntersectionObserver);
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.hasLoaded).toBe(true);
  });

  it('should unobserve element when triggerOnce is true and element becomes visible', () => {
    let intersectionCallback: IntersectionObserverCallback;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    });

    const { result } = renderHook(() => useLazyLoading({ triggerOnce: true }));
    const mockElement = document.createElement('div');

    act(() => {
      // @ts-ignore
      result.current.ref.current = mockElement;
    });

    const mockEntry = {
      isIntersecting: true,
      target: mockElement,
    } as IntersectionObserverEntry;

    act(() => {
      intersectionCallback([mockEntry], {} as IntersectionObserver);
    });

    expect(mockUnobserve).toHaveBeenCalledWith(mockElement);
  });

  it('should not unobserve when triggerOnce is false', () => {
    let intersectionCallback: IntersectionObserverCallback;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    });

    const { result } = renderHook(() => useLazyLoading({ triggerOnce: false }));
    const mockElement = document.createElement('div');

    act(() => {
      // @ts-ignore
      result.current.ref.current = mockElement;
    });

    const mockEntry = {
      isIntersecting: true,
      target: mockElement,
    } as IntersectionObserverEntry;

    act(() => {
      intersectionCallback([mockEntry], {} as IntersectionObserver);
    });

    expect(mockUnobserve).not.toHaveBeenCalled();
  });

  it('should handle element going out of view when triggerOnce is false', () => {
    let intersectionCallback: IntersectionObserverCallback;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    });

    const { result } = renderHook(() => useLazyLoading({ triggerOnce: false }));
    const mockElement = document.createElement('div');

    act(() => {
      // @ts-ignore
      result.current.ref.current = mockElement;
    });

    // Element becomes visible
    let mockEntry = {
      isIntersecting: true,
      target: mockElement,
    } as IntersectionObserverEntry;

    act(() => {
      intersectionCallback([mockEntry], {} as IntersectionObserver);
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.hasLoaded).toBe(true);

    // Element goes out of view
    mockEntry = {
      isIntersecting: false,
      target: mockElement,
    } as IntersectionObserverEntry;

    act(() => {
      intersectionCallback([mockEntry], {} as IntersectionObserver);
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.hasLoaded).toBe(true); // Should remain true
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useLazyLoading());

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle missing IntersectionObserver gracefully', () => {
    const originalIntersectionObserver = window.IntersectionObserver;
    // @ts-ignore
    delete window.IntersectionObserver;

    const { result } = renderHook(() => useLazyLoading());

    expect(result.current.isVisible).toBe(true); // Should default to visible
    expect(result.current.hasLoaded).toBe(true);

    // Restore
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('should handle multiple threshold values', () => {
    const options = {
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    renderHook(() => useLazyLoading(options));

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: [0, 0.25, 0.5, 0.75, 1],
      })
    );
  });

  it('should handle custom root element', () => {
    const rootElement = document.createElement('div');
    const options = {
      root: rootElement,
    };

    renderHook(() => useLazyLoading(options));

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        root: rootElement,
      })
    );
  });
});