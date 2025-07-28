import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { invoiceFormSchema } from '@/lib/validations';
import { ApiResponse, Invoice, CreateInvoiceData, LineItem } from '@/types';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const invoices = await sheetsService.getInvoices();

    const response: ApiResponse<Invoice[]> = {
      success: true,
      data: invoices
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch invoices'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
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
    
    // Transform form data to create invoice data
    const lineItems: LineItem[] = formData.lineItems.map(item => ({
      id: generateId(),
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate
    }));

    const createData: CreateInvoiceData = {
      clientId: formData.clientId,
      templateId: formData.templateId,
      status: 'draft',
      issueDate: new Date(formData.issueDate),
      dueDate: new Date(formData.dueDate),
      lineItems,
      subtotal: 0, // Will be calculated in service
      taxRate: formData.taxRate,
      taxAmount: 0, // Will be calculated in service
      total: 0, // Will be calculated in service
      notes: formData.notes,
      isRecurring: formData.isRecurring,
      recurringSchedule: formData.recurringSchedule ? {
        ...formData.recurringSchedule,
        nextInvoiceDate: new Date(formData.recurringSchedule.startDate),
        isActive: true
      } : undefined
    };

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const invoice = await sheetsService.createInvoice(createData);

    const response: ApiResponse<Invoice> = {
      success: true,
      data: invoice
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create invoice'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}