import { ComponentConfig } from '../../interfaces/ComponentInterface';

export interface CopyrightInfoProps {
  /** 作者名称 */
  author?: string;
  /** 作者邮箱 */
  email?: string;
  /** 网站URL */
  website?: string;
  /** 工具名称 */
  toolName?: string;
  /** 许可协议 */
  license?: string;
  /** 署名要求文本 */
  attributionText?: string;
  /** 自定义年份，默认为当前年份 */
  year?: number;
  /** 是否显示版权符号 */
  showCopyrightSymbol?: boolean;
  /** 是否显示联系信息 */
  showContactInfo?: boolean;
  /** 是否显示网站链接 */
  showWebsiteLink?: boolean;
  /** 是否显示技术支持信息 */
  showPoweredBy?: boolean;
  /** 是否显示许可协议 */
  showLicense?: boolean;
  /** 是否显示署名要求 */
  showAttribution?: boolean;
  /** 自定义CSS类名 */
  className?: string;
  /** 语言代码，默认为自动检测 */
  language?: 'zh-CN' | 'en';
  /** 点击事件回调 */
  onClick?: (event: React.MouseEvent) => void;
}

export interface CopyrightConfig extends ComponentConfig, Omit<CopyrightInfoProps, 'language'> {
  // 配置接口继承组件配置和属性，排除language
}

export interface CopyrightTranslations {
  copyright: string;
  contact: string;
  website: string;
  poweredBy: string;
  license: string;
  attribution: string;
}