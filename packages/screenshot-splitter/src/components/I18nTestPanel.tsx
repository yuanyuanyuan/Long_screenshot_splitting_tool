/**
 * I18n测试面板组件
 * 用于在开发环境下测试多语言覆盖率
 */

import React, { useState, useEffect } from 'react';
import { useI18nCoverageTest } from '../utils/i18nTestCoverage';
import { useI18nContext } from '../hooks/useI18nContext';

interface I18nTestPanelProps {
  show?: boolean;
}

const I18nTestPanel: React.FC<I18nTestPanelProps> = ({ show = false }) => {
  const { currentLanguage, switchLanguage } = useI18nContext();
  const { generateCoverageReport, testAllKeys } = useI18nCoverageTest();
  const [testResults, setTestResults] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(show);

  // 运行测试
  const runTest = () => {
    const results = generateCoverageReport();
    setTestResults(results);
  };

  // 自动运行测试
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 延迟运行，确保i18n已经完全初始化
      const timer = setTimeout(() => {
        runTest();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLanguage]);

  // 切换语言并重新测试
  const handleLanguageSwitch = (lang: string) => {
    switchLanguage(lang);
    setTimeout(() => runTest(), 500);
  };

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '16px',
      fontSize: '12px',
      zIndex: 9999,
      overflow: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>🌐 I18n Coverage Test</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '16px', 
            cursor: 'pointer',
            padding: '0 4px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong>Current Language: {currentLanguage}</strong>
        <div style={{ marginTop: '4px' }}>
          <button 
            onClick={() => handleLanguageSwitch('zh-CN')}
            style={{ 
              marginRight: '8px', 
              padding: '4px 8px', 
              fontSize: '11px',
              backgroundColor: currentLanguage === 'zh-CN' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            中文
          </button>
          <button 
            onClick={() => handleLanguageSwitch('en')}
            style={{ 
              padding: '4px 8px', 
              fontSize: '11px',
              backgroundColor: currentLanguage === 'en' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            English
          </button>
        </div>
      </div>

      <button 
        onClick={runTest}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '12px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        🔄 Run Coverage Test
      </button>

      {testResults && (
        <div>
          <div style={{ 
            padding: '8px', 
            backgroundColor: testResults.summary.status === 'COMPLETE' ? '#d4edda' : '#f8d7da',
            borderRadius: '4px',
            marginBottom: '12px'
          }}>
            <strong>
              {testResults.summary.status === 'COMPLETE' ? '✅' : '⚠️'} 
              Coverage: {testResults.summary.coveragePercentage}%
            </strong>
            <div>
              Found: {testResults.summary.totalKeys - testResults.summary.missingKeys}/{testResults.summary.totalKeys} keys
            </div>
          </div>

          {testResults.overall.missing.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#dc3545' }}>❌ Missing Keys ({testResults.overall.missing.length}):</strong>
              <div style={{ 
                maxHeight: '200px', 
                overflow: 'auto', 
                backgroundColor: '#fff', 
                padding: '8px', 
                borderRadius: '4px',
                marginTop: '4px',
                border: '1px solid #dee2e6'
              }}>
                {testResults.overall.missing.map((key: string, index: number) => (
                  <div key={index} style={{ 
                    padding: '2px 0', 
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#dc3545'
                  }}>
                    {key}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <strong>📋 Category Breakdown:</strong>
            <div style={{ marginTop: '4px' }}>
              {testResults.categories.map((category: any, index: number) => (
                <div key={index} style={{ 
                  padding: '4px 0', 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>
                    {category.coverage === 100 ? '✅' : '⚠️'} {category.category}
                  </span>
                  <span>
                    {category.coverage}% ({category.total - category.missing.length}/{category.total})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 全局显示/隐藏测试面板的函数
declare global {
  interface Window {
    showI18nTest: () => void;
    hideI18nTest: () => void;
  }
}

// 开发环境下添加全局控制函数
if (process.env.NODE_ENV === 'development') {
  window.showI18nTest = () => {
    const event = new CustomEvent('toggleI18nTest', { detail: { show: true } });
    window.dispatchEvent(event);
  };
  
  window.hideI18nTest = () => {
    const event = new CustomEvent('toggleI18nTest', { detail: { show: false } });
    window.dispatchEvent(event);
  };
}

export default I18nTestPanel;