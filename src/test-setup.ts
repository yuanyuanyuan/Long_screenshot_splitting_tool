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
