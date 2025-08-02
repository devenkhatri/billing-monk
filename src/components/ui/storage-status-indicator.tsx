'use client';

import { InvoiceStorageStatus } from '@/types';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface StorageStatusIndicatorProps {
  status?: InvoiceStorageStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StorageStatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false,
  className = '' 
}: StorageStatusIndicatorProps) {
  const getStatusConfig = () => {
    if (!status) {
      return {
        icon: XCircleIcon,
        color: 'text-gray-400',
        bgColor: 'bg-gray-100',
        label: 'Disabled',
        title: 'Google Drive storage is disabled'
      };
    }

    switch (status.status) {
      case 'stored':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Stored',
          title: `Stored in Google Drive${status.uploadedAt ? ` on ${status.uploadedAt.toLocaleDateString()}` : ''}`
        };
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Pending',
          title: 'Upload to Google Drive is pending'
        };
      case 'failed':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Failed',
          title: `Upload failed${status.errorMessage ? `: ${status.errorMessage}` : ''}${status.retryCount > 0 ? ` (${status.retryCount} retries)` : ''}`
        };
      case 'disabled':
        return {
          icon: XCircleIcon,
          color: 'text-gray-400',
          bgColor: 'bg-gray-100',
          label: 'Disabled',
          title: 'Google Drive storage is disabled'
        };
      default:
        return {
          icon: CloudArrowUpIcon,
          color: 'text-gray-400',
          bgColor: 'bg-gray-100',
          label: 'Unknown',
          title: 'Unknown storage status'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-5 h-5',
          icon: 'h-3 w-3',
          text: 'text-xs'
        };
      case 'lg':
        return {
          container: 'w-8 h-8',
          icon: 'h-5 w-5',
          text: 'text-sm'
        };
      default: // md
        return {
          container: 'w-6 h-6',
          icon: 'h-4 w-4',
          text: 'text-xs'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const IconComponent = config.icon;

  if (showLabel) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`} title={config.title}>
        <div className={`inline-flex items-center justify-center rounded-full ${config.bgColor} ${sizeClasses.container}`}>
          <IconComponent className={`${config.color} ${sizeClasses.icon}`} />
        </div>
        <span className={`${config.color} font-medium ${sizeClasses.text}`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full ${config.bgColor} ${sizeClasses.container} ${className}`}
      title={config.title}
    >
      <IconComponent className={`${config.color} ${sizeClasses.icon}`} />
    </div>
  );
}