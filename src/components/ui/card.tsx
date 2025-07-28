import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className, padding = 'md' }: CardProps) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={clsx(
      'bg-white shadow-sm rounded-lg border border-gray-200',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className }: CardHeaderProps) => (
  <div className={clsx('border-b border-gray-200 pb-4 mb-4', className)}>
    {children}
  </div>
);

const CardContent = ({ children, className }: CardContentProps) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className }: CardFooterProps) => (
  <div className={clsx('border-t border-gray-200 pt-4 mt-4', className)}>
    {children}
  </div>
);

export { Card, CardHeader, CardContent, CardFooter };