/**
 * 组件通信管理器单元测试
 */

import { ComponentCommunicationManager } from '../ComponentCommunicationManager';
import { ComponentInterface } from '../../interfaces/ComponentInterface';

describe('ComponentCommunicationManager', () => {
  let manager: ComponentCommunicationManager;
  let mockComponent: ComponentInterface;

  beforeEach(() => {
    manager = new ComponentCommunicationManager();
    mockComponent = {
      id: 'test-component',
      name: 'Test Component',
      version: '1.0.0',
      initialize: jest.fn(),
      destroy: jest.fn(),
      getState: jest.fn(() => ({ initialized: true })),
      setState: jest.fn(),
      onMessage: jest.fn()
    };
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('组件注册', () => {
    test('应该能够注册组件', () => {
      const result = manager.registerComponent(mockComponent);
      expect(result).toBe(true);
      expect(manager.getComponent('test-component')).toBe(mockComponent);
    });

    test('不应该重复注册相同ID的组件', () => {
      manager.registerComponent(mockComponent);
      const result = manager.registerComponent(mockComponent);
      expect(result).toBe(false);
    });

    test('应该能够注销组件', () => {
      manager.registerComponent(mockComponent);
      const result = manager.unregisterComponent('test-component');
      expect(result).toBe(true);
      expect(manager.getComponent('test-component')).toBeUndefined();
    });
  });

  describe('消息传递', () => {
    beforeEach(() => {
      manager.registerComponent(mockComponent);
    });

    test('应该能够发送消息给指定组件', () => {
      const message = { type: 'test', data: { value: 123 } };
      const result = manager.sendMessage('test-component', message);
      
      expect(result).toBe(true);
      expect(mockComponent.onMessage).toHaveBeenCalledWith(message);
    });

    test('发送消息给不存在的组件应该返回false', () => {
      const message = { type: 'test', data: {} };
      const result = manager.sendMessage('non-existent', message);
      
      expect(result).toBe(false);
    });

    test('应该能够广播消息给所有组件', () => {
      const mockComponent2: ComponentInterface = {
        ...mockComponent,
        id: 'test-component-2',
        onMessage: jest.fn()
      };
      
      manager.registerComponent(mockComponent2);
      
      const message = { type: 'broadcast', data: { value: 456 } };
      manager.broadcastMessage(message);
      
      expect(mockComponent.onMessage).toHaveBeenCalledWith(message);
      expect(mockComponent2.onMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('事件监听', () => {
    test('应该能够添加和移除事件监听器', () => {
      const listener = jest.fn();
      
      manager.addEventListener('test-event', listener);
      manager.emit('test-event', { data: 'test' });
      
      expect(listener).toHaveBeenCalledWith({ data: 'test' });
      
      manager.removeEventListener('test-event', listener);
      manager.emit('test-event', { data: 'test2' });
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('应该能够处理多个监听器', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      manager.addEventListener('test-event', listener1);
      manager.addEventListener('test-event', listener2);
      manager.emit('test-event', { data: 'test' });
      
      expect(listener1).toHaveBeenCalledWith({ data: 'test' });
      expect(listener2).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('状态管理', () => {
    beforeEach(() => {
      manager.registerComponent(mockComponent);
    });

    test('应该能够获取组件状态', () => {
      const state = manager.getComponentState('test-component');
      expect(state).toEqual({ initialized: true });
      expect(mockComponent.getState).toHaveBeenCalled();
    });

    test('应该能够设置组件状态', () => {
      const newState = { initialized: false, data: 'test' };
      const result = manager.setComponentState('test-component', newState);
      
      expect(result).toBe(true);
      expect(mockComponent.setState).toHaveBeenCalledWith(newState);
    });

    test('获取不存在组件的状态应该返回null', () => {
      const state = manager.getComponentState('non-existent');
      expect(state).toBeNull();
    });
  });

  describe('生命周期管理', () => {
    test('应该能够初始化所有组件', async () => {
      manager.registerComponent(mockComponent);
      
      await manager.initializeAll();
      
      expect(mockComponent.initialize).toHaveBeenCalled();
    });

    test('应该能够销毁所有组件', async () => {
      manager.registerComponent(mockComponent);
      
      await manager.destroyAll();
      
      expect(mockComponent.destroy).toHaveBeenCalled();
    });

    test('销毁管理器时应该清理所有资源', async () => {
      manager.registerComponent(mockComponent);
      
      await manager.destroy();
      
      expect(mockComponent.destroy).toHaveBeenCalled();
      expect(manager.getComponent('test-component')).toBeUndefined();
    });
  });
});