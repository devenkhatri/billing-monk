import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { paymentFormSchema, paymentFiltersSchema, paginationSchema } from '@/lib/validations';
import { ApiResponse, Payment, PaymentFilters, PaginationParams } from '@/types';
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
    const filters: PaymentFilters = {
      invoiceId: searchParams.get('invoiceId') || undefined,
      paymentMethod: searchParams.get('paymentMethod') as any || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    };

    const pagination: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'paymentDate',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Validate filters and pagination
    const filtersResult = paymentFiltersSchema.safeParse(filters);
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
    let payments = await sheetsService.getPayments(filters.invoiceId);

    // Apply additional filters
    if (filters.paymentMethod) {
      payments = payments.filter(payment => payment.paymentMethod === filters.paymentMethod);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      payments = payments.filter(payment => payment.paymentDate >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      payments = payments.filter(payment => payment.paymentDate <= toDate);
    }

    // Apply sorting
    payments.sort((a, b) => {
      let aValue: any = a[pagination.sortBy as keyof Payment];
      let bValue: any = b[pagination.sortBy as keyof Payment];
      
      // Handle date sorting
      if (pagination.sortBy === 'paymentDate' || pagination.sortBy === 'createdAt') {
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
    const total = payments.length;
    const startIndex = (pagination.page! - 1) * pagination.limit!;
    const endIndex = startIndex + pagination.limit!;
    const paginatedPayments = payments.slice(startIndex, endIndex);

    return createSuccessResponse(
      paginatedPayments,
      200,
      {
        total,
        page: pagination.page!,
        limit: pagination.limit!,
        hasMore: endIndex < total,
      }
    );
  } catch (error) {
    console.error('Error fetching payments:', error);
    return createErrorResponse(
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Failed to fetch payments',
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
    const result = paymentFormSchema.safeParse(body);
    if (!result.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid payment data',
        400,
        result.error.issues
      );
    }
    
    // Convert string date to Date object
    const paymentData = {
      invoiceId: result.data.invoiceId,
      amount: result.data.amount,
      paymentDate: new Date(result.data.paymentDate),
      paymentMethod: result.data.paymentMethod,
      notes: result.data.notes,
    };

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const payment = await sheetsService.createPayment(paymentData);

    return createSuccessResponse(payment, 201);
  } catch (error) {
    console.error('Error creating payment:', error);
    return createErrorResponse(
      'CREATE_ERROR',
      error instanceof Error ? error.message : 'Failed to create payment',
      500,
      error
    );
  }
}