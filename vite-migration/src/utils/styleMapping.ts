/**
 * 样式映射和工具函数
 * 用于将原有CSS类名映射到Tailwind CSS类名
 */

// 原CSS类名到Tailwind类名的映射表
export const styleMapping = {
  // 按钮样式
  'btn': 'px-4 py-2 rounded-md font-medium transition-colors duration-200',
  'btn-primary': 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  'btn-secondary': 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
  'btn-danger': 'bg-error-500 text-white hover:bg-error-600 focus:ring-2 focus:ring-error-500 focus:ring-offset-2',
  
  // 预览相关样式
  'preview-container': 'flex flex-col lg:flex-row gap-6 p-6 bg-white rounded-lg shadow-sm',
  'preview-header': 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6',
  'preview-content': 'flex flex-col lg:flex-row gap-6 flex-1',
  
  // 缩略图相关样式
  'thumbnail-sidebar': 'w-full lg:w-1/3 xl:w-1/4 flex-shrink-0',
  'thumbnail-list': 'space-y-3 max-h-96 lg:max-h-[600px] overflow-y-auto',
  'thumbnail-item': 'relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer',
  'thumbnail-item-selected': 'border-success-500 bg-success-50 ring-2 ring-success-500 ring-opacity-50',
  'thumbnail-checkbox': 'w-4 h-4 text-success-500 border-gray-300 rounded focus:ring-success-500',
  'thumbnail-img': 'w-16 h-16 object-cover rounded border',
  'thumbnail-info': 'flex-1 min-w-0',
  'thumbnail-label': 'text-sm font-semibold text-gray-700 truncate',
  'thumbnail-hint': 'text-xs text-gray-500 mt-1',
  
  // 大图预览相关样式
  'preview-main': 'flex-1 flex flex-col items-center justify-center min-h-[400px]',
  'preview-image-container': 'relative text-center max-w-full',
  'preview-image': 'max-w-full max-h-96 rounded-lg shadow-lg mb-4',
  'preview-info': 'text-center',
  'preview-placeholder': 'text-center text-gray-400',
  
  // 选择控制样式
  'selection-controls': 'flex gap-3 flex-wrap',
  
  // 加载和错误状态样式
  'image-loading-overlay': 'absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10',
  'loading-spinner': 'px-4 py-2 bg-gray-100 rounded text-gray-600 text-sm font-medium shadow-sm',
  'image-error-container': 'flex flex-col items-center justify-center p-8 text-center bg-error-50 border-2 border-dashed border-error-200 rounded-lg min-h-[200px]',
  'error-icon': 'text-5xl mb-4',
  'retry-button': 'bg-error-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-error-600 transition-colors',
  'reset-button': 'bg-gray-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-600 transition-colors',
  
  // 键盘导航提示样式
  'keyboard-navigation-hint': 'bg-primary-50 border border-primary-200 rounded-lg p-3 text-center my-4',
  'hint-text': 'text-primary-700 text-sm font-medium',
  'keyboard-hint': 'text-success-600 text-xs italic mt-1 opacity-80',
  
  // 预加载状态样式
  'preload-status': 'text-success-600 text-xs italic mt-2',
  
  // 错误详情样式
  'error-details': 'my-4 p-3 bg-error-100 border-l-4 border-error-500 rounded',
  'retry-info': 'text-error-800 text-xs font-medium m-0',
  'error-final': 'text-center mt-4',
} as const;

// 响应式样式工具函数
export const responsive = {
  // 隐藏在移动端
  hiddenOnMobile: 'hidden md:block',
  // 隐藏在桌面端
  hiddenOnDesktop: 'block md:hidden',
  // 移动端全宽，桌面端固定宽度
  responsiveWidth: 'w-full lg:w-80',
  // 响应式间距
  responsiveSpacing: 'gap-3 lg:gap-6',
  // 响应式文字大小
  responsiveText: 'text-sm lg:text-base',
  // 移动端优化的触摸目标
  touchTarget: 'min-h-[44px] min-w-[44px]',
  // 移动端优化的按钮
  mobileButton: 'px-6 py-3 text-base min-h-[44px] touch-manipulation',
  // 移动端优化的缩略图项
  mobileThumbnail: 'p-4 min-h-[60px] touch-manipulation',
  // 移动端优化的滚动容器
  mobileScroll: 'overflow-y-auto overscroll-contain scroll-smooth',
  // 移动端优化的图片容器
  mobileImageContainer: 'touch-manipulation select-none',
};

// 样式常量定义
export const styleConstants = {
  // 颜色主题
  colors: {
    primary: 'primary-500',
    success: 'success-500',
    error: 'error-500',
    gray: 'gray-500',
  },
  
  // 间距
  spacing: {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
  },
  
  // 圆角
  borderRadius: {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  },
  
  // 阴影
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  },
  
  // 过渡动画
  transition: {
    default: 'transition-all duration-200',
    fast: 'transition-all duration-150',
    slow: 'transition-all duration-300',
  },
};

// 工具函数：组合多个Tailwind类名
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// 工具函数：根据条件应用样式
export function conditionalStyle(
  condition: boolean,
  trueStyle: string,
  falseStyle: string = ''
): string {
  return condition ? trueStyle : falseStyle;
}

// 工具函数：获取映射的样式类名
export function getMappedStyle(originalClass: keyof typeof styleMapping): string {
  return styleMapping[originalClass] || '';
}

// 工具函数：构建响应式样式
export function buildResponsiveStyle({
  base,
  sm,
  md,
  lg,
  xl,
}: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}): string {
  const styles = [];
  if (base) styles.push(base);
  if (sm) styles.push(`sm:${sm}`);
  if (md) styles.push(`md:${md}`);
  if (lg) styles.push(`lg:${lg}`);
  if (xl) styles.push(`xl:${xl}`);
  return styles.join(' ');
}