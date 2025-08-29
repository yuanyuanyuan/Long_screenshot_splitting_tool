/**
 * 关键词密度管理器
 * 基于Google SEO最佳实践管理关键词密度和分布
 */

import { seoConfigManager } from './SEOConfigManager';
import type { Language, PageType } from '../../types/seo.types';

interface KeywordDensityConfig {
  targetDensity: {
    primary: number;
    secondary: number;
    longTail: number;
  };
  contentStructure: {
    titleKeywordPosition: 'beginning' | 'middle' | 'end' | 'natural';
    keywordVariations: boolean;
    semanticKeywords: boolean;
    keywordProximity: number;
  };
  densityRules: {
    minDensity: number;
    maxDensity: number;
    optimalRange: [number, number];
    avoidOverOptimization: boolean;
  };
}

interface KeywordAnalysis {
  keyword: string;
  density: number;
  frequency: number;
  positions: number[];
  isOptimal: boolean;
  suggestions: string[];
}

interface ContentOptimization {
  originalText: string;
  optimizedText: string;
  keywordAnalysis: KeywordAnalysis[];
  overallDensity: number;
  recommendations: string[];
  seoScore: number;
}

class KeywordDensityManager {
  private config: KeywordDensityConfig | null = null;
  private keywords: Record<Language, {
    primary: string[];
    secondary: string[];
    longTail: string[];
  }> = {
    'zh-CN': { primary: [], secondary: [], longTail: [] },
    'en': { primary: [], secondary: [], longTail: [] }
  };

