import React from 'react';

/**
 * 按钮变体类型
 */
export type ButtonVariant = 
  | 'primary'    // 主要按钮
  | 'secondary'  // 次要按钮
  | 'outline'    // 轮廓按钮
  | 'ghost'      // 幽灵按钮
  | 'success'    // 成功按钮
  | 'danger'     // 危险按钮
  | 'warning'    // 警告按钮
  | 'info'       // 信息按钮
  | 'light'      // 浅色按钮
  | 'dark'       // 深色按钮
  | 'link';      // 链接样式按钮

/**
 * 按钮尺寸类型
 */
export type ButtonSize = 
  | 'sm'         // 小尺寸
  | 'md'         // 中等尺寸
  | 'lg'         // 大尺寸
  | 'xl'         // 超大尺寸
  | 'small'      // 小尺寸 (兼容)
  | 'medium'     // 中等尺寸 (兼容)
  | 'large';     // 大尺寸 (兼容)

/**
 * 按钮组件属性接口
 */
export interface ButtonProps {
  /** 按钮内容 */
  children: React.ReactNode;
  
  /** 按钮变体样式 */
  variant?: ButtonVariant;
  
  /** 按钮尺寸 */
  size?: ButtonSize;
  
  /** 是否禁用 */
  disabled?: boolean;
  
  /** 是否显示加载状态 */
  loading?: boolean;
  
  /** 点击事件处理函数 */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /** 按钮类型 */
  type?: 'button' | 'submit' | 'reset';
  
  /** 自定义类名 */
  className?: string;
  
  /** 其他HTML按钮属性 */
  [key: string]: any;
}

/**
 * 按钮组件默认属性
 */
export const defaultButtonProps: Partial<ButtonProps> = {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  type: 'button',
  className: '',
};
