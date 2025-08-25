import { CopyrightConfig } from '../types';

export const defaultCopyrightConfig: CopyrightConfig = {
  author: 'Your Name',
  email: 'your.email@example.com',
  website: 'https://example.com',
  toolName: 'Screenshot Splitter Tool',
  license: 'MIT License',
  attributionText: 'Please include attribution when sharing',
  year: new Date().getFullYear(),
  showCopyrightSymbol: true,
  showContactInfo: true,
  showWebsiteLink: true,
  showPoweredBy: true,
  showLicense: false,
  showAttribution: false,
  className: 'copyright-info'
};

export const minimalCopyrightConfig: CopyrightConfig = {
  author: 'Your Name',
  year: new Date().getFullYear(),
  showCopyrightSymbol: true,
  showContactInfo: false,
  showWebsiteLink: false,
  showPoweredBy: false,
  showLicense: false,
  showAttribution: false,
  className: 'copyright-info-minimal'
};

export const fullCopyrightConfig: CopyrightConfig = {
  author: 'Your Name',
  email: 'your.email@example.com',
  website: 'https://example.com',
  toolName: 'Screenshot Splitter Tool',
  license: 'MIT License',
  attributionText: 'Please include attribution when sharing',
  year: new Date().getFullYear(),
  showCopyrightSymbol: true,
  showContactInfo: true,
  showWebsiteLink: true,
  showPoweredBy: true,
  showLicense: true,
  showAttribution: true,
  className: 'copyright-info-full'
};