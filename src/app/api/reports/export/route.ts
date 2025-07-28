import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { RevenueReport, ClientReport, InvoiceStatusReport, InvoiceStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const format = searchParams.get('format') || 'csv';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const clientId = searchParams.get('clientId');

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();

    if (format === 'pdf') {
      // Handle PDF export
      let pdfBuffer: Buffer;
      let filename = '';

      switch (reportType) {
        case 'revenue':
          const revenueData = await generateRevenueReport(sheetsService, dateFrom, dateTo);
          pdfBuffer = await generateRevenuePDF(revenueData, dateFrom, dateTo);
          filename = `revenue-report-${new Date().toISOString().split('T')[0]}.pdf`;
          break;

        case 'client':
          const clientData = await generateClientReport(sheetsService, dateFrom, dateTo, clientId);
          pdfBuffer = await generateClientPDF(clientData, dateFrom, dateTo);
          filename = `client-report-${new Date().toISOString().split('T')[0]}.pdf`;
          break;

        case 'invoice-status':
          const statusData = await generateInvoiceStatusReport(sheetsService, dateFrom, dateTo);
          pdfBuffer = await generateInvoiceStatusPDF(statusData, dateFrom, dateTo);
          filename = `invoice-status-report-${new Date().toISOString().split('T')[0]}.pdf`;
          break;

        default:
          return NextResponse.json({
            success: false,
            error: { code: 'INVALID_REPORT_TYPE', message: 'Invalid report type specified' }
          }, { status: 400 });
      }

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else {
      // Handle CSV export
      let csvContent = '';
      let filename = '';

      switch (reportType) {
        case 'revenue':
          const revenueData = await generateRevenueReport(sheetsService, dateFrom, dateTo);
          csvContent = generateRevenueCSV(revenueData);
          filename = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'client':
          const clientData = await generateClientReport(sheetsService, dateFrom, dateTo, clientId);
          csvContent = generateClientCSV(clientData);
          filename = `client-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'invoice-status':
          const statusData = await generateInvoiceStatusReport(sheetsService, dateFrom, dateTo);
          csvContent = generateInvoiceStatusCSV(statusData);
          filename = `invoice-status-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;

        default:
          return NextResponse.json({
            success: false,
            error: { code: 'INVALID_REPORT_TYPE', message: 'Invalid report type specified' }
          }, { status: 400 });
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'EXPORT_FAILED', message: 'Failed to export report' }
    }, { status: 500 });
  }
}

// Helper functions (reusing from main reports route)
async function generateRevenueReport(
  sheetsService: GoogleSheetsService,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  const invoices = await sheetsService.getInvoices();
  
  let filteredInvoices = invoices;
  if (dateFrom || dateTo) {
    filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      if (dateFrom && invoiceDate < new Date(dateFrom)) return false;
      if (dateTo && invoiceDate > new Date(dateTo)) return false;
      return true;
    });
  }

  const monthlyData = new Map<string, {
    revenue: number;
    invoiceCount: number;
    clientIds: Set<string>;
  }>();

  filteredInvoices.forEach(invoice => {
    const monthKey = new Date(invoice.issueDate).toISOString().substring(0, 7);
    
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
) {
  const invoices = await sheetsService.getInvoices();
  const clients = await sheetsService.getClients();
  
  let filteredInvoices = invoices;
  if (dateFrom || dateTo) {
    filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      if (dateFrom && invoiceDate < new Date(dateFrom)) return false;
      if (dateTo && invoiceDate > new Date(dateTo)) return false;
      return true;
    });
  }

  if (clientId) {
    filteredInvoices = filteredInvoices.filter(invoice => invoice.clientId === clientId);
  }

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
) {
  const invoices = await sheetsService.getInvoices();
  
  let filteredInvoices = invoices;
  if (dateFrom || dateTo) {
    filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate);
      if (dateFrom && invoiceDate < new Date(dateFrom)) return false;
      if (dateTo && invoiceDate > new Date(dateTo)) return false;
      return true;
    });
  }

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

