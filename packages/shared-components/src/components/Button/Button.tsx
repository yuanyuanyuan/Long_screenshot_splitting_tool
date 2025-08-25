import React from 'react';
import './Button.css';
import { ButtonProps } from './types';

/**
 * 基础按钮组件
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="medium" onClick={handleClick}>
 *   点击我
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const stateClass = disabled ? 'btn--disabled' : '';
  const loadingClass = loading ? 'btn--loading' : '';

  const combinedClassName = [
    baseClass,
    variantClass,
    sizeClass,
    stateClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      type={type}
      className={combinedClassName}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      <span className="btn__content">{children}</span>
    </button>
  );
};

Button.displayName = 'Button';