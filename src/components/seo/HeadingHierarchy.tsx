import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode, type HTMLAttributes } from 'react';

/**
 * Heading hierarchy levels
 */
type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * Heading validation errors
 */
interface HeadingValidationError {
  level: HeadingLevel;
  message: string;
  line?: number;
  suggestion?: string;
}

/**
 * Heading metadata
 */
interface HeadingMeta {
  id: string;
  level: HeadingLevel;
  text: string;
  order: number;
  parent?: string;
  children: string[];
}

/**
 * Heading hierarchy context
 */
interface HeadingHierarchyContextType {
  headings: Map<string, HeadingMeta>;
  registerHeading: (id: string, level: HeadingLevel, text: string) => void;
  unregisterHeading: (id: string) => void;
  validateHierarchy: () => HeadingValidationError[];
  getTableOfContents: () => HeadingMeta[];
  isValidHierarchy: boolean;
  errors: HeadingValidationError[];
}

const HeadingHierarchyContext = createContext<HeadingHierarchyContextType | null>(null);

/**
 * Heading Hierarchy Provider
 * Manages and validates heading structure for SEO compliance
 */
export const HeadingProvider: React.FC<{ children: ReactNode; strict?: boolean }> = ({ 
  children, 
  strict = true 
}) => {
  const [headings, setHeadings] = useState<Map<string, HeadingMeta>>(new Map());
  const [errors, setErrors] = useState<HeadingValidationError[]>([]);
  const [isValidHierarchy, setIsValidHierarchy] = useState(true);
  const orderCounterRef = useRef(0);

  // Register a new heading
  const registerHeading = useCallback((id: string, level: HeadingLevel, text: string) => {
    setHeadings(prev => {
      const next = new Map(prev);
      const order = orderCounterRef.current++;
      
      // Find parent heading
      let parent: string | undefined;
      const levelNum = parseInt(level.charAt(1));
      
      if (levelNum > 1) {
        // Look for the nearest parent heading
        const sortedHeadings = Array.from(prev.values()).sort((a, b) => a.order - b.order);
        
        for (let i = sortedHeadings.length - 1; i >= 0; i--) {
          const heading = sortedHeadings[i];
          const headingLevelNum = parseInt(heading.level.charAt(1));
          
          if (headingLevelNum < levelNum) {
            parent = heading.id;
            
            // Update parent's children
            const parentMeta = prev.get(heading.id);
            if (parentMeta) {
              parentMeta.children.push(id);
            }
            break;
          }
        }
      }
      
      next.set(id, {
        id,
        level,
        text,
        order,
        parent,
        children: []
      });
      
      return next;
    });
  }, []);

  // Unregister a heading
  const unregisterHeading = useCallback((id: string) => {
    setHeadings(prev => {
      const next = new Map(prev);
      const heading = next.get(id);
      
      if (heading) {
        // Remove from parent's children
        if (heading.parent) {
          const parent = next.get(heading.parent);
          if (parent) {
            parent.children = parent.children.filter(childId => childId !== id);
          }
        }
        
        // Reassign children to parent
        heading.children.forEach(childId => {
          const child = next.get(childId);
          if (child) {
            child.parent = heading.parent;
            if (heading.parent) {
              const parent = next.get(heading.parent);
              if (parent) {
                parent.children.push(childId);
              }
            }
          }
        });
        
        next.delete(id);
      }
      
      return next;
    });
  }, []);

  // Validate heading hierarchy
  const validateHierarchy = useCallback((): HeadingValidationError[] => {
    const validationErrors: HeadingValidationError[] = [];
    const sortedHeadings = Array.from(headings.values()).sort((a, b) => a.order - b.order);
    
    if (sortedHeadings.length === 0) {
      return validationErrors;
    }
    
    // Check for H1
    const h1Count = sortedHeadings.filter(h => h.level === 'h1').length;
    
    if (h1Count === 0 && strict) {
      validationErrors.push({
        level: 'h1',
        message: 'Page must have exactly one H1 tag for SEO',
        suggestion: 'Add a main heading with <h1> tag'
      });
    } else if (h1Count > 1) {
      validationErrors.push({
        level: 'h1',
        message: `Page has ${h1Count} H1 tags, but should have only one`,
        suggestion: 'Use H2 or lower for subsections'
      });
    }
    
    // Check hierarchy order
    for (let i = 0; i < sortedHeadings.length - 1; i++) {
      const current = sortedHeadings[i];
      const next = sortedHeadings[i + 1];
      
      const currentLevel = parseInt(current.level.charAt(1));
      const nextLevel = parseInt(next.level.charAt(1));
      
      // Check for skipped levels
      if (nextLevel > currentLevel + 1) {
        validationErrors.push({
          level: next.level,
          message: `Heading level skipped: ${current.level} → ${next.level}`,
          suggestion: `Use h${currentLevel + 1} instead of ${next.level}`,
          line: i + 1
        });
      }
    }
    
    // Check for orphaned headings (headings without proper parent)
    sortedHeadings.forEach((heading, index) => {
      const levelNum = parseInt(heading.level.charAt(1));
      
      if (levelNum > 1) {
        // Look for parent in previous headings
        let hasParent = false;
        
        for (let i = index - 1; i >= 0; i--) {
          const prevHeading = sortedHeadings[i];
          const prevLevel = parseInt(prevHeading.level.charAt(1));
          
          if (prevLevel === levelNum - 1) {
            hasParent = true;
            break;
          } else if (prevLevel < levelNum - 1) {
            // Found a potential parent but with wrong level
            break;
          }
        }
        
        if (!hasParent && strict) {
          validationErrors.push({
            level: heading.level,
            message: `${heading.level} "${heading.text}" has no parent h${levelNum - 1}`,
            suggestion: `Add a parent h${levelNum - 1} or change to appropriate level`,
            line: index
          });
        }
      }
    });
    
    // Check for empty headings
    sortedHeadings.forEach((heading, index) => {
      if (!heading.text || heading.text.trim().length === 0) {
        validationErrors.push({
          level: heading.level,
          message: `Empty ${heading.level} tag detected`,
          suggestion: 'Add meaningful text content to heading',
          line: index
        });
      } else if (heading.text.trim().length < 3) {
        validationErrors.push({
          level: heading.level,
          message: `${heading.level} text too short: "${heading.text}"`,
          suggestion: 'Use more descriptive heading text for better SEO',
          line: index
        });
      }
    });
    
    return validationErrors;
  }, [headings, strict]);

  // Get table of contents
  const getTableOfContents = useCallback((): HeadingMeta[] => {
    return Array.from(headings.values()).sort((a, b) => a.order - b.order);
  }, [headings]);

  // Validate on heading changes
  useEffect(() => {
    const validationErrors = validateHierarchy();
    setErrors(validationErrors);
    setIsValidHierarchy(validationErrors.length === 0);
  }, [headings, validateHierarchy]);

  const value: HeadingHierarchyContextType = {
    headings,
    registerHeading,
    unregisterHeading,
    validateHierarchy,
    getTableOfContents,
    isValidHierarchy,
    errors
  };

  return (
    <HeadingHierarchyContext.Provider value={value}>
      {children}
    </HeadingHierarchyContext.Provider>
  );
};

