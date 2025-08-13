/**
 * 共享状态管理器单元测试
 */

import { SharedStateManager } from '../SharedStateManager';

describe('SharedStateManager', () => {
  let manager: SharedStateManager;

  beforeEach(() => {
    manager = new SharedStateManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('状态管理', () => {
    test('应该能够设置和获取状态', () => {
      const testState = { user: { name: 'Test User', id: 123 } };
      
      manager.setState('user', testState.user);
      const retrievedState = manager.getState('user');
      
      expect(retrievedState).toEqual(testState.user);
    });

    test('获取不存在的状态应该返回undefined', () => {
      const state = manager.getState('non-existent');
      expect(state).toBeUndefined();
    });

    test('应该能够更新现有状态', () => {
      manager.setState('user', { name: 'John', age: 25 });
      manager.updateState('user', { age: 26, city: 'New York' });
      
      const state = manager.getState('user');
      expect(state).toEqual({ name: 'John', age: 26, city: 'New York' });
    });

    test('更新不存在的状态应该创建新状态', () => {
      manager.updateState('settings', { theme: 'dark' });
      
      const state = manager.getState('settings');
      expect(state).toEqual({ theme: 'dark' });
    });

    test('应该能够删除状态', () => {
      manager.setState('temp', { data: 'temporary' });
      expect(manager.getState('temp')).toBeDefined();
      
      const result = manager.removeState('temp');
      expect(result).toBe(true);
      expect(manager.getState('temp')).toBeUndefined();
    });

    test('删除不存在的状态应该返回false', () => {
      const result = manager.removeState('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('状态订阅', () => {
    test('应该能够订阅状态变化', () => {
      const callback = jest.fn();
      
      manager.subscribe('user', callback);
      manager.setState('user', { name: 'Alice' });
      
      expect(callback).toHaveBeenCalledWith(
        { name: 'Alice' },
        undefined,
        'user'
      );
    });

    test('应该能够取消订阅', () => {
      const callback = jest.fn();
      
      const unsubscribe = manager.subscribe('user', callback);
      manager.setState('user', { name: 'Bob' });
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      manager.setState('user', { name: 'Charlie' });
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('应该支持多个订阅者', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      manager.subscribe('user', callback1);
      manager.subscribe('user', callback2);
      manager.setState('user', { name: 'David' });
      
      expect(callback1).toHaveBeenCalledWith(
        { name: 'David' },
        undefined,
        'user'
      );
      expect(callback2).toHaveBeenCalledWith(
        { name: 'David' },
        undefined,
        'user'
      );
    });

    test('状态更新时应该传递旧值和新值', () => {
      const callback = jest.fn();
      
      manager.setState('counter', 0);
      manager.subscribe('counter', callback);
      manager.setState('counter', 1);
      
      expect(callback).toHaveBeenCalledWith(1, 0, 'counter');
    });
  });

  describe('批量操作', () => {
    test('应该能够批量设置状态', () => {
      const states = {
        user: { name: 'Eve', id: 456 },
        settings: { theme: 'light', lang: 'en' },
        cache: { lastUpdate: Date.now() }
      };
      
      manager.setBatch(states);
      
      expect(manager.getState('user')).toEqual(states.user);
      expect(manager.getState('settings')).toEqual(states.settings);
      expect(manager.getState('cache')).toEqual(states.cache);
    });

    test('应该能够获取所有状态', () => {
      manager.setState('a', { value: 1 });
      manager.setState('b', { value: 2 });
      manager.setState('c', { value: 3 });
      
      const allStates = manager.getAllStates();
      
      expect(allStates).toEqual({
        a: { value: 1 },
        b: { value: 2 },
        c: { value: 3 }
      });
    });

    test('应该能够清空所有状态', () => {
      manager.setState('a', { value: 1 });
      manager.setState('b', { value: 2 });
      
      manager.clearAll();
      
      expect(manager.getAllStates()).toEqual({});
    });
  });

  describe('持久化', () => {
    test('应该能够保存状态到localStorage', () => {
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
      
      manager.setState('user', { name: 'Frank' });
      manager.persist('user');
      
      expect(mockSetItem).toHaveBeenCalledWith(
        'shared-state-user',
        JSON.stringify({ name: 'Frank' })
      );
      
      mockSetItem.mockRestore();
    });

    test('应该能够从localStorage恢复状态', () => {
      const mockGetItem = jest.spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(JSON.stringify({ name: 'Grace' }));
      
      const result = manager.restore('user');
      
      expect(result).toBe(true);
      expect(manager.getState('user')).toEqual({ name: 'Grace' });
      
      mockGetItem.mockRestore();
    });

    test('恢复不存在的状态应该返回false', () => {
      const mockGetItem = jest.spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(null);
      
      const result = manager.restore('non-existent');
      
      expect(result).toBe(false);
      
      mockGetItem.mockRestore();
    });
  });

  describe('状态验证', () => {
    test('应该能够验证状态格式', () => {
      const validator = (state: any) => {
        return typeof state === 'object' && 
               typeof state.name === 'string' && 
               typeof state.age === 'number';
      };
      
      manager.setValidator('user', validator);
      
      // 有效状态
      expect(() => {
        manager.setState('user', { name: 'Henry', age: 30 });
      }).not.toThrow();
      
      // 无效状态
      expect(() => {
        manager.setState('user', { name: 'Invalid', age: 'not-a-number' });
      }).toThrow();
    });

    test('没有验证器时应该允许任何状态', () => {
      expect(() => {
        manager.setState('anything', { random: 'data', number: 42 });
      }).not.toThrow();
    });
  });

  describe('错误处理', () => {
    test('应该处理JSON序列化错误', () => {
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
      
      // 创建循环引用对象
      const circularObj: any = { name: 'Circular' };
      circularObj.self = circularObj;
      
      manager.setState('circular', circularObj);
      
      expect(() => {
        manager.persist('circular');
      }).not.toThrow();
      
      mockSetItem.mockRestore();
    });

    test('应该处理JSON解析错误', () => {
      const mockGetItem = jest.spyOn(Storage.prototype, 'getItem')
        .mockReturnValue('invalid-json');
      
      const result = manager.restore('invalid');
      
      expect(result).toBe(false);
      
      mockGetItem.mockRestore();
    });
  });
});