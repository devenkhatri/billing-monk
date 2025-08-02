import { google, drive_v3 } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import type { Session } from 'next-auth';

// Error types for Google Drive operations
export class GoogleDriveError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GoogleDriveError';
  }
}

export class DriveAuthenticationError extends GoogleDriveError {
  constructor(message: string = 'Google Drive authentication failed') {
    super(message, 'DRIVE_AUTHENTICATION_ERROR', 401, false);
  }
}

export class DriveQuotaError extends GoogleDriveError {
  constructor(message: string = 'Google Drive quota exceeded') {
    super(message, 'DRIVE_QUOTA_ERROR', 429, true);
  }
}

export class DriveNetworkError extends GoogleDriveError {
  constructor(message: string = 'Google Drive network error occurred') {
    super(message, 'DRIVE_NETWORK_ERROR', 500, true);
  }
}

export class DrivePermissionError extends GoogleDriveError {
  constructor(message: string = 'Google Drive permission denied') {
    super(message, 'DRIVE_PERMISSION_ERROR', 403, false);
  }
}

export class DriveFileNotFoundError extends GoogleDriveError {
  constructor(message: string = 'File or folder not found in Google Drive') {
    super(message, 'DRIVE_FILE_NOT_FOUND', 404, false);
  }
}

// Configuration interfaces
export interface GoogleDriveConfig {
  folderId?: string;
  folderName: string;
  enabled: boolean;
}

export interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
  retryCount?: number;
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId?: string;
  createdTime: Date;
  modifiedTime: Date;
}

export interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  date: Date;
  isRecurring?: boolean;
  recurrenceInfo?: string;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds
  backoffMultiplier: 2
};

