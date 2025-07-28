import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { ApiResponse, Invoice } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const service = await GoogleSheetsService.getAuthenticatedService();
    const recurringInvoices = await service.getRecurringInvoices();

    const response: ApiResponse<Invoice[]> = {
      success: true,
      data: recurringInvoices
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching recurring invoices:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch recurring invoices'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const service = await GoogleSheetsService.getAuthenticatedService();
    
    // Get all recurring invoices that are due
    const dueInvoices = await service.getRecurringInvoicesDue();
    const generatedInvoices: Invoice[] = [];

    // Generate invoices for each due recurring invoice
    for (const templateInvoice of dueInvoices) {
      const newInvoice = await service.generateRecurringInvoice(templateInvoice);
      if (newInvoice) {
        generatedInvoices.push(newInvoice);
      }
    }

    const response: ApiResponse<{
      generated: Invoice[];
      count: number;
    }> = {
      success: true,
      data: {
        generated: generatedInvoices,
        count: generatedInvoices.length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating recurring invoices:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: 'Failed to generate recurring invoices'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}