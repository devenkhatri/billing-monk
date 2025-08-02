import { ActivityItem, CreateActivityLogData } from '@/types';
import { apiClient } from './api-client';

/**
 * Activity Logger utility for tracking application activities
 */
export class ActivityLogger {
  private static instance: ActivityLogger;
  private isEnabled: boolean = true;

  private constructor() {}

  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  /**
   * Enable or disable activity logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Log an activity
   */
  async log(data: CreateActivityLogData): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      await apiClient.post('/activity-logs', data);
    } catch (error) {
      // Don't throw errors for logging failures to avoid breaking main functionality
      console.warn('Failed to log activity:', error);
    }
  }

  /**
   * Log client activities
   */
  async logClientActivity(
    type: 'client_added' | 'client_updated' | 'client_deleted',
    clientId: string,
    clientName: string,
    userId?: string,
    userEmail?: string,
    previousValue?: any,
    newValue?: any
  ): Promise<void> {
    const descriptions = {
      client_added: `Client "${clientName}" was created`,
      client_updated: `Client "${clientName}" was updated`,
      client_deleted: `Client "${clientName}" was deleted`,
    };

    await this.log({
      type,
      description: descriptions[type],
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      userId,
      userEmail,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }

  /**
   * Log invoice activities
   */
  async logInvoiceActivity(
    type: 'invoice_created' | 'invoice_updated' | 'invoice_sent' | 'invoice_paid' | 'invoice_cancelled',
    invoiceId: string,
    invoiceNumber: string,
    amount?: number,
    userId?: string,
    userEmail?: string,
    previousValue?: any,
    newValue?: any
  ): Promise<void> {
    const descriptions = {
      invoice_created: `Invoice ${invoiceNumber} was created`,
      invoice_updated: `Invoice ${invoiceNumber} was updated`,
      invoice_sent: `Invoice ${invoiceNumber} was sent`,
      invoice_paid: `Invoice ${invoiceNumber} was marked as paid`,
      invoice_cancelled: `Invoice ${invoiceNumber} was cancelled`,
    };

    await this.log({
      type,
      description: descriptions[type],
      entityType: 'invoice',
      entityId: invoiceId,
      entityName: invoiceNumber,
      userId,
      userEmail,
      amount,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }

  /**
   * Log payment activities
   */
  async logPaymentActivity(
    type: 'payment_received' | 'payment_updated' | 'payment_deleted',
    paymentId: string,
    invoiceNumber: string,
    amount: number,
    userId?: string,
    userEmail?: string,
    previousValue?: any,
    newValue?: any
  ): Promise<void> {
    const descriptions = {
      payment_received: `Payment of $${amount} received for invoice ${invoiceNumber}`,
      payment_updated: `Payment for invoice ${invoiceNumber} was updated`,
      payment_deleted: `Payment for invoice ${invoiceNumber} was deleted`,
    };

    await this.log({
      type,
      description: descriptions[type],
      entityType: 'payment',
      entityId: paymentId,
      entityName: `Payment for ${invoiceNumber}`,
      userId,
      userEmail,
      amount,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }

  /**
   * Log project activities
   */
  async logProjectActivity(
    type: 'project_created' | 'project_updated' | 'project_completed' | 'project_deleted',
    projectId: string,
    projectName: string,
    userId?: string,
    userEmail?: string,
    previousValue?: any,
    newValue?: any
  ): Promise<void> {
    const descriptions = {
      project_created: `Project "${projectName}" was created`,
      project_updated: `Project "${projectName}" was updated`,
      project_completed: `Project "${projectName}" was completed`,
      project_deleted: `Project "${projectName}" was deleted`,
    };

    await this.log({
      type,
      description: descriptions[type],
      entityType: 'project',
      entityId: projectId,
      entityName: projectName,
      userId,
      userEmail,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }

  /**
   * Log task activities
   */
  async logTaskActivity(
    type: 'task_created' | 'task_updated' | 'task_completed' | 'task_deleted',
    taskId: string,
    taskTitle: string,
    userId?: string,
    userEmail?: string,
    previousValue?: any,
    newValue?: any
  ): Promise<void> {
    const descriptions = {
      task_created: `Task "${taskTitle}" was created`,
      task_updated: `Task "${taskTitle}" was updated`,
      task_completed: `Task "${taskTitle}" was completed`,
      task_deleted: `Task "${taskTitle}" was deleted`,
    };

    await this.log({
      type,
      description: descriptions[type],
      entityType: 'task',
      entityId: taskId,
      entityName: taskTitle,
      userId,
      userEmail,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }

  /**
   * Log time entry activities
   */
  async logTimeEntryActivity(
    type: 'time_entry_created' | 'time_entry_updated' | 'time_entry_deleted',
    timeEntryId: string,
    taskTitle: string,
    duration: number,
    userId?: string,
    userEmail?: string,
    previousValue?: any,
    newValue?: any
  ): Promise<void> {
    const hours = Math.round(duration / 60 * 100) / 100;
    const descriptions = {
      time_entry_created: `Time entry of ${hours}h created for task "${taskTitle}"`,
      time_entry_updated: `Time entry for task "${taskTitle}" was updated`,
      time_entry_deleted: `Time entry for task "${taskTitle}" was deleted`,
    };

    await this.log({
      type,
      description: descriptions[type],
      entityType: 'time_entry',
      entityId: timeEntryId,
      entityName: `Time entry for ${taskTitle}`,
      userId,
      userEmail,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
      metadata: { duration, hours },
    });
  }

  /**
   * Log template activities
   */
  async logTemplateActivity(
    type: 'template_created' | 'template_updated' | 'template_deleted',
    templateId: string,
    templateName: string,
    userId?: string,
    userEmail?: string,
    previousValue?: any,
    newValue?: any
  ): Promise<void> {
    const descriptions = {
      template_created: `Template "${templateName}" was created`,
      template_updated: `Template "${templateName}" was updated`,
      template_deleted: `Template "${templateName}" was deleted`,
    };

    await this.log({
      type,
      description: descriptions[type],
      entityType: 'template',
      entityId: templateId,
      entityName: templateName,
      userId,
      userEmail,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }

  /**
   * Log settings activities
   */
  async logSettingsActivity(
    settingsType: string,
    userId?: string,
    userEmail?: string,
    previousValue?: any,
    newValue?: any
  ): Promise<void> {
    await this.log({
      type: 'settings_updated',
      description: `${settingsType} settings were updated`,
      entityType: 'settings',
      entityId: settingsType,
      entityName: `${settingsType} Settings`,
      userId,
      userEmail,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }

  /**
   * Log Google Drive activities
   */
  async logGoogleDriveActivity(
    type: 'google_drive_upload_success' | 'google_drive_upload_failed' | 'google_drive_upload_error' | 'google_drive_retry',
    invoiceId: string,
    invoiceNumber: string,
    userId?: string,
    userEmail?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      google_drive_upload_success: `Invoice ${invoiceNumber} PDF successfully stored to Google Drive`,
      google_drive_upload_failed: `Invoice ${invoiceNumber} PDF failed to upload to Google Drive`,
      google_drive_upload_error: `Invoice ${invoiceNumber} PDF Google Drive upload encountered an error`,
      google_drive_retry: `Retrying Google Drive upload for invoice ${invoiceNumber}`,
    };

    await this.log({
      type: 'invoice_updated',
      description: descriptions[type],
      entityType: 'invoice',
      entityId: invoiceId,
      entityName: invoiceNumber,
      userId,
      userEmail,
      metadata: {
        ...metadata,
        action: type
      }
    });
  }

  /**
   * Get activity logs with filters
   */
  async getActivityLogs(filters?: any, pagination?: any) {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    if (pagination) {
      if (pagination.page) params.append('page', String(pagination.page));
      if (pagination.limit) params.append('limit', String(pagination.limit));
    }

    const url = `/activity-logs${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url);
  }
}

// Export singleton instance
export const activityLogger = ActivityLogger.getInstance();