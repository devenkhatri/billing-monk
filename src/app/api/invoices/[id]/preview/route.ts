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

    // Generate HTML preview
    const pdfGenerator = new PDFGenerator();
    const htmlPreview = await pdfGenerator.generatePreviewHTML({
      invoice,
      client,
      companySettings
    });

    // Return HTML as response
    return new NextResponse(htmlPreview, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to generate preview',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}