# Design Document: Vite Single-file Migration

## Overview

This document outlines the technical design for migrating the existing long screenshot splitting tool from Astro framework to React + Vite + vite-plugin-singlefile architecture. The migration will preserve all existing functionality while creating a single-file HTML application suitable for offline deployment.

## Current Architecture Analysis

### Existing Technology Stack
- **Framework**: Astro with component-based architecture
- **Styling**: Tailwind CSS v4.1.11
- **Build Tool**: Astro build system
- **Code Quality**: Biome for linting and formatting
- **Deployment**: Static site generation with GitHub Pages

### Current Module Structure
```
src/
├── components/
│   ├── Feedback.astro
│   └── Previewer.astro
├── layouts/
│   └── MainLayout.astro
├── pages/
│   └── index.astro
├── scripts/
│   ├── main-modular.js (entry point)
│   ├── split.worker.js (Web Worker)
│   ├── i18n.js (internationalization)
│   └── modules/
│       ├── appState.js
│       ├── fileProcessor.js
│       ├── exportManager.js
│       ├── previewInterface.js
│       └── testUtils.js
└── styles/
    ├── global.css
    └── tailwind.css
```

### Key Features Analysis
1. **Image Processing**: Web Worker-based splitting with progress tracking
2. **State Management**: Centralized app state with Blob management
3. **UI Components**: Modular preview interface with thumbnail selection
4. **Export Functionality**: ZIP and PDF export using JSZip and jsPDF
5. **Internationalization**: JSON-based i18n with dynamic loading
6. **File Handling**: Drag-and-drop with validation and error handling

## Target Architecture Design

### New Technology Stack
- **Framework**: React 18+ with functional components and hooks
- **Build Tool**: Vite with vite-plugin-singlefile
- **Bundling**: Single HTML file with inlined assets
- **External Dependencies**: CDN-based for React, JSZip, jsPDF
- **Styling**: Tailwind CSS (maintained)
- **Code Quality**: Biome (maintained)

### Project Structure
```
vite-migration/
├── public/
│   ├── locales/
│   │   ├── en.json
│   │   └── zh-CN.json
│   └── split.worker.js
├── src/
│   ├── components/
│   │   ├── App.jsx
│   │   ├── FileUploader.jsx
│   │   ├── ImageProcessor.jsx
│   │   ├── PreviewInterface.jsx
│   │   ├── ThumbnailList.jsx
│   │   ├── ExportControls.jsx
│   │   └── ProgressSteps.jsx
│   ├── hooks/
│   │   ├── useAppState.js
│   │   ├── useImageProcessor.js
│   │   ├── useI18n.js
│   │   └── useWorker.js
│   ├── utils/
│   │   ├── fileProcessor.js
│   │   ├── exportManager.js
│   │   └── constants.js
│   ├── styles/
│   │   └── index.css
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

## Components and Interfaces

### React Component Architecture

#### 1. App Component (Root)
```jsx
const App = () => {
  const { state, dispatch } = useAppState();
  const { t, changeLanguage } = useI18n();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ProgressSteps currentStep={state.currentStep} />
      <FileUploader onFileSelect={handleFileSelect} />
      <ImageProcessor />
      <PreviewInterface />
      <ExportControls />
      <Footer />
    </div>
  );
};
```

#### 2. Custom Hooks Design

**useAppState Hook**
```javascript
const useAppState = () => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  
  const actions = {
    setFile: (file) => dispatch({ type: 'SET_FILE', payload: file }),
    addBlob: (blob, index) => dispatch({ type: 'ADD_BLOB', payload: { blob, index } }),
    toggleSelection: (index) => dispatch({ type: 'TOGGLE_SELECTION', payload: index }),
    setProcessing: (isProcessing) => dispatch({ type: 'SET_PROCESSING', payload: isProcessing }),
    cleanup: () => dispatch({ type: 'CLEANUP' })
  };
  
  return { state, actions };
};
```

**useImageProcessor Hook**
```javascript
const useImageProcessor = () => {
  const { state, actions } = useAppState();
  const { worker, sendMessage } = useWorker('/split.worker.js');
  
  const processImage = useCallback((file, splitHeight) => {
    actions.setProcessing(true);
    sendMessage({ file, splitHeight });
  }, [actions, sendMessage]);
  
  return { processImage, isProcessing: state.isProcessing };
};
```

**useI18n Hook**
```javascript
const useI18n = () => {
  const [locale, setLocale] = useState('zh-CN');
  const [translations, setTranslations] = useState({});
  
  const t = useCallback((key, params = {}) => {
    // Translation logic with parameter substitution
  }, [translations]);
  
  const changeLanguage = useCallback(async (newLocale) => {
    // Load and set new translations
  }, []);
  
  return { t, changeLanguage, locale };
};
```

### Component Interfaces

#### FileUploader Component
```jsx
interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedTypes: string[];
  maxSize: number;
  disabled: boolean;
}
```

#### PreviewInterface Component
```jsx
interface PreviewInterfaceProps {
  thumbnails: ThumbnailData[];
  selectedIndices: Set<number>;
  onSelectionChange: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}
