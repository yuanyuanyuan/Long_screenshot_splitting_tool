/**
 * 组件间通信接口定义
 * 定义了组件之间标准化的通信协议和数据结构
 */

// 组件基础信息接口
export interface ComponentInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
}

// 组件状态接口
export interface ComponentState {
  isActive: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  data?: any;
}

// 组件事件接口
export interface ComponentEvent {
  type: string;
  source: string;
  target?: string;
  payload?: any;
  timestamp: number;
}

// 组件消息接口
export interface ComponentMessage {
  id: string;
  type: 'request' | 'response' | 'notification';
  action: string;
  data?: any;
  callback?: string;
}

// 组件配置接口
export interface ComponentConfig {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  apiEndpoint?: string;
  features?: Record<string, boolean>;
  customStyles?: Record<string, string>;
}

// 组件生命周期钩子接口
export interface ComponentLifecycle {
  onInit?: () => void | Promise<void>;
  onMount?: () => void | Promise<void>;
  onUpdate?: (prevState: any) => void | Promise<void>;
  onUnmount?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

// 主要的组件接口
export interface IComponent {
  // 基础信息
  info: ComponentInfo;
  
  // 当前状态
  state: ComponentState;
  
  // 配置信息
  config: ComponentConfig;
  
  // 生命周期方法
  lifecycle: ComponentLifecycle;
  
  // 初始化组件
  initialize(config?: Partial<ComponentConfig>): Promise<void>;
  
  // 启动组件
  start(): Promise<void>;
  
  // 停止组件
  stop(): Promise<void>;
  
  // 更新配置
  updateConfig(config: Partial<ComponentConfig>): void;
  
  // 发送消息
  sendMessage(message: ComponentMessage): Promise<any>;
  
  // 接收消息
  onMessage(handler: (message: ComponentMessage) => void): void;
  
  // 发送事件
  emit(event: ComponentEvent): void;
  
  // 监听事件
  on(eventType: string, handler: (event: ComponentEvent) => void): void;
  
  // 移除事件监听
  off(eventType: string, handler?: (event: ComponentEvent) => void): void;
  
  // 获取组件状态
  getState(): ComponentState;
  
  // 更新组件状态
  setState(state: Partial<ComponentState>): void;
  
  // 销毁组件
  destroy(): Promise<void>;
}

// 组件注册信息接口
export interface ComponentRegistry {
  [componentId: string]: {
    component: IComponent;
    instance?: any;
    mountPoint?: HTMLElement;
    isRegistered: boolean;
    registeredAt: number;
  };
}

// 组件通信管理器接口
export interface IComponentCommunicationManager {
  // 注册组件
  register(component: IComponent): void;
  
  // 注销组件
  unregister(componentId: string): void;
  
  // 获取组件
  getComponent(componentId: string): IComponent | undefined;
  
  // 获取所有组件
  getAllComponents(): ComponentRegistry;
  
  // 广播消息
  broadcast(message: ComponentMessage): void;
  
  // 发送消息给特定组件
  sendTo(targetId: string, message: ComponentMessage): Promise<any>;
  
  // 订阅全局事件
  subscribe(eventType: string, handler: (event: ComponentEvent) => void): void;
  
  // 取消订阅
  unsubscribe(eventType: string, handler?: (event: ComponentEvent) => void): void;
  
  // 发布全局事件
  publish(event: ComponentEvent): void;
}

// 共享状态接口
export interface SharedState {
  [key: string]: any;
}

// 状态变更事件接口
export interface StateChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  source?: string;
}

// 共享状态管理器接口
export interface ISharedStateManager {
  // 获取状态值
  get<T = any>(key: string): T | undefined;
  
  // 设置状态值
  set<T = any>(key: string, value: T, source?: string): void;
  
  // 删除状态值
  delete(key: string, source?: string): void;
  
  // 清空所有状态
  clear(source?: string): void;
  
  // 获取所有状态
  getAll(): SharedState;
  
  // 监听状态变更
  watch(key: string, handler: (event: StateChangeEvent) => void): void;
  
  // 监听所有状态变更
  watchAll(handler: (event: StateChangeEvent) => void): void;
  
  // 取消监听
  unwatch(key: string, handler?: (event: StateChangeEvent) => void): void;
  
  // 取消所有监听
  unwatchAll(handler?: (event: StateChangeEvent) => void): void;
}