  /**
   * 初始化管理器
   */
  async initialize(): Promise<boolean> {
    try {
      const result = await seoConfigManager.loadConfig();
      if (result.success && result.config) {
        this.config = result.config.keywordOptimization || this.getDefaultConfig();
        // Convert config keywords to the expected format
        if (result.config.keywords) {
          this.keywords = {
            'zh-CN': {
              primary: result.config.keywords.primary?.['zh-CN'] || [],
              secondary: result.config.keywords.secondary?.['zh-CN'] || [],
              longTail: result.config.keywords.longTail?.['zh-CN'] || []
            },
            'en': {
              primary: result.config.keywords.primary?.['en'] || [],
              secondary: result.config.keywords.secondary?.['en'] || [],
              longTail: result.config.keywords.longTail?.['en'] || []
            }
          };
        } else {
          this.keywords = this.getDefaultKeywords();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize keyword density manager:', error);
      return false;
    }
  }

  /**
   * 分析文本的关键词密度
   */
  analyzeKeywordDensity(text: string, language: Language = 'zh-CN'): KeywordAnalysis[] {
    const analysis: KeywordAnalysis[] = [];
    const words = this.tokenizeText(text, language);
    const totalWords = words.length;

    if (totalWords === 0) return analysis;

    // 分析主要关键词
    this.keywords[language].primary.forEach(keyword => {
      const keywordAnalysis = this.analyzeKeyword(text, keyword, totalWords, 'primary');
      analysis.push(keywordAnalysis);
    });

    // 分析次要关键词
    this.keywords[language].secondary.forEach(keyword => {
      const keywordAnalysis = this.analyzeKeyword(text, keyword, totalWords, 'secondary');
      analysis.push(keywordAnalysis);
    });

    // 分析长尾关键词
    this.keywords[language].longTail.forEach(keyword => {
      const keywordAnalysis = this.analyzeKeyword(text, keyword, totalWords, 'longTail');
      analysis.push(keywordAnalysis);
    });

    return analysis;
  }

  /**
   * 分析单个关键词
   */
  private analyzeKeyword(
    text: string, 
    keyword: string, 
    totalWords: number, 
    type: 'primary' | 'secondary' | 'longTail'
  ): KeywordAnalysis {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex) || [];
    const frequency = matches.length;
    const density = totalWords > 0 ? (frequency / totalWords) * 100 : 0;

    // 找到关键词位置
    const positions: number[] = [];
    let match;
    const searchRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    while ((match = searchRegex.exec(text)) !== null) {
      positions.push(match.index);
    }

    // 评估是否在最佳范围内
    const targetDensity = this.config?.targetDensity?.[type] || this.getDefaultTargetDensity(type);
    const optimalRange = this.config?.densityRules?.optimalRange || [1.5, 3.0];
    const isOptimal = density >= optimalRange[0] && density <= optimalRange[1];

    // 生成优化建议
    const suggestions = this.generateSuggestions(density, targetDensity, frequency, type, keyword);

    return {
      keyword,
      density,
      frequency,
      positions,
      isOptimal,
      suggestions
    };
  }

  /**
   * 优化内容的关键词密度
   */
  optimizeContent(
    originalText: string,
    page: PageType,
    language: Language = 'zh-CN',
    context: Record<string, any> = {}
  ): ContentOptimization {
    const analysis = this.analyzeKeywordDensity(originalText, language);
    let optimizedText = originalText;
    const recommendations: string[] = [];

    // 针对密度不足的关键词进行优化
    analysis.forEach(keywordAnalysis => {
      if (!keywordAnalysis.isOptimal && keywordAnalysis.density < 1.5) {
        optimizedText = this.insertKeywordNaturally(
          optimizedText,
          keywordAnalysis.keyword,
          language,
          context
        );
        recommendations.push(
          `增加关键词 "${keywordAnalysis.keyword}" 的使用频率 (当前密度: ${keywordAnalysis.density.toFixed(2)}%)`
        );
      } else if (keywordAnalysis.density > 5.0) {
        // 关键词过度优化的处理
        optimizedText = this.reduceKeywordOveruse(
          optimizedText,
          keywordAnalysis.keyword,
          language
        );
        recommendations.push(
          `减少关键词 "${keywordAnalysis.keyword}" 的使用频率，避免过度优化 (当前密度: ${keywordAnalysis.density.toFixed(2)}%)`
        );
      }
    });

    // 重新分析优化后的文本
    const optimizedAnalysis = this.analyzeKeywordDensity(optimizedText, language);
    const overallDensity = this.calculateOverallDensity(optimizedAnalysis);
    const seoScore = this.calculateSEOScore(optimizedAnalysis, page, language);

    // 添加结构化建议
    recommendations.push(...this.generateStructuralRecommendations(optimizedAnalysis, page, language));

    return {
      originalText,
      optimizedText,
      keywordAnalysis: optimizedAnalysis,
      overallDensity,
      recommendations,
      seoScore
    };
  }

  /**
   * 自然地插入关键词
   */
  private insertKeywordNaturally(
    text: string,
    keyword: string,
    language: Language,
    context: Record<string, any>
  ): string {
    // 找到合适的插入点
    const sentences = text.split(/[。！？.!?]/);
    if (sentences.length < 2) return text;

    // 选择中间的句子进行关键词插入
    const targetSentenceIndex = Math.floor(sentences.length / 2);
    const targetSentence = sentences[targetSentenceIndex];

    // 生成包含关键词的自然语句
    const keywordPhrase = this.generateKeywordPhrase(keyword, language, context);
    
    // 将关键词短语自然地集成到句子中
    let enhancedSentence = targetSentence;
    
    if (language === 'zh-CN') {
      // 中文的自然集成
      enhancedSentence = targetSentence.replace(
        /^([^，。]*)(，|。|$)/,
        `$1，${keywordPhrase}$2`
      );
    } else {
      // 英文的自然集成
      enhancedSentence = targetSentence.replace(
        /^([^,.]*)(,|\.|\s|$)/,
        `$1, ${keywordPhrase}$2`
      );
    }

    sentences[targetSentenceIndex] = enhancedSentence;
    return sentences.join(language === 'zh-CN' ? '。' : '.');
  }

  /**
   * 生成包含关键词的自然短语
   */
  private generateKeywordPhrase(keyword: string, language: Language, _context: Record<string, any>): string {
    const phraseTemplates = {
      'zh-CN': [
        `提供专业的${keyword}服务`,
        `${keyword}功能强大且易用`,
        `支持${keyword}的完整解决方案`,
        `作为优秀的${keyword}`,
        `实现高效的${keyword}处理`
      ],
      'en': [
        `providing professional ${keyword} services`,
        `${keyword} functionality that is powerful and easy to use`,
        `complete ${keyword} solution support`,
        `as an excellent ${keyword}`,
        `achieving efficient ${keyword} processing`
      ]
    };

    const templates = phraseTemplates[language] || phraseTemplates['en'];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    return randomTemplate;
  }

  /**
   * 减少关键词过度使用
   */
  private reduceKeywordOveruse(text: string, keyword: string, language: Language): string {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex) || [];
    
    if (matches.length <= 2) return text; // 如果关键词数量合理，不需要减少

    // 替换部分关键词为同义词或代词
    const synonyms = this.getSynonyms(keyword, language);
    let replacementCount = 0;
    const targetReplacements = Math.floor(matches.length / 3); // 替换约1/3的关键词

    return text.replace(regex, (match, _offset) => {
      if (replacementCount < targetReplacements && Math.random() > 0.5) {
        replacementCount++;
        return synonyms[Math.floor(Math.random() * synonyms.length)] || match;
      }
      return match;
    });
  }