```

#### ExportControls Component
```jsx
interface ExportControlsProps {
  selectedCount: number;
  onExportZip: () => void;
  onExportPdf: () => void;
  fileName: string;
  onFileNameChange: (name: string) => void;
  disabled: boolean;
}
```

## Data Models

### Application State Model
```javascript
const initialState = {
  // File and processing state
  originalFile: null,
  isProcessing: false,
  currentStep: 1,
  
  // Image data
  blobs: [],
  objectUrls: [],
  thumbnails: [],
  
  // User selections
  selectedSlices: new Set(),
  
  // Configuration
  splitHeight: 1200,
  fileName: '分割结果',
  
  // UI state
  previewVisible: false,
  currentPreview: null,
  
  // Progress tracking
  progress: 0,
  error: null
};
```

### Thumbnail Data Model
```javascript
interface ThumbnailData {
  id: number;
  blob: Blob;
  objectUrl: string;
  width: number;
  height: number;
  selected: boolean;
}
```

### Worker Message Protocol
```javascript
// From Main to Worker
interface WorkerRequest {
  file: File;
  splitHeight: number;
}

// From Worker to Main
type WorkerResponse = 
  | { type: 'progress'; progress: number }
  | { type: 'chunk'; blob: Blob; index: number }
  | { type: 'done' }
  | { type: 'error'; message: string };
```

## Error Handling

### Error Boundary Implementation
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Error Handling Strategy
1. **File Upload Errors**: Validate file type, size, and format
2. **Worker Errors**: Handle processing failures with user feedback
3. **Memory Errors**: Implement cleanup and resource management
4. **Export Errors**: Graceful degradation with error messages
5. **Network Errors**: Handle CDN loading failures

### Error Recovery Mechanisms
- Automatic retry for transient failures
- Fallback to local libraries if CDN fails
- Progressive enhancement for unsupported features
- User-friendly error messages with suggested actions

## Testing Strategy

### Unit Testing
- **Hooks Testing**: Custom hooks with React Testing Library
- **Component Testing**: Individual component functionality
- **Utility Functions**: Pure function testing with Jest
- **Worker Testing**: Mock worker communication

### Integration Testing
- **File Processing Flow**: End-to-end image processing
- **Export Functionality**: ZIP and PDF generation
- **State Management**: Complex state transitions
- **I18n Integration**: Language switching and translation

### Performance Testing
- **Bundle Size**: Monitor single-file output size
- **Memory Usage**: Track blob and URL management
- **Processing Speed**: Compare with original implementation
- **Load Time**: Measure initial application startup

### Browser Compatibility Testing
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Feature Detection**: Web Workers, File API, Canvas API

## Migration Implementation Plan

### Phase 1: Project Setup and Configuration
1. Create new Vite project with React template
2. Configure vite-plugin-singlefile
3. Set up external CDN dependencies
4. Configure Tailwind CSS and Biome
5. Set up development and build scripts

### Phase 2: Core Infrastructure
1. Implement custom hooks (useAppState, useI18n, useWorker)
2. Create utility functions (fileProcessor, exportManager)
3. Set up error boundary and error handling
4. Implement Web Worker integration

### Phase 3: Component Migration
1. Convert Astro components to React components
2. Implement file upload and drag-and-drop
3. Create image processing and progress tracking
4. Build preview interface and thumbnail list
5. Implement export controls and functionality

### Phase 4: Feature Parity and Testing
1. Ensure all existing features work correctly
2. Implement comprehensive testing suite
3. Performance optimization and bundle analysis
4. Cross-browser compatibility testing

### Phase 5: Deployment and Documentation
1. Build and test single-file output
2. Create deployment documentation
3. Performance benchmarking against original
4. User acceptance testing

## Build Configuration

### Vite Configuration
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { viteExternalsPlugin } from 'vite-plugin-externals';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({
      removeViteModuleLoader: true,
      useRecommendedBuildConfig: true,
      inlinePattern: ['**/*.js', '**/*.css'],
      deleteInlinedFiles: true
    }),
    viteExternalsPlugin({
      'react': 'React',
      'react-dom': 'ReactDOM',
      'jszip': 'JSZip',
      'jspdf': 'jsPDF'
    })
  ],
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      inlineDynamicImports: true,
      output: {
        manualChunks: () => 'everything.js'
      }
    }
  }
});
```

### CDN Dependencies in index.html
```html
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

## Performance Considerations

### Bundle Optimization
- Tree shaking for unused code elimination
- Code splitting for dynamic imports
- Asset optimization and compression
- CDN externalization for large libraries

### Memory Management
- Proper cleanup of object URLs
- Efficient blob handling
- Worker lifecycle management
- Component unmounting cleanup

### User Experience
- Progressive loading indicators
- Responsive design maintenance
- Accessibility preservation
- Error state handling

## Security Considerations

### File Processing Security
- Client-side file validation
- Memory limit enforcement
- Safe blob handling
- XSS prevention in dynamic content

### CDN Security
- Subresource Integrity (SRI) hashes
- Fallback mechanisms for CDN failures
- Content Security Policy configuration
- HTTPS enforcement

## Deployment Strategy

### Single-file Output
- Self-contained HTML file with all assets
- No external dependencies except CDN libraries
- Offline functionality after initial load
- Cross-platform compatibility

### Distribution Methods
- Direct file upload to any web server
- Email attachment distribution
- USB drive deployment
- Intranet system integration

## Success Metrics

### Functional Metrics
- 100% feature parity with original application
- All existing test cases pass
- Cross-browser compatibility maintained
- Performance equal or better than original

### Technical Metrics
- Single-file output under 5MB
- Load time under 3 seconds
- Memory usage within acceptable limits
- No runtime errors in supported browsers

### User Experience Metrics
- UI/UX identical to original
- All accessibility features preserved
- Internationalization fully functional
- Error handling provides clear feedback