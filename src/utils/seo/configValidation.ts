/**
 * SEO Configuration Validation Utilities
 * Provides comprehensive validation functions for SEO configuration data
 */

import type {
  SEOConfig,
  ValidationError,
  SchemaValidationResult,
  // PageType,
  Language,
  // JSONSchema,
  HeadingHierarchyValidation,
  HeadingLevel,
} from '../../types/seo.types';

/**
 * Validate SEO configuration against schema and business rules
 */
export class SEOConfigValidator {
  /**
   * Comprehensive configuration validation
   */
  static async validateFullConfig(config: unknown): Promise<SchemaValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!config || typeof config !== 'object') {
      return {
        valid: false,
        errors: [{
          field: 'root',
          message: 'Configuration must be a valid object',
          severity: 'error'
        }],
        warnings: []
      };
    }

    const seoConfig = config as SEOConfig;

    // Validate structure
    this.validateStructure(seoConfig, errors);
    
    // Validate content quality
    this.validateContentQuality(seoConfig, errors, warnings);
    
    // Validate SEO best practices
    this.validateSEOBestPractices(seoConfig, warnings);
    
    // Validate internationalization
    this.validateInternationalization(seoConfig, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate basic configuration structure
   */
  private static validateStructure(config: SEOConfig, errors: ValidationError[]): void {
    const requiredFields: (keyof SEOConfig)[] = ['version', 'site', 'keywords', 'pages', 'structuredData'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          severity: 'error'
        });
      }
    }

    // Validate site configuration
    if (config.site) {
      if (!config.site.name?.['zh-CN'] || !config.site.name?.['en']) {
        errors.push({
          field: 'site.name',
          message: 'Site name must include both zh-CN and en translations',
          severity: 'error'
        });
      }
      
      if (!this.isValidUrl(config.site.url)) {
        errors.push({
          field: 'site.url',
          message: 'Site URL must be a valid URL',
          severity: 'error'
        });
      }
    }

    // Validate pages structure
    if (config.pages) {
      if (!config.pages.home) {
        errors.push({
          field: 'pages.home',
          message: 'Home page configuration is required',
          severity: 'error'
        });
      }
    }
  }

  /**
   * Validate content quality for SEO optimization
   */
  private static validateContentQuality(
    config: SEOConfig, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    Object.entries(config.pages).forEach(([pageKey, pageConfig]) => {
      // Title validation
      Object.entries(pageConfig.title).forEach(([lang, title]) => {
        if (title.length < 10) {
          errors.push({
            field: `pages.${pageKey}.title.${lang}`,
            message: `Title too short: minimum 10 characters (current: ${title.length})`,
            value: title,
            severity: 'error'
          });
        }
        
        if (title.length > 60) {
          warnings.push({
            field: `pages.${pageKey}.title.${lang}`,
            message: `Title may be too long for search results: recommended max 60 characters (current: ${title.length})`,
            value: title,
            severity: 'warning'
          });
        }

        // Check for keyword presence in title
        const pageKeywords = config.keywords.primary[lang as Language] || [];
        const hasKeywords = pageKeywords.some(keyword => 
          title.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (!hasKeywords && pageKeywords.length > 0) {
          warnings.push({
            field: `pages.${pageKey}.title.${lang}`,
            message: 'Title should include at least one primary keyword',
            value: title,
            severity: 'warning'
          });
        }
      });

      // Description validation
      Object.entries(pageConfig.description).forEach(([lang, description]) => {
        if (description.length < 50) {
          errors.push({
            field: `pages.${pageKey}.description.${lang}`,
            message: `Description too short: minimum 50 characters (current: ${description.length})`,
            value: description,
            severity: 'error'
          });
        }
        
        if (description.length > 160) {
          warnings.push({
            field: `pages.${pageKey}.description.${lang}`,
            message: `Description may be too long for search snippets: recommended max 160 characters (current: ${description.length})`,
            value: description,
            severity: 'warning'
          });
        }
      });

      // Priority validation
      if (pageConfig.priority < 0 || pageConfig.priority > 1) {
        errors.push({
          field: `pages.${pageKey}.priority`,
          message: 'Page priority must be between 0 and 1',
          value: pageConfig.priority,
          severity: 'error'
        });
      }
    });
  }

  /**
   * Validate SEO best practices
   */
  private static validateSEOBestPractices(config: SEOConfig, warnings: ValidationError[]): void {
    // Check for duplicate keywords
    const allKeywords = new Set<string>();
    const duplicates = new Set<string>();
    
    Object.values(config.keywords.primary).flat().forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase().trim();
      if (allKeywords.has(normalizedKeyword)) {
        duplicates.add(keyword);
      }
      allKeywords.add(normalizedKeyword);
    });
    
    if (duplicates.size > 0) {
      warnings.push({
        field: 'keywords.primary',
        message: `Duplicate keywords found: ${Array.from(duplicates).join(', ')}`,
        value: Array.from(duplicates),
        severity: 'warning'
      });
    }

    // Validate heading structure
    Object.entries(config.pages).forEach(([pageKey, pageConfig]) => {
      if (pageConfig.headingStructure) {
        const validation = this.validateHeadingHierarchy(pageConfig.headingStructure);
        
        if (!validation.isValid) {
          validation.errors.forEach(error => {
            warnings.push({
              field: `pages.${pageKey}.headingStructure`,
              message: error,
              severity: 'warning'
            });
          });
        }
        
        validation.warnings.forEach(warning => {
          warnings.push({
            field: `pages.${pageKey}.headingStructure`,
            message: warning,
            severity: 'warning'
          });
        });
      }
    });

    // Check for missing Open Graph images
    Object.entries(config.pages).forEach(([pageKey, pageConfig]) => {
      if (!config.defaultImages?.ogImage && !pageConfig.customMeta?.ogImage) {
        warnings.push({
          field: `pages.${pageKey}`,
          message: 'Missing Open Graph image for better social media sharing',
          severity: 'warning'
        });
      }
    });
  }

  /**
   * Validate internationalization support
   */
  private static validateInternationalization(
    config: SEOConfig,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const supportedLanguages = config.site.supportedLanguages;
    
    // Check if default language is supported
    if (!supportedLanguages.includes(config.site.defaultLanguage)) {
      errors.push({
        field: 'site.defaultLanguage',
        message: 'Default language must be included in supported languages',
        value: config.site.defaultLanguage,
        severity: 'error'
      });
    }

    // Validate that all pages have translations for all supported languages
    Object.entries(config.pages).forEach(([pageKey, pageConfig]) => {
      supportedLanguages.forEach(lang => {
        if (!pageConfig.title[lang]) {
          warnings.push({
            field: `pages.${pageKey}.title`,
            message: `Missing ${lang} translation for page title`,
            severity: 'warning'
          });
        }
        
        if (!pageConfig.description[lang]) {
          warnings.push({
            field: `pages.${pageKey}.description`,
            message: `Missing ${lang} translation for page description`,
            severity: 'warning'
          });
        }
      });
    });

    // Validate keyword translations
    supportedLanguages.forEach(lang => {
      if (!config.keywords.primary[lang] || config.keywords.primary[lang].length === 0) {
        warnings.push({
          field: `keywords.primary.${lang}`,
          message: `Missing primary keywords for ${lang} language`,
          severity: 'warning'
        });
      }
    });
  }

  /**
   * Validate heading hierarchy structure
   */
  static validateHeadingHierarchy(structure: any): HeadingHierarchyValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const headings: { level: HeadingLevel; text: string; position: number }[] = [];

    // Check H1 uniqueness
    if (structure.h1) {
      if (Array.isArray(structure.h1)) {
        errors.push('Page should have only one H1 heading');
      } else if (typeof structure.h1 === 'object') {
        Object.entries(structure.h1).forEach(([_lang, text]) => {
          headings.push({ level: 'h1', text: text as string, position: 1 });
        });
      }
    } else {
      errors.push('Page must have an H1 heading');
    }

    // Validate hierarchy levels
    const levels = ['h2', 'h3', 'h4', 'h5', 'h6'] as const;
    let position = 2;
    
    levels.forEach(level => {
      if (structure[level]) {
        if (Array.isArray(structure[level])) {
          structure[level].forEach((text: string, index: number) => {
            headings.push({ level, text, position: position + index });
          });
          position += structure[level].length;
        }
      }
    });

    // Check for proper nesting
    let currentLevel = 1;
    headings.forEach(heading => {
      const headingLevel = parseInt(heading.level.substring(1));
      if (headingLevel > currentLevel + 1) {
        warnings.push(`Heading ${heading.level} appears without proper nesting (skipped from H${currentLevel})`);
      }
      currentLevel = Math.max(currentLevel, headingLevel);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      structure: headings
    };
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate keyword density for content
   */
  static validateKeywordDensity(
    content: string, 
    keywords: string[], 
    optimalRange: { min: number; max: number } = { min: 0.5, max: 3.0 }
  ): { keyword: string; density: number; isOptimal: boolean }[] {
    const wordCount = content.split(/\s+/).length;
    
    return keywords.map(keyword => {
      const keywordMatches = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      const density = (keywordMatches / wordCount) * 100;
      
      return {
        keyword,
        density: Math.round(density * 100) / 100,
        isOptimal: density >= optimalRange.min && density <= optimalRange.max
      };
    });
  }

  /**
   * Validate content readability (simplified implementation)
   */
  static validateReadability(content: string): {
    score: number;
    level: string;
    issues: string[];
  } {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    
    const issues: string[] = [];
    let score = 100;
    
    // Penalize long sentences
    if (avgWordsPerSentence > 20) {
      issues.push('Sentences are too long (average > 20 words)');
      score -= 20;
    }
    
    // Penalize very short content
    if (words.length < 50) {
      issues.push('Content is too short (< 50 words)');
      score -= 30;
    }
    
    // Check for complex words (simplified)
    const complexWords = words.filter(word => word.length > 12).length;
    const complexWordRatio = complexWords / words.length;
    
    if (complexWordRatio > 0.1) {
      issues.push('Too many complex words (> 10%)');
      score -= 10;
    }
    
    score = Math.max(0, score);
    
    let level = 'Advanced';
    if (score >= 80) level = 'Easy';
    else if (score >= 60) level = 'Moderate';
    else if (score >= 40) level = 'Difficult';
    
    return { score, level, issues };
  }
}

export default SEOConfigValidator;