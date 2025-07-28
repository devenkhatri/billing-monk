import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { ApiResponse, Invoice } from '@/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'isActive must be a boolean value'
        }
      };
      return NextResponse.json(response, { status: 400 });
    }

    const service = await GoogleSheetsService.getAuthenticatedService();
    const updatedInvoice = await service.toggleRecurringInvoice(id, isActive);

    if (!updatedInvoice) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recurring invoice not found or not a recurring invoice'
        }
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Invoice> = {
      success: true,
      data: updatedInvoice
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating recurring invoice:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update recurring invoice'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const service = await GoogleSheetsService.getAuthenticatedService();
    
    // Get the recurring invoice template
    const templateInvoice = await service.getInvoice(id);
    if (!templateInvoice || !templateInvoice.isRecurring) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recurring invoice template not found'
        }
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Generate a new invoice from the template
    const newInvoice = await service.generateRecurringInvoice(templateInvoice);
    
    if (!newInvoice) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: 'Failed to generate invoice from recurring template'
        }
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ApiResponse<Invoice> = {
      success: true,
      data: newInvoice
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating invoice from recurring template:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: 'Failed to generate invoice from recurring template'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}