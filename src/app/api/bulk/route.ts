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

const bulkUpdateSchema = z.object({
  operation: z.literal('update'),
  type: z.enum(['clients', 'invoices', 'payments', 'templates']),
  updates: z.array(z.object({
    id: z.string(),
    data: z.record(z.string(), z.any())
  })).min(1, 'At least one update is required')
});

const bulkCreateSchema = z.object({
  operation: z.literal('create'),
  type: z.enum(['clients', 'invoices', 'payments', 'templates']),
  items: z.array(z.record(z.string(), z.any())).min(1, 'At least one item is required')
});

const bulkOperationSchema = z.discriminatedUnion('operation', [
  bulkDeleteSchema,
  bulkUpdateStatusSchema,
  bulkUpdateSchema,
  bulkCreateSchema
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

    const data = validationResult.data!;
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();

    switch (data.operation) {
      case 'delete':
        return await handleBulkDelete(sheetsService, data.type, data.ids);
      
      case 'updateStatus':
        return await handleBulkUpdateStatus(sheetsService, data.ids, data.status);
      
      case 'update':
        return await handleBulkUpdate(sheetsService, data.type, data.updates);
      
      case 'create':
        return await handleBulkCreate(sheetsService, data.type, data.items);
      
      default:
        return createErrorResponse('INVALID_INPUT', 'Unsupported bulk operation', 400);
    }
  } catch (error) {
    console.error('Bulk operation error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
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

  // Process in batches of 10 to avoid overwhelming the API
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const batchPromises = batch.map(async (id) => {
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

        return { id, success, error: null };
      } catch (error) {
        return { 
          id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { id, success, error } = result.value;
        if (success) {
          results.successful.push(id);
        } else {
          results.failed.push({ id, error: error || 'Item not found' });
        }
      } else {
        // This shouldn't happen with our current implementation, but just in case
        results.failed.push({ 
          id: 'unknown', 
          error: result.reason?.message || 'Batch operation failed' 
        });
      }
    });
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

  // Process in batches of 10
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const batchPromises = batch.map(async (id) => {
      try {
        const invoice = await sheetsService.updateInvoice(id, { status });
        return { id, invoice, error: null };
      } catch (error) {
        return { 
          id, 
          invoice: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { id, invoice, error } = result.value;
        if (invoice) {
          results.successful.push(id);
        } else {
          results.failed.push({ id, error: error || 'Invoice not found' });
        }
      } else {
        results.failed.push({ 
          id: 'unknown', 
          error: result.reason?.message || 'Batch operation failed' 
        });
      }
    });
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

async function handleBulkUpdate(
  sheetsService: GoogleSheetsService,
  type: 'clients' | 'invoices' | 'payments' | 'templates',
  updates: Array<{ id: string; data: Record<string, any> }>
) {
  const results = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[]
  };

  // Process in batches of 10
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < updates.length; i += batchSize) {
    batches.push(updates.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const batchPromises = batch.map(async ({ id, data }) => {
      try {
        let result = null;
        
        switch (type) {
          case 'clients':
            result = await sheetsService.updateClient(id, data);
            break;
          case 'invoices':
            result = await sheetsService.updateInvoice(id, data);
            break;
          case 'payments':
            // Payments don't have update method, skip
            throw new Error('Payment updates not supported');
          case 'templates':
            result = await sheetsService.updateTemplate(id, data);
            break;
        }

        return { id, result, error: null };
      } catch (error) {
        return { 
          id, 
          result: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { id, result: updateResult, error } = result.value;
        if (updateResult) {
          results.successful.push(id);
        } else {
          results.failed.push({ id, error: error || 'Update failed' });
        }
      } else {
        results.failed.push({ 
          id: 'unknown', 
          error: result.reason?.message || 'Batch operation failed' 
        });
      }
    });
  }

  return createSuccessResponse({
    operation: 'update',
    type,
    results,
    summary: {
      total: updates.length,
      successful: results.successful.length,
      failed: results.failed.length
    }
  });
}

async function handleBulkCreate(
  sheetsService: GoogleSheetsService,
  type: 'clients' | 'invoices' | 'payments' | 'templates',
  items: Array<Record<string, any>>
) {
  const results = {
    successful: [] as any[],
    failed: [] as { index: number; error: string }[]
  };

  // Process in batches of 10
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize).map((item, idx) => ({ item, index: i + idx })));
  }

  for (const batch of batches) {
    const batchPromises = batch.map(async ({ item, index }) => {
      try {
        let result = null;
        
        switch (type) {
          case 'clients':
            result = await sheetsService.createClient(item);
            break;
          case 'invoices':
            result = await sheetsService.createInvoice(item);
            break;
          case 'payments':
            result = await sheetsService.createPayment(item);
            break;
          case 'templates':
            result = await sheetsService.createTemplate(item);
            break;
        }

        return { index, result, error: null };
      } catch (error) {
        return { 
          index, 
          result: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { index, result: createResult, error } = result.value;
        if (createResult) {
          results.successful.push(createResult);
        } else {
          results.failed.push({ index, error: error || 'Creation failed' });
        }
      } else {
        results.failed.push({ 
          index: -1, 
          error: result.reason?.message || 'Batch operation failed' 
        });
      }
    });
  }

  return createSuccessResponse({
    operation: 'create',
    type,
    results,
    summary: {
      total: items.length,
      successful: results.successful.length,
      failed: results.failed.length
    }
  });
}