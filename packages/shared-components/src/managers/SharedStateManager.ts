/**
 * 共享状态管理器实现
 * 负责管理组件间的共享状态，支持状态监听和变更通知
 */

import {
  ISharedStateManager,
  SharedState,
  StateChangeEvent
} from '../interfaces/ComponentInterface';

export class SharedStateManager implements ISharedStateManager {
  private state: SharedState = {};
  private watchers: Map<string, Set<(event: StateChangeEvent) => void>> = new Map();
  private globalWatchers: Set<(event: StateChangeEvent) => void> = new Set();
  private history: StateChangeEvent[] = [];
  private maxHistorySize = 100;

  /**
   * 获取状态值
   */
  get<T = any>(key: string): T | undefined {
    return this.state[key] as T;
  }

  /**
   * 设置状态值
   */
  set<T = any>(key: string, value: T, source?: string): void {
    const oldValue = this.state[key];
    
    // 如果值没有变化，则不触发更新
    if (this.isEqual(oldValue, value)) {
      return;
    }

    this.state[key] = value;

    const changeEvent: StateChangeEvent = {
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
      source
    };

    // 添加到历史记录
    this.addToHistory(changeEvent);

    // 通知监听器
    this.notifyWatchers(key, changeEvent);
    this.notifyGlobalWatchers(changeEvent);

    console.log(`State changed: ${key}`, changeEvent);
  }

  /**
   * 删除状态值
   */
  delete(key: string, source?: string): void {
    if (!(key in this.state)) {
      return;
    }

    const oldValue = this.state[key];
    delete this.state[key];

    const changeEvent: StateChangeEvent = {
      key,
      oldValue,
      newValue: undefined,
      timestamp: Date.now(),
      source
    };

    // 添加到历史记录
    this.addToHistory(changeEvent);

    // 通知监听器
    this.notifyWatchers(key, changeEvent);
    this.notifyGlobalWatchers(changeEvent);

    console.log(`State deleted: ${key}`, changeEvent);
  }

  /**
   * 清空所有状态
   */
  clear(source?: string): void {
    const keys = Object.keys(this.state);
    
    if (keys.length === 0) {
      return;
    }

    const oldState = { ...this.state };
    this.state = {};

    // 为每个被清除的键创建变更事件
    keys.forEach(key => {
      const changeEvent: StateChangeEvent = {
        key,
        oldValue: oldState[key],
        newValue: undefined,
        timestamp: Date.now(),
        source
      };

      // 添加到历史记录
      this.addToHistory(changeEvent);

      // 通知监听器
      this.notifyWatchers(key, changeEvent);
      this.notifyGlobalWatchers(changeEvent);
    });

    console.log('All state cleared', { clearedKeys: keys, source });
  }

  /**
   * 获取所有状态
   */
  getAll(): SharedState {
    return { ...this.state };
  }

  /**
   * 监听特定键的状态变更
   */
  watch(key: string, handler: (event: StateChangeEvent) => void): void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    
    this.watchers.get(key)!.add(handler);
    console.log(`Added watcher for key: ${key}`);
  }

  /**
   * 监听所有状态变更
   */
  watchAll(handler: (event: StateChangeEvent) => void): void {
    this.globalWatchers.add(handler);
    console.log('Added global state watcher');
  }

  /**
   * 取消监听特定键
   */
  unwatch(key: string, handler?: (event: StateChangeEvent) => void): void {
    const keyWatchers = this.watchers.get(key);
    
    if (!keyWatchers) {
      return;
    }

    if (handler) {
      keyWatchers.delete(handler);
      if (keyWatchers.size === 0) {
        this.watchers.delete(key);
      }
    } else {
      this.watchers.delete(key);
    }
    
    console.log(`Removed watcher for key: ${key}`);
  }

  /**
   * 取消所有全局监听
   */
  unwatchAll(handler?: (event: StateChangeEvent) => void): void {
    if (handler) {
      this.globalWatchers.delete(handler);
    } else {
      this.globalWatchers.clear();
    }
    
    console.log('Removed global state watcher(s)');
  }

  /**
   * 批量更新状态
   */
  batchUpdate(updates: Record<string, any>, source?: string): void {
    const changes: StateChangeEvent[] = [];

    // 收集所有变更
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = this.state[key];
      
      if (!this.isEqual(oldValue, value)) {
        this.state[key] = value;
        
        const changeEvent: StateChangeEvent = {
          key,
          oldValue,
          newValue: value,
          timestamp: Date.now(),
          source
        };
        
        changes.push(changeEvent);
        this.addToHistory(changeEvent);
      }
    });

    // 批量通知监听器
    changes.forEach(changeEvent => {
      this.notifyWatchers(changeEvent.key, changeEvent);
      this.notifyGlobalWatchers(changeEvent);
    });

    if (changes.length > 0) {
      console.log(`Batch updated ${changes.length} state keys`, changes);
    }
  }

  /**
   * 获取状态变更历史
   */
  getHistory(key?: string): StateChangeEvent[] {
    if (key) {
      return this.history.filter(event => event.key === key);
    }
    return [...this.history];
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.history = [];
    console.log('State change history cleared');
  }

  /**
   * 获取管理器状态信息
   */
  getStatus(): {
    stateKeys: number;
    watchers: number;
    globalWatchers: number;
    historySize: number;
  } {
    const watcherCount = Array.from(this.watchers.values())
      .reduce((total, watchers) => total + watchers.size, 0);

    return {
      stateKeys: Object.keys(this.state).length,
      watchers: watcherCount,
      globalWatchers: this.globalWatchers.size,
      historySize: this.history.length
    };
  }

  /**
   * 通知特定键的监听器
   */
  private notifyWatchers(key: string, event: StateChangeEvent): void {
    const keyWatchers = this.watchers.get(key);
    
    if (keyWatchers) {
      keyWatchers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in state watcher for key ${key}:`, error);
        }
      });
    }
  }

  /**
   * 通知全局监听器
   */
  private notifyGlobalWatchers(event: StateChangeEvent): void {
    this.globalWatchers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in global state watcher:', error);
      }
    });
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(event: StateChangeEvent): void {
    this.history.push(event);
    
    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * 深度比较两个值是否相等
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }

    if (a == null || b == null) {
      return a === b;
    }

    if (typeof a !== typeof b) {
      return false;
    }

    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) {
        return false;
      }

      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        return false;
      }

      return keysA.every(key => this.isEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * 销毁管理器，清理所有资源
   */
  destroy(): void {
    this.state = {};
    this.watchers.clear();
    this.globalWatchers.clear();
    this.history = [];
    
    console.log('SharedStateManager destroyed');
  }
}

// 创建全局单例实例
export const sharedStateManager = new SharedStateManager();

// 导出类型和实例
export default SharedStateManager;