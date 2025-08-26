# Mobile-First Responsive Design System

This document outlines the mobile-first responsive design system implemented for the Long Screenshot Splitter application.

## 🏗️ Architecture Overview

The responsive design system follows a mobile-first approach with progressive enhancement for larger screens. It consists of:

- **Viewport Detection Hooks** - React hooks for responsive state management
- **Responsive Containers** - Layout components that adapt to screen size
- **CSS Utilities** - Mobile-optimized styling utilities
- **Breakpoint Strategy** - Consistent breakpoint system across the app

## 📱 Breakpoint Strategy

We use a mobile-first approach with the following breakpoints:

```typescript
const BREAKPOINTS = {
  xs: 0,     // Extra small devices (mobile phones) - BASE
  sm: 640,   // Small tablets
  md: 768,   // Medium tablets
  lg: 1024,  // Laptops
  xl: 1280,  // Desktop
  '2xl': 1536, // Large desktop
}
```

### Design Philosophy
- **Mobile First**: All base styles target mobile devices
- **Progressive Enhancement**: Larger screens get additional features
- **Touch-Friendly**: 44px minimum touch targets on mobile
- **Performance Optimized**: Reduced animations on low-power devices

## 🎣 Hooks Usage

### useViewport()
Primary hook for responsive behavior:

```tsx
import { useViewport } from './hooks/useViewport';

function MyComponent() {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    currentBreakpoint,
    width,
    height,
    isTouch 
  } = useViewport();
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      Current breakpoint: {currentBreakpoint}
    </div>
  );
}
```

### useBreakpoint()
Check specific breakpoints:

```tsx
import { useBreakpoint } from './hooks/useViewport';

function MyComponent() {
  const isMobileOrTablet = useBreakpoint(['xs', 'sm', 'md']);
  const isLargeScreen = useBreakpoint('xl');
  
  return (
    <div>
      {isMobileOrTablet && <CompactView />}
      {isLargeScreen && <ExpandedView />}
    </div>
  );
}
```

### useMobileDetection()
Enhanced mobile detection:

```tsx
import { useMobileDetection } from './hooks/useViewport';

function MyComponent() {
  const {
    isMobileDevice,
    isSmallMobile,
    isTouch,
    isRetinaDisplay
  } = useMobileDetection();
  
  return (
    <div className={isTouch ? 'touch-optimized' : 'mouse-optimized'}>
      {isRetinaDisplay && <HighResImage />}
    </div>
  );
}
```

## 🧱 Components

### ResponsiveContainer
Adaptive container with breakpoint-specific classes:

```tsx
import { ResponsiveContainer } from './components/ResponsiveContainer';

<ResponsiveContainer
  mobileClass="flex-col space-y-4"
  tabletClass="flex-row space-x-6" 
  desktopClass="grid grid-cols-3 gap-8"
  enableTouchOptimization
>
  <div>Content adapts to viewport</div>
</ResponsiveContainer>
```

### ResponsiveFlexContainer
Mobile-first flex layouts:

```tsx
<ResponsiveFlexContainer direction="responsive">
  {/* Stacks on mobile, rows on tablet+ */}
  <div>Item 1</div>
  <div>Item 2</div>
</ResponsiveFlexContainer>
```

### ResponsiveGridContainer
Adaptive grid layouts:

```tsx
<ResponsiveGridContainer 
  cols={{ mobile: 1, tablet: 2, desktop: 3 }}
>
  <div>Grid item</div>
  <div>Grid item</div>
  <div>Grid item</div>
</ResponsiveGridContainer>
```

## 🎨 CSS Utilities

### Responsive Spacing
```css
/* Mobile-first spacing scale */
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 0.75rem;  /* 12px */
--spacing-lg: 1rem;     /* 16px */
--spacing-xl: 1.5rem;   /* 24px */
--spacing-2xl: 2rem;    /* 32px */
```

### Touch Targets
```css
/* Touch-friendly button sizing */
.btn-touch {
  min-height: 44px;     /* iOS minimum */
  min-width: 44px;
  padding: 0.75rem 1rem;
}
```

### Mobile-Optimized Form Controls
```css
.input-mobile {
  font-size: 16px; /* Prevents zoom on iOS */
  min-height: 48px;
  padding: 0.75rem;
}
```

## 📐 Layout Patterns

### Container Patterns
```css
/* Fluid container */
.container-fluid {
  width: 100%;
  padding: 0.75rem; /* Mobile first */
}

@media (min-width: 640px) {
  .container-fluid {
    padding: 1rem;
  }
}

@media (min-width: 1024px) {
  .container-fluid {
    padding: 1.5rem;
  }
}
```

### Flex Patterns
```css
/* Mobile stack, desktop row */
.flex-mobile {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .flex-mobile {
    flex-direction: row;
    gap: 1rem;
  }
}
```

## 🛠️ Development Tools

### Viewport Debugger
Development-only component for testing responsive behavior:

```tsx
import { ViewportDebugger } from './components/ViewportDebugger';

// Only renders in development
<ViewportDebugger position="bottom-right" />
```

Shows:
- Current viewport dimensions
- Active breakpoint
- Device type detection
- Touch capability
- Quick test buttons for common sizes

### Grid Overlay
Visual debugging for layout alignment:

```tsx
import { ResponsiveGridOverlay } from './components/ViewportDebugger';

<ResponsiveGridOverlay show={showGrid} color="rgba(255, 0, 0, 0.1)" />
```

## 🚀 Performance Optimizations

### Reduced Motion Support
Respects user preference for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .container,
  .animation-class {
    transition: none;
    animation: none;
  }
}
```

### High Contrast Support
Enhanced accessibility for high contrast mode:

```css
@media (prefers-contrast: high) {
  .container {
    border: 2px solid currentColor;
  }
  
  .btn-touch {
    border: 2px solid currentColor;
  }
}
```

### Dark Mode Support
System preference-aware dark mode:

```css
@media (prefers-color-scheme: dark) {
  .modal-mobile {
    background-color: rgba(0, 0, 0, 0.9);
  }
}
```

## 🧪 Testing Responsive Behavior

### Manual Testing
1. Use browser DevTools responsive mode
2. Test on actual devices when possible
3. Verify touch interactions work properly
4. Check text remains readable at all sizes

### Automated Testing Considerations
- Viewport dimensions in tests
- Touch event simulation
- Accessibility testing at different breakpoints
- Performance testing on mobile networks

## 📋 Implementation Checklist

- ✅ Mobile-first CSS architecture
- ✅ Responsive viewport hooks
- ✅ Touch-optimized components
- ✅ Breakpoint-aware layouts
- ✅ Accessibility compliance
- ✅ Performance optimizations
- ✅ Development debugging tools
- ✅ Cross-browser compatibility

## 🔄 Future Enhancements

Potential areas for improvement:
- Container queries support
- Advanced gesture detection
- PWA optimizations
- Enhanced offline support
- Advanced accessibility features