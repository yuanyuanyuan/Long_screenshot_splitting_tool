/**
 * 应用常量定义
 */

// 应用信息
export const APP_INFO = {
  NAME: 'Long Screenshot Splitter',
  VERSION: '1.0.0',
  DESCRIPTION: '长截图分割工具 - 支持将长截图分割为多个部分',
  AUTHOR: 'Tencent',
  LICENSE: 'MIT',
} as const;

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  IMAGE: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  EXPORT: ['png', 'jpg', 'jpeg', 'pdf', 'zip'],
} as const;

// 文件大小限制
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_WIDTH: 10000, // 10000px
  MAX_IMAGE_HEIGHT: 50000, // 50000px
  MIN_IMAGE_WIDTH: 100, // 100px
  MIN_IMAGE_HEIGHT: 100, // 100px
} as const;

// UI常量
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300, // ms
  ANIMATION_DURATION: 200, // ms
  TOAST_DURATION: 3000, // ms
  LOADING_DELAY: 500, // ms
} as const;

// 分割参数
export const SPLIT_CONSTANTS = {
  DEFAULT_SPLIT_HEIGHT: 1000, // px
  MIN_SPLIT_HEIGHT: 100, // px
  MAX_SPLIT_HEIGHT: 5000, // px
  DEFAULT_OVERLAP: 50, // px
  MIN_OVERLAP: 0, // px
  MAX_OVERLAP: 200, // px
} as const;

// 导出格式
export const EXPORT_FORMATS = {
  PNG: 'png',
  JPG: 'jpg',
  JPEG: 'jpeg',
  PDF: 'pdf',
  ZIP: 'zip',
} as const;

// 质量设置
export const QUALITY_SETTINGS = {
  LOW: 0.6,
  MEDIUM: 0.8,
  HIGH: 0.9,
  LOSSLESS: 1.0,
} as const;

// 本地存储键
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  RECENT_FILES: 'recent_files',
  SPLIT_SETTINGS: 'split_settings',
  EXPORT_SETTINGS: 'export_settings',
  UI_STATE: 'ui_state',
} as const;

// 事件名称
export const EVENT_NAMES = {
  FILE_UPLOADED: 'file_uploaded',
  IMAGE_PROCESSED: 'image_processed',
  SPLIT_COMPLETED: 'split_completed',
  EXPORT_STARTED: 'export_started',
  EXPORT_COMPLETED: 'export_completed',
  ERROR_OCCURRED: 'error_occurred',
} as const;

// 错误代码
export const ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  IMAGE_LOAD_FAILED: 'IMAGE_LOAD_FAILED',
  SPLIT_FAILED: 'SPLIT_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 正则表达式
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  FILENAME: /^[^<>:"/\\|?*]+$/,
  VERSION: /^\d+\.\d+\.\d+$/,
} as const;