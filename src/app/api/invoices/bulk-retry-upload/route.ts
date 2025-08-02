import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { GoogleDriveService } from '@/lib/google-drive';
import { ApiError, ApiSuccess } from '@/types';

interface BulkRetryRequest {
  invoiceIds: string[];
}

interface BulkRetryResult {
  invoiceId: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkRetryRequest = await request.json();
    const { invoiceIds } = body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      const error: ApiError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invoice IDs array is required and cannot be empty'
        }
      };
      return NextResponse.json(error, { status: 400 });
    }

    if (invoiceIds.length > 50) {
      const error: ApiError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot retry more than 50 invoices at once'
        }
      };
      return NextResponse.json(error, { status: 400 });
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const results: BulkRetryResult[] = [];

    // Process each invoice
    for (const invoiceId of invoiceIds) {
      try {
        // Get the current storage status
        const currentStatus = await sheetsService.getInvoiceStorageStatus(invoiceId);
        
        if (!currentStatus) {
          results.push({
            invoiceId,
            success: false,
            error: 'Invoice storage status not found'
          });
          continue;
        }

        if (currentStatus.status === 'stored') {
          results.push({
            invoiceId,
            success: false,
            error: 'Invoice is already stored in Google Drive'
          });
          continue;
        }

        if (currentStatus.status !== 'failed') {
          results.push({
            invoiceId,
            success: false,
            error: 'Only failed uploads can be retried'
          });
          continue;
        }

        // Update status to pending and increment retry count
        await sheetsService.updateInvoiceStorageStatus(invoiceId, {
          status: 'pending',
          retryCount: currentStatus.retryCount + 1,
          lastAttempt: new Date(),
          errorMessage: undefined
        });

        results.push({
          invoiceId,
          success: true
        });

      } catch (error) {
        console.error(`Error processing invoice ${invoiceId}:`, error);
        results.push({
          invoiceId,
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process retry'
        });
      }
    }

    // Count successful and failed retries
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    const response: ApiSuccess<{
      results: BulkRetryResult[];
      summary: {
        total: number;
        successful: number;
        failed: number;
      };
    }> = {
      success: true,
      data: {
        results,
        summary: {
          total: invoiceIds.length,
          successful: successCount,
          failed: failureCount
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in bulk retry upload:', error);
    
    const apiError: ApiError = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process bulk retry'
      }
    };
    
    return NextResponse.json(apiError, { status: 500 });
  }
}