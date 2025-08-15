import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  generatePageStructuredData, 
  validateStructuredData 
} from '../utils/seo/structuredDataGenerator';
import type { 
  StructuredDataType, 
  PageType, 
  Language, 
  SEOContext 
} from '../types/seo.types';

/**
 * 结构化数据上下文接口
 */
interface StructuredDataContextType {
  structuredData: StructuredDataType[];
  updateContext: (context: Partial<SEOContext>) => void;
  validateData: () => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  regenerateData: () => void;
}

/**
 * 结构化数据提供者组件属性
 */
interface StructuredDataProviderProps {
  children: React.ReactNode;
  page: PageType;
  language?: Language;
  initialContext?: SEOContext;
  enableValidation?: boolean;
  onValidationError?: (errors: string[]) => void;
  onValidationWarning?: (warnings: string[]) => void;
}

// 创建上下文
const StructuredDataContext = createContext<StructuredDataContextType | null>(null);

/**
 * 结构化数据提供者组件
 * 负责生成、管理和注入页面的结构化数据
 */
export const StructuredDataProvider: React.FC<StructuredDataProviderProps> = ({
  children,
  page,
  language = 'zh-CN',
  initialContext = {},
  enableValidation = true,
  onValidationError,
  onValidationWarning,
}) => {
  const [context, setContext] = React.useState<SEOContext>(initialContext);
  
  // 生成结构化数据
  const structuredData = useMemo(() => {
    try {
      return generatePageStructuredData(page, language, context);
    } catch (error) {
      console.error('生成结构化数据失败:', error);
      return [];
    }
  }, [page, language, context]);

  // 更新上下文
  const updateContext = React.useCallback((newContext: Partial<SEOContext>) => {
    setContext(prev => ({ ...prev, ...newContext }));
  }, []);

  // 验证数据
  const validateData = React.useCallback(() => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let isValid = true;

    structuredData.forEach((data, index) => {
      const validation = validateStructuredData(data);
      if (!validation.isValid) {
        isValid = false;
        allErrors.push(...validation.errors.map(error => `数据${index + 1}: ${error}`));
      }
      allWarnings.push(...validation.warnings.map(warning => `数据${index + 1}: ${warning}`));
    });

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
    };
  }, [structuredData]);

  // 重新生成数据
  const regenerateData = React.useCallback(() => {
    setContext(prev => ({ ...prev }));
  }, []);

  // 验证效果
  useEffect(() => {
    if (enableValidation && structuredData.length > 0) {
      const validation = validateData();
      
      if (!validation.isValid && onValidationError) {
        onValidationError(validation.errors);
      }
      
      if (validation.warnings.length > 0 && onValidationWarning) {
        onValidationWarning(validation.warnings);
      }
    }
  }, [structuredData, enableValidation, validateData, onValidationError, onValidationWarning]);

  // 上下文值
  const contextValue = useMemo(() => ({
    structuredData,
    updateContext,
    validateData,
    regenerateData,
  }), [structuredData, updateContext, validateData, regenerateData]);

  return (
    <StructuredDataContext.Provider value={contextValue}>
      {/* 注入结构化数据到页面头部 */}
      <Helmet>
        {structuredData.map((data, index) => (
          <script
            key={`structured-data-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(data, null, 2)
            }}
          />
        ))}
      </Helmet>
      {children}
    </StructuredDataContext.Provider>
  );
};

/**
 * 使用结构化数据的Hook
 */
export const useStructuredData = (): StructuredDataContextType => {
  const context = useContext(StructuredDataContext);
  if (!context) {
    throw new Error('useStructuredData必须在StructuredDataProvider内部使用');
  }
  return context;
};

/**
 * 结构化数据显示组件（用于调试）
 */
interface StructuredDataDebugProps {
  showValidation?: boolean;
  showRawData?: boolean;
  className?: string;
}

export const StructuredDataDebug: React.FC<StructuredDataDebugProps> = ({
  showValidation = true,
  showRawData = false,
  className = '',
}) => {
  const { structuredData, validateData } = useStructuredData();
  const [validation, setValidation] = React.useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  // 执行验证
  const handleValidate = React.useCallback(() => {
    const result = validateData();
    setValidation(result);
  }, [validateData]);

  // 自动验证
  useEffect(() => {
    if (showValidation) {
      handleValidate();
    }
  }, [showValidation, handleValidate]);

  if (process.env.NODE_ENV === 'production') {
    return null; // 生产环境不显示调试信息
  }

  return (
    <div className={`structured-data-debug ${className}`}>
      <div className="debug-header">
        <h3>结构化数据调试信息</h3>
        <button onClick={handleValidate}>重新验证</button>
      </div>

      {/* 验证结果 */}
      {showValidation && validation && (
        <div className="validation-results">
          <h4>验证结果</h4>
          <div className={`status ${validation.isValid ? 'valid' : 'invalid'}`}>
            状态: {validation.isValid ? '✅ 有效' : '❌ 无效'}
          </div>
          
          {validation.errors.length > 0 && (
            <div className="errors">
              <h5>错误:</h5>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index} className="error">{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validation.warnings.length > 0 && (
            <div className="warnings">
              <h5>警告:</h5>
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="warning">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 数据概览 */}
      <div className="data-overview">
        <h4>数据概览</h4>
        <p>共生成 {structuredData.length} 个结构化数据对象</p>
        <ul>
          {structuredData.map((data, index) => (
            <li key={index}>
              {index + 1}. {data['@type']} - {(data as any).name || '未命名'}
            </li>
          ))}
        </ul>
      </div>

      {/* 原始数据 */}
      {showRawData && (
        <div className="raw-data">
          <h4>原始数据</h4>
          <pre>
            <code>
              {JSON.stringify(structuredData, null, 2)}
            </code>
          </pre>
        </div>
      )}

      <style jsx>{`
        .structured-data-debug {
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 16px;
          margin: 16px 0;
          font-family: monospace;
          font-size: 12px;
        }
        
        .debug-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .debug-header h3 {
          margin: 0;
          color: #333;
        }
        
        .debug-header button {
          background: #007bff;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .debug-header button:hover {
          background: #0056b3;
        }
        
        .validation-results {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
        }
        
        .status.valid {
          color: #28a745;
          font-weight: bold;
        }
        
        .status.invalid {
          color: #dc3545;
          font-weight: bold;
        }
        
        .errors ul, .warnings ul {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        .error {
          color: #dc3545;
        }
        
        .warning {
          color: #ffc107;
        }
        
        .data-overview {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
        }
        
        .raw-data {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
        }
        
        .raw-data pre {
          max-height: 400px;
          overflow-y: auto;
          background: #f8f9fa;
          padding: 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

/**
 * 结构化数据状态指示器组件
 */
interface StructuredDataIndicatorProps {
  showCount?: boolean;
  showStatus?: boolean;
  className?: string;
}

export const StructuredDataIndicator: React.FC<StructuredDataIndicatorProps> = ({
  showCount = true,
  showStatus = true,
  className = '',
}) => {
  const { structuredData, validateData } = useStructuredData();
  const [isValid, setIsValid] = React.useState<boolean | null>(null);

  // 检查有效性
  useEffect(() => {
    if (showStatus) {
      const validation = validateData();
      setIsValid(validation.isValid);
    }
  }, [structuredData, showStatus, validateData]);

  if (process.env.NODE_ENV === 'production') {
    return null; // 生产环境不显示指示器
  }

  return (
    <div className={`structured-data-indicator ${className}`}>
      {showCount && (
        <span className="count">
          📊 {structuredData.length} 个结构化数据
        </span>
      )}
      {showStatus && isValid !== null && (
        <span className={`status ${isValid ? 'valid' : 'invalid'}`}>
          {isValid ? '✅' : '❌'}
        </span>
      )}
      
      <style>{`
        .structured-data-indicator {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .count {
          opacity: 0.9;
        }
        
        .status {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

// 默认导出
export default StructuredDataProvider;