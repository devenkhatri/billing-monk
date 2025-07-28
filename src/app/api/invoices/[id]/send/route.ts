import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { ApiResponse, Invoice, UpdateInvoiceData } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await GoogleSheetsService.getAuthenticatedService();
    
    // Get the invoice to check if it exists
    const invoice = await service.getInvoice(id);
    if (!invoice) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found'
        }
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Update invoice status to 'sent' and set sent date
    const updateData: UpdateInvoiceData = {
      status: 'sent',
      sentDate: new Date()
    };
    const updatedInvoice = await service.updateInvoice(id, updateData);

    if (!updatedInvoice) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update invoice status'
        }
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ApiResponse<Invoice> = {
      success: true,
      data: updatedInvoice
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error sending invoice:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'SEND_ERROR',
        message: 'Failed to send invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}