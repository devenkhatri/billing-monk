import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { invoiceFormSchema } from '@/lib/validations';
import { ApiResponse, Invoice, UpdateInvoiceData, LineItem } from '@/types';
import { generateId } from '@/lib/utils';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await params;
    
    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 'Invoice ID is required', 400);
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const invoice = await sheetsService.getInvoice(id);

    if (!invoice) {
      return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
    }

    return createSuccessResponse(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return createErrorResponse(
      'FETCH_ERROR',
      'Failed to fetch invoice',
      500,
      error
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await params;
    
    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 'Invoice ID is required', 400);
    }

    const body = await request.json();
    
    // Check if this is a status update or full form update
    const isStatusUpdate = body.status && Object.keys(body).length <= 3; // status, sentDate, and maybe one more field

    let updateData: UpdateInvoiceData;

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
        return createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid invoice data',
          400,
          validationResult.error.issues
        );
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

      // Transform recurring schedule if present
      let recurringSchedule: UpdateInvoiceData['recurringSchedule'] = undefined;
      if (formData.isRecurring && formData.recurringSchedule) {
        recurringSchedule = {
          frequency: formData.recurringSchedule.frequency,
          interval: formData.recurringSchedule.interval,
          startDate: new Date(formData.recurringSchedule.startDate),
          endDate: formData.recurringSchedule.endDate ? new Date(formData.recurringSchedule.endDate) : undefined,
          nextInvoiceDate: new Date(formData.recurringSchedule.startDate), // Will be calculated in service
          isActive: true
        };
      }

      updateData = {
        clientId: formData.clientId,
        templateId: formData.templateId,
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(formData.dueDate),
        lineItems,
        taxRate: formData.taxRate,
        notes: formData.notes,
        isRecurring: formData.isRecurring,
        recurringSchedule
      };
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const invoice = await sheetsService.updateInvoice(id, updateData);

    if (!invoice) {
      return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
    }

    return createSuccessResponse(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return createErrorResponse(
      'UPDATE_ERROR',
      'Failed to update invoice',
      500,
      error
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await params;
    
    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 'Invoice ID is required', 400);
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const success = await sheetsService.deleteInvoice(id);

    if (!success) {
      return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
    }

    return createSuccessResponse({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return createErrorResponse(
      'DELETE_ERROR',
      'Failed to delete invoice',
      500,
      error
    );
  }
}