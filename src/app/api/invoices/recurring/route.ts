import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { ApiResponse, Invoice } from '@/types';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const service = await GoogleSheetsService.getAuthenticatedService();
    const recurringInvoices = await service.getRecurringInvoices();

    return createSuccessResponse(recurringInvoices);
  } catch (error) {
    console.error('Error fetching recurring invoices:', error);
    return createErrorResponse(
      'FETCH_ERROR',
      'Failed to fetch recurring invoices',
      500,
      error
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

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

    return createSuccessResponse({
      generated: generatedInvoices,
      count: generatedInvoices.length
    });
  } catch (error) {
    console.error('Error generating recurring invoices:', error);
    return createErrorResponse(
      'GENERATION_ERROR',
      'Failed to generate recurring invoices',
      500,
      error
    );
  }
}