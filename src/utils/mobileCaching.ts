/**
 * 移动端缓存策略工具
 * 针对移动端优化的智能缓存管理
 * 支持图片、数据和资源的分层缓存
 */

// 缓存类型定义
export enum CacheType {
  IMAGE = 'image',
  DATA = 'data',
  RESOURCE = 'resource',
  CONFIG = 'config'
}

// 缓存策略
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate'
}

// 缓存配置接口
export interface CacheConfig {
  type: CacheType;
  strategy: CacheStrategy;
  maxAge: number; // 毫秒
  maxSize: number; // 字节
  compression: boolean;
  priority: number; // 1-10, 10最高
}

// 缓存条目接口
export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expires: number;
  size: number;
  type: CacheType;
  compressed: boolean;
  accessCount: number;
  lastAccessed: number;
}

// 存储适配器接口
interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// IndexedDB适配器
class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'mobile-cache-db';
  private storeName = 'cache-store';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, value });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async removeItem(key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<string[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }
}

// LocalStorage适配器（fallback）
class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // 存储空间不足，清理旧缓存
      console.warn('LocalStorage full, clearing old cache');
      this.clearOldCache();
      localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }

  async keys(): Promise<string[]> {
    return Object.keys(localStorage);
  }

  private clearOldCache(): void {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('mobile-cache-'));
    
    // 清理最旧的50%缓存
    const toRemove = Math.ceil(cacheKeys.length * 0.5);
    const sortedKeys = cacheKeys.sort();
    
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(sortedKeys[i]);
    }
  }
}

/**
 * 移动端缓存管理器
 */
export class MobileCacheManager {
  private static instance: MobileCacheManager | null = null;
  private storage: StorageAdapter;
  private cache: Map<string, CacheEntry> = new Map();
  private configs: Map<CacheType, CacheConfig> = new Map();
  private totalSize: number = 0;
  private maxTotalSize: number = 50 * 1024 * 1024; // 50MB
  private isInitialized: boolean = false;

  private constructor() {
    // 优先使用IndexedDB，fallback到LocalStorage
    this.storage = 'indexedDB' in window ? new IndexedDBAdapter() : new LocalStorageAdapter();
    
    // 默认配置
    this.setDefaultConfigs();
  }

  static getInstance(): MobileCacheManager {
    if (!MobileCacheManager.instance) {
      MobileCacheManager.instance = new MobileCacheManager();
    }
    return MobileCacheManager.instance;
  }

