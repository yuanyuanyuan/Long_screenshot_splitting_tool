/**
 * React Hook for SEO Configuration Management
 * Provides reactive access to SEO configuration with automatic loading and validation
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { seoConfigManager } from '../utils/seo/SEOConfigManager';
import type {
  SEOConfig,
  // SEOConfigValidationResult,
  Language,
  PageType,
  // ConfigManagerEvent,
  // ConfigManagerEventHandler,
} from '../types/seo.types';

export interface UseSEOConfigOptions {
  autoLoad?: boolean;
  validateOnLoad?: boolean;
  language?: Language;
  enableHotReload?: boolean;
  onError?: (error: string[]) => void;
  onWarning?: (warnings: string[]) => void;
}

export interface UseSEOConfigReturn {
  config: SEOConfig | null;
  isLoading: boolean;
  isLoaded: boolean;
  errors: string[];
  warnings: string[];
  loadConfig: () => Promise<void>;
  reloadConfig: () => Promise<void>;
  getPageConfig: (page: PageType, language?: Language) => ReturnType<typeof seoConfigManager.getPageConfig> | null;
  getKeywords: (page: PageType, language?: Language, includeContext?: boolean) => string[];
  getStructuredData: (page: PageType, language?: Language) => Record<string, unknown> | null;
  stats: {
    loaded: boolean;
    cacheSize: number;
    lastLoadTime: number;
    cacheValid: boolean;
  };
}

/**
 * Custom hook for SEO configuration management
 */
export function useSEOConfig(options: UseSEOConfigOptions = {}): UseSEOConfigReturn {
  const {
    autoLoad = true,
    validateOnLoad = true,
    language = 'zh-CN',
    enableHotReload = false,
    onError,
    onWarning,
  } = options;

  // State management
  const [config, setConfig] = useState<SEOConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Load configuration function
  const loadConfig = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrors([]);
    setWarnings([]);

    try {
      const result = await seoConfigManager.loadConfig({
        validateOnly: validateOnLoad,
        force: false,
      });

      if (result.success && result.config) {
        setConfig(result.config);
        setIsLoaded(true);
        setWarnings(result.warnings);
        
        if (onWarning && result.warnings.length > 0) {
          onWarning(result.warnings);
        }
      } else {
        setErrors(result.errors);
        setIsLoaded(false);
        
        if (onError) {
          onError(result.errors);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrors([errorMessage]);
      setIsLoaded(false);
      
      if (onError) {
        onError([errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, validateOnLoad, onError, onWarning]);

  // Reload configuration function
  const reloadConfig = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrors([]);
    setWarnings([]);

    try {
      const result = await seoConfigManager.reloadConfig();

      if (result.success && result.config) {
        setConfig(result.config);
        setIsLoaded(true);
        setWarnings(result.warnings);
        
        if (onWarning && result.warnings.length > 0) {
          onWarning(result.warnings);
        }
      } else {
        setErrors(result.errors);
        
        if (onError) {
          onError(result.errors);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrors([errorMessage]);
      
      if (onError) {
        onError([errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onError, onWarning]);

  // Page configuration getter
  const getPageConfig = useCallback((page: PageType, lang?: Language) => {
    if (!config) return null;
    
    try {
      return seoConfigManager.getPageConfig(page, lang || language);
    } catch (error) {
      console.warn('Failed to get page config:', error);
      return null;
    }
  }, [config, language]);

  // Keywords getter
  const getKeywords = useCallback((page: PageType, lang?: Language, includeContext?: boolean) => {
    if (!config) return [];
    
    try {
      return seoConfigManager.getKeywords(page, lang || language, includeContext);
    } catch (error) {
      console.warn('Failed to get keywords:', error);
      return [];
    }
  }, [config, language]);

  // Structured data getter
  const getStructuredData = useCallback((page: PageType, lang?: Language) => {
    if (!config) return null;
    
    try {
      return seoConfigManager.getStructuredData(page, lang || language);
    } catch (error) {
      console.warn('Failed to get structured data:', error);
      return null;
    }
  }, [config, language]);

  // Configuration statistics
  const stats = useMemo(() => {
    return seoConfigManager.getStats();
  }, [config, isLoaded]);

  // Event handler for configuration changes
  useEffect(() => {
    if (!enableHotReload) return;

    // let isSubscribed = true;
//     // const eventHandler: ConfigManagerEventHandler = (event: ConfigManagerEvent) => {
//       if (!isSubscribed) return;
// 
//       switch (event.type) {
//         case 'config:loaded':
//           if (event.data?.config) {
//             setConfig(event.data.config);
//             setIsLoaded(true);
//             setErrors([]);
//           }
//           break;
//           
//         case 'config:error':
//           if (event.error) {
//             setErrors([event.error.message]);
//             setIsLoaded(false);
//           }
//           break;
//           
//         case 'config:hot:reload':
//           // Trigger reload on hot reload event
//           reloadConfig();
//           break;
//           
//         default:
//           break;
//       }
//     };

    // Note: This would require implementing an event system in SEOConfigManager
    // For now, we'll use a simple polling mechanism in development
    let isSubscribed = true;
    let hotReloadInterval: NodeJS.Timeout | undefined;
    
    if (process.env.NODE_ENV === 'development') {
      hotReloadInterval = setInterval(async () => {
        try {
          const currentStats = seoConfigManager.getStats();
          if (currentStats.lastLoadTime > stats.lastLoadTime) {
            await reloadConfig();
          }
        } catch (error) {
          console.warn('Hot reload check failed:', error);
        }
      }, 5000); // Check every 5 seconds in development
    }

    return () => {
      isSubscribed = false;
      if (hotReloadInterval) {
        clearInterval(hotReloadInterval);
      }
    };
  }, [enableHotReload, reloadConfig, stats.lastLoadTime]);

  // Auto-load configuration on mount
  useEffect(() => {
    if (autoLoad && !isLoaded && !isLoading) {
      loadConfig();
    }
  }, [autoLoad, isLoaded, isLoading, loadConfig]);

  return {
    config,
    isLoading,
    isLoaded,
    errors,
    warnings,
    loadConfig,
    reloadConfig,
    getPageConfig,
    getKeywords,
    getStructuredData,
    stats,
  };
}

/**
 * HOC for components that need SEO configuration
 */
export function withSEOConfig<P extends object>(
  Component: React.ComponentType<P & { seoConfig: UseSEOConfigReturn }>
) {
  return function WrappedComponent(props: P) {
    const seoConfig = useSEOConfig();
    
    return <Component {...props} seoConfig={seoConfig} />;
  };
}

/**
 * Context provider for SEO configuration (optional advanced usage)
 */

const SEOConfigContext = createContext<UseSEOConfigReturn | null>(null);

export function SEOConfigProvider({ 
  children, 
  options = {} 
}: { 
  children: React.ReactNode; 
  options?: UseSEOConfigOptions; 
}) {
  const seoConfig = useSEOConfig(options);
  
  return (
    <SEOConfigContext.Provider value={seoConfig}>
      {children}
    </SEOConfigContext.Provider>
  );
}

export function useSEOConfigContext(): UseSEOConfigReturn {
  const context = useContext(SEOConfigContext);
  if (!context) {
    throw new Error('useSEOConfigContext must be used within SEOConfigProvider');
  }
  return context;
}

export default useSEOConfig;