/**
 * Hook to use heading hierarchy context
 */
export const useHeadingHierarchy = () => {
  const context = useContext(HeadingHierarchyContext);
  if (!context) {
    throw new Error('useHeadingHierarchy must be used within HeadingProvider');
  }
  return context;
};

/**
 * Base Heading Component with validation
 */
interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
  children: ReactNode;
  skipValidation?: boolean;
}

export const Heading: React.FC<HeadingProps> = ({ 
  level, 
  children, 
  skipValidation = false,
  id: providedId,
  ...props 
}) => {
  const context = useContext(HeadingHierarchyContext);
  const [headingId] = useState(() => providedId || `heading-${Math.random().toString(36).substr(2, 9)}`);
  const textRef = useRef<string>('');
  
  useEffect(() => {
    if (!skipValidation && context) {
      // Extract text content
      let text = '';
      if (typeof children === 'string') {
        text = children;
      } else if (React.isValidElement(children)) {
        // Try to extract text from React elements
        const extractText = (node: ReactNode): string => {
          if (typeof node === 'string') return node;
          if (typeof node === 'number') return node.toString();
          if (React.isValidElement(node) && (node.props as any)?.children) {
            return extractText((node.props as any).children);
          }
          if (Array.isArray(node)) {
            return node.map(extractText).join('');
          }
          return '';
        };
        text = extractText(children);
      }
      
      textRef.current = text;
      context.registerHeading(headingId, level, text);
      
      return () => {
        context.unregisterHeading(headingId);
      };
    }
  }, [headingId, level, children, skipValidation, context]);
  
  const HeadingTag = `h${level}` as any;
  
  return React.createElement(HeadingTag, { id: headingId, ...props }, children);
};

/**
 * Convenience components for each heading level
 */
export const H1: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h1" {...props} />
);

export const H2: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h2" {...props} />
);

export const H3: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h3" {...props} />
);

export const H4: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h4" {...props} />
);

export const H5: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h5" {...props} />
);

export const H6: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h6" {...props} />
);

/**
 * Debug component for development
 */
export const HeadingHierarchyDebugger: React.FC = () => {
  const { headings, errors, isValidHierarchy } = useHeadingHierarchy();
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: isValidHierarchy ? '#4caf50' : '#f44336',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <div>
        <strong>Heading Hierarchy</strong>
        <div>Status: {isValidHierarchy ? '✅ Valid' : '❌ Invalid'}</div>
        <div>Total Headings: {headings.size}</div>
      </div>
      
      {errors.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <strong>Errors:</strong>
          {errors.map((error, index) => (
            <div key={index} style={{ marginTop: '5px' }}>
              • {error.message}
              {error.suggestion && (
                <div style={{ marginLeft: '10px', fontSize: '11px', opacity: 0.9 }}>
                  → {error.suggestion}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeadingProvider;