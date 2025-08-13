/**
 * 共享组件库入口文件
 * 导出所有接口、管理器和工具类
 */

// 导出接口定义
export * from './interfaces/ComponentInterface';

// 导出管理器
export { ComponentCommunicationManager, communicationManager } from './managers/ComponentCommunicationManager';
export { SharedStateManager, sharedStateManager } from './managers/SharedStateManager';

// 导出类型
export type {
  IComponent,
  IComponentCommunicationManager,
  ISharedStateManager,
  ComponentInfo,
  ComponentState,
  ComponentEvent,
  ComponentMessage,
  ComponentConfig,
  ComponentLifecycle,
  ComponentRegistry,
  SharedState,
  StateChangeEvent
} from './interfaces/ComponentInterface';

// 版本信息
export const VERSION = '1.0.0';

// 默认导出
export default {
  communicationManager,
  sharedStateManager,
  VERSION
};