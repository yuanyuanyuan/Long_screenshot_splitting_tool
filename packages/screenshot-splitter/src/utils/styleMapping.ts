/**
 * 样式映射和工具函数
 * 用于将原有CSS类名映射到Tailwind CSS类名
 */

// 原CSS类名到Tailwind类名的映射表
export const styleMapping = {
  // 按钮样式 - 显著放大并增强视觉权重
  btn: 'px-6 py-3 lg:px-8 lg:py-4 rounded-xl font-bold text-base lg:text-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
  'btn-primary':
    'bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 border-2 border-blue-700',
  'btn-secondary':
    'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 focus:ring-offset-2 border-2 border-gray-300',
  'btn-danger':
    'bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:ring-offset-2 border-2 border-red-700',

  // 预览相关样式
  'preview-container':
    'flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 bg-white rounded-lg shadow-sm w-full max-w-full',
  'preview-header':
    'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 lg:mb-6 w-full',
  'preview-content': 'flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 w-full',

  // 缩略图相关样式 - PC端左侧选择栏
  'thumbnail-sidebar': 'w-full lg:w-80 xl:w-96 flex-shrink-0 bg-gray-50 rounded-lg p-4',
  'thumbnail-list': 'space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain',
  'thumbnail-item':
    'relative flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer',
  'thumbnail-item-selected':
    'border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-50 shadow-md',
  'thumbnail-item-active': 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-30',
  'thumbnail-checkbox':
    'w-6 h-6 text-green-500 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 cursor-pointer',
  'thumbnail-img':
    'w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm',
  'thumbnail-info': 'flex-1 min-w-0',
  'thumbnail-label': 'text-base lg:text-lg font-bold text-gray-800 mb-1',
  'thumbnail-hint': 'text-sm text-gray-600 leading-relaxed',
  'thumbnail-number':
    'absolute -top-2 -left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center',
  'thumbnail-select-btn':
    'absolute -top-2 -right-2 w-8 h-8 bg-gray-200 hover:bg-blue-600 text-gray-600 hover:text-white font-bold rounded-full flex items-center justify-center transition-all duration-200 shadow-md',
  'thumbnail-select-btn-selected': 'bg-green-600 text-white hover:bg-green-700',

  // 大图预览相关样式 - PC端右侧预览区
  'preview-main':
    'flex-1 flex flex-col items-center justify-center min-h-[500px] lg:min-h-[600px] bg-gray-50 rounded-lg p-4',
  'preview-image-container':
    'relative w-full max-w-full overflow-hidden rounded-lg bg-white shadow-md',
  'preview-image': 'w-full max-w-full max-h-[60vh] lg:max-h-[70vh] object-contain rounded-lg',
  'preview-info': 'mt-4 text-center w-full p-4 bg-white rounded-lg shadow-sm',
  'preview-title': 'text-xl lg:text-2xl font-bold text-gray-800 mb-2',
  'preview-details': 'flex justify-center gap-4 mb-2 text-sm text-gray-600',
  'preview-dimension': 'bg-gray-100 px-3 py-1 rounded-full',
  'preview-size': 'bg-gray-100 px-3 py-1 rounded-full',
  'preview-hint': 'text-sm text-gray-500 italic',
  'preview-placeholder': 'text-center text-gray-400 p-8',
  'placeholder-icon': 'text-gray-400 mb-4 flex justify-center',
  'placeholder-title': 'text-lg font-medium text-gray-600 mb-2',
  'placeholder-hint': 'text-gray-500',

  // 选择控制样式 - 显著放大的全选/取消按钮
  'selection-controls': 'flex gap-4 flex-wrap justify-center lg:justify-start',

  // 加载和错误状态样式
  'image-loading-overlay':
    'absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10',
  'loading-spinner':
    'px-6 py-4 bg-blue-100 rounded-lg text-blue-700 text-base font-medium shadow-sm',
  'image-error-container':
    'flex flex-col items-center justify-center p-8 text-center bg-red-50 border-2 border-dashed border-red-200 rounded-lg min-h-[200px]',
  'error-icon': 'text-5xl mb-4',
  'error-title': 'text-lg font-semibold text-red-700 mb-2',
  'error-message': 'text-red-600 mb-4',
  'retry-button':
    'bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors',
  'reset-button':
    'bg-gray-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-600 transition-colors',
  'error-final': 'text-center mt-4',
  'error-final-message': 'text-red-700 mb-3',

  // 键盘导航提示样式
  'keyboard-navigation-hint': 'bg-blue-50 border border-blue-200 rounded-lg p-3 text-center my-4',
  'hint-text': 'text-blue-700 text-sm font-medium',
  'keyboard-hint': 'text-green-600 text-xs italic mt-1 opacity-80',

  // 预加载状态样式
  'preload-status': 'text-green-600 text-xs italic mt-2',

  // 错误详情样式
  'error-details': 'my-4 p-3 bg-red-100 border-l-4 border-red-500 rounded',
  'retry-info': 'text-red-800 text-xs font-medium m-0',
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
    primary: 'blue-600',
    success: 'green-600',
    error: 'red-600',
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
