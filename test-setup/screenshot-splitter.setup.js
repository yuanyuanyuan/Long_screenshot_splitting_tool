/**
 * 长截图分割工具测试环境设置
 */

import '@testing-library/jest-dom';

// 模拟 Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  })),
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  setTransform: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  fillText: jest.fn(),
  strokeText: jest.fn()
}));

// 模拟 Image 对象
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload && this.onload();
    }, 100);
  }
  
  set src(value) {
    this._src = value;
  }
  
  get src() {
    return this._src;
  }
};

// 模拟 FileReader
global.FileReader = class {
  constructor() {
    this.readAsDataURL = jest.fn(() => {
      setTimeout(() => {
        this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        this.onload && this.onload();
      }, 100);
    });
  }
};

// 模拟 URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// 模拟 localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// 模拟 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 模拟 ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    // Mock implementation
  }
  
  unobserve() {
    // Mock implementation
  }
  
  disconnect() {
    // Mock implementation
  }
};

// 设置测试环境变量
process.env.NODE_ENV = 'test';