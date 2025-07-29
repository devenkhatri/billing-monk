// Performance monitoring utilities

export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now();
    
    try {
      const result = await fn();
      const end = performance.now();
      const duration = end - start;
      
      if (duration > 1000) { // Log slow operations (>1s)
        console.warn(`🐌 Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      } else if (duration > 500) { // Log medium operations (>500ms)
        console.info(`⚠️ Medium operation: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      resolve(result);
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      console.error(`❌ Failed operation: ${name} failed after ${duration.toFixed(2)}ms`, error);
      reject(error);
    }
  });
}

// React component performance wrapper
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function PerformanceMonitoredComponent(props: P) {
    const renderStart = performance.now();
    
    React.useEffect(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      if (renderTime > 100) { // Log slow renders (>100ms)
        console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms to render`);
      }
    });
    
    return React.createElement(Component, props);
  };
}

// Debounce utility to prevent excessive API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}