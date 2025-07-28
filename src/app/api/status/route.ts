import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { validateAuth } from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await validateAuth(request);
    if (!authResult.isValid) {
      return authResult.error;
    }

    const apiStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: {
        authentication: {
          '/api/auth/status': {
            methods: ['GET'],
            description: 'Check authentication status'
          }
        },
        clients: {
          '/api/clients': {
            methods: ['GET', 'POST'],
            description: 'List clients or create new client'
          },
          '/api/clients/[id]': {
            methods: ['GET', 'PUT', 'DELETE'],
            description: 'Get, update, or delete specific client'
          }
        },
        invoices: {
          '/api/invoices': {
            methods: ['GET', 'POST'],
            description: 'List invoices or create new invoice'
          },
          '/api/invoices/[id]': {
            methods: ['GET', 'PUT', 'DELETE'],
            description: 'Get, update, or delete specific invoice'
          },
          '/api/invoices/[id]/pdf': {
            methods: ['GET'],
            description: 'Generate PDF for invoice'
          },
          '/api/invoices/[id]/preview': {
            methods: ['GET'],
            description: 'Preview invoice before sending'
          },
          '/api/invoices/[id]/send': {
            methods: ['POST'],
            description: 'Send invoice to client'
          },
          '/api/invoices/recurring': {
            methods: ['GET', 'POST'],
            description: 'List recurring invoices or generate due invoices'
          },
          '/api/invoices/recurring/[id]': {
            methods: ['GET', 'PUT', 'DELETE'],
            description: 'Manage specific recurring invoice'
          }
        },
        payments: {
          '/api/payments': {
            methods: ['GET', 'POST'],
            description: 'List payments or record new payment'
          },
          '/api/payments/[id]': {
            methods: ['GET', 'PUT', 'DELETE'],
            description: 'Get, update, or delete specific payment'
          }
        },
        templates: {
          '/api/templates': {
            methods: ['GET', 'POST'],
            description: 'List templates or create new template'
          },
          '/api/templates/[id]': {
            methods: ['GET', 'PUT', 'DELETE'],
            description: 'Get, update, or delete specific template'
          }
        },
        settings: {
          '/api/settings': {
            methods: ['GET', 'PUT'],
            description: 'Get or update company settings'
          }
        },
        reports: {
          '/api/reports': {
            methods: ['GET'],
            description: 'Generate various business reports',
            queryParams: {
              type: 'revenue | client | invoice-status',
              dateFrom: 'ISO date string (optional)',
              dateTo: 'ISO date string (optional)',
              clientId: 'UUID (optional, for client reports)'
            }
          },
          '/api/reports/export': {
            methods: ['GET'],
            description: 'Export reports in various formats'
          }
        },
        dashboard: {
          '/api/dashboard': {
            methods: ['GET'],
            description: 'Get dashboard metrics and analytics'
          }
        },
        bulk: {
          '/api/bulk': {
            methods: ['POST'],
            description: 'Perform bulk operations on multiple records'
          }
        },
        sheets: {
          '/api/sheets/setup': {
            methods: ['GET', 'POST'],
            description: 'Setup or check Google Sheets integration'
          }
        },
        cron: {
          '/api/cron/recurring-invoices': {
            methods: ['POST'],
            description: 'Generate recurring invoices (automated)'
          }
        }
      },
      features: {
        authentication: 'Google OAuth with NextAuth.js',
        dataStorage: 'Google Sheets API v4',
        pdfGeneration: 'Server-side PDF generation',
        recurringInvoices: 'Automated recurring invoice generation',
        bulkOperations: 'Bulk delete and status updates',
        reporting: 'Revenue, client, and status reports',
        realTimeSync: 'Real-time Google Sheets synchronization'
      },
      limits: {
        pagination: {
          maxLimit: 100,
          defaultLimit: 10
        },
        bulkOperations: {
          maxItems: 50
        },
        fileUpload: {
          maxSize: '10MB',
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
        }
      }
    };

    return createSuccessResponse(apiStatus);
  } catch (error) {
    console.error('API status error:', error);
    return createErrorResponse(
      'STATUS_ERROR',
      'Failed to get API status',
      500,
      error
    );
  }
}