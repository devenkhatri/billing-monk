import { clsx } from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <svg
      className={clsx('animate-spin', sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const LoadingSkeleton = ({ className, lines = 3 }: LoadingSkeletonProps) => (
  <div className={clsx('animate-pulse', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={clsx(
          'bg-gray-200 rounded',
          index === lines - 1 ? 'h-4 w-3/4' : 'h-4 w-full',
          index > 0 && 'mt-2'
        )}
      />
    ))}
  </div>
);

const LoadingState = ({ message = 'Loading...', className }: LoadingStateProps) => (
  <div className={clsx('flex items-center justify-center p-8', className)}>
    <div className="text-center">
      <Spinner size="lg" className="mx-auto text-blue-600 mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

const TableLoadingSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="animate-pulse">
    <div className="bg-gray-50 px-6 py-3">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export { Spinner, LoadingSkeleton, LoadingState, TableLoadingSkeleton };