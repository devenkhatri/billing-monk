import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { PDFGenerator } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await GoogleSheetsService.getAuthenticatedService();
    
    // Get invoice data
    const invoice = await service.getInvoice(id);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    // Get client data
    const client = await service.getClient(invoice.clientId);
    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } },
        { status: 404 }
      );
    }

    // Get company settings
    const companySettings = await service.getCompanySettings();
    if (!companySettings) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Company settings not found' } },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generateInvoicePDF({
      invoice,
      client,
      companySettings
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to generate PDF',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}