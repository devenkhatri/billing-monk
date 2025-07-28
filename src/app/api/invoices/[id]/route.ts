import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { invoiceFormSchema } from '@/lib/validations';
import { ApiResponse, Invoice, CreateInvoiceData, LineItem } from '@/types';
import { generateId } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const invoice = await sheetsService.getInvoice(params.id);

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

    const response: ApiResponse<Invoice> = {
      success: true,
      data: invoice
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch invoice'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Check if this is a status update or full form update
    const isStatusUpdate = body.status && Object.keys(body).length <= 3; // status, sentDate, and maybe one more field

    let updateData: Partial<CreateInvoiceData>;

    if (isStatusUpdate) {
      // Simple status update
      updateData = {
        status: body.status,
        sentDate: body.sentDate ? new Date(body.sentDate) : undefined
      };
    } else {
      // Full form update - validate with schema
      const validationResult = invoiceFormSchema.safeParse(body);
      if (!validationResult.success) {
        const response: ApiResponse<never> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid invoice data',
            details: validationResult.error.errors
          }
        };
        return NextResponse.json(response, { status: 400 });
      }

      const formData = validationResult.data;
      
      // Transform form data to update invoice data
      const lineItems: LineItem[] = formData.lineItems.map(item => ({
        id: generateId(),
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate
      }));

      updateData = {
        clientId: formData.clientId,
        templateId: formData.templateId,
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(formData.dueDate),
        lineItems,
        taxRate: formData.taxRate,
        notes: formData.notes,
        isRecurring: formData.isRecurring,
        recurringSchedule: formData.recurringSchedule ? {
          ...formData.recurringSchedule,
          nextInvoiceDate: new Date(formData.recurringSchedule.startDate),
          isActive: true
        } : undefined
      };
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const invoice = await sheetsService.updateInvoice(params.id, updateData);

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

    const response: ApiResponse<Invoice> = {
      success: true,
      data: invoice
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating invoice:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update invoice'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const success = await sheetsService.deleteInvoice(params.id);

    if (!success) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found'
        }
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Invoice deleted successfully' }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting invoice:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete invoice'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}