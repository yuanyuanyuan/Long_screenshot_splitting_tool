/**
 * 调试面板组件
 * 显示详细的状态数据和诊断信息
 */

import React, { useState } from 'react';

interface DebugPanelProps {
  debugSnapshot: any;
  onLogDebugInfo: () => void;
  onRunDiagnostics: () => void;
  className?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  debugSnapshot,
  onLogDebugInfo,
  onRunDiagnostics,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'slices' | 'diagnostics'>('status');

  const renderStatusGrid = () => (
    <div className="grid grid-cols-2 gap-4 mt-3">
      <div className="status-card bg-white p-3 rounded border">
        <h4 className="font-semibold text-sm mb-2 text-blue-600">🖼️ 图片状态</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>原图:</span>
            <span className={debugSnapshot.hasOriginalImage ? 'text-green-600' : 'text-red-600'}>
              {debugSnapshot.hasOriginalImage ? '✓ 存在' : '✗ 不存在'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>切片数量:</span>
            <span className="font-mono">{debugSnapshot.slicesCount}</span>
          </div>
          <div className="flex justify-between">
            <span>有效切片:</span>
            <span className={debugSnapshot.hasSlices ? 'text-green-600' : 'text-red-600'}>
              {debugSnapshot.hasSlices ? '✓ 是' : '✗ 否'}
            </span>
          </div>
        </div>
      </div>

      <div className="status-card bg-white p-3 rounded border">
        <h4 className="font-semibold text-sm mb-2 text-purple-600">⚙️ 处理状态</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>处理中:</span>
            <span className={debugSnapshot.isProcessing ? 'text-orange-600' : 'text-green-600'}>
              {debugSnapshot.isProcessing ? '⏳ 是' : '✓ 否'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>选中数量:</span>
            <span className="font-mono">{debugSnapshot.selectedSlicesCount}</span>
          </div>
          <div className="flex justify-between">
            <span>时间戳:</span>
            <span className="font-mono text-gray-500">
              {new Date(debugSnapshot.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSlicesInfo = () => (
    <div className="slices-info mt-3">
      <h4 className="font-semibold text-sm mb-2 text-green-600">🧩 切片详情</h4>
      {debugSnapshot.urlValidation && debugSnapshot.urlValidation.length > 0 ? (
        <div className="space-y-2">
          {debugSnapshot.urlValidation.map((slice: any, index: number) => (
            <div key={index} className="slice-item bg-white p-2 rounded border text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold">切片 {index + 1}</span>
                <div className="flex gap-2">
                  <span className={slice.hasUrl ? 'text-green-600' : 'text-red-600'}>
                    {slice.hasUrl ? '✓ URL' : '✗ URL'}
                  </span>
                  <span className={slice.hasBlob ? 'text-green-600' : 'text-red-600'}>
                    {slice.hasBlob ? '✓ Blob' : '✗ Blob'}
                  </span>
                </div>
              </div>
              <div className="mt-1 text-gray-500">
                <span>大小: {(slice.blobSize / 1024).toFixed(1)}KB</span>
                {slice.urlValid && <span className="ml-2 text-green-600">URL有效</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">暂无切片数据</div>
      )}
    </div>
  );

  const renderDiagnostics = () => {
    const conditions = debugSnapshot.renderingConditions || {};
    return (
      <div className="diagnostics-info mt-3">
        <h4 className="font-semibold text-sm mb-2 text-orange-600">🩺 渲染诊断</h4>
        <div className="space-y-2">
          <div className="condition-item bg-white p-2 rounded border text-xs">
            <div className="flex justify-between">
              <span>应显示"暂无内容":</span>
              <span
                className={conditions.shouldShowNoContent ? 'text-orange-600' : 'text-green-600'}
              >
                {conditions.shouldShowNoContent ? '⚠️ 是' : '✓ 否'}
              </span>
            </div>
          </div>
          <div className="condition-item bg-white p-2 rounded border text-xs">
            <div className="flex justify-between">
              <span>应优先显示切片:</span>
              <span
                className={conditions.shouldShowSlicesFirst ? 'text-blue-600' : 'text-gray-600'}
              >
                {conditions.shouldShowSlicesFirst ? '✓ 是' : '- 否'}
              </span>
            </div>
          </div>
          <div className="condition-item bg-white p-2 rounded border text-xs">
            <div className="flex justify-between">
              <span>可显示原图:</span>
              <span className={conditions.canShowOriginal ? 'text-green-600' : 'text-gray-600'}>
                {conditions.canShowOriginal ? '✓ 是' : '- 否'}
              </span>
            </div>
          </div>
          <div className="condition-item bg-white p-2 rounded border text-xs">
            <div className="flex justify-between">
              <span>可显示切片:</span>
              <span className={conditions.canShowSlices ? 'text-green-600' : 'text-red-600'}>
                {conditions.canShowSlices ? '✓ 是' : '✗ 否'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`debug-panel bg-gray-50 rounded-lg border ${className}`}>
      {/* 头部控制栏 */}
      <div className="debug-header flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">🔍 调试面板</h3>
          <span className="text-xs text-gray-500">({debugSnapshot.slicesCount} 切片)</span>
        </div>
        <div className="debug-actions flex gap-2">
          <button
            onClick={onLogDebugInfo}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
          >
            详细日志
          </button>
          <button
            onClick={onRunDiagnostics}
            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
          >
            一键诊断
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>
      </div>

      {/* 快速状态指示器 */}
      <div className="quick-status p-3 bg-white border-b">
        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-4">
            <span
              className={`status-indicator ${debugSnapshot.hasSlices ? 'text-green-600' : 'text-red-600'}`}
            >
              切片: {debugSnapshot.hasSlices ? '✓' : '✗'}
            </span>
            <span
              className={`status-indicator ${debugSnapshot.hasOriginalImage ? 'text-green-600' : 'text-gray-500'}`}
            >
              原图: {debugSnapshot.hasOriginalImage ? '✓' : '-'}
            </span>
            <span
              className={`status-indicator ${debugSnapshot.isProcessing ? 'text-orange-600' : 'text-green-600'}`}
            >
              处理: {debugSnapshot.isProcessing ? '⏳' : '✓'}
            </span>
          </div>
          <div className="text-gray-500">
            最后更新: {new Date(debugSnapshot.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* 详细信息面板 */}
      {isExpanded && (
        <div className="debug-content p-4">
          {/* 标签页导航 */}
          <div className="tab-nav flex gap-1 mb-4">
            {[
              { key: 'status', label: '状态概览', icon: '📊' },
              { key: 'slices', label: '切片详情', icon: '🧩' },
              { key: 'diagnostics', label: '渲染诊断', icon: '🩺' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* 标签页内容 */}
          <div className="tab-content">
            {activeTab === 'status' && renderStatusGrid()}
            {activeTab === 'slices' && renderSlicesInfo()}
            {activeTab === 'diagnostics' && renderDiagnostics()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
