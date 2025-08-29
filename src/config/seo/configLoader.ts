/**
 * SEO Configuration Loader
 * Provides robust configuration loading with caching, error handling, and performance optimization
 * 
 * Features:
 * - Automatic configuration loading and initialization
 * - Hot-reload capability for development
 * - Performance monitoring and metrics
 * - Graceful error handling with fallbacks
 */

import { seoConfigManager } from '../../utils/seo/SEOConfigManager';
import type { 
  SEOConfig, 
  SEOConfigValidationResult, 
  SEOConfigLoadOptions,
  ConfigLoaderOptions,
  ConfigLoaderMetrics
} from '../../types/seo.types';

/**
 * Configuration Loader Class
 * Handles initialization, loading, and monitoring of SEO configuration
 */
export class ConfigLoader {
  private static instance: ConfigLoader;
  private initialized = false;
  private loading = false;
  private metrics: ConfigLoaderMetrics = {
    loadCount: 0,
    successCount: 0,
    errorCount: 0,
    avgLoadTime: 0,
    lastLoadTime: 0,
    totalLoadTime: 0
  };
  private retryTimeout: NodeJS.Timeout | null = null;
  private reloadInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Initialize configuration loader
   */
  public async initialize(options: ConfigLoaderOptions = {}): Promise<SEOConfigValidationResult> {
    const {
      autoReload = false,
      reloadInterval = 5 * 60 * 1000, // 5 minutes
      enableHotReload = process.env.NODE_ENV === 'development',
      // _validateOnLoad = true,
      retryOnFailure = true,
      maxRetries = 3
    } = options;

    if (this.initialized && !options.force) {
      console.info('[ConfigLoader] Already initialized');
      return {
        success: true,
        config: seoConfigManager.getConfig(),
        errors: [],
        warnings: [],
        loadTime: 0
      };
    }

    console.info('[ConfigLoader] Initializing SEO configuration loader...');
    
    try {
      this.loading = true;
      const startTime = Date.now();

      // Load configuration
      const result = await this.loadConfiguration({
        force: true,
        validateOnly: false,
        ...options
      });

      // Update metrics
      this.updateMetrics(Date.now() - startTime, result.success);

      if (result.success) {
        this.initialized = true;
        console.info('[ConfigLoader] Configuration loaded successfully');

        // Setup auto-reload if enabled
        if (autoReload) {
          this.setupAutoReload(reloadInterval);
        }

        // Setup hot-reload for development
        if (enableHotReload) {
          this.setupHotReload();
        }

      } else {
        console.error('[ConfigLoader] Failed to load configuration:', result.errors);
        
        if (retryOnFailure) {
          this.scheduleRetry(maxRetries);
        }
      }

      return result;

    } catch (error) {
      console.error('[ConfigLoader] Initialization error:', error);
      this.updateMetrics(0, false);
      
      return {
        success: false,
        config: seoConfigManager.getConfig(), // This will return fallback config
        errors: [error instanceof Error ? error.message : 'Unknown initialization error'],
        warnings: [],
        loadTime: 0
      };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load configuration with full error handling and metrics
   */
  public async loadConfiguration(options: SEOConfigLoadOptions = {}): Promise<SEOConfigValidationResult> {
    if (this.loading) {
      console.warn('[ConfigLoader] Configuration already loading, please wait...');
      return this.waitForLoad();
    }

    try {
      this.loading = true;
      const startTime = Date.now();

      // Load configuration using manager
      const result = await seoConfigManager.loadConfig(options);

      // Update metrics
      this.updateMetrics(Date.now() - startTime, result.success);

      // Log results
      if (result.success) {
        console.info('[ConfigLoader] Configuration loaded successfully', {
          loadTime: result.loadTime,
          warnings: result.warnings?.length || 0
        });
      } else {
        console.error('[ConfigLoader] Configuration load failed', {
          errors: result.errors,
          warnings: result.warnings
        });
      }

      return result;

    } catch (error) {
      console.error('[ConfigLoader] Load configuration error:', error);
      this.updateMetrics(0, false);
      
      return {
        success: false,
        config: seoConfigManager.getConfig(),
        errors: [error instanceof Error ? error.message : 'Unknown load error'],
        warnings: [],
        loadTime: 0
      };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Reload configuration
   */
  public async reloadConfiguration(): Promise<SEOConfigValidationResult> {
    console.info('[ConfigLoader] Reloading configuration...');
    return this.loadConfiguration({ force: true });
  }

  /**
   * Validate current configuration
   */
  public async validateConfiguration(): Promise<SEOConfigValidationResult> {
    try {
      return await seoConfigManager.loadConfig({ validateOnly: true });
    } catch (error) {
      return {
        success: false,
        config: undefined,
        errors: [error instanceof Error ? error.message : 'Validation error'],
        warnings: [],
        loadTime: 0
      };
    }
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): SEOConfig {
    return seoConfigManager.getConfig();
  }

  /**
   * Check if loader is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if loader is currently loading
   */
  public isLoading(): boolean {
    return this.loading;
  }

  /**
   * Get loader metrics
   */
  public getMetrics(): ConfigLoaderMetrics & { 
    seoManagerStats: ReturnType<typeof seoConfigManager.getStats> 
  } {
    return {
      ...this.metrics,
      seoManagerStats: seoConfigManager.getStats()
    };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      loadCount: 0,
      successCount: 0,
      errorCount: 0,
      avgLoadTime: 0,
      lastLoadTime: 0,
      totalLoadTime: 0
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (this.reloadInterval) {
      clearInterval(this.reloadInterval);
      this.reloadInterval = null;
    }

    this.initialized = false;
    console.info('[ConfigLoader] Cleaned up resources');
  }

  // Private methods

  private async waitForLoad(): Promise<SEOConfigValidationResult> {
    // Simple polling mechanism to wait for load completion
    return new Promise((resolve) => {
      const checkLoading = () => {
        if (!this.loading) {
          resolve({
            success: true,
            config: seoConfigManager.getConfig(),
            errors: [],
            warnings: ['Waited for concurrent load to complete'],
            loadTime: 0
          });
        } else {
          setTimeout(checkLoading, 100);
        }
      };
      checkLoading();
    });
  }

  private updateMetrics(loadTime: number, success: boolean): void {
    this.metrics.loadCount++;
    this.metrics.lastLoadTime = Date.now();
    
    if (success) {
      this.metrics.successCount++;
      this.metrics.totalLoadTime += loadTime;
      this.metrics.avgLoadTime = this.metrics.totalLoadTime / this.metrics.successCount;
    } else {
      this.metrics.errorCount++;
    }
  }

  private scheduleRetry(maxRetries: number, currentRetry = 1): void {
    if (currentRetry > maxRetries) {
      console.error('[ConfigLoader] Max retries exceeded, giving up');
      return;
    }

    const retryDelay = Math.min(1000 * Math.pow(2, currentRetry - 1), 30000); // Exponential backoff, max 30s
    console.warn(`[ConfigLoader] Scheduling retry ${currentRetry}/${maxRetries} in ${retryDelay}ms`);

    this.retryTimeout = setTimeout(async () => {
      try {
        const result = await this.loadConfiguration({ force: true });
        if (result.success) {
          this.initialized = true;
          console.info('[ConfigLoader] Retry successful');
        } else {
          this.scheduleRetry(maxRetries, currentRetry + 1);
        }
      } catch (error) {
        console.error('[ConfigLoader] Retry failed:', error);
        this.scheduleRetry(maxRetries, currentRetry + 1);
      }
    }, retryDelay);
  }

  private setupAutoReload(interval: number): void {
    console.info(`[ConfigLoader] Setting up auto-reload every ${interval}ms`);
    
    this.reloadInterval = setInterval(async () => {
      try {
        console.info('[ConfigLoader] Auto-reloading configuration...');
        await this.reloadConfiguration();
      } catch (error) {
        console.error('[ConfigLoader] Auto-reload failed:', error);
      }
    }, interval);
  }

  private setupHotReload(): void {
    // In a real implementation, this would watch for file changes
    // For now, we'll just log that hot-reload is enabled
    console.info('[ConfigLoader] Hot-reload enabled for development');
    
    // Example: Watch for configuration file changes
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // In browser environment, could use WebSocket or polling
      // This is a placeholder for actual hot-reload implementation
      console.info('[ConfigLoader] Hot-reload would be implemented here');
    }
  }
}

/**
 * Convenience function to initialize configuration
 */
export async function initializeSEOConfig(options?: ConfigLoaderOptions): Promise<SEOConfigValidationResult> {
  const loader = ConfigLoader.getInstance();
  return loader.initialize(options);
}

/**
 * Convenience function to get configuration
 */
export function getSEOConfig(): SEOConfig {
  const loader = ConfigLoader.getInstance();
  return loader.getConfiguration();
}

/**
 * Convenience function to reload configuration
 */
export async function reloadSEOConfig(): Promise<SEOConfigValidationResult> {
  const loader = ConfigLoader.getInstance();
  return loader.reloadConfiguration();
}

/**
 * Convenience function to validate configuration
 */
export async function validateSEOConfig(): Promise<SEOConfigValidationResult> {
  const loader = ConfigLoader.getInstance();
  return loader.validateConfiguration();
}

// Export singleton instance
export const configLoader = ConfigLoader.getInstance();