function generateRevenueCSV(data: RevenueReport[]): string {
  const headers = ['Period', 'Revenue', 'Invoice Count', 'Client Count'];
  const rows = data.map(item => [
    item.period,
    item.revenue.toFixed(2),
    item.invoiceCount.toString(),
    item.clientCount.toString()
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

function generateClientCSV(data: ClientReport[]): string {
  const headers = ['Client Name', 'Total Invoiced', 'Total Paid', 'Outstanding Amount', 'Invoice Count'];
  const rows = data.map(item => [
    item.clientName,
    item.totalInvoiced.toFixed(2),
    item.totalPaid.toFixed(2),
    item.outstandingAmount.toFixed(2),
    item.invoiceCount.toString()
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

function generateInvoiceStatusCSV(data: InvoiceStatusReport[]): string {
  const headers = ['Status', 'Count', 'Total Amount'];
  const rows = data.map(item => [
    item.status,
    item.count.toString(),
    item.totalAmount.toFixed(2)
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

// PDF Generation Functions
import jsPDF from 'jspdf';

async function generateRevenuePDF(data: RevenueReport[], dateFrom?: string | null, dateTo?: string | null): Promise<Buffer> {
  const doc = new jsPDF();

  
  // Title
  doc.setFontSize(20);
  doc.text('Revenue Report', 20, 30);
  
  // Date range
  if (dateFrom && dateTo) {
    doc.setFontSize(12);
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 20, 45);
  }
  
  // Summary
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalInvoices = data.reduce((sum, item) => sum + item.invoiceCount, 0);
  
  doc.setFontSize(14);
  doc.text('Summary:', 20, 65);
  doc.setFontSize(12);
  doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, 80);
  doc.text(`Total Invoices: ${totalInvoices}`, 20, 95);
  doc.text(`Average Revenue/Month: $${(data.length > 0 ? totalRevenue / data.length : 0).toFixed(2)}`, 20, 110);
  
  // Table headers
  let yPos = 130;
  doc.setFontSize(12);
  doc.text('Period', 20, yPos);
  doc.text('Revenue', 80, yPos);
  doc.text('Invoices', 130, yPos);
  doc.text('Clients', 170, yPos);
  
  // Table data
  yPos += 10;
  data.forEach((item) => {
    const [year, month] = item.period.split('-');
    const date = new Date(parseInt(year || '0'), parseInt(month || '0') - 1);
    const periodText = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    doc.text(periodText, 20, yPos);
    doc.text(`$${item.revenue.toFixed(2)}`, 80, yPos);
    doc.text(item.invoiceCount.toString(), 130, yPos);
    doc.text(item.clientCount.toString(), 170, yPos);
    yPos += 15;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 30;
    }
  });
  
  return Buffer.from(doc.output('arraybuffer'));
}

async function generateClientPDF(data: ClientReport[], dateFrom?: string | null, dateTo?: string | null): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Client Report', 20, 30);
  
  // Date range
  if (dateFrom && dateTo) {
    doc.setFontSize(12);
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 20, 45);
  }
  
  // Summary
  const totalInvoiced = data.reduce((sum, item) => sum + item.totalInvoiced, 0);
  const totalPaid = data.reduce((sum, item) => sum + item.totalPaid, 0);
  const totalOutstanding = data.reduce((sum, item) => sum + item.outstandingAmount, 0);
  
  doc.setFontSize(14);
  doc.text('Summary:', 20, 65);
  doc.setFontSize(12);
  doc.text(`Total Invoiced: $${totalInvoiced.toFixed(2)}`, 20, 80);
  doc.text(`Total Paid: $${totalPaid.toFixed(2)}`, 20, 95);
  doc.text(`Outstanding: $${totalOutstanding.toFixed(2)}`, 20, 110);
  doc.text(`Active Clients: ${data.length}`, 20, 125);
  
  // Table headers
  let yPos = 145;
  doc.setFontSize(10);
  doc.text('Client', 20, yPos);
  doc.text('Invoiced', 80, yPos);
  doc.text('Paid', 120, yPos);
  doc.text('Outstanding', 150, yPos);
  doc.text('Rate', 185, yPos);
  
  // Table data
  yPos += 10;
  data.forEach((item) => {
    const paymentRate = item.totalInvoiced > 0 ? (item.totalPaid / item.totalInvoiced) * 100 : 0;
    
    doc.text(item.clientName.substring(0, 20), 20, yPos);
    doc.text(`$${item.totalInvoiced.toFixed(2)}`, 80, yPos);
    doc.text(`$${item.totalPaid.toFixed(2)}`, 120, yPos);
    doc.text(`$${item.outstandingAmount.toFixed(2)}`, 150, yPos);
    doc.text(`${paymentRate.toFixed(1)}%`, 185, yPos);
    yPos += 12;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 30;
    }
  });
  
  return Buffer.from(doc.output('arraybuffer'));
}

async function generateInvoiceStatusPDF(data: InvoiceStatusReport[], dateFrom?: string | null, dateTo?: string | null): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Invoice Status Report', 20, 30);
  
  // Date range
  if (dateFrom && dateTo) {
    doc.setFontSize(12);
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 20, 45);
  }
  
  // Summary
  const totalInvoices = data.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0);
  
  doc.setFontSize(14);
  doc.text('Summary:', 20, 65);
  doc.setFontSize(12);
  doc.text(`Total Invoices: ${totalInvoices}`, 20, 80);
  doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, 95);
  
  // Table headers
  let yPos = 115;
  doc.setFontSize(12);
  doc.text('Status', 20, yPos);
  doc.text('Count', 80, yPos);
  doc.text('Total Amount', 130, yPos);
  doc.text('Percentage', 170, yPos);
  
  // Table data
  yPos += 10;
  data.forEach((item) => {
    const percentage = totalInvoices > 0 ? (item.count / totalInvoices) * 100 : 0;
    
    doc.text(item.status.charAt(0).toUpperCase() + item.status.slice(1), 20, yPos);
    doc.text(item.count.toString(), 80, yPos);
    doc.text(`$${item.totalAmount.toFixed(2)}`, 130, yPos);
    doc.text(`${percentage.toFixed(1)}%`, 170, yPos);
    yPos += 15;
  });
  
  return Buffer.from(doc.output('arraybuffer'));
}