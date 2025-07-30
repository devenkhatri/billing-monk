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
    
    // Fetch data sequentially to avoid quota issues
    console.log('Fetching dashboard data sequentially...');
    const clients = await sheetsService.getClients();
    console.log(`Fetched ${clients.length} clients`);
    
    const invoices = await sheetsService.getInvoices();
    console.log(`Fetched ${invoices.length} invoices`);
    
    const payments = await sheetsService.getPayments();
    console.log(`Fetched ${payments.length} payments`);
    
    const projects = await sheetsService.getProjects();
    console.log(`Fetched ${projects.length} projects`);
    
    const tasks = await sheetsService.getTasks();
    console.log(`Fetched ${tasks.length} tasks`);
    
    const timeEntries = await sheetsService.getTimeEntries();
    console.log(`Fetched ${timeEntries.length} time entries`);
    
    const templates = await sheetsService.getTemplates();
    console.log(`Fetched ${templates.length} templates`);

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

    // Generate comprehensive recent activity
    const recentActivity: ActivityItem[] = [];
    
    // Add recent invoices
    const recentInvoices = filteredInvoices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    recentInvoices.forEach(invoice => {
      const client = clients.find(c => c.id === invoice.clientId);
      recentActivity.push({
        id: `invoice-created-${invoice.id}`,
        type: 'invoice_created',
        description: `Invoice ${invoice.invoiceNumber} created for ${client?.name || 'Unknown Client'}`,
        timestamp: invoice.createdAt,
        relatedId: invoice.id,
        entityType: 'invoice',
        amount: invoice.total
      });

      // Add invoice status changes
      if (invoice.status === 'paid') {
        recentActivity.push({
          id: `invoice-paid-${invoice.id}`,
          type: 'invoice_paid',
          description: `Invoice ${invoice.invoiceNumber} marked as paid`,
          timestamp: invoice.updatedAt,
          relatedId: invoice.id,
          entityType: 'invoice',
          amount: invoice.total
        });
      }
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

    // Add recent clients
    const recentClients = clients
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    recentClients.forEach(client => {
      recentActivity.push({
        id: `client-${client.id}`,
        type: 'client_added',
        description: `New client "${client.name}" added`,
        timestamp: client.createdAt,
        relatedId: client.id,
        entityType: 'client'
      });
    });

    // Add recent projects
    const recentProjects = projects
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    recentProjects.forEach(project => {
      const client = clients.find(c => c.id === project.clientId);
      recentActivity.push({
        id: `project-created-${project.id}`,
        type: 'project_created',
        description: `Project "${project.name}" created for ${client?.name || 'Unknown Client'}`,
        timestamp: project.createdAt,
        relatedId: project.id,
        entityType: 'project'
      });

      // Add project completion
      if (project.status === 'completed') {
        recentActivity.push({
          id: `project-completed-${project.id}`,
          type: 'project_completed',
          description: `Project "${project.name}" marked as completed`,
          timestamp: project.updatedAt,
          relatedId: project.id,
          entityType: 'project'
        });
      }
    });

    // Add recent tasks
    const recentTasks = tasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    
    recentTasks.forEach(task => {
      const project = projects.find(p => p.id === task.projectId);
      recentActivity.push({
        id: `task-created-${task.id}`,
        type: 'task_created',
        description: `Task "${task.title}" created in project "${project?.name || 'Unknown Project'}"`,
        timestamp: task.createdAt,
        relatedId: task.id,
        entityType: 'task'
      });

      // Add task completion
      if (task.status === 'completed') {
        recentActivity.push({
          id: `task-completed-${task.id}`,
          type: 'task_completed',
          description: `Task "${task.title}" marked as completed`,
          timestamp: task.updatedAt,
          relatedId: task.id,
          entityType: 'task'
        });
      }
    });

    // Add recent time entries
    const recentTimeEntries = timeEntries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    
    recentTimeEntries.forEach(timeEntry => {
      const task = tasks.find(t => t.id === timeEntry.taskId);
      const project = task ? projects.find(p => p.id === task.projectId) : null;
      const hours = (timeEntry.duration / 3600).toFixed(1);
      
      recentActivity.push({
        id: `time-entry-${timeEntry.id}`,
        type: 'time_entry_created',
        description: `${hours}h logged for task "${task?.title || 'Unknown Task'}" in "${project?.name || 'Unknown Project'}"`,
        timestamp: timeEntry.createdAt,
        relatedId: timeEntry.id,
        entityType: 'time_entry'
      });
    });

    // Add recent templates
    const recentTemplates = templates
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    recentTemplates.forEach(template => {
      recentActivity.push({
        id: `template-${template.id}`,
        type: 'template_created',
        description: `Invoice template "${template.name}" created`,
        timestamp: template.createdAt,
        relatedId: template.id,
        entityType: 'template'
      });
    });

    // Sort and limit recent activity
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivity = recentActivity.slice(0, 15);

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