import { clsx } from 'clsx';
import { Button } from './button';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  variant?: 'text' | 'card' | 'table';
}

interface LoadingStateProps {
  message?: string;
  className?: string;
  showSpinner?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

interface AsyncLoadingStateProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
  errorTitle?: string;
  children: React.ReactNode;
  className?: string;
}

const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
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

const LoadingSkeleton = ({ className, lines = 3, variant = 'text' }: LoadingSkeletonProps) => {
  if (variant === 'card') {
    return (
      <div className={clsx('animate-pulse bg-white rounded-lg border p-6', className)}>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={clsx('animate-pulse', className)}>
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex space-x-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: lines }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: 4 }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
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
};

const LoadingState = ({ 
  message = 'Loading...', 
  className, 
  showSpinner = true, 
  size = 'lg' 
}: LoadingStateProps) => (
  <div className={clsx('flex items-center justify-center p-8', className)}>
    <div className="text-center">
      {showSpinner && (
        <Spinner size={size} className="mx-auto text-blue-600 mb-4" />
      )}
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

// Loading overlay component
const LoadingOverlay = ({ isLoading, message = 'Loading...', children, className }: LoadingOverlayProps) => (
  <div className={clsx('relative', className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto text-blue-600 mb-2" />
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    )}
  </div>
);

// Async loading state component with error handling
const AsyncLoadingState = ({
  loading,
  error,
  onRetry,
  loadingMessage = 'Loading...',
  errorTitle = 'Something went wrong',
  children,
  className
}: AsyncLoadingStateProps) => {
  if (loading) {
    return (
      <div className={clsx('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <Spinner size="lg" className="mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('flex items-center justify-center p-8', className)}>
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{errorTitle}</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Button loading state component
const ButtonLoadingState = ({ loading, children, ...props }: { loading: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} disabled={loading || props.disabled}>
    {loading ? (
      <div className="flex items-center justify-center">
        <Spinner size="sm" className="mr-2" />
        Loading...
      </div>
    ) : (
      children
    )}
  </button>
);

export { 
  Spinner, 
  LoadingSkeleton, 
  LoadingState, 
  TableLoadingSkeleton, 
  LoadingOverlay, 
  AsyncLoadingState,
  ButtonLoadingState
};