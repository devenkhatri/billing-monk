import { NextRequest } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { validateAuth, validateRequestBody } from '@/lib/api-validation';
import { z } from 'zod';

// Bulk operation schemas
const bulkDeleteSchema = z.object({
  operation: z.literal('delete'),
  type: z.enum(['clients', 'invoices', 'payments', 'templates']),
  ids: z.array(z.string()).min(1, 'At least one ID is required')
});

const bulkUpdateStatusSchema = z.object({
  operation: z.literal('updateStatus'),
  type: z.literal('invoices'),
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
});

const bulkOperationSchema = z.discriminatedUnion('operation', [
  bulkDeleteSchema,
  bulkUpdateStatusSchema
]);

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.isValid) {
      return authResult.error;
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = validateRequestBody(body, bulkOperationSchema);
    if (!validationResult.isValid) {
      return validationResult.error;
    }

    const data = validationResult.data;
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();

    switch (data.operation) {
      case 'delete':
        return await handleBulkDelete(sheetsService, data.type, data.ids);
      
      case 'updateStatus':
        return await handleBulkUpdateStatus(sheetsService, data.ids, data.status);
      
      default:
        return createErrorResponse('INVALID_OPERATION', 'Unsupported bulk operation', 400);
    }
  } catch (error) {
    console.error('Bulk operation error:', error);
    return createErrorResponse(
      'BULK_OPERATION_ERROR',
      'Failed to perform bulk operation',
      500,
      error
    );
  }
}

async function handleBulkDelete(
  sheetsService: GoogleSheetsService,
  type: 'clients' | 'invoices' | 'payments' | 'templates',
  ids: string[]
) {
  const results = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[]
  };

  for (const id of ids) {
    try {
      let success = false;
      
      switch (type) {
        case 'clients':
          success = await sheetsService.deleteClient(id);
          break;
        case 'invoices':
          success = await sheetsService.deleteInvoice(id);
          break;
        case 'payments':
          success = await sheetsService.deletePayment(id);
          break;
        case 'templates':
          success = await sheetsService.deleteTemplate(id);
          break;
      }

      if (success) {
        results.successful.push(id);
      } else {
        results.failed.push({ id, error: 'Item not found' });
      }
    } catch (error) {
      results.failed.push({ 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return createSuccessResponse({
    operation: 'delete',
    type,
    results,
    summary: {
      total: ids.length,
      successful: results.successful.length,
      failed: results.failed.length
    }
  });
}

async function handleBulkUpdateStatus(
  sheetsService: GoogleSheetsService,
  ids: string[],
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
) {
  const results = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[]
  };

  for (const id of ids) {
    try {
      const invoice = await sheetsService.updateInvoice(id, { status });
      
      if (invoice) {
        results.successful.push(id);
      } else {
        results.failed.push({ id, error: 'Invoice not found' });
      }
    } catch (error) {
      results.failed.push({ 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return createSuccessResponse({
    operation: 'updateStatus',
    type: 'invoices',
    status,
    results,
    summary: {
      total: ids.length,
      successful: results.successful.length,
      failed: results.failed.length
    }
  });
}