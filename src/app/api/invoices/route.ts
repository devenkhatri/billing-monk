import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { invoiceFormSchema, invoiceFiltersSchema, paginationSchema } from '@/lib/validations';
import { ApiResponse, Invoice, CreateInvoiceData, LineItem, InvoiceFilters, PaginationParams } from '@/types';
import { generateId } from '@/lib/utils';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: InvoiceFilters = {
      status: searchParams.get('status') as any || undefined,
      clientId: searchParams.get('clientId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const pagination: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'issueDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Validate filters and pagination
    const filtersResult = invoiceFiltersSchema.safeParse(filters);
    const paginationResult = paginationSchema.safeParse(pagination);

    if (!filtersResult.success || !paginationResult.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        400,
        {
          filters: filtersResult.error?.issues,
          pagination: paginationResult.error?.issues,
        }
      );
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    let invoices = await sheetsService.getInvoices();

    // Apply filters
    if (filters.status) {
      invoices = invoices.filter(invoice => invoice.status === filters.status);
    }

    if (filters.clientId) {
      invoices = invoices.filter(invoice => invoice.clientId === filters.clientId);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      invoices = invoices.filter(invoice => invoice.issueDate >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      invoices = invoices.filter(invoice => invoice.issueDate <= toDate);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      invoices = invoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        (invoice.notes && invoice.notes.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    invoices.sort((a, b) => {
      let aValue: any = a[pagination.sortBy as keyof Invoice];
      let bValue: any = b[pagination.sortBy as keyof Invoice];
      
      // Handle date sorting
      if (pagination.sortBy === 'issueDate' || pagination.sortBy === 'dueDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (pagination.sortOrder === 'desc') {
          return bValue.localeCompare(aValue);
        }
        return aValue.localeCompare(bValue);
      }
      
      // Handle number sorting
      if (pagination.sortOrder === 'desc') {
        return bValue - aValue;
      }
      return aValue - bValue;
    });

    // Apply pagination
    const total = invoices.length;
    const startIndex = (pagination.page! - 1) * pagination.limit!;
    const endIndex = startIndex + pagination.limit!;
    const paginatedInvoices = invoices.slice(startIndex, endIndex);

    return createSuccessResponse(
      paginatedInvoices,
      200,
      {
        total,
        page: pagination.page!,
        limit: pagination.limit!,
        hasMore: endIndex < total,
      }
    );
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return createErrorResponse(
      'FETCH_ERROR',
      'Failed to fetch invoices',
      500,
      error
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    
    // Validate the request body
    const validationResult = invoiceFormSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid invoice data',
        400,
        validationResult.error.issues
      );
    }

    const formData = validationResult.data;
    
    // Transform form data to create invoice data
    const lineItems: LineItem[] = formData.lineItems.map(item => ({
      id: generateId(),
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate
    }));

    // Transform recurring schedule if present
    let recurringSchedule: CreateInvoiceData['recurringSchedule'] = undefined;
    if (formData.isRecurring && formData.recurringSchedule) {
      recurringSchedule = {
        frequency: formData.recurringSchedule.frequency,
        interval: formData.recurringSchedule.interval,
        startDate: new Date(formData.recurringSchedule.startDate),
        endDate: formData.recurringSchedule.endDate ? new Date(formData.recurringSchedule.endDate) : undefined,
        nextInvoiceDate: new Date(formData.recurringSchedule.startDate), // Will be calculated in service
        isActive: true
      };
    }

    const createData: CreateInvoiceData = {
      clientId: formData.clientId,
      templateId: formData.templateId,
      status: 'draft',
      issueDate: new Date(formData.issueDate),
      dueDate: new Date(formData.dueDate),
      lineItems,
      subtotal: 0, // Will be calculated in service
      taxRate: formData.taxRate,
      taxAmount: 0, // Will be calculated in service
      total: 0, // Will be calculated in service
      notes: formData.notes,
      isRecurring: formData.isRecurring,
      recurringSchedule
    };

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const invoice = await sheetsService.createInvoice(createData);

    return createSuccessResponse(invoice, 201);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return createErrorResponse(
      'CREATE_ERROR',
      'Failed to create invoice',
      500,
      error
    );
  }
}