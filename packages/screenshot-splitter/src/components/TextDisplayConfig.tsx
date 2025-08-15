/**
 * 文字显示配置组件
 * 用于控制ImagePreview组件中各种文字信息的显示/隐藏
 */

import { useState, useCallback } from 'react';
import { styleMapping, cn } from '../utils/styleMapping';
import { useI18n } from '../hooks/useI18n';

/**
 * 文字显示配置选项接口
 */
export interface TextDisplayOptions {
  /** 显示切片标题 (如: "切片 1") */
  showSliceTitle: boolean;
  /** 显示尺寸信息 (如: "800 × 600") */
  showDimensions: boolean;
  /** 显示文件大小 (如: "1000 KB") */
  showFileSize: boolean;
  /** 显示完整格式化文本 (如: "切片 1 800 × 600 | 1000 KB") */
  showFullText: boolean;
  /** 显示缩略图序号 (如: "#1") */
  showThumbnailNumber: boolean;
  /** 显示键盘导航提示 */
  showKeyboardHints: boolean;
  /** 显示预加载状态信息 */
  showPreloadStatus: boolean;
  /** 显示调试信息 */
  showDebugInfo: boolean;
}

/**
 * 默认显示配置
 */
export const DEFAULT_TEXT_DISPLAY_OPTIONS: TextDisplayOptions = {
  showSliceTitle: true,
  showDimensions: true,
  showFileSize: true,
  showFullText: true,
  showThumbnailNumber: true,
  showKeyboardHints: true,
  showPreloadStatus: true,
  showDebugInfo: false, // 默认隐藏调试信息
};

/**
 * 简洁模式配置 - 隐藏非必要信息
 */
export const MINIMAL_TEXT_DISPLAY_OPTIONS: TextDisplayOptions = {
  showSliceTitle: true,
  showDimensions: false,
  showFileSize: false,
  showFullText: false,
  showThumbnailNumber: true,
  showKeyboardHints: false,
  showPreloadStatus: false,
  showDebugInfo: false,
};

/**
 * 详细模式配置 - 显示所有信息
 */
export const DETAILED_TEXT_DISPLAY_OPTIONS: TextDisplayOptions = {
  showSliceTitle: true,
  showDimensions: true,
  showFileSize: true,
  showFullText: true,
  showThumbnailNumber: true,
  showKeyboardHints: true,
  showPreloadStatus: true,
  showDebugInfo: true,
};

/**
 * 文字显示配置组件Props
 */
interface TextDisplayConfigProps {
  /** 当前配置选项 */
  options: TextDisplayOptions;
  /** 配置变更回调 */
  onChange: (options: TextDisplayOptions) => void;
  /** 是否显示为紧凑模式 */
  compact?: boolean;
  /** 是否显示预设按钮 */
  showPresets?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 配置项组件
 */
interface ConfigItemProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
}

function ConfigItem({ label, description, checked, onChange, compact = false }: ConfigItemProps) {
  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
      checked ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200',
      compact ? 'p-2' : ''
    )}>
      <label className="flex items-start gap-2 cursor-pointer flex-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <div className="flex-1">
          <div className={cn(
            'font-medium text-gray-900',
            compact ? 'text-sm' : 'text-base'
          )}>
            {label}
          </div>
          {description && !compact && (
            <div className="text-sm text-gray-600 mt-1">
              {description}
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

/**
 * 文字显示配置组件
 */
export function TextDisplayConfig({
  options,
  onChange,
  compact = false,
  showPresets = true,
  className
}: TextDisplayConfigProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  // 更新单个配置项
  const updateOption = useCallback((key: keyof TextDisplayOptions, value: boolean) => {
    onChange({
      ...options,
      [key]: value
    });
  }, [options, onChange]);

  // 应用预设配置
  const applyPreset = useCallback((preset: TextDisplayOptions) => {
    onChange(preset);
  }, [onChange]);

  // 重置为默认配置
  const resetToDefault = useCallback(() => {
    onChange(DEFAULT_TEXT_DISPLAY_OPTIONS);
  }, [onChange]);

  // 切换全部显示/隐藏
  const toggleAll = useCallback((show: boolean) => {
    const newOptions = { ...options };
    Object.keys(newOptions).forEach(key => {
      (newOptions as any)[key] = show;
    });
    onChange(newOptions);
  }, [options, onChange]);

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 shadow-sm',
      className
    )}>
      {/* 配置头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            'font-semibold text-gray-900',
            compact ? 'text-base' : 'text-lg'
          )}>
            {t('textDisplay.title')}
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title={isExpanded ? '收起' : '展开'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className={cn(
                'transition-transform',
                isExpanded ? 'rotate-180' : ''
              )}
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
        </div>

        {/* 快速操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleAll(true)}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            title="显示全部"
          >
            全显示
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            title="隐藏全部"
          >
            全隐藏
          </button>
        </div>
      </div>

      {/* 配置内容 */}
      {isExpanded && (
        <div className="p-4">
          {/* 预设配置按钮 */}
          {showPresets && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">快速预设</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyPreset(DEFAULT_TEXT_DISPLAY_OPTIONS)}
                  className={cn(styleMapping['btn'], styleMapping['btn-secondary'], 'text-sm')}
                >
                  默认模式
                </button>
                <button
                  onClick={() => applyPreset(MINIMAL_TEXT_DISPLAY_OPTIONS)}
                  className={cn(styleMapping['btn'], styleMapping['btn-secondary'], 'text-sm')}
                >
                  简洁模式
                </button>
                <button
                  onClick={() => applyPreset(DETAILED_TEXT_DISPLAY_OPTIONS)}
                  className={cn(styleMapping['btn'], styleMapping['btn-secondary'], 'text-sm')}
                >
                  详细模式
                </button>
                <button
                  onClick={resetToDefault}
                  className={cn(styleMapping['btn'], 'bg-gray-100 text-gray-700 hover:bg-gray-200', 'text-sm')}
                >
                  重置
                </button>
              </div>
            </div>
          )}

          {/* 基础信息显示配置 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">基础信息</h4>
            <div className="space-y-2">
              <ConfigItem
                label="切片标题"
                description="显示切片编号，如 '切片 1'"
                checked={options.showSliceTitle}
                onChange={(checked) => updateOption('showSliceTitle', checked)}
                compact={compact}
              />
              <ConfigItem
                label="尺寸信息"
                description="显示图片尺寸，如 '800 × 600'"
                checked={options.showDimensions}
                onChange={(checked) => updateOption('showDimensions', checked)}
                compact={compact}
              />
              <ConfigItem
                label="文件大小"
                description="显示文件大小，如 '1000 KB'"
                checked={options.showFileSize}
                onChange={(checked) => updateOption('showFileSize', checked)}
                compact={compact}
              />
              <ConfigItem
                label="完整格式化文本"
                description="显示完整信息，如 '切片 1 800 × 600 | 1000 KB'"
                checked={options.showFullText}
                onChange={(checked) => updateOption('showFullText', checked)}
                compact={compact}
              />
            </div>
          </div>

          {/* 界面元素配置 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">界面元素</h4>
            <div className="space-y-2">
              <ConfigItem
                label="缩略图序号"
                description="显示缩略图左上角的序号标识"
                checked={options.showThumbnailNumber}
                onChange={(checked) => updateOption('showThumbnailNumber', checked)}
                compact={compact}
              />
              <ConfigItem
                label="键盘导航提示"
                description="显示键盘快捷键使用提示"
                checked={options.showKeyboardHints}
                onChange={(checked) => updateOption('showKeyboardHints', checked)}
                compact={compact}
              />
            </div>
          </div>

          {/* 状态信息配置 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">状态信息</h4>
            <div className="space-y-2">
              <ConfigItem
                label="预加载状态"
                description="显示图片预加载进度信息"
                checked={options.showPreloadStatus}
                onChange={(checked) => updateOption('showPreloadStatus', checked)}
                compact={compact}
              />
              <ConfigItem
                label="调试信息"
                description="显示开发调试相关信息（建议生产环境关闭）"
                checked={options.showDebugInfo}
                onChange={(checked) => updateOption('showDebugInfo', checked)}
                compact={compact}
              />
            </div>
          </div>

          {/* 当前配置摘要 */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">当前配置摘要</h4>
            <div className="text-xs text-gray-600">
              {Object.entries(options).filter(([_, value]) => value).length} / {Object.keys(options).length} 项已启用
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(options).map(([key, value]) => (
                <span
                  key={key}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    value 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 收起状态的简要信息 */}
      {!isExpanded && (
        <div className="px-4 pb-4">
          <div className="text-sm text-gray-600">
            {Object.entries(options).filter(([_, value]) => value).length} / {Object.keys(options).length} 项已启用
            {!options.showDebugInfo && (
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                简洁模式
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 文字显示配置Hook
 * 提供配置状态管理和本地存储功能
 */
export function useTextDisplayConfig(initialOptions: TextDisplayOptions = DEFAULT_TEXT_DISPLAY_OPTIONS) {
  const [options, setOptions] = useState<TextDisplayOptions>(() => {
    // 尝试从localStorage加载配置
    try {
      const saved = localStorage.getItem('textDisplayOptions');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 合并默认配置，确保新增的配置项有默认值
        return { ...initialOptions, ...parsed };
      }
    } catch (error) {
      console.warn('[TextDisplayConfig] 加载本地配置失败:', error);
    }
    return initialOptions;
  });

  // 更新配置并保存到localStorage
  const updateOptions = useCallback((newOptions: TextDisplayOptions) => {
    setOptions(newOptions);
    try {
      localStorage.setItem('textDisplayOptions', JSON.stringify(newOptions));
    } catch (error) {
      console.warn('[TextDisplayConfig] 保存本地配置失败:', error);
    }
  }, []);

  // 重置配置
  const resetOptions = useCallback(() => {
    updateOptions(initialOptions);
  }, [initialOptions, updateOptions]);

  // 应用预设
  const applyPreset = useCallback((preset: TextDisplayOptions) => {
    updateOptions(preset);
  }, [updateOptions]);

  return {
    options,
    updateOptions,
    resetOptions,
    applyPreset,
    // 便捷方法
    enableMinimalMode: () => applyPreset(MINIMAL_TEXT_DISPLAY_OPTIONS),
    enableDetailedMode: () => applyPreset(DETAILED_TEXT_DISPLAY_OPTIONS),
    enableDefaultMode: () => applyPreset(DEFAULT_TEXT_DISPLAY_OPTIONS),
  };
}