  /**
   * 获取同义词
   */
  private getSynonyms(keyword: string, language: Language): string[] {
    const synonymMap = {
      'zh-CN': {
        '长截图分割': ['长图切割', '截图处理', '图片分割'],
        '截图切割': ['图片切割', '长图分割', '截图处理'],
        '图片分割工具': ['图像分割器', '截图分割器', '图片切割工具'],
        '在线截图工具': ['在线图片处理', '网页截图工具', '在线分割工具'],
        '免费图片处理': ['免费图像处理', '免费在线工具', '免费分割服务']
      },
      'en': {
        'long screenshot splitter': ['long image cutter', 'screenshot divider', 'image splitting tool'],
        'screenshot cutter': ['image cutter', 'screenshot splitter', 'image divider'],
        'image splitting tool': ['image splitting software', 'screenshot splitting tool', 'image divider tool'],
        'online screenshot tool': ['online image processor', 'web screenshot tool', 'online splitting tool'],
        'free image processing': ['free image editing', 'free online tool', 'free splitting service']
      }
    };

    const languageMap = synonymMap[language];
    if (languageMap && typeof languageMap === 'object') {
      return (languageMap as Record<string, string[]>)[keyword.toLowerCase()] || ['it', 'this tool', 'the service'];
    }
    return ['it', 'this tool', 'the service'];
  }

  /**
   * 计算整体关键词密度
   */
  private calculateOverallDensity(analysis: KeywordAnalysis[]): number {
    const totalDensity = analysis.reduce((sum, item) => sum + item.density, 0);
    return totalDensity / analysis.length || 0;
  }

