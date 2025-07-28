import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { RevenueReport, ClientReport, InvoiceStatusReport, InvoiceStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const clientId = searchParams.get('clientId');

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();

    switch (reportType) {
      case 'revenue':
        const revenueReport = await generateRevenueReport(sheetsService, dateFrom, dateTo);
        return NextResponse.json({ success: true, data: revenueReport });

      case 'client':
        const clientReport = await generateClientReport(sheetsService, dateFrom, dateTo, clientId);
        return NextResponse.json({ success: true, data: clientReport });

      case 'invoice-status':
        const statusReport = await generateInvoiceStatusReport(sheetsService, dateFrom, dateTo);
        return NextResponse.json({ success: true, data: statusReport });

      default:
        return NextResponse.json({
          success: false,
          error: { code: 'INVALID_REPORT_TYPE', message: 'Invalid report type specified' }
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'REPORT_GENERATION_FAILED', message: 'Failed to generate report' }
    }, { status: 500 });
  }
}

async function generateRevenueReport(
  sheetsService: GoogleSheetsService,
  dateFrom?: string | null,
  dateTo?: string | null
): Promise<RevenueReport[]> {
  const invoices = await sheetsService.getInvoices();
  
  // Filter invoices by date range if provided
  let filteredInvoices = invoices;
  if (dateFrom || dateTo) {
    filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      if (dateFrom && invoiceDate < new Date(dateFrom)) return false;
      if (dateTo && invoiceDate > new Date(dateTo)) return false;
      return true;
    });
  }

  // Group by month
  const monthlyData = new Map<string, {
    revenue: number;
    invoiceCount: number;
    clientIds: Set<string>;
  }>();

  filteredInvoices.forEach(invoice => {
    const monthKey = new Date(invoice.issueDate).toISOString().substring(0, 7); // YYYY-MM
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        revenue: 0,
        invoiceCount: 0,
        clientIds: new Set()
      });
    }

    const data = monthlyData.get(monthKey)!;
    data.revenue += invoice.paidAmount;
    data.invoiceCount += 1;
    data.clientIds.add(invoice.clientId);
  });

  return Array.from(monthlyData.entries())
    .map(([period, data]) => ({
      period,
      revenue: data.revenue,
      invoiceCount: data.invoiceCount,
      clientCount: data.clientIds.size
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

async function generateClientReport(
  sheetsService: GoogleSheetsService,
  dateFrom?: string | null,
  dateTo?: string | null,
  clientId?: string | null
): Promise<ClientReport[]> {
  const invoices = await sheetsService.getInvoices();
  const clients = await sheetsService.getClients();
  
  // Filter invoices by date range if provided
  let filteredInvoices = invoices;
  if (dateFrom || dateTo) {
    filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      if (dateFrom && invoiceDate < new Date(dateFrom)) return false;
      if (dateTo && invoiceDate > new Date(dateTo)) return false;
      return true;
    });
  }

  // Filter by specific client if provided
  if (clientId) {
    filteredInvoices = filteredInvoices.filter(invoice => invoice.clientId === clientId);
  }

  // Group by client
  const clientData = new Map<string, {
    totalInvoiced: number;
    totalPaid: number;
    invoiceCount: number;
  }>();

  filteredInvoices.forEach(invoice => {
    if (!clientData.has(invoice.clientId)) {
      clientData.set(invoice.clientId, {
        totalInvoiced: 0,
        totalPaid: 0,
        invoiceCount: 0
      });
    }

    const data = clientData.get(invoice.clientId)!;
    data.totalInvoiced += invoice.total;
    data.totalPaid += invoice.paidAmount;
    data.invoiceCount += 1;
  });

  return Array.from(clientData.entries())
    .map(([clientId, data]) => {
      const client = clients.find(c => c.id === clientId);
      return {
        clientId,
        clientName: client?.name || 'Unknown Client',
        totalInvoiced: data.totalInvoiced,
        totalPaid: data.totalPaid,
        outstandingAmount: data.totalInvoiced - data.totalPaid,
        invoiceCount: data.invoiceCount
      };
    })
    .sort((a, b) => b.totalInvoiced - a.totalInvoiced);
}

async function generateInvoiceStatusReport(
  sheetsService: GoogleSheetsService,
  dateFrom?: string | null,
  dateTo?: string | null
): Promise<InvoiceStatusReport[]> {
  const invoices = await sheetsService.getInvoices();
  
  // Filter invoices by date range if provided
  let filteredInvoices = invoices;
  if (dateFrom || dateTo) {
    filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      if (dateFrom && invoiceDate < new Date(dateFrom)) return false;
      if (dateTo && invoiceDate > new Date(dateTo)) return false;
      return true;
    });
  }

  // Group by status
  const statusData = new Map<string, {
    count: number;
    totalAmount: number;
  }>();

  filteredInvoices.forEach(invoice => {
    if (!statusData.has(invoice.status)) {
      statusData.set(invoice.status, {
        count: 0,
        totalAmount: 0
      });
    }

    const data = statusData.get(invoice.status)!;
    data.count += 1;
    data.totalAmount += invoice.total;
  });

  return Array.from(statusData.entries())
    .map(([status, data]) => ({
      status: status as InvoiceStatus,
      count: data.count,
      totalAmount: data.totalAmount
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}