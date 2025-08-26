/**
 * Responsive Component Exports
 * Mobile-first responsive components and utilities
 */

// Responsive layout components
export {
  ResponsiveContainer,
  ResponsiveFlexContainer,
  ResponsiveGridContainer,
  ResponsiveButtonContainer,
  SafeAreaContainer,
} from '../ResponsiveContainer';

// Development debugging components
export {
  ViewportDebugger,
  ResponsiveGridOverlay,
} from '../ViewportDebugger';

// Responsive hooks
export {
  useViewport,
  useBreakpoint,
  useMediaQuery,
  useMobileDetection,
  createResponsiveClasses,
  BREAKPOINTS,
} from '../../hooks/useViewport';

export type {
  ViewportState,
  Breakpoint,
} from '../../hooks/useViewport';