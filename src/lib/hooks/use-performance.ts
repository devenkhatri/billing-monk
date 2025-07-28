'use client';

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
}

/**
 * Hook for monitoring component performance
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(Date.now());
  const mountTime = useRef<number | null>(null);

  useEffect(() => {
    // Record mount time
    mountTime.current = Date.now();
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      const renderTime = mountTime.current - renderStartTime.current;
      console.log(`[Performance] ${componentName} rendered in ${renderTime}ms`);
    }
  }, [componentName]);

  useEffect(() => {
    // Update render start time for re-renders
    renderStartTime.current = Date.now();
  });

  return {
    markStart: () => {
      renderStartTime.current = Date.now();
    },
    markEnd: (operation: string) => {
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - renderStartTime.current;
        console.log(`[Performance] ${componentName} - ${operation}: ${duration}ms`);
      }
    }
  };
}

/**
 * Hook for measuring async operation performance
 */
export function useAsyncPerformance() {
  const measureAsync = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        console.log(`[Performance] ${operationName}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        console.log(`[Performance] ${operationName} (failed): ${duration}ms`);
      }
      throw error;
    }
  };

  return { measureAsync };
}

/**
 * Hook for monitoring page load performance
 */
export function usePagePerformance(pageName: string) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Wait for page to be fully loaded
      const handleLoad = () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation && process.env.NODE_ENV === 'development') {
            const metrics = {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              totalTime: navigation.loadEventEnd - navigation.fetchStart,
            };
            
            console.log(`[Performance] ${pageName} page metrics:`, metrics);
          }
        }, 0);
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    }
  }, [pageName]);
}