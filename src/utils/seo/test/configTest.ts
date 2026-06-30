/**
 * SEO Configuration Test Utility
 * Quick validation and testing functions for development
 */

import { seoConfigManager } from '../SEOConfigManager';
import { SEOConfigValidator } from '../configValidation';

/**
 * Test the SEO configuration loading and validation
 */
export async function testSEOConfig(): Promise<{
  success: boolean;
  results: {
    loading: boolean;
    validation: boolean;
    pageConfig: boolean;
    keywords: boolean;
    structuredData: boolean;
  };
  errors: string[];
  warnings: string[];
}> {
  const results = {
    loading: false,
    validation: false,
    pageConfig: false,
    keywords: false,
    structuredData: false,
  };

  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    console.log('🔧 Testing SEO Configuration System...');

    // Test 1: Configuration Loading
    console.log('📥 Testing configuration loading...');
    const loadResult = await seoConfigManager.loadConfig({ force: true });

    if (loadResult.success && loadResult.config) {
      results.loading = true;
      console.log('✅ Configuration loaded successfully');
      warnings.push(...loadResult.warnings);
    } else {
      console.log('❌ Configuration loading failed');
      errors.push(...loadResult.errors);
      return { success: false, results, errors, warnings };
    }

    // Test 2: Validation
    console.log('🔍 Testing configuration validation...');
    const validationResult = await SEOConfigValidator.validateFullConfig(loadResult.config);

    if (validationResult.valid) {
      results.validation = true;
      console.log('✅ Configuration validation passed');
    } else {
      console.log('⚠️  Configuration validation has issues');
      errors.push(...validationResult.errors.map(e => e.message));
    }
    warnings.push(...validationResult.warnings.map(w => w.message));

    // Test 3: Page Configuration Access
    console.log('📄 Testing page configuration access...');
    try {
      const homeConfig = seoConfigManager.getPageConfig('home', 'zh-CN');
      const homeConfigEn = seoConfigManager.getPageConfig('home', 'en');

      if (
        homeConfig.title &&
        homeConfig.description &&
        homeConfigEn.title &&
        homeConfigEn.description
      ) {
        results.pageConfig = true;
        console.log('✅ Page configuration access works');
        console.log(`   - Home title (zh-CN): ${homeConfig.title.substring(0, 50)}...`);
        console.log(`   - Home title (en): ${homeConfigEn.title.substring(0, 50)}...`);
      } else {
        console.log('❌ Page configuration incomplete');
        errors.push('Page configuration access failed');
      }
    } catch (error) {
      console.log('❌ Page configuration access failed');
      errors.push(`Page config error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Keywords Access
    console.log('🎯 Testing keywords access...');
    try {
      const keywordsZh = seoConfigManager.getKeywords('home', 'zh-CN', true);
      const keywordsEn = seoConfigManager.getKeywords('home', 'en', true);

      if (keywordsZh.length > 0 && keywordsEn.length > 0) {
        results.keywords = true;
        console.log('✅ Keywords access works');
        console.log(`   - Keywords (zh-CN): ${keywordsZh.slice(0, 3).join(', ')}...`);
        console.log(`   - Keywords (en): ${keywordsEn.slice(0, 3).join(', ')}...`);
      } else {
        console.log('❌ Keywords access incomplete');
        errors.push('Keywords access failed');
      }
    } catch (error) {
      console.log('❌ Keywords access failed');
      errors.push(`Keywords error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: Structured Data
    console.log('🏗️ Testing structured data access...');
    try {
      const structuredDataZh = seoConfigManager.getStructuredData('home', 'zh-CN');
      const structuredDataEn = seoConfigManager.getStructuredData('home', 'en');

      if (structuredDataZh?.['@type'] && structuredDataEn?.['@type']) {
        results.structuredData = true;
        console.log('✅ Structured data access works');
        console.log(`   - Type: ${structuredDataZh['@type']}`);
        console.log(`   - Name (zh-CN): ${structuredDataZh.name}`);
        console.log(`   - Name (en): ${structuredDataEn.name}`);
      } else {
        console.log('❌ Structured data access incomplete');
        errors.push('Structured data access failed');
      }
    } catch (error) {
      console.log('❌ Structured data access failed');
      errors.push(
        `Structured data error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Overall success check
    const allTestsPassed = Object.values(results).every(result => result === true);

    if (allTestsPassed) {
      console.log('🎉 All SEO configuration tests passed!');
    } else {
      console.log('⚠️  Some SEO configuration tests failed');
    }

    // Display statistics
    const stats = seoConfigManager.getStats();
    console.log('📊 Configuration Statistics:');
    console.log(`   - Loaded: ${stats.loaded}`);
    console.log(`   - Cache size: ${stats.cacheSize}`);
    console.log(`   - Last load time: ${stats.lastLoadTime}ms`);
    console.log(`   - Cache valid: ${stats.cacheValid}`);

    return {
      success: allTestsPassed && errors.length === 0,
      results,
      errors,
      warnings,
    };
  } catch (error) {
    console.log('💥 Test suite failed with error:', error);
    errors.push(`Test suite error: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return {
      success: false,
      results,
      errors,
      warnings,
    };
  }
}

/**
 * Quick development test function
 */
export async function quickTest(): Promise<void> {
  const result = await testSEOConfig();

  if (result.success) {
    console.log('✅ SEO Configuration system is working correctly');
  } else {
    console.log('❌ SEO Configuration system has issues:');
    result.errors.forEach(error => console.log(`   - ${error}`));

    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
  }
}

/**
 * Test heading hierarchy validation
 */
export function testHeadingValidation(): void {
  console.log('📝 Testing heading hierarchy validation...');

  const testStructures = [
    {
      name: 'Valid structure',
      structure: {
        h1: { 'zh-CN': '主标题', en: 'Main Title' },
        h2: { 'zh-CN': ['子标题1', '子标题2'], en: ['Subtitle 1', 'Subtitle 2'] },
        h3: { 'zh-CN': ['详细内容1', '详细内容2'], en: ['Detail 1', 'Detail 2'] },
      },
    },
    {
      name: 'Invalid structure (no H1)',
      structure: {
        h2: { 'zh-CN': ['直接的H2'], en: ['Direct H2'] },
      },
    },
    {
      name: 'Invalid structure (multiple H1)',
      structure: {
        h1: { 'zh-CN': ['标题1', '标题2'], en: ['Title 1', 'Title 2'] },
      },
    },
  ];

  testStructures.forEach(({ name, structure }) => {
    console.log(`\n🧪 Testing: ${name}`);
    const validation = SEOConfigValidator.validateHeadingHierarchy(structure);

    console.log(`   Valid: ${validation.isValid}`);
    if (validation.errors.length > 0) {
      console.log(`   Errors: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`   Warnings: ${validation.warnings.join(', ')}`);
    }
  });
}

// Export for development console use
if (typeof window !== 'undefined') {
  (window as any).testSEOConfig = testSEOConfig;
  (window as any).quickTest = quickTest;
  (window as any).testHeadingValidation = testHeadingValidation;
}

export default { testSEOConfig, quickTest, testHeadingValidation };
