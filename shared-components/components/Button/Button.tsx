import React from 'react';
import styles from './Button.module.css';
import { ButtonProps } from './types';

/**
 * 基础按钮组件（CSS Modules）
 *
 * 兼容尺寸别名：small->sm, medium->md, large->lg
 */
function normalizeSize(size?: string): 'sm' | 'md' | 'lg' | 'xl' {
  switch (size) {
    case 'small':
      return 'sm';
    case 'medium':
      return 'md';
    case 'large':
      return 'lg';
    case 'sm':
    case 'md':
    case 'lg':
    case 'xl':
      return size as any;
    default:
      return 'md';
  }
}

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
  const sizeKey = `btn--${normalizeSize(size)}`;
  const variantKey = `btn--${variant}`;
  const classes = [
    styles['btn'],
    styles[sizeKey],
    styles[variantKey],
    disabled ? styles['btn--disabled'] : '',
    loading ? styles['btn--loading'] : '',
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
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className={styles['btn__spinner']} />}
      <span className={styles['btn__content']}>{children}</span>
    </button>
  );
};

Button.displayName = 'Button';