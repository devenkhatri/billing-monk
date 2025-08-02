import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { PDFGenerator } from '@/lib/pdf-generator';
import { GoogleDriveService, GoogleDriveError } from '@/lib/google-drive';
import { GoogleDriveErrorHandler, GoogleDriveFallbackHandler } from '@/lib/google-drive-error-handler';
import { GoogleDriveAuthHandler } from '@/lib/google-drive-auth-handler';
import { activityLogger } from '@/lib/activity-logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Handles Google Drive upload with comprehensive error handling and fallback behavior
 */
async function handleGoogleDriveUpload(
  invoice: any,
  client: any,
  pdfBuffer: ArrayBuffer,
  session: any
): Promise<void> {
  const fallbackHandler = new GoogleDriveFallbackHandler();
  
  try {
    // Check if Google Drive is enabled in settings
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const appSettings = await sheetsService.getAppSettings();
    
    if (!appSettings?.googleDrive?.enabled) {
      const fallbackResult = fallbackHandler.handleDisabledService(
        invoice.id,
        invoice.invoiceNumber
      );
      
      // Log that Google Drive is disabled
      await activityLogger.logGoogleDriveActivity(
        'google_drive_disabled',
        invoice.id,
        invoice.invoiceNumber,
        session?.user?.email,
        session?.user?.email,
        { message: fallbackResult.message }
      );
      
      console.log(`Google Drive storage disabled for invoice ${invoice.invoiceNumber}`);
      return;
    }

    // Check authentication status
    const authStatus = await GoogleDriveAuthHandler.checkAuthenticationStatus();
    
    if (!authStatus.isAuthenticated || authStatus.needsReauth) {
      const authError = new Error(authStatus.error || 'Authentication required');
      const fallbackResult = fallbackHandler.handleUnavailableService(
        invoice.id,
        invoice.invoiceNumber,
        authError
      );
      
      // Log authentication issue
      await activityLogger.logGoogleDriveActivity(
        'google_drive_auth_required',
        invoice.id,
        invoice.invoiceNumber,
        session?.user?.email,
        session?.user?.email,
        {
          error: authStatus.error,
          needsReauth: authStatus.needsReauth
        }
      );
      
      console.warn(`Google Drive authentication required for invoice ${invoice.invoiceNumber}:`, authStatus.error);
      return;
    }

    // Attempt to create Google Drive service
    const driveService = await GoogleDriveService.getAuthenticatedService();
    
    // Helper function to format recurrence information for filename
    function formatRecurrenceInfo(schedule: any): string {
      const { frequency, interval } = schedule;
      
      // Format frequency for filename
      const frequencyMap: Record<string, string> = {
        'weekly': 'Weekly',
        'monthly': 'Monthly', 
        'quarterly': 'Quarterly',
        'yearly': 'Yearly'
      };
      
      const formattedFrequency = frequencyMap[frequency] || frequency;
      
      // Include interval if it's not 1 (e.g., "Every-2-Months")
      if (interval && interval > 1) {
        return `Every-${interval}-${formattedFrequency}`;
      }
      
      return formattedFrequency;
    }

    // Prepare invoice data for filename generation
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      clientName: client.name,
      date: new Date(invoice.issueDate),
      isRecurring: invoice.isRecurring,
      recurrenceInfo: invoice.isRecurring && invoice.recurringSchedule 
        ? formatRecurrenceInfo(invoice.recurringSchedule)
        : undefined
    };

    // Attempt upload with retry logic built into the service
    const uploadResult = await driveService.uploadInvoicePDF(
      new Uint8Array(pdfBuffer),
      `invoice-${invoice.invoiceNumber}.pdf`,
      invoiceData
    );

    if (uploadResult.success) {
      // Log successful upload
      await activityLogger.logGoogleDriveActivity(
        'google_drive_upload_success',
        invoice.id,
        invoice.invoiceNumber,
        session?.user?.email,
        session?.user?.email,
        {
          driveFileId: uploadResult.fileId,
          fileName: uploadResult.fileName
        }
      );

      // Update storage status in sheets
      await sheetsService.updateInvoiceStorageStatus(invoice.id, {
        status: 'stored',
        driveFileId: uploadResult.fileId,
        uploadedAt: new Date(),
        lastAttempt: new Date(),
        retryCount: uploadResult.retryCount || 0,
        errorMessage: undefined
      });

      console.log(`Successfully uploaded invoice ${invoice.invoiceNumber} to Google Drive:`, {
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName
      });
    } else {
      // Handle upload failure
      const uploadError = new Error(uploadResult.error || 'Upload failed');
      const fallbackResult = fallbackHandler.handleUnavailableService(
        invoice.id,
        invoice.invoiceNumber,
        uploadError
      );

      // Log failed upload
      await activityLogger.logGoogleDriveActivity(
        'google_drive_upload_failed',
        invoice.id,
        invoice.invoiceNumber,
        session?.user?.email,
        session?.user?.email,
        {
          error: uploadResult.error,
          retryCount: uploadResult.retryCount || 0,
          shouldQueue: fallbackResult.shouldQueue
        }
      );

      // Update storage status
      await sheetsService.updateInvoiceStorageStatus(invoice.id, {
        status: 'failed',
        lastAttempt: new Date(),
        retryCount: uploadResult.retryCount || 0,
        errorMessage: uploadResult.error
      });

      console.warn(`Failed to upload invoice ${invoice.invoiceNumber} to Google Drive:`, uploadResult.error);
    }

  } catch (driveError) {
    // Handle service-level errors (authentication, network, etc.)
    const error = driveError instanceof Error ? driveError : new Error('Unknown Google Drive error');
    const fallbackResult = fallbackHandler.handleUnavailableService(
      invoice.id,
      invoice.invoiceNumber,
      error
    );

    // Log service error
    await activityLogger.logGoogleDriveActivity(
      'google_drive_service_error',
      invoice.id,
      invoice.invoiceNumber,
      session?.user?.email,
      session?.user?.email,
      {
        error: error.message,
        errorType: error.constructor.name,
        shouldQueue: fallbackResult.shouldQueue
      }
    );

    // Update storage status if we can access sheets
    try {
      const sheetsService = await GoogleSheetsService.getAuthenticatedService();
      await sheetsService.updateInvoiceStorageStatus(invoice.id, {
        status: 'failed',
        lastAttempt: new Date(),
        retryCount: 0,
        errorMessage: GoogleDriveErrorHandler.getNotificationMessage(error)
      });
    } catch (sheetsError) {
      console.error('Failed to update storage status after Google Drive error:', sheetsError);
    }

    console.error(`Google Drive service error for invoice ${invoice.invoiceNumber}:`, error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await GoogleSheetsService.getAuthenticatedService();
    
    // Get invoice data
    const invoice = await service.getInvoice(id);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    // Get client data
    const client = await service.getClient(invoice.clientId);
    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } },
        { status: 404 }
      );
    }

    // Get company settings
    const companySettings = await service.getCompanySettings();
    if (!companySettings) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Company settings not found' } },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generateInvoicePDF({
      invoice,
      client,
      companySettings
    });

    // Get session for activity logging
    const session = await getServerSession(authOptions);

    // Attempt Google Drive upload after successful PDF generation
    // This should not block the PDF response if it fails
    await handleGoogleDriveUpload(invoice, client, pdfBuffer, session);

    // Return PDF as response (regardless of Google Drive upload status)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to generate PDF',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}