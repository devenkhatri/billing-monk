'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { Loading } from './loading';

interface LazyLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
}

/**
 * Lazy loader component that renders children when they come into view
 */
export function LazyLoader({
  children,
  fallback = <Loading />,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  className
}: LazyLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If already triggered and triggerOnce is true, don't set up observer
    if (hasTriggered && triggerOnce) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasTriggered(true);
          
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

/**
 * Simple virtualized list for large datasets
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className || ''}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  loadMore: () => void;
  loading?: boolean;
  threshold?: number;
  className?: string;
}

/**
 * Infinite scroll component
 */
export function InfiniteScroll({
  children,
  hasMore,
  loadMore,
  loading = false,
  threshold = 100,
  className
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [hasMore, loading, loadMore, threshold]);

  return (
    <div className={className}>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="py-4 text-center">
          {loading ? <Loading /> : <div className="h-4" />}
        </div>
      )}
    </div>
  );
}

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Lazy loading image component
 */
export function LazyImage({
  src,
  alt,
  className,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(img);
        }
      },
      {
        rootMargin: '50px'
      }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  return (
    <img
      ref={imgRef}
      src={isVisible ? (isError ? placeholder : src) : placeholder}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-50'
      } ${className || ''}`}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}