  /**
   * 计算SEO评分
   */
  private calculateSEOScore(analysis: KeywordAnalysis[], _page: PageType, _language: Language): number {
    let score = 0;
    let maxScore = 0;

    analysis.forEach(item => {
      maxScore += 100;
      
      if (item.isOptimal) {
        score += 100;
      } else if (item.density >= 1.0 && item.density <= 5.0) {
        score += 70;
      } else if (item.density > 0) {
        score += 40;
      }

      // 关键词分布评分
      if (item.positions.length > 1) {
        const distribution = this.analyzeKeywordDistribution(item.positions, 1000); // 假设文本长度1000字符
        score += distribution * 30;
        maxScore += 30;
      }
    });

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  /**
   * 分析关键词分布
   */
  private analyzeKeywordDistribution(positions: number[], textLength: number): number {
    if (positions.length < 2) return 0;

    const segments = 3; // 将文本分为3个部分
    const segmentSize = textLength / segments;
    const segmentCounts = new Array(segments).fill(0);

    positions.forEach(pos => {
      const segmentIndex = Math.floor(pos / segmentSize);
      if (segmentIndex < segments) {
        segmentCounts[segmentIndex]++;
      }
    });

    // 计算分布均匀性
    const nonEmptySegments = segmentCounts.filter(count => count > 0).length;
    return nonEmptySegments / segments;
  }

  /**
   * 生成结构化建议
   */
  private generateStructuralRecommendations(
    analysis: KeywordAnalysis[],
    page: PageType,
    language: Language
  ): string[] {
    const recommendations: string[] = [];

    // 检查主要关键词是否在标题中
    const primaryKeywords = analysis.filter(item => 
      this.keywords[language].primary.includes(item.keyword)
    );

    if (primaryKeywords.length > 0 && primaryKeywords[0].density < 2.0) {
      recommendations.push(
        language === 'zh-CN' 
          ? `建议在H1标题中使用主要关键词 "${primaryKeywords[0].keyword}"`
          : `Consider using primary keyword "${primaryKeywords[0].keyword}" in H1 title`
      );
    }

    // 检查关键词在文章开头的使用
    const firstParagraphKeywords = analysis.filter(item => 
      item.positions.some(pos => pos < 200) // 前200字符
    );

    if (firstParagraphKeywords.length < 2) {
      recommendations.push(
        language === 'zh-CN'
          ? '建议在文章开头段落中使用更多关键词'
          : 'Consider using more keywords in the opening paragraph'
      );
    }

    // 检查长尾关键词的使用
    const longTailUsage = analysis.filter(item => 
      this.keywords[language].longTail.includes(item.keyword) && item.density > 0
    );

    if (longTailUsage.length < this.keywords[language].longTail.length / 2) {
      recommendations.push(
        language === 'zh-CN'
          ? '增加长尾关键词的使用以提高搜索覆盖率'
          : 'Increase usage of long-tail keywords to improve search coverage'
      );
    }

    return recommendations;
  }

  /**
   * 文本分词
   */
  private tokenizeText(text: string, language: Language): string[] {
    if (language === 'zh-CN') {
      // 中文分词（简单版本，生产环境建议使用专业分词库）
      return text.match(/[\u4e00-\u9fff]+|[a-zA-Z]+|\d+/g) || [];
    } else {
      // 英文分词
      return text.toLowerCase().match(/[a-zA-Z]+/g) || [];
    }
  }

  /**
   * 生成优化建议
   */
  private generateSuggestions(
    density: number,
    targetDensity: number,
    frequency: number,
    type: 'primary' | 'secondary' | 'longTail',
    keyword: string
  ): string[] {
    const suggestions: string[] = [];

    if (density < targetDensity * 0.5) {
      suggestions.push(`关键词密度过低，建议增加 "${keyword}" 的使用频率`);
    } else if (density > targetDensity * 2) {
      suggestions.push(`关键词密度过高，避免过度优化 "${keyword}"`);
    }

    if (frequency === 0) {
      suggestions.push(`建议在内容中添加关键词 "${keyword}"`);
    } else if (frequency === 1 && type === 'primary') {
      suggestions.push(`主要关键词 "${keyword}" 建议至少使用2-3次`);
    }

    return suggestions;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): KeywordDensityConfig {
    return {
      targetDensity: {
        primary: 2.5,
        secondary: 1.8,
        longTail: 1.2
      },
      contentStructure: {
        titleKeywordPosition: 'beginning',
        keywordVariations: true,
        semanticKeywords: true,
        keywordProximity: 50
      },
      densityRules: {
        minDensity: 0.5,
        maxDensity: 5.0,
        optimalRange: [1.5, 3.0],
        avoidOverOptimization: true
      }
    };
  }

  /**
   * 获取默认关键词
   */
  private getDefaultKeywords(): Record<Language, { primary: string[]; secondary: string[]; longTail: string[] }> {
    return {
      'zh-CN': {
        primary: ['长截图分割', '截图切割', '图片分割工具'],
        secondary: ['在线截图工具', '免费图片处理', '长图切割'],
        longTail: ['如何分割长截图', '长截图怎么切割', '免费在线图片分割工具']
      },
      'en': {
        primary: ['long screenshot splitter', 'screenshot cutter', 'image splitting tool'],
        secondary: ['online screenshot tool', 'free image processing', 'long image cutter'],
        longTail: ['how to split long screenshots', 'cut long screenshots online', 'free online image splitting tool']
      }
    };
  }

  /**
   * 获取默认目标密度
   */
  private getDefaultTargetDensity(type: 'primary' | 'secondary' | 'longTail'): number {
    const defaults = { primary: 2.5, secondary: 1.8, longTail: 1.2 };
    return defaults[type];
  }

  /**
   * 获取管理器状态
   */
  getStats() {
    return {
      configLoaded: this.config !== null,
      keywordsLoaded: Object.values(this.keywords).some(lang => 
        lang.primary.length > 0 || lang.secondary.length > 0 || lang.longTail.length > 0
      ),
      supportedLanguages: Object.keys(this.keywords) as Language[]
    };
  }
}

// 创建单例实例
export const keywordDensityManager = new KeywordDensityManager();

// 类型导出
export type { KeywordDensityConfig, KeywordAnalysis, ContentOptimization };

// 默认导出
export default keywordDensityManager;