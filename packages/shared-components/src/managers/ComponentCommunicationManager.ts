/**
 * 组件通信管理器实现
 * 负责管理组件间的消息传递、事件发布订阅和组件注册
 */

import {
  IComponent,
  IComponentCommunicationManager,
  ComponentRegistry,
  ComponentMessage,
  ComponentEvent
} from '../interfaces/ComponentInterface';

export class ComponentCommunicationManager implements IComponentCommunicationManager {
  private components: ComponentRegistry = {};
  private eventHandlers: Map<string, Set<(event: ComponentEvent) => void>> = new Map();
  private messageQueue: ComponentMessage[] = [];
  private isProcessingQueue = false;

  /**
   * 注册组件到通信管理器
   */
  register(component: IComponent): void {
    const componentId = component.info.id;
    
    if (this.components[componentId]) {
      console.warn(`Component ${componentId} is already registered`);
      return;
    }

    this.components[componentId] = {
      component,
      instance: null,
      mountPoint: null,
      isRegistered: true,
      registeredAt: Date.now()
    };

    // 设置组件的消息处理器
    component.onMessage((message: ComponentMessage) => {
      this.handleComponentMessage(componentId, message);
    });

    console.log(`Component ${componentId} registered successfully`);
    
    // 发布组件注册事件
    this.publish({
      type: 'component:registered',
      source: 'communication-manager',
      payload: { componentId, component: component.info },
      timestamp: Date.now()
    });
  }

  /**
   * 注销组件
   */
  unregister(componentId: string): void {
    if (!this.components[componentId]) {
      console.warn(`Component ${componentId} is not registered`);
      return;
    }

    const componentInfo = this.components[componentId];
    
    // 清理组件实例
    if (componentInfo.instance) {
      try {
        componentInfo.component.destroy();
      } catch (error) {
        console.error(`Error destroying component ${componentId}:`, error);
      }
    }

    delete this.components[componentId];
    
    console.log(`Component ${componentId} unregistered successfully`);
    
    // 发布组件注销事件
    this.publish({
      type: 'component:unregistered',
      source: 'communication-manager',
      payload: { componentId },
      timestamp: Date.now()
    });
  }

  /**
   * 获取指定组件
   */
  getComponent(componentId: string): IComponent | undefined {
    return this.components[componentId]?.component;
  }

  /**
   * 获取所有已注册的组件
   */
  getAllComponents(): ComponentRegistry {
    return { ...this.components };
  }

  /**
   * 广播消息给所有组件
   */
  broadcast(message: ComponentMessage): void {
    const broadcastMessage: ComponentMessage = {
      ...message,
      id: message.id || this.generateMessageId(),
      type: 'notification'
    };

    Object.keys(this.components).forEach(componentId => {
      if (componentId !== message.source) {
        this.sendToComponent(componentId, broadcastMessage);
      }
    });

    console.log(`Broadcast message: ${message.action}`, broadcastMessage);
  }

  /**
   * 发送消息给特定组件
   */
  async sendTo(targetId: string, message: ComponentMessage): Promise<any> {
    const targetComponent = this.components[targetId];
    
    if (!targetComponent) {
      throw new Error(`Target component ${targetId} not found`);
    }

    const messageWithId: ComponentMessage = {
      ...message,
      id: message.id || this.generateMessageId()
    };

    return this.sendToComponent(targetId, messageWithId);
  }

  /**
   * 订阅全局事件
   */
  subscribe(eventType: string, handler: (event: ComponentEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);
    console.log(`Subscribed to event: ${eventType}`);
  }

  /**
   * 取消订阅事件
   */
  unsubscribe(eventType: string, handler?: (event: ComponentEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType);
    
    if (!handlers) {
      return;
    }

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    } else {
      this.eventHandlers.delete(eventType);
    }
    
    console.log(`Unsubscribed from event: ${eventType}`);
  }

  /**
   * 发布全局事件
   */
  publish(event: ComponentEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error handling event ${event.type}:`, error);
        }
      });
    }

    // 同时通知所有组件
    Object.values(this.components).forEach(({ component }) => {
      try {
        component.emit(event);
      } catch (error) {
        console.error(`Error emitting event to component ${component.info.id}:`, error);
      }
    });

    console.log(`Published event: ${event.type}`, event);
  }

  /**
   * 处理组件发送的消息
   */
  private handleComponentMessage(sourceId: string, message: ComponentMessage): void {
    // 将消息添加到队列
    this.messageQueue.push({
      ...message,
      id: message.id || this.generateMessageId()
    });

    // 处理消息队列
    this.processMessageQueue();
  }

  /**
   * 处理消息队列
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      
      try {
        await this.processMessage(message);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * 处理单个消息
   */
  private async processMessage(message: ComponentMessage): Promise<void> {
    // 根据消息类型进行不同处理
    switch (message.type) {
      case 'request':
        await this.handleRequest(message);
        break;
      case 'response':
        await this.handleResponse(message);
        break;
      case 'notification':
        await this.handleNotification(message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * 处理请求消息
   */
  private async handleRequest(message: ComponentMessage): Promise<void> {
    // 实现请求处理逻辑
    console.log(`Handling request: ${message.action}`, message);
  }

  /**
   * 处理响应消息
   */
  private async handleResponse(message: ComponentMessage): Promise<void> {
    // 实现响应处理逻辑
    console.log(`Handling response: ${message.action}`, message);
  }

  /**
   * 处理通知消息
   */
  private async handleNotification(message: ComponentMessage): Promise<void> {
    // 实现通知处理逻辑
    console.log(`Handling notification: ${message.action}`, message);
  }

  /**
   * 发送消息给指定组件
   */
  private async sendToComponent(componentId: string, message: ComponentMessage): Promise<any> {
    const component = this.components[componentId]?.component;
    
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    try {
      return await component.sendMessage(message);
    } catch (error) {
      console.error(`Error sending message to component ${componentId}:`, error);
      throw error;
    }
  }

  /**
   * 生成唯一的消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取管理器状态信息
   */
  getStatus(): {
    registeredComponents: number;
    activeEventTypes: number;
    queuedMessages: number;
    isProcessingQueue: boolean;
  } {
    return {
      registeredComponents: Object.keys(this.components).length,
      activeEventTypes: this.eventHandlers.size,
      queuedMessages: this.messageQueue.length,
      isProcessingQueue: this.isProcessingQueue
    };
  }

  /**
   * 清理所有资源
   */
  destroy(): void {
    // 注销所有组件
    Object.keys(this.components).forEach(componentId => {
      this.unregister(componentId);
    });

    // 清理事件处理器
    this.eventHandlers.clear();

    // 清理消息队列
    this.messageQueue = [];
    this.isProcessingQueue = false;

    console.log('ComponentCommunicationManager destroyed');
  }
}

// 创建全局单例实例
export const communicationManager = new ComponentCommunicationManager();

// 导出类型和实例
export default ComponentCommunicationManager;