  private setDefaultConfigs(): void {
    // 图片缓存配置
    this.configs.set(CacheType.IMAGE, {
      type: CacheType.IMAGE,
      strategy: CacheStrategy.CACHE_FIRST,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      maxSize: 20 * 1024 * 1024, // 20MB
      compression: true,
      priority: 8
    });

    // 数据缓存配置
    this.configs.set(CacheType.DATA, {
      type: CacheType.DATA,
      strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
      maxAge: 60 * 60 * 1000, // 1小时
      maxSize: 5 * 1024 * 1024, // 5MB
      compression: true,
      priority: 9
    });

    // 资源缓存配置
    this.configs.set(CacheType.RESOURCE, {
      type: CacheType.RESOURCE,
      strategy: CacheStrategy.CACHE_FIRST,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
      maxSize: 10 * 1024 * 1024, // 10MB
      compression: true,
      priority: 6
    });

    // 配置缓存
    this.configs.set(CacheType.CONFIG, {
      type: CacheType.CONFIG,
      strategy: CacheStrategy.NETWORK_FIRST,
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      maxSize: 1 * 1024 * 1024, // 1MB
      compression: false,
      priority: 10
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 初始化存储适配器
      if (this.storage instanceof IndexedDBAdapter) {
        await (this.storage as IndexedDBAdapter).init();
      }

      // 加载现有缓存到内存
      await this.loadCache();
      
      // 清理过期缓存
      await this.cleanExpiredCache();
      
      this.isInitialized = true;
      console.log('📱 移动端缓存管理器初始化完成');
    } catch (error) {
      console.error('缓存管理器初始化失败:', error);
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const keys = await this.storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith('mobile-cache-'));

      for (const key of cacheKeys) {
        const data = await this.storage.getItem(key);
        if (data) {
          try {
            const entry: CacheEntry = JSON.parse(data);
            this.cache.set(entry.key, entry);
            this.totalSize += entry.size;
          } catch (e) {
            // 损坏的缓存条目，删除
            await this.storage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('加载缓存失败:', error);
    }
  }

  private async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
    }

    console.log(`🧹 清理了 ${expiredKeys.length} 个过期缓存条目`);
  }

  async set(key: string, data: any, type: CacheType = CacheType.DATA): Promise<void> {
    if (!this.isInitialized) await this.initialize();

    const config = this.configs.get(type);
    if (!config) return;

    const now = Date.now();
    
    // 序列化数据
    let serializedData: string;
    try {
      serializedData = JSON.stringify(data);
    } catch (error) {
      console.error('数据序列化失败:', error);
      return;
    }

    // 压缩数据（如果启用）
    if (config.compression && serializedData.length > 1024) {
      serializedData = await this.compress(serializedData);
    }

    const size = new Blob([serializedData]).size;
    
    // 检查单个条目大小限制
    if (size > config.maxSize) {
      console.warn(`缓存条目过大 (${size} bytes)，跳过缓存`);
      return;
    }

    // 检查总缓存大小，必要时清理
    await this.ensureSpace(size, type);

    const entry: CacheEntry = {
      key,
      data: serializedData,
      timestamp: now,
      expires: now + config.maxAge,
      size,
      type,
      compressed: config.compression && serializedData.length > 1024,
      accessCount: 1,
      lastAccessed: now
    };

    // 更新内存缓存
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.totalSize -= existingEntry.size;
    }
    
    this.cache.set(key, entry);
    this.totalSize += size;

    // 保存到存储
    try {
      await this.storage.setItem(`mobile-cache-${key}`, JSON.stringify(entry));
    } catch (error) {
      // 存储失败，从内存缓存中移除
      this.cache.delete(key);
      this.totalSize -= size;
      console.error('缓存存储失败:', error);
    }
  }

  async get(key: string, type: CacheType = CacheType.DATA): Promise<any> {
    if (!this.isInitialized) await this.initialize();

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    
    // 检查是否过期
    if (entry.expires < now) {
      await this.delete(key);
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = now;

    // 解压缩数据（如果需要）
    let data = entry.data;
    if (entry.compressed) {
      data = await this.decompress(data);
    }

    // 反序列化数据
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('数据反序列化失败:', error);
      await this.delete(key);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
      await this.storage.removeItem(`mobile-cache-${key}`);
    }
  }

  async clear(type?: CacheType): Promise<void> {
    if (type) {
      // 清理特定类型的缓存
      const keysToDelete: string[] = [];
      for (const [key, entry] of this.cache.entries()) {
        if (entry.type === type) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        await this.delete(key);
      }
    } else {
      // 清理所有缓存
      this.cache.clear();
      this.totalSize = 0;
      await this.storage.clear();
    }
  }

  private async ensureSpace(requiredSize: number, type: CacheType): Promise<void> {
    const config = this.configs.get(type);
    if (!config) return;

    // 检查是否需要清理空间
    if (this.totalSize + requiredSize <= this.maxTotalSize) {
      return;
    }

    // 获取可清理的条目（按优先级和最后访问时间排序）
    const entries = Array.from(this.cache.entries())
      .map(([cacheKey, entry]) => ({ key: cacheKey, ...entry }))
      .filter(entry => entry.type !== type || this.configs.get(entry.type)!.priority < config.priority)
      .sort((a, b) => {
        // 优先清理低优先级和长时间未访问的条目
        const priorityDiff = this.configs.get(a.type)!.priority - this.configs.get(b.type)!.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return a.lastAccessed - b.lastAccessed;
      });

    // 清理条目直到有足够空间
    let freedSpace = 0;
    for (const entry of entries) {
      if (freedSpace >= requiredSize) break;
      
      await this.delete(entry.key);
      freedSpace += entry.size;
    }

    console.log(`🧹 清理了 ${freedSpace} bytes 空间用于新缓存`);
  }

  private async compress(data: string): Promise<string> {
    // 简单的LZ压缩算法实现
    try {
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(data));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let result = await reader.read();
        
        while (!result.done) {
          chunks.push(result.value);
          result = await reader.read();
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
      }
    } catch (e) {
      console.warn('压缩失败，使用原始数据:', e);
    }
    
    return data;
  }

  private async decompress(data: string): Promise<string> {
    try {
      if ('DecompressionStream' in window && data !== data) {
        const compressed = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let result = await reader.read();
        
        while (!result.done) {
          chunks.push(result.value);
          result = await reader.read();
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new TextDecoder().decode(decompressed);
      }
    } catch (e) {
      console.warn('解压缩失败，使用原始数据:', e);
    }
    
    return data;
  }

  // 缓存统计信息
  getStats(): {
    totalSize: number;
    totalEntries: number;
    hitRate: number;
    typeBreakdown: { [key: string]: { count: number; size: number } };
  } {
    const typeBreakdown: { [key: string]: { count: number; size: number } } = {};
    let totalAccess = 0;
    let totalHits = 0;

    for (const entry of this.cache.values()) {
      const typeKey = entry.type.toString();
      if (!typeBreakdown[typeKey]) {
        typeBreakdown[typeKey] = { count: 0, size: 0 };
      }
      
      typeBreakdown[typeKey].count++;
      typeBreakdown[typeKey].size += entry.size;
      totalAccess += entry.accessCount;
      if (entry.accessCount > 1) totalHits += entry.accessCount - 1;
    }

    return {
      totalSize: this.totalSize,
      totalEntries: this.cache.size,
      hitRate: totalAccess > 0 ? (totalHits / totalAccess) * 100 : 0,
      typeBreakdown
    };
  }

  // 预热缓存
  async preheat(urls: string[], type: CacheType = CacheType.IMAGE): Promise<void> {
    console.log(`🔥 开始预热 ${urls.length} 个资源`);
    
    const promises = urls.map(async (url, index) => {
      try {
        // 延迟加载避免网络拥堵
        await new Promise(resolve => setTimeout(resolve, index * 100));
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.blob();
          await this.set(url, data, type);
        }
      } catch (error) {
        console.warn(`预热失败: ${url}`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('🔥 缓存预热完成');
  }
}

// 便捷函数
export const mobileCache = MobileCacheManager.getInstance();

// React Hook
export function useMobileCache() {
  const cache = MobileCacheManager.getInstance();
  
  React.useEffect(() => {
    cache.initialize();
  }, []);

  return {
    get: cache.get.bind(cache),
    set: cache.set.bind(cache),
    delete: cache.delete.bind(cache),
    clear: cache.clear.bind(cache),
    getStats: cache.getStats.bind(cache),
    preheat: cache.preheat.bind(cache),
  };
}

// 缓存装饰器
export function withMobileCache(type: CacheType = CacheType.DATA, maxAge?: number) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = async function (...args: any[]) {
      const cache = MobileCacheManager.getInstance();
      const cacheKey = `${propertyName}-${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await cache.get(cacheKey, type);
      if (cached !== null) {
        return cached;
      }
      
      // 执行原方法
      const result = await method.apply(this as any, args);
      
      // 缓存结果
      if (result !== undefined && result !== null) {
        await cache.set(cacheKey, result, type);
      }
      
      return result;
    } as any;
  };
}

// 导入React类型（如果需要）
declare global {
  namespace React {
    // Hook类型声明
  }
}