
# 文档 08: 国际化架构 (Internationalization Architecture)

## 1. 概述

本文档详细介绍了 `screenshot-splitter` 应用的国际化（Internationalization, i18n）架构。该架构旨在使应用能够轻松地支持多种语言和地区，为全球用户提供本地化的使用体验。

架构的核心设计目标包括：
*   **可扩展性**: 添加新语言应尽可能简单，无需修改核心代码。
*   **性能**: 只加载用户当前需要的语言资源，避免不必要的网络开销。
*   **开发体验**: 为开发者提供一个简单直观的 API 来进行文本翻译。
*   **智能检测**: 自动检测并应用最适合用户的语言。

该架构基于标准的 React Context API 和自定义 Hooks 实现，形成了一套高效且解耦的解决方案。

## 2. 架构图

国际化系统的主要组件及其交互关系可以用以下图表来描述：

```mermaid
graph TD
    subgraph Application
        App -- Wraps with --> P[I18nProvider];
        P -- Injects --> Ctx[React Context];
        Comp[Any Component] -- "useI18nContext()" --> Ctx;
    end
    
    subgraph i18n Logic
        P -- "Uses" --> H[useI18n Hook];
        H -- "Detects" --> D[LanguageDetector];
        H -- "Loads" --> L[Language Files (.json)];
        H -- "Caches" --> M[In-Memory Cache];
    end

    subgraph Browser
        D -- "Reads" --> LS[LocalStorage];
        D -- "Reads" --> NA[navigator.language];
    end

    style H fill:#f9f,stroke:#333,stroke-width:2px
```
工作流程如下：
1.  应用的根组件 `App` 被 `I18nProvider` 包裹。
2.  `I18nProvider` 内部调用 `useI18n` Hook，该 Hook 负责所有 i18n 逻辑。
3.  `useI18n` 通过 `LanguageDetector` 确定初始语言，然后**动态加载**对应的 `.json` 文件。
4.  加载的翻译和 `t` 函数等 API 通过 React Context 注入到应用中。
5.  任何子组件都可以通过 `useI18nContext()` Hook 轻松访问这些 API 来实现内容的翻译。

## 3. 代码示例

该架构的核心是 `useI18n` Hook，它封装了所有复杂的逻辑。

**文件路径**: `packages/screenshot-splitter/src/hooks/useI18n.ts`
```typescript
// (Simplified)
const languageCache = new Map<string, Record<string, string>>();

async function loadLanguageResource(language: string) {
  if (languageCache.has(language)) {
    return languageCache.get(language)!;
  }
  // 动态导入，实现了代码分割
  const module = await import(`../locales/${language}.json`);
  const resource = module.default;
  languageCache.set(language, resource);
  return resource;
}

export function useI18n() {
  const [currentLanguage, setCurrentLanguage] = useState(getSavedLanguage());
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    // 当语言变化时，异步加载新的翻译文件
    loadLanguageResource(currentLanguage).then(setTranslations);
  }, [currentLanguage]);

  const t = useCallback((key: string, params?: object) => {
    // ... logic to find and interpolate the translation string
  }, [translations]);

  const changeLanguage = useCallback((lang: string) => {
    setCurrentLanguage(lang);
    saveLanguage(lang);
  }, []);

  return { t, changeLanguage, currentLanguage };
}
```
`loadLanguageResource` 函数中的 `await import(...)` 是实现按需加载的关键，它确保了只有用户选择的语言文件会被下载。

## 4. 配置示例

在组件中使用国际化 API 非常简单直观。

**1. 包裹应用**:
**文件路径**: `packages/screenshot-splitter/src/App.tsx`
```typescript
function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
```

**2. 在组件中使用**:
**文件路径**: `packages/screenshot-splitter/src/components/FileUploader.tsx` (Conceptual)
```typescript
import { useI18nContext } from '../hooks/useI18nContext';

export const FileUploader = () => {
  const { t } = useI18nContext();

  return (
    <div>
      <h2>{t('upload.title')}</h2>
      <p>{t('upload.instruction', { maxFileSize: 10 })}</p>
    </div>
  );
};
```

**3. 添加语言文件**:
**文件路径**: `packages/screenshot-splitter/src/locales/en.json`
```json
{
  "upload.title": "Upload Screenshot",
  "upload.instruction": "Please select a file, size limit {maxFileSize}MB."
}
```
这个流程清晰地展示了“配置优于编码”的原则。开发者只需在 `json` 文件中添加翻译，然后在组件中通过 `key` 来调用，而无需关心背后复杂的加载和状态管理逻辑。

## 5. 最佳实践

*   **结构化的 Key**: 使用点号 (`.`) 分隔的 key（如 `upload.title`）来组织翻译，可以使其结构更清晰，易于管理。
*   **避免在翻译中嵌入 HTML**: 尽量保持翻译文本的纯粹性。如果需要链接或特殊格式，应使用带有插值的组件，而不是将 HTML 标签硬编码到 JSON 文件中。
*   **提供 Key 作为回退**: `t` 函数在找不到翻译时，应返回 `key` 本身。这使得开发过程中即使没有翻译，UI 也不会完全崩溃，并且能清晰地显示哪些文本需要被翻译。
*   **集中管理语言文件**: 将所有语言的 `json` 文件放在一个专门的 `locales` 目录下，便于维护和自动化处理（例如，交给专业的翻译团队）。

## 6. 案例分析

**场景**: 项目需要增加对日语的支持。

基于当前的 i18n 架构，这个过程非常简单：
1.  **复制和翻译**: 复制 `en.json` 文件，重命名为 `ja.json`，并将其中的所有值翻译成日语。
2.  **更新配置**: 在 `useI18n.ts` 文件中，将 `'ja'` 添加到 `SUPPORTED_LANGUAGES` 数组中。
    ```typescript
    // In useI18n.ts
    const SUPPORTED_LANGUAGES = ['zh-CN', 'en', 'ja'] as const;
    ```
3.  **（可选）更新 UI**: 在 `LanguageSwitcher` 组件中，增加一个切换到日语的选项。

**完成。** 整个过程不需要修改任何核心的 i18n 逻辑。应用现在已经具备了日语支持。`LanguageDetector` 会自动识别浏览器语言为日语的用户，`useI18n` hook 能够动态加载 `ja.json`，`changeLanguage` 函数也能够正确地切换到日语。这充分证明了该架构的**高度可扩展性**。
