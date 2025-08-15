/**
 * 简化的路由Hook - 解决白屏问题
 */

import { useState, useEffect, useCallback } from 'react';

// 简化的路由状态
interface SimpleRouterState {
  currentPath: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

// 简化的路由Hook
export function useRouter() {
  const [state, setState] = useState<SimpleRouterState>(() => ({
    currentPath: window.location.hash.slice(1) || '/',
    params: {},
    query: {}
  }));

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.slice(1) || '/';
      setState({
        currentPath: path,
        params: {},
        query: {}
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const push = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  const replace = useCallback((path: string) => {
    window.location.replace(window.location.pathname + window.location.search + '#' + path);
  }, []);

  return {
    currentPath: state.currentPath,
    params: state.params,
    query: state.query,
    push,
    replace,
    isActive: (path: string) => state.currentPath === path
  };
}

export default useRouter;