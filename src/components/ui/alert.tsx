import { ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  onClose?: () => void;
  className?: string;
}

const Alert = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  onClose,
  className
}: AlertProps) => {
  const handleClose = onClose || onDismiss;
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200',
      icon: CheckCircleIcon,
      iconColor: 'text-green-400',
      titleColor: 'text-green-800',
      textColor: 'text-green-700'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-800',
      textColor: 'text-yellow-700'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: XCircleIcon,
      iconColor: 'text-red-400',
      titleColor: 'text-red-800',
      textColor: 'text-red-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700'
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={clsx('rounded-md border p-4', config.container, className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={clsx('h-5 w-5', config.iconColor)} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={clsx('text-sm font-medium', config.titleColor)}>
              {title}
            </h3>
          )}
          <div className={clsx('text-sm', title ? 'mt-2' : '', config.textColor)}>
            {children}
          </div>
        </div>
        {(dismissible || handleClose) && handleClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={clsx(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  config.textColor,
                  'hover:bg-opacity-20 hover:bg-current'
                )}
                onClick={handleClose}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Alert };