export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private retryConfig: RetryConfig;
  private readonly DEFAULT_FOLDER_NAME = 'Invoices';

  constructor(accessToken: string, retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.drive = google.drive({ version: 'v3', auth });
    this.retryConfig = retryConfig;
  }

  /**
   * Creates a GoogleDriveService instance using the current user's session
   */
  static async getAuthenticatedService(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG): Promise<GoogleDriveService> {
    const session = await getServerSession(authOptions) as Session & { accessToken?: string };

    if (!session?.accessToken) {
      throw new DriveAuthenticationError('No valid session or access token found');
    }

    return new GoogleDriveService(session.accessToken, retryConfig);
  }

  /**
   * Executes a Google Drive operation with retry logic and error handling
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryable: boolean = true
  ): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        attempt++;

        // Parse Google Drive API errors
        const parsedError = this.parseGoogleDriveError(error, operationName);
        
        // Don't retry if error is not retryable or we've exceeded max retries
        if (!retryable || !parsedError.retryable || attempt > this.retryConfig.maxRetries) {
          throw parsedError;
        }

        // Calculate delay with exponential backoff
        let delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );

        // Add jitter for quota errors
        if (parsedError instanceof DriveQuotaError) {
          delay = delay * (1 + Math.random());
        }

        console.warn(`${operationName} failed (attempt ${attempt}/${this.retryConfig.maxRetries + 1}), retrying in ${delay}ms:`, parsedError.message);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but just in case
    throw this.parseGoogleDriveError(lastError!, operationName);
  }

  /**
   * Parses Google Drive API errors into our custom error types
   */
  private parseGoogleDriveError(error: any, operationName: string): GoogleDriveError {
    const message = error?.message || 'Unknown error occurred';
    const statusCode = error?.response?.status || error?.status || error?.code;

    // Authentication errors
    if (statusCode === 401 || message.includes('unauthorized') || message.includes('invalid_grant')) {
      return new DriveAuthenticationError(`Authentication failed during ${operationName}: ${message}`);
    }

    // Permission errors
    if (statusCode === 403) {
      if (message.includes('quota') || message.includes('rate limit')) {
        return new DriveQuotaError(`Quota exceeded during ${operationName}: ${message}`);
      }
      return new DrivePermissionError(`Permission denied during ${operationName}: ${message}`);
    }

    // File not found errors
    if (statusCode === 404) {
      return new DriveFileNotFoundError(`File not found during ${operationName}: ${message}`);
    }

    // Rate limiting errors
    if (statusCode === 429 || message.includes('rate limit') || message.includes('quota exceeded')) {
      return new DriveQuotaError(`Rate limit exceeded during ${operationName}: ${message}`);
    }

    // Network/connectivity errors
    if (statusCode >= 500 || message.includes('network') || message.includes('timeout') || error.code === 'ENOTFOUND') {
      return new DriveNetworkError(`Network error during ${operationName}: ${message}`);
    }

    // Validation errors
    if (statusCode === 400 || message.includes('invalid') || message.includes('bad request')) {
      return new GoogleDriveError(`Validation error during ${operationName}: ${message}`, 'DRIVE_VALIDATION_ERROR', statusCode, false);
    }

    // Generic error with retry capability for unknown errors
    return new GoogleDriveError(
      `Error during ${operationName}: ${message}`,
      'DRIVE_UNKNOWN_ERROR',
      statusCode,
      statusCode >= 500 // Retry server errors
    );
  }

  /**
   * Uploads an invoice PDF to Google Drive
   */
  async uploadInvoicePDF(
    pdfBuffer: Uint8Array, 
    fileName: string, 
    invoiceData?: InvoiceData
  ): Promise<DriveUploadResult> {
    try {
      const config = await this.getConfig();
      
      if (!config.enabled) {
        return {
          success: false,
          error: 'Google Drive storage is disabled'
        };
      }

      // Ensure the invoice folder exists
      const folderId = await this.ensureInvoiceFolder();
      
      // Generate proper filename based on invoice data or use provided filename
      const generatedFileName = invoiceData 
        ? this.generateInvoiceFileName(invoiceData)
        : fileName;
      
      // Sanitize filename
      const sanitizedFileName = this.sanitizeFileName(generatedFileName);

      // Check for existing file and handle conflicts
      const finalFileName = await this.handleFileNameConflict(folderId, sanitizedFileName);

      const uploadResult = await this.executeWithRetry(async () => {
        const response = await this.drive.files.create({
          requestBody: {
            name: finalFileName,
            parents: [folderId],
            mimeType: 'application/pdf'
          },
          media: {
            mimeType: 'application/pdf',
            body: Buffer.from(pdfBuffer)
          }
        });

        return response.data;
      }, 'uploadInvoicePDF');

      return {
        success: true,
        fileId: uploadResult.id!,
        fileName: finalFileName
      };

    } catch (error) {
      console.error('Error uploading invoice PDF:', error);
      
      return {
        success: false,
        error: error instanceof GoogleDriveError ? error.message : 'Unknown error occurred during upload'
      };
    }
  }

  /**
   * Ensures the invoice folder exists, creating it if necessary
   */
  async ensureInvoiceFolder(): Promise<string> {
    const config = await this.getConfig();
    
    // If we have a configured folder ID, verify it exists
    if (config.folderId) {
      try {
        await this.executeWithRetry(async () => {
          await this.drive.files.get({
            fileId: config.folderId!,
            fields: 'id,name,mimeType'
          });
        }, 'verifyFolder');
        
        return config.folderId;
      } catch (error) {
        console.warn('Configured folder not found, creating default folder:', error);
        // Fall through to create default folder
      }
    }

    // Create or find the default folder
    return this.createOrFindFolder(config.folderName || this.DEFAULT_FOLDER_NAME);
  }

  /**
   * Creates or finds a folder by name
   */
  private async createOrFindFolder(folderName: string): Promise<string> {
    return this.executeWithRetry(async () => {
      // First, try to find existing folder
      const searchResponse = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id,name)'
      });

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        return searchResponse.data.files[0].id!;
      }

      // Create new folder if not found
      const createResponse = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });

      return createResponse.data.id!;
    }, 'createOrFindFolder');
  }

  /**
   * Lists folders in Google Drive for folder selection
   */
  async listFolders(): Promise<DriveFolder[]> {
    return this.executeWithRetry(async () => {
      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id,name,parents,createdTime,modifiedTime)',
        orderBy: 'name'
      });

      const folders = response.data.files || [];
      
      return folders.map(folder => ({
        id: folder.id!,
        name: folder.name!,
        parentId: folder.parents?.[0],
        createdTime: new Date(folder.createdTime!),
        modifiedTime: new Date(folder.modifiedTime!)
      }));
    }, 'listFolders');
  }

  /**
   * Creates a new folder in Google Drive
   */
  async createFolder(folderName: string, parentId?: string): Promise<DriveFolder> {
    return this.executeWithRetry(async () => {
      // Check if folder already exists
      const existingFolders = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentId ? ` and parents in '${parentId}'` : ''}`,
        fields: 'files(id,name)'
      });

      if (existingFolders.data.files && existingFolders.data.files.length > 0) {
        throw new GoogleDriveError(
          `A folder named "${folderName}" already exists`,
          'FOLDER_ALREADY_EXISTS',
          400,
          false
        );
      }

      // Create the folder
      const response = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : undefined
        },
        fields: 'id,name,parents,createdTime,modifiedTime'
      });

      const folder = response.data;
      return {
        id: folder.id!,
        name: folder.name!,
        parentId: folder.parents?.[0],
        createdTime: new Date(folder.createdTime!),
        modifiedTime: new Date(folder.modifiedTime!)
      };
    }, 'createFolder');
  }

  /**
   * Gets the current Google Drive configuration
   */
  async getConfig(): Promise<GoogleDriveConfig> {
    // This will be implemented to read from Google Sheets settings
    // For now, return default configuration
    return {
      folderName: this.DEFAULT_FOLDER_NAME,
      enabled: true
    };
  }

  /**
   * Updates the Google Drive configuration
   */
  async updateConfig(config: Partial<GoogleDriveConfig>): Promise<void> {
    // This will be implemented to save to Google Sheets settings
    // For now, this is a placeholder
    console.log('Updating Google Drive config:', config);
  }

  /**
   * Retries upload for a failed invoice
   */
  async retryUpload(_invoiceId: string): Promise<DriveUploadResult> {
    // This will be implemented to retry failed uploads
    // For now, this is a placeholder
    return {
      success: false,
      error: 'Retry functionality not yet implemented'
    };
  }

  /**
   * Generates standardized filename for invoices according to requirements 6.1 and 6.4
   * Format: "Invoice-{invoice_number}-{client_name}-{date}.pdf"
   * For recurring invoices: "Invoice-{invoice_number}-{client_name}-{date}-Recurring-{frequency}.pdf"
   */
  private generateInvoiceFileName(invoiceData: InvoiceData): string {
    const { invoiceNumber, clientName, date, isRecurring, recurrenceInfo } = invoiceData;
    
    // Format date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    
    // Clean client name for filename use - remove invalid characters and normalize
    const cleanClientName = this.sanitizeFileNameComponent(clientName);
    
    // Clean invoice number for filename use
    const cleanInvoiceNumber = this.sanitizeFileNameComponent(invoiceNumber);
    
    // Base filename format: "Invoice-{number}-{client}-{date}"
    let filename = `Invoice-${cleanInvoiceNumber}-${cleanClientName}-${formattedDate}`;
    
    // Add recurring information if applicable (requirement 6.4)
    if (isRecurring && recurrenceInfo) {
      const cleanRecurrenceInfo = this.sanitizeFileNameComponent(recurrenceInfo);
      filename += `-Recurring-${cleanRecurrenceInfo}`;
    }
    
    return `${filename}.pdf`;
  }

  /**
   * Sanitizes individual filename components to ensure they are safe for file systems
   * Removes invalid characters and normalizes spacing
   */
  private sanitizeFileNameComponent(component: string): string {
    const sanitized = component
      .replace(/[<>:"/\\|?*&()]/g, '') // Remove invalid filesystem characters including parentheses
      .replace(/\./g, '') // Remove periods to avoid confusion with file extensions
      .replace(/\s+/g, '-') // Replace whitespace with dashes
      .replace(/-+/g, '-') // Replace multiple consecutive dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .trim();
    
    // Limit component length and ensure it doesn't end with a dash after truncation
    const truncated = sanitized.substring(0, 50);
    return truncated.replace(/-$/, ''); // Remove trailing dash if present after truncation
  }

  /**
   * Sanitizes filename for Google Drive compatibility
   */
  private sanitizeFileName(fileName: string): string {
    // Remove or replace invalid characters
    return fileName
      .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 255); // Limit length
  }

  /**
   * Handles filename conflicts by appending timestamp if needed
   */
  private async handleFileNameConflict(folderId: string, fileName: string): Promise<string> {
    try {
      // Check if file already exists
      const searchResponse = await this.drive.files.list({
        q: `name='${fileName}' and parents in '${folderId}' and trashed=false`,
        fields: 'files(id,name)'
      });

      if (!searchResponse.data.files || searchResponse.data.files.length === 0) {
        return fileName; // No conflict
      }

      // File exists, append timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
      
      return `${baseName}-${timestamp}${fileExtension}`;
    } catch (error) {
      console.warn('Error checking for filename conflicts, using original name:', error);
      return fileName;
    }
  }
}