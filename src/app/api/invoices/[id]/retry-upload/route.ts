import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { GoogleDriveService, GoogleDriveError } from '@/lib/google-drive';
import { GoogleDriveErrorHandler, GoogleDriveFallbackHandler } from '@/lib/google-drive-error-handler';
import { GoogleDriveAuthHandler } from '@/lib/google-drive-auth-handler';
import { PDFGenerator } from '@/lib/pdf-generator';
import { activityLogger } from '@/lib/activity-logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ApiError } from '@/types';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const invoiceId = params.id;

    if (!invoiceId) {
      const error: ApiError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invoice ID is required'
        }
      };
      return NextResponse.json(error, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const fallbackHandler = new GoogleDriveFallbackHandler();
    
    // Get the current storage status
    const currentStatus = await sheetsService.getInvoiceStorageStatus(invoiceId);
    
    if (!currentStatus) {
      const error: ApiError = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice storage status not found'
        }
      };
      return NextResponse.json(error, { status: 404 });
    }

    if (currentStatus.status === 'stored') {
      const error: ApiError = {
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Invoice is already stored in Google Drive'
        }
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Check if Google Drive is enabled
    const appSettings = await sheetsService.getAppSettings();
    if (!appSettings?.googleDrive?.enabled) {
      const error: ApiError = {
        success: false,
        error: {
          code: 'SERVICE_DISABLED',
          message: 'Google Drive storage is currently disabled'
        }
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Check authentication status
    const authStatus = await GoogleDriveAuthHandler.checkAuthenticationStatus();
    
    if (!authStatus.isAuthenticated || authStatus.needsReauth) {
      const authGuidance = GoogleDriveAuthHandler.getAuthenticationGuidance(authStatus);
      const error: ApiError = {
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: authGuidance.message,
          details: {
            title: authGuidance.title,
            actions: authGuidance.actions
          }
        }
      };
      return NextResponse.json(error, { status: 401 });
    }

    // Get the invoice data
    const invoice = await sheetsService.getInvoice(invoiceId);
    if (!invoice) {
      const error: ApiError = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found'
        }
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Get the client data for filename generation
    const client = await sheetsService.getClient(invoice.clientId);
    if (!client) {
      const error: ApiError = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found'
        }
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Get company settings for PDF generation
    const companySettings = await sheetsService.getCompanySettings();
    if (!companySettings) {
      const error: ApiError = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Company settings not found'
        }
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Update status to pending and increment retry count
    const newRetryCount = currentStatus.retryCount + 1;
    await sheetsService.updateInvoiceStorageStatus(invoiceId, {
      status: 'pending',
      retryCount: newRetryCount,
      lastAttempt: new Date(),
      errorMessage: undefined
    });

    // Log retry attempt
    await activityLogger.logGoogleDriveActivity(
      'google_drive_retry_initiated',
      invoice.id,
      invoice.invoiceNumber,
      session?.user?.email,
      session?.user?.email,
      {
        retryCount: newRetryCount,
        previousError: currentStatus.errorMessage
      }
    );

    try {
      // Generate PDF
      const pdfGenerator = new PDFGenerator();
      const pdfBuffer = await pdfGenerator.generateInvoicePDF({
        invoice,
        client,
        companySettings
      });

      // Create Google Drive service
      const driveService = await GoogleDriveService.getAuthenticatedService();
      
      // Prepare invoice data for filename generation
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        clientName: client.name,
        date: new Date(invoice.issueDate),
        isRecurring: invoice.isRecurring,
        recurrenceInfo: invoice.isRecurring && invoice.recurringSchedule 
          ? `${invoice.recurringSchedule.frequency}-${invoice.recurringSchedule.interval}`
          : undefined
      };

      // Attempt upload
      const uploadResult = await driveService.uploadInvoicePDF(
        new Uint8Array(pdfBuffer),
        `invoice-${invoice.invoiceNumber}.pdf`,
        invoiceData
      );

      if (uploadResult.success) {
        // Update status to stored
        const updatedStatus = await sheetsService.updateInvoiceStorageStatus(invoiceId, {
          status: 'stored',
          driveFileId: uploadResult.fileId,
          uploadedAt: new Date(),
          lastAttempt: new Date(),
          retryCount: newRetryCount,
          errorMessage: undefined
        });

        // Log successful retry
        await activityLogger.logGoogleDriveActivity(
          'google_drive_retry_success',
          invoice.id,
          invoice.invoiceNumber,
          session?.user?.email,
          session?.user?.email,
          {
            driveFileId: uploadResult.fileId,
            fileName: uploadResult.fileName,
            retryCount: newRetryCount
          }
        );

        return NextResponse.json({
          success: true,
          data: updatedStatus,
          message: 'Invoice successfully uploaded to Google Drive'
        });

      } else {
        // Handle upload failure
        const uploadError = new Error(uploadResult.error || 'Upload failed');
        const userError = GoogleDriveErrorHandler.getUserFriendlyError(uploadError);
        
        // Update status to failed
        const updatedStatus = await sheetsService.updateInvoiceStorageStatus(invoiceId, {
          status: 'failed',
          lastAttempt: new Date(),
          retryCount: newRetryCount,
          errorMessage: uploadResult.error
        });

        // Log failed retry
        await activityLogger.logGoogleDriveActivity(
          'google_drive_retry_failed',
          invoice.id,
          invoice.invoiceNumber,
          session?.user?.email,
          session?.user?.email,
          {
            error: uploadResult.error,
            retryCount: newRetryCount,
            userFriendlyError: userError.message
          }
        );

        const error: ApiError = {
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: userError.message,
            details: {
              title: userError.title,
              actionable: userError.actionable,
              retryable: userError.retryable,
              actions: userError.actions
            }
          }
        };
        
        return NextResponse.json(error, { status: 400 });
      }

    } catch (uploadError) {
      // Handle service-level errors
      const error = uploadError instanceof Error ? uploadError : new Error('Unknown error');
      const userError = GoogleDriveErrorHandler.getUserFriendlyError(error);
      
      // Update status to failed with error message
      const updatedStatus = await sheetsService.updateInvoiceStorageStatus(invoiceId, {
        status: 'failed',
        lastAttempt: new Date(),
        retryCount: newRetryCount,
        errorMessage: GoogleDriveErrorHandler.getNotificationMessage(error)
      });

      // Log service error during retry
      await activityLogger.logGoogleDriveActivity(
        'google_drive_retry_error',
        invoice.id,
        invoice.invoiceNumber,
        session?.user?.email,
        session?.user?.email,
        {
          error: error.message,
          errorType: error.constructor.name,
          retryCount: newRetryCount
        }
      );

      // Return appropriate error response based on error type
      if (error instanceof GoogleDriveError) {
        const statusCode = error.statusCode || 500;
        const apiError: ApiError = {
          success: false,
          error: {
            code: error.code,
            message: userError.message,
            details: {
              title: userError.title,
              actionable: userError.actionable,
              retryable: userError.retryable,
              actions: userError.actions
            }
          }
        };
        
        return NextResponse.json(apiError, { status: statusCode });
      }

      // Generic error
      const apiError: ApiError = {
        success: false,
        error: {
          code: 'RETRY_FAILED',
          message: userError.message,
          details: {
            title: userError.title,
            actionable: userError.actionable,
            retryable: userError.retryable
          }
        }
      };
      
      return NextResponse.json(apiError, { status: 500 });
    }

  } catch (error) {
    console.error('Error retrying upload:', error);
    
    const apiError: ApiError = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retry upload'
      }
    };
    
    return NextResponse.json(apiError, { status: 500 });
  }
}