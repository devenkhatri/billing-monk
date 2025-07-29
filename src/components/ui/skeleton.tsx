import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export function Skeleton({ 
  className, 
  width, 
  height, 
  rounded = false 
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

export function SkeletonCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
      {children || (
        <>
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="40%" />
          <div className="space-y-2">
            <Skeleton height={12} width="100%" />
            <Skeleton height={12} width="80%" />
            <Skeleton height={12} width="90%" />
          </div>
        </>
      )}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={16} width="80%" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={14} width={`${60 + Math.random() * 30}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}