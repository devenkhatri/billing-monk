import { GoogleDriveError, DriveAuthenticationError, DriveQuotaError, DriveNetworkError, DrivePermissionError, DriveFileNotFoundError } from './google-drive';

export interface UserFriendlyError {
  title: string;
  message: string;
  actionable: boolean;
  retryable: boolean;
  actions?: ErrorAction[];
}

export interface ErrorAction {
  label: string;
  type: 'retry' | 'authenticate' | 'configure' | 'contact_support';
  url?: string;
}

/**
 * Converts Google Drive errors into user-friendly messages with actionable guidance
 */
export class GoogleDriveErrorHandler {
  /**
   * Converts a Google Drive error into a user-friendly error message
   */
  static getUserFriendlyError(error: Error | GoogleDriveError): UserFriendlyError {
    if (error instanceof DriveAuthenticationError) {
      return {
        title: 'Google Drive Authentication Required',
        message: 'Your Google Drive access has expired or been revoked. Please re-authenticate to continue storing invoices.',
        actionable: true,
        retryable: false,
        actions: [
          {
            label: 'Re-authenticate',
            type: 'authenticate',
            url: '/api/auth/signin'
          }
        ]
      };
    }

    if (error instanceof DriveQuotaError) {
      return {
        title: 'Google Drive Storage Full',
        message: 'Your Google Drive storage is full or you\'ve exceeded the API quota. Free up space or try again later.',
        actionable: true,
        retryable: true,
        actions: [
          {
            label: 'Check Storage',
            type: 'configure',
            url: 'https://drive.google.com/drive/quota'
          },
          {
            label: 'Retry Later',
            type: 'retry'
          }
        ]
      };
    }

    if (error instanceof DriveNetworkError) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to Google Drive. Please check your internet connection and try again.',
        actionable: true,
        retryable: true,
        actions: [
          {
            label: 'Retry Now',
            type: 'retry'
          }
        ]
      };
    }

    if (error instanceof DrivePermissionError) {
      return {
        title: 'Permission Denied',
        message: 'You don\'t have permission to access the selected Google Drive folder. Please choose a different folder or check your permissions.',
        actionable: true,
        retryable: false,
        actions: [
          {
            label: 'Change Folder',
            type: 'configure'
          }
        ]
      };
    }

    if (error instanceof DriveFileNotFoundError) {
      return {
        title: 'Folder Not Found',
        message: 'The configured Google Drive folder no longer exists. A new default folder will be created automatically.',
        actionable: true,
        retryable: true,
        actions: [
          {
            label: 'Retry Upload',
            type: 'retry'
          },
          {
            label: 'Configure Folder',
            type: 'configure'
          }
        ]
      };
    }

    if (error instanceof GoogleDriveError) {
      // Handle other Google Drive errors
      if (error.code === 'DRIVE_VALIDATION_ERROR') {
        return {
          title: 'Invalid File',
          message: 'The invoice file could not be uploaded due to validation issues. Please try generating the invoice again.',
          actionable: true,
          retryable: false,
          actions: [
            {
              label: 'Contact Support',
              type: 'contact_support'
            }
          ]
        };
      }

      return {
        title: 'Google Drive Error',
        message: error.message || 'An unexpected error occurred while accessing Google Drive.',
        actionable: error.retryable,
        retryable: error.retryable,
        actions: error.retryable ? [
          {
            label: 'Retry',
            type: 'retry'
          }
        ] : [
          {
            label: 'Contact Support',
            type: 'contact_support'
          }
        ]
      };
    }

    // Handle generic errors
    return {
      title: 'Upload Failed',
      message: 'An unexpected error occurred while uploading to Google Drive. Your invoice was still generated successfully.',
      actionable: true,
      retryable: true,
      actions: [
        {
          label: 'Retry Upload',
          type: 'retry'
        }
      ]
    };
  }

  /**
   * Gets a simplified error message for notifications
   */
  static getNotificationMessage(error: Error | GoogleDriveError): string {
    const userError = this.getUserFriendlyError(error);
    return `${userError.title}: ${userError.message}`;
  }

  /**
   * Determines if an error should trigger a notification
   */
  static shouldNotifyUser(error: Error | GoogleDriveError): boolean {
    // Don't notify for authentication errors during automatic uploads
    // as these will be handled by the authentication flow
    if (error instanceof DriveAuthenticationError) {
      return false;
    }

    // Always notify for other errors
    return true;
  }

  /**
   * Gets the appropriate notification type for an error
   */
  static getNotificationType(error: Error | GoogleDriveError): 'error' | 'warning' {
    if (error instanceof DriveQuotaError || error instanceof DriveNetworkError) {
      return 'warning'; // These are temporary issues
    }
    return 'error'; // All other errors are more serious
  }
}

/**
 * Fallback behavior configuration for when Google Drive is unavailable
 */
export interface FallbackConfig {
  enableLocalStorage: boolean;
  enableEmailNotification: boolean;
  enableRetryQueue: boolean;
  maxRetryAttempts: number;
  retryDelayMinutes: number;
}

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enableLocalStorage: false, // Don't store locally for security
  enableEmailNotification: true, // Notify user of failures
  enableRetryQueue: true, // Queue failed uploads for retry
  maxRetryAttempts: 3,
  retryDelayMinutes: 30
};

/**
 * Handles fallback behavior when Google Drive is unavailable or disabled
 */
export class GoogleDriveFallbackHandler {
  private config: FallbackConfig;

  constructor(config: FallbackConfig = DEFAULT_FALLBACK_CONFIG) {
    this.config = config;
  }

  /**
   * Handles the case when Google Drive is disabled
   */
  handleDisabledService(invoiceId: string, invoiceNumber: string): {
    success: boolean;
    message: string;
    shouldNotify: boolean;
  } {
    console.log(`Google Drive storage is disabled for invoice ${invoiceNumber}`);
    
    return {
      success: true, // Not an error, just disabled
      message: 'Google Drive storage is disabled. Invoice generated successfully.',
      shouldNotify: false // Don't notify as this is expected behavior
    };
  }

  /**
   * Handles the case when Google Drive is unavailable
   */
  handleUnavailableService(
    invoiceId: string, 
    invoiceNumber: string, 
    error: Error
  ): {
    success: boolean;
    message: string;
    shouldNotify: boolean;
    shouldQueue: boolean;
  } {
    const userError = GoogleDriveErrorHandler.getUserFriendlyError(error);
    
    console.warn(`Google Drive unavailable for invoice ${invoiceNumber}:`, error.message);
    
    return {
      success: false,
      message: `Invoice generated successfully, but Google Drive storage failed: ${userError.message}`,
      shouldNotify: GoogleDriveErrorHandler.shouldNotifyUser(error),
      shouldQueue: this.config.enableRetryQueue && userError.retryable
    };
  }

  /**
   * Determines if a failed upload should be queued for retry
   */
  shouldQueueForRetry(error: Error | GoogleDriveError, currentRetryCount: number): boolean {
    if (!this.config.enableRetryQueue) {
      return false;
    }

    if (currentRetryCount >= this.config.maxRetryAttempts) {
      return false;
    }

    const userError = GoogleDriveErrorHandler.getUserFriendlyError(error);
    return userError.retryable;
  }

  /**
   * Gets the delay before next retry attempt
   */
  getRetryDelay(retryCount: number): number {
    // Exponential backoff with base delay from config
    const baseDelayMs = this.config.retryDelayMinutes * 60 * 1000;
    return Math.min(baseDelayMs * Math.pow(2, retryCount), 24 * 60 * 60 * 1000); // Max 24 hours
  }
}