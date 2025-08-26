/**
 * 多语言测试覆盖工具
 * 用于检测所有i18n键值的完整性和覆盖率
 */

import { useI18nContext } from '../hooks/useI18nContext';

// 定义所有应该存在的翻译键值
export const REQUIRED_I18N_KEYS = {
  // 头部信息
  header: [
    'header.title',
    'header.subtitle'
  ],

  // 上传相关
  upload: [
    'upload.title',
    'upload.dragText',
    'upload.selectFile',
    'upload.processing',
    'upload.progress',
    'upload.error',
    'upload.fileTypeError',
    'upload.fileSizeError',
    'upload.pageTitle',
    'upload.pageDescription'
  ],

  // 预览相关
  preview: [
    'preview.title',
    'preview.selectAll',
    'preview.deselectAll',
    'preview.selected',
    'preview.noSlices'
  ],

  // 导出相关
  export: [
    'export.title',
    'export.pdf',
    'export.zip',
    'export.exporting',
    'export.success',
    'export.noSelection',
    'export.goSplit',
    'export.error',
    'export.validation.noImage.title',
    'export.validation.noImage.message',
    'export.validation.noImage.goUpload',
    'export.validation.noSelection.title',
    'export.validation.noSelection.message',
    'export.validation.noSelection.tip',
    'export.validation.noSelection.goSplit',
    'export.validation.goHome',
    'export.pageTitle',
    'export.pageDescription'
  ],

  // 分割相关
  split: [
    'split.title',
    'split.noImage',
    'split.goUpload',
    'split.validation.title',
    'split.validation.message',
    'split.validation.goUpload',
    'split.validation.goHome',
    'split.pageTitle',
    'split.pageDescription'
  ],

  // 语言切换
  lang: [
    'lang.current',
    'lang.switcher.zh-CN',
    'lang.switcher.en'
  ],

  // 导航相关
  navigation: [
    'navigation.home',
    'navigation.upload',
    'navigation.split',
    'navigation.export',
    'navigation.breadcrumb.separator',
    'navigation.progress.completed',
    'navigation.tooltip.processing',
    'navigation.tooltip.needUpload',
    'navigation.tooltip.needSplit',
    'navigation.tooltip.needSelect',
    'navigation.accessibility.button',
    'navigation.accessibility.buttonDisabled',
    'navigation.accessibility.badge',
    'navigation.accessibility.progress',
    'navigation.accessibility.current',
    'navigation.accessibility.disabled',
    'navigation.accessibility.mainNav',
    'navigation.accessibility.navButtons',
    'navigation.accessibility.shortcuts',
    'navigation.error.title',
    'navigation.error.dismiss',
    'navigation.error.processingFailed',
    'navigation.error.stateCorruption',
    'navigation.error.missingImage',
    'navigation.error.missingSlices',
    'navigation.error.invalidState',
    'navigation.error.navigationFailed',
    'navigation.shortcuts.next',
    'navigation.shortcuts.previous',
    'navigation.shortcuts.nextTooltip',
    'navigation.shortcuts.previousTooltip',
    'navigation.debug.currentStep',
    'navigation.debug.progress',
    'navigation.performance.renderTime',
    'navigation.performance.interactionTime',
    'navigation.network.retrying',
    'navigation.network.failed',
    'navigation.network.offline',
    'navigation.network.reconnected',
    'navigation.validation.invalidPath',
    'navigation.validation.accessDenied',
    'navigation.validation.prerequisiteNotMet',
    'navigation.state.loading',
    'navigation.state.ready',
    'navigation.state.processing',
    'navigation.state.completed',
    'navigation.state.error',
    'navigation.metrics.totalSteps',
    'navigation.metrics.completedSteps',
    'navigation.metrics.remainingSteps',
    'navigation.metrics.progressPercentage'
  ],

  // 应用相关
  app: [
    'app.loading',
    'app.i18nLoading'
  ],

  // 调试相关
  debug: [
    'debug.control.title',
    'debug.control.show',
    'debug.control.hide',
    'debug.control.expand',
    'debug.control.collapse',
    'debug.level.label',
    'debug.level.none',
    'debug.level.none.description',
    'debug.level.minimal',
    'debug.level.minimal.description',
    'debug.level.standard',
    'debug.level.standard.description',
    'debug.level.detailed',
    'debug.level.detailed.description',
    'debug.level.custom',
    'debug.quickToggle.title',
    'debug.quickToggle.sliceTitle',
    'debug.quickToggle.dimensions',
    'debug.quickToggle.fileSize',
    'debug.button.hideAll',
    'debug.button.showAll',
    'debug.info.title',
    'debug.info.manualCheck',
    'debug.info.forceRefresh',
    'debug.info.realTimeStatus',
    'debug.info.sliceCount',
    'debug.info.processing',
    'debug.info.progress',
    'debug.info.selectedCount',
    'debug.info.shouldShowPreview',
    'debug.info.directStateCheck',
    'debug.info.stateObject',
    'debug.info.snapshotObject',
    'debug.info.yes',
    'debug.info.no',
    'debug.preview.title',
    'debug.preview.dataTitle'
  ],

  // 控制台消息
  console: [
    'console.imageProcessed',
    'console.processingFailed',
    'console.pdfProgress',
    'console.pdfComplete',
    'console.zipProgress',
    'console.zipComplete',
    'console.pdfFailed',
    'console.zipFailed'
  ],

  // 弹窗消息
  alert: [
    'alert.debugOutput'
  ]
};

// 获取所有键值的扁平化数组
export const getAllRequiredKeys = (): string[] => {
  return Object.values(REQUIRED_I18N_KEYS).flat();
};

// 测试翻译键值覆盖率的Hook
export const useI18nCoverageTest = () => {
  const { t, currentLanguage } = useI18nContext();

  // 测试所有键值是否存在
  const testAllKeys = (): { missing: string[], total: number, coverage: number } => {
    const allKeys = getAllRequiredKeys();
    const missing: string[] = [];

    allKeys.forEach(key => {
      try {
        const translation = t(key);
        // 如果翻译结果就是键值本身，说明翻译缺失
        if (translation === key) {
          missing.push(key);
        }
      } catch {
        missing.push(key);
      }
    });

    const coverage = ((allKeys.length - missing.length) / allKeys.length) * 100;

    return {
      missing,
      total: allKeys.length,
      coverage: Math.round(coverage * 100) / 100
    };
  };

  // 测试特定分类的键值
  const testCategoryKeys = (category: keyof typeof REQUIRED_I18N_KEYS) => {
    const categoryKeys = REQUIRED_I18N_KEYS[category];
    const missing: string[] = [];

    categoryKeys.forEach(key => {
      try {
        const translation = t(key);
        if (translation === key) {
          missing.push(key);
        }
      } catch {
        missing.push(key);
      }
    });

    return {
      category,
      missing,
      total: categoryKeys.length,
      coverage: ((categoryKeys.length - missing.length) / categoryKeys.length) * 100
    };
  };

  // 生成完整的覆盖率报告
  const generateCoverageReport = () => {
    const overallTest = testAllKeys();
    const categoryTests = Object.keys(REQUIRED_I18N_KEYS).map(category => 
      testCategoryKeys(category as keyof typeof REQUIRED_I18N_KEYS)
    );

    const report = {
      language: currentLanguage,
      timestamp: new Date().toISOString(),
      overall: overallTest,
      categories: categoryTests,
      summary: {
        totalKeys: overallTest.total,
        missingKeys: overallTest.missing.length,
        coveragePercentage: overallTest.coverage,
        status: overallTest.coverage === 100 ? 'COMPLETE' : 'INCOMPLETE'
      }
    };

    console.group(`🌐 I18n Coverage Report - ${currentLanguage.toUpperCase()}`);
    console.log(`📊 Overall Coverage: ${report.overall.coverage}%`);
    console.log(`✅ Found: ${report.overall.total - report.overall.missing.length} keys`);
    console.log(`❌ Missing: ${report.overall.missing.length} keys`);
    
    if (report.overall.missing.length > 0) {
      console.group('❌ Missing Keys:');
      report.overall.missing.forEach(key => console.log(`  - ${key}`));
      console.groupEnd();
    }

    console.group('📋 Category Breakdown:');
    categoryTests.forEach(test => {
      const status = test.coverage === 100 ? '✅' : '⚠️';
      console.log(`${status} ${test.category}: ${test.coverage}% (${test.total - test.missing.length}/${test.total})`);
      if (test.missing.length > 0) {
        test.missing.forEach(key => console.log(`    - Missing: ${key}`));
      }
    });
    console.groupEnd();
    console.groupEnd();

    return report;
  };

  return {
    testAllKeys,
    testCategoryKeys,
    generateCoverageReport,
    getAllRequiredKeys
  };
};

// 开发环境下自动运行覆盖率测试
export const runI18nCoverageTest = () => {
  if (process.env.NODE_ENV === 'development') {
    // 延迟执行，确保i18n已经初始化
    setTimeout(() => {
      try {
        // 这里需要在组件内部调用，暂时注释掉
        // const { generateCoverageReport } = useI18nCoverageTest();
        // generateCoverageReport();
        console.log('🌐 I18n Coverage Test is ready. Call generateCoverageReport() in a component to run the test.');
      } catch (error) {
        console.error('❌ I18n Coverage Test failed:', error);
      }
    }, 2000);
  }
};