import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { ApiResponse, Invoice } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (you might want to add authentication)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const service = await GoogleSheetsService.getAuthenticatedService();
    
    // Get all recurring invoices that are due
    const dueInvoices = await service.getRecurringInvoicesDue();
    const generatedInvoices: Invoice[] = [];
    const errors: string[] = [];

    console.log(`Found ${dueInvoices.length} recurring invoices due for generation`);

    // Generate invoices for each due recurring invoice
    for (const templateInvoice of dueInvoices) {
      try {
        const newInvoice = await service.generateRecurringInvoice(templateInvoice);
        if (newInvoice) {
          generatedInvoices.push(newInvoice);
          console.log(`Generated invoice ${newInvoice.invoiceNumber} from recurring template ${templateInvoice.invoiceNumber}`);
        } else {
          errors.push(`Failed to generate invoice from template ${templateInvoice.invoiceNumber}`);
        }
      } catch (error) {
        console.error(`Error generating invoice from template ${templateInvoice.invoiceNumber}:`, error);
        errors.push(`Error generating invoice from template ${templateInvoice.invoiceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const response: ApiResponse<{
      generated: Invoice[];
      count: number;
      errors: string[];
      processedAt: string;
    }> = {
      success: true,
      data: {
        generated: generatedInvoices,
        count: generatedInvoices.length,
        errors,
        processedAt: new Date().toISOString()
      }
    };

    console.log(`Recurring invoice generation completed: ${generatedInvoices.length} generated, ${errors.length} errors`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in recurring invoice cron job:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'CRON_ERROR',
        message: 'Failed to process recurring invoices',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// Also allow GET for testing purposes
export async function GET(request: NextRequest) {
  try {
    const service = await GoogleSheetsService.getAuthenticatedService();
    const dueInvoices = await service.getRecurringInvoicesDue();

    const response: ApiResponse<{
      dueInvoices: Invoice[];
      count: number;
      checkedAt: string;
    }> = {
      success: true,
      data: {
        dueInvoices,
        count: dueInvoices.length,
        checkedAt: new Date().toISOString()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking due recurring invoices:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'CHECK_ERROR',
        message: 'Failed to check due recurring invoices'
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}