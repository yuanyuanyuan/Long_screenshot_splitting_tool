import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { structuredDataGenerator } from '../../utils/seo/structuredDataGenerator';
import type {
  PageType,
  Language,
  StructuredDataType,
  SEOContext
} from '../../types/seo.types';

/**
 * Props for StructuredDataProvider component
 */
interface StructuredDataProviderProps {
  page: PageType;
  language: Language;
  types?: StructuredDataType[];
  context?: SEOContext;
  enableValidation?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Enhanced Structured Data Provider Component
 * Generates and injects structured data for better SEO
 */
export const StructuredDataProvider: React.FC<StructuredDataProviderProps> = ({
  page = 'home',
  language = 'zh-CN',
  types = ['WebApplication', 'BreadcrumbList'],
  context = {},
  enableValidation = true,
  onLoad,
  onError
}) => {
  const [structuredData, setStructuredData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  // Generate structured data based on types
  useEffect(() => {
    const generateData = async () => {
      setIsLoading(true);
      setErrors([]);
      
      try {
        const dataItems: Record<string, any>[] = [];
        const validationErrors: string[] = [];
        
        for (const type of types) {
          try {
            let data: any;
            
            switch (type) {
              case 'WebApplication':
                data = structuredDataGenerator.generateWebApplication(page, language, context);
                break;
                
              case 'SoftwareApplication':
                data = structuredDataGenerator.generateSoftwareApplication(language, context);
                break;
                
              case 'BreadcrumbList':
                data = structuredDataGenerator.generateBreadcrumb(page, language);
                break;
                
              case 'FAQPage':
                data = structuredDataGenerator.generateFAQ(language);
                break;
                
              case 'HowTo':
                data = structuredDataGenerator.generateHowTo(language);
                break;
                
              default:
                console.warn(`[StructuredDataProvider] Unknown type: ${type}`);
                continue;
            }
            
            // Validate if enabled
            if (enableValidation) {
              const validation = structuredDataGenerator.validateStructuredData(data);
              if (!validation.isValid) {
                validationErrors.push(...validation.errors);
                if (validation.warnings) {
                  console.warn('[StructuredDataProvider] Validation warnings:', validation.warnings);
                }
              }
            }
            
            dataItems.push(data);
          } catch (error) {
            console.error(`[StructuredDataProvider] Failed to generate ${type}:`, error);
            validationErrors.push(`Failed to generate ${type}: ${(error as Error).message}`);
          }
        }
        
        setStructuredData(dataItems);
        
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          if (onError) {
            onError(new Error(`Structured data validation failed: ${validationErrors.join(', ')}`));
          }
        } else {
          onLoad?.();
        }
      } catch (error) {
        console.error('[StructuredDataProvider] Generation failed:', error);
        setErrors([(error as Error).message]);
        onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateData();
  }, [page, language, types, context, enableValidation, onLoad, onError]);

  // Generate combined structured data for page
  const combinedStructuredData = useMemo(() => {
    if (structuredData.length === 0) return null;
    
    // If single item, return as-is
    if (structuredData.length === 1) {
      return structuredData[0];
    }
    
    // Multiple items - combine into Graph
    return {
      '@context': 'https://schema.org',
      '@graph': structuredData
    };
  }, [structuredData]);

  // Render script tags
  if (isLoading || !combinedStructuredData) {
    return null;
  }

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(combinedStructuredData, null, 2)}
        </script>
      </Helmet>
      
      {/* Debug information in development */}
      {process.env.NODE_ENV === 'development' && errors.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 60,
          right: 10,
          background: '#ff5722',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          maxWidth: '300px',
          maxHeight: '150px',
          overflow: 'auto',
          zIndex: 9998
        }}>
          <strong>Structured Data Errors:</strong>
          {errors.map((error, index) => (
            <div key={index} style={{ marginTop: '5px' }}>
              • {error}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/**
 * Enhanced component with additional features
 */
export const EnhancedStructuredDataProvider: React.FC<StructuredDataProviderProps & {
  enableAutoUpdate?: boolean;
  updateInterval?: number;
}> = ({
  enableAutoUpdate = false,
  updateInterval = 60000, // 1 minute default
  ...props
}) => {
  const [updateCount, setUpdateCount] = useState(0);
  
  // Auto-update structured data periodically
  useEffect(() => {
    if (!enableAutoUpdate) return;
    
    const interval = setInterval(() => {
      setUpdateCount(prev => prev + 1);
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [enableAutoUpdate, updateInterval]);
  
  // Update context with refresh indicator
  const enhancedContext = useMemo(() => ({
    ...props.context,
    lastUpdated: new Date().toISOString(),
    updateCount
  }), [props.context, updateCount]);
  
  return (
    <StructuredDataProvider
      {...props}
      context={enhancedContext}
    />
  );
};

// For backward compatibility with lazy loading in SEOManager
export const StructuredDataGenerator: React.FC<{
  page: PageType;
  language: Language;
  types: StructuredDataType[];
  onLoad: () => void;
}> = ({ page, language, types, onLoad }) => {
  return (
    <StructuredDataProvider
      page={page}
      language={language}
      types={types}
      onLoad={onLoad}
    />
  );
};

export default StructuredDataProvider;