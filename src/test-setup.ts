import '@testing-library/jest-dom';

// 确保全局测试函数可用
import { expect, test, describe, it, beforeEach, afterEach, vi } from 'vitest';

// 将测试函数添加到全局作用域
globalThis.expect = expect;
globalThis.test = test;
globalThis.describe = describe;
globalThis.it = it;
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;
globalThis.vi = vi;

// Development infrastructure test environment setup
if (process.env.VITE_DEV_MODE === 'parallel') {
  console.log('🧪 Test setup: Parallel development mode enabled');
}

// Mock ResizeObserver for responsive components testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for performance testing
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Setup for SEO testing
globalThis.structuredClone = globalThis.structuredClone || ((obj) => JSON.parse(JSON.stringify(obj)));
