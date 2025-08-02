import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { ApiError } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceIds } = body;

    if (!Array.isArray(invoiceIds)) {
      const error: ApiError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'invoiceIds must be an array'
        }
      };
      return NextResponse.json(error, { status: 400 });
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Get all storage statuses and filter by requested invoice IDs
    const allStatuses = await sheetsService.getAllInvoiceStorageStatuses();
    const requestedStatuses = allStatuses.filter(status => 
      invoiceIds.includes(status.invoiceId)
    );

    return NextResponse.json({
      success: true,
      data: requestedStatuses
    });

  } catch (error) {
    console.error('Error fetching storage statuses:', error);
    
    const apiError: ApiError = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch storage statuses'
      }
    };
    
    return NextResponse.json(apiError, { status: 500 });
  }
}