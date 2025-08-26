/**
 * 调试信息控制组件
 * 提供调试信息显示/隐藏的控制界面
 */

import { useState, useCallback } from 'react';
import { useTextDisplayConfig, type TextDisplayOptions } from './TextDisplayConfig';
import { useI18nContext } from '../hooks/useI18nContext';

export interface DebugInfoControlProps {
  /** 是否显示控制面板 */
  visible?: boolean;
  /** 控制面板位置 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 控制面板变化回调 */
  onVisibilityChange?: (visible: boolean) => void;
}

export interface DebugLevel {
  id: string;
  nameKey: string;
  descriptionKey: string;
  options: Partial<TextDisplayOptions>;
}

// 预定义的调试级别
export const DEBUG_LEVELS: DebugLevel[] = [
  {
    id: 'none',
    nameKey: 'debug.level.none',
    descriptionKey: 'debug.level.none.description',
    options: {
      showSliceTitle: false,
      showDimensions: false,
      showFileSize: false,
    },
  },
  {
    id: 'minimal',
    nameKey: 'debug.level.minimal',
    descriptionKey: 'debug.level.minimal.description',
    options: {
      showSliceTitle: true,
      showDimensions: true,
      showFileSize: false,
    },
  },
  {
    id: 'standard',
    nameKey: 'debug.level.standard',
    descriptionKey: 'debug.level.standard.description',
    options: {
      showSliceTitle: true,
      showDimensions: true,
      showFileSize: true,
    },
  },
  {
    id: 'detailed',
    nameKey: 'debug.level.detailed',
    descriptionKey: 'debug.level.detailed.description',
    options: {
      showSliceTitle: true,
      showDimensions: true,
      showFileSize: true,
    },
  },
];

/**
 * 调试信息控制组件
 */
export const DebugInfoControl: React.FC<DebugInfoControlProps> = ({
  visible = true,
  position = 'top-right',
  compact = false,
  className = '',
  onVisibilityChange,
}) => {
  const { t } = useI18nContext();
  const { options: config, updateOptions: updateConfig } = useTextDisplayConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<string>(() => {
    // 根据当前配置推断调试级别
    const matchingLevel = DEBUG_LEVELS.find(level => {
      const options = level.options;
      return Object.keys(options).every(key => {
        const optionKey = key as keyof TextDisplayOptions;
        return config[optionKey] === options[optionKey];
      });
    });
    return matchingLevel?.id || 'standard';
  });

  // 切换控制面板可见性
  const toggleVisibility = useCallback(() => {
    const newVisible = !visible;
    onVisibilityChange?.(newVisible);
  }, [visible, onVisibilityChange]);

  // 切换展开状态
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // 应用调试级别
  const applyDebugLevel = useCallback(
    (levelId: string) => {
      const level = DEBUG_LEVELS.find(l => l.id === levelId);
      if (level) {
        // 合并当前配置和级别选项，确保所有必需字段都有值
        const mergedOptions: TextDisplayOptions = {
          ...config,
          ...level.options,
        };
        updateConfig(mergedOptions);
        setCurrentLevel(levelId);
        if (compact) {
          setIsExpanded(false);
        }
      }
    },
    [updateConfig, compact, config]
  );

  // 快速切换常用选项
  const toggleQuickOption = useCallback(
    (optionKey: keyof TextDisplayOptions) => {
      const newConfig = {
        ...config,
        [optionKey]: !config[optionKey],
      };
      updateConfig(newConfig);
      // 更新当前级别为自定义
      setCurrentLevel('custom');
    },
    [config, updateConfig]
  );

  if (!visible) {
    return (
      <button
        className="debug-control-toggle"
        onClick={toggleVisibility}
        title={t('debug.control.show')}
      >
        🐛
      </button>
    );
  }

  const positionClass = `debug-control-${position}`;
  const compactClass = compact ? 'debug-control-compact' : '';

  return (
    <div className={`debug-info-control ${positionClass} ${compactClass} ${className}`}>
      <div className="debug-control-header">
        <h4>{t('debug.control.title')}</h4>
        <div className="debug-control-actions">
          {!compact && (
            <button
              className="debug-control-expand"
              onClick={toggleExpanded}
              title={isExpanded ? t('debug.control.collapse') : t('debug.control.expand')}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
          <button
            className="debug-control-close"
            onClick={toggleVisibility}
            title={t('debug.control.hide')}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="debug-control-content">
        {/* 调试级别选择 */}
        <div className="debug-level-selector">
          <label>{t('debug.level.label')}</label>
          <select
            value={currentLevel}
            onChange={e => applyDebugLevel(e.target.value)}
            className="debug-level-select"
          >
            {DEBUG_LEVELS.map(level => (
              <option key={level.id} value={level.id}>
                {t(level.nameKey)}
              </option>
            ))}
            {currentLevel === 'custom' && <option value="custom">{t('debug.level.custom')}</option>}
          </select>
        </div>

        {/* 当前级别描述 */}
        {currentLevel !== 'custom' && (
          <div className="debug-level-description">
            {t(DEBUG_LEVELS.find(l => l.id === currentLevel)?.descriptionKey || '')}
          </div>
        )}

        {/* 快速切换选项 */}
        {!compact && (
          <div className="debug-quick-toggles">
            <h5>{t('debug.quickToggle.title')}</h5>
            <div className="debug-toggle-grid">
              <label className="debug-toggle-item">
                <input
                  type="checkbox"
                  checked={config.showSliceTitle}
                  onChange={() => toggleQuickOption('showSliceTitle')}
                />
                <span>{t('debug.quickToggle.sliceTitle')}</span>
              </label>
              <label className="debug-toggle-item">
                <input
                  type="checkbox"
                  checked={config.showDimensions}
                  onChange={() => toggleQuickOption('showDimensions')}
                />
                <span>{t('debug.quickToggle.dimensions')}</span>
              </label>
              <label className="debug-toggle-item">
                <input
                  type="checkbox"
                  checked={config.showFileSize}
                  onChange={() => toggleQuickOption('showFileSize')}
                />
                <span>{t('debug.quickToggle.fileSize')}</span>
              </label>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="debug-control-buttons">
          <button
            className="debug-btn debug-btn-primary"
            onClick={() => applyDebugLevel('none')}
            title={t('debug.button.hideAll')}
          >
            {t('debug.button.hideAll')}
          </button>
          <button
            className="debug-btn debug-btn-secondary"
            onClick={() => applyDebugLevel('detailed')}
            title={t('debug.button.showAll')}
          >
            {t('debug.button.showAll')}
          </button>
        </div>
      </div>

      <style>{`
        .debug-info-control {
          position: fixed;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          border-radius: 8px;
          padding: 12px;
          min-width: 280px;
          max-width: 400px;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }

        .debug-control-top-left {
          top: 20px;
          left: 20px;
        }

        .debug-control-top-right {
          top: 20px;
          right: 20px;
        }

        .debug-control-bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .debug-control-bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .debug-control-compact {
          min-width: 200px;
          padding: 8px;
        }

        .debug-control-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 8px;
        }

        .debug-control-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .debug-control-actions {
          display: flex;
          gap: 4px;
        }

        .debug-control-expand,
        .debug-control-close,
        .debug-control-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: background-color 0.2s;
        }

        .debug-control-expand:hover,
        .debug-control-close:hover,
        .debug-control-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .debug-control-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 16px;
        }

        .debug-level-selector {
          margin-bottom: 12px;
        }

        .debug-level-selector label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .debug-level-select {
          width: 100%;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
          font-size: 12px;
        }

        .debug-level-select option {
          background: #333;
          color: white;
        }

        .debug-level-description {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 12px;
          font-style: italic;
        }

        .debug-quick-toggles {
          margin-bottom: 12px;
        }

        .debug-quick-toggles h5 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 500;
        }

        .debug-toggle-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .debug-toggle-item {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 11px;
        }

        .debug-toggle-item input[type="checkbox"] {
          margin: 0;
          width: 14px;
          height: 14px;
        }

        .debug-control-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .debug-btn {
          flex: 1;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .debug-btn-primary {
          background: #dc3545;
          color: white;
        }

        .debug-btn-primary:hover {
          background: #c82333;
        }

        .debug-btn-secondary {
          background: #28a745;
          color: white;
        }

        .debug-btn-secondary:hover {
          background: #218838;
        }
      `}</style>
    </div>
  );
};

export default DebugInfoControl;
