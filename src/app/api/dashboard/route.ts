import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { DashboardMetrics, ActivityItem } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Fetch all data needed for dashboard metrics
    const [clients, invoices, payments] = await Promise.all([
      sheetsService.getClients(),
      sheetsService.getInvoices(),
      sheetsService.getPayments()
    ]);

    // Filter data by date range if provided
    const filteredInvoices = dateFrom && dateTo 
      ? invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate >= new Date(dateFrom) && invoiceDate <= new Date(dateTo);
        })
      : invoices;

    const filteredPayments = dateFrom && dateTo
      ? payments.filter(payment => {
          const paymentDate = new Date(payment.paymentDate);
          return paymentDate >= new Date(dateFrom) && paymentDate <= new Date(dateTo);
        })
      : payments;

    // Calculate metrics
    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingAmount = filteredInvoices
      .filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled')
      .reduce((sum, invoice) => sum + invoice.balance, 0);
    
    const paidAmount = filteredInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    const overdueAmount = filteredInvoices
      .filter(invoice => {
        const dueDate = new Date(invoice.dueDate);
        const now = new Date();
        return invoice.status !== 'paid' && invoice.status !== 'cancelled' && dueDate < now;
      })
      .reduce((sum, invoice) => sum + invoice.balance, 0);

    const totalClients = clients.length;
    const activeClients = clients.filter(client => {
      return filteredInvoices.some(invoice => invoice.clientId === client.id);
    }).length;

    const totalInvoices = filteredInvoices.length;
    const paidInvoices = filteredInvoices.filter(invoice => invoice.status === 'paid').length;
    const overdueInvoices = filteredInvoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const now = new Date();
      return invoice.status !== 'paid' && invoice.status !== 'cancelled' && dueDate < now;
    }).length;

    // Generate recent activity
    const recentActivity: ActivityItem[] = [];
    
    // Add recent invoices
    const recentInvoices = filteredInvoices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    recentInvoices.forEach(invoice => {
      const client = clients.find(c => c.id === invoice.clientId);
      recentActivity.push({
        id: `invoice-${invoice.id}`,
        type: 'invoice_created',
        description: `Invoice ${invoice.invoiceNumber} created for ${client?.name || 'Unknown Client'}`,
        timestamp: invoice.createdAt,
        relatedId: invoice.id
      });
    });

    // Add recent payments
    const recentPayments = filteredPayments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    recentPayments.forEach(payment => {
      const invoice = invoices.find(i => i.id === payment.invoiceId);
      const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;
      recentActivity.push({
        id: `payment-${payment.id}`,
        type: 'payment_received',
        description: `Payment of $${payment.amount.toFixed(2)} received from ${client?.name || 'Unknown Client'}`,
        timestamp: payment.createdAt,
        relatedId: payment.invoiceId
      });
    });

    // Sort and limit recent activity
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivity = recentActivity.slice(0, 10);

    const metrics: DashboardMetrics = {
      totalRevenue,
      outstandingAmount,
      paidAmount,
      overdueAmount,
      totalClients,
      activeClients,
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      recentActivity: limitedActivity
    };

    return createSuccessResponse(metrics);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch dashboard metrics',
      500,
      error
    );
  }
}