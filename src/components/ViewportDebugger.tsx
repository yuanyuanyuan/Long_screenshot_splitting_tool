import React, { useState } from 'react';
import { useViewport, useMobileDetection } from '../hooks/useViewport';

/**
 * Development-only viewport debugger component
 * Shows current viewport information and responsive state
 * Only renders in development environment
 */
export const ViewportDebugger: React.FC<{
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  collapsed?: boolean;
}> = ({ 
  position = 'bottom-right',
  collapsed: initialCollapsed = true 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const viewport = useViewport();
  const mobileDetection = useMobileDetection();
  
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
  
  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs font-mono max-w-xs`}
      style={{ fontSize: '10px' }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full text-left mb-2 pb-2 border-b border-gray-600 hover:text-blue-300"
      >
        📱 Viewport {isCollapsed ? '→' : '↓'}
      </button>
      
      {!isCollapsed && (
        <div className="space-y-2">
          {/* Basic viewport info */}
          <div className="space-y-1">
            <div className="text-blue-300 font-semibold">Viewport</div>
            <div>Size: {viewport.width} × {viewport.height}</div>
            <div>Breakpoint: <span className="text-yellow-300">{viewport.currentBreakpoint}</span></div>
            <div>Orientation: {viewport.isLandscape ? 'Landscape' : 'Portrait'}</div>
            <div>DPR: {viewport.devicePixelRatio}x</div>
          </div>
          
          {/* Device type detection */}
          <div className="space-y-1">
            <div className="text-green-300 font-semibold">Device Type</div>
            <div>Mobile: <span className={viewport.isMobile ? 'text-green-400' : 'text-red-400'}>
              {viewport.isMobile ? 'Yes' : 'No'}
            </span></div>
            <div>Tablet: <span className={viewport.isTablet ? 'text-green-400' : 'text-red-400'}>
              {viewport.isTablet ? 'Yes' : 'No'}
            </span></div>
            <div>Desktop: <span className={viewport.isDesktop ? 'text-green-400' : 'text-red-400'}>
              {viewport.isDesktop ? 'Yes' : 'No'}
            </span></div>
          </div>
          
          {/* Touch detection */}
          <div className="space-y-1">
            <div className="text-purple-300 font-semibold">Input</div>
            <div>Touch: <span className={viewport.isTouch ? 'text-green-400' : 'text-red-400'}>
              {viewport.isTouch ? 'Yes' : 'No'}
            </span></div>
            <div>Small Mobile: <span className={mobileDetection.isSmallMobile ? 'text-green-400' : 'text-red-400'}>
              {mobileDetection.isSmallMobile ? 'Yes' : 'No'}
            </span></div>
            <div>Retina: <span className={mobileDetection.isRetinaDisplay ? 'text-green-400' : 'text-red-400'}>
              {mobileDetection.isRetinaDisplay ? 'Yes' : 'No'}
            </span></div>
          </div>
          
          {/* Quick test buttons */}
          <div className="space-y-1">
            <div className="text-orange-300 font-semibold">Test</div>
            <div className="flex space-x-2">
              <button
                onClick={() => window.resizeTo(320, 568)}
                className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                title="iPhone SE size"
              >
                320px
              </button>
              <button
                onClick={() => window.resizeTo(768, 1024)}
                className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                title="iPad size"
              >
                768px
              </button>
              <button
                onClick={() => window.resizeTo(1200, 800)}
                className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                title="Desktop size"
              >
                1200px
              </button>
            </div>
          </div>
          
          {/* CSS classes being applied */}
          <div className="space-y-1">
            <div className="text-cyan-300 font-semibold">Active Classes</div>
            <div className="text-xs text-gray-300">
              {[
                viewport.isMobile && 'mobile',
                viewport.isTablet && 'tablet', 
                viewport.isDesktop && 'desktop',
                viewport.isTouch && 'touch',
                viewport.isLandscape && 'landscape',
                viewport.isPortrait && 'portrait',
                `bp-${viewport.currentBreakpoint}`,
              ].filter(Boolean).join(' ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Simple responsive grid overlay for visual debugging
 * Shows grid lines to help align responsive layouts
 */
export const ResponsiveGridOverlay: React.FC<{
  show?: boolean;
  color?: string;
}> = ({ 
  show = false,
  color = 'rgba(255, 0, 0, 0.1)'
}) => {
  const viewport = useViewport();
  
  if (!show || process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const cols = viewport.isMobile ? 1 : viewport.isTablet ? 2 : 3;
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-40"
      style={{
        background: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent calc(100% / ${cols} - 1px),
          ${color} calc(100% / ${cols} - 1px),
          ${color} calc(100% / ${cols})
        )`,
      }}
    />
  );
};