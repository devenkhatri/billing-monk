import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { clientFormSchema, clientFiltersSchema, paginationSchema } from '@/lib/validations';
import { ApiResponse, Client, ClientFilters, PaginationParams } from '@/types';
import { createErrorResponse, createSuccessResponse, handleApiError, withErrorHandling } from '@/lib/error-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { activityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: ClientFilters = {
      search: searchParams.get('search') || undefined,
      country: searchParams.get('country') || undefined,
      state: searchParams.get('state') || undefined,
    };

    const pagination: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    // Validate filters and pagination
    const filtersResult = clientFiltersSchema.safeParse(filters);
    const paginationResult = paginationSchema.safeParse(pagination);

    if (!filtersResult.success || !paginationResult.success) {
      throw new Error('Invalid query parameters');
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    let clients = await sheetsService.getClients();

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      clients = clients.filter(client => 
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower)
      );
    }

    if (filters.country) {
      clients = clients.filter(client => 
        client.address.country.toLowerCase() === filters.country!.toLowerCase()
      );
    }

    if (filters.state) {
      clients = clients.filter(client => 
        client.address.state.toLowerCase() === filters.state!.toLowerCase()
      );
    }

    // Apply sorting
    clients.sort((a, b) => {
      const aValue = a[pagination.sortBy as keyof Client] as string;
      const bValue = b[pagination.sortBy as keyof Client] as string;
      
      if (pagination.sortOrder === 'desc') {
        return bValue.localeCompare(aValue);
      }
      return aValue.localeCompare(bValue);
    });

    // Apply pagination
    const total = clients.length;
    const startIndex = (pagination.page! - 1) * pagination.limit!;
    const endIndex = startIndex + pagination.limit!;
    const paginatedClients = clients.slice(startIndex, endIndex);

    return {
      clients: paginatedClients,
      meta: {
        total,
        page: pagination.page!,
        limit: pagination.limit!,
        hasMore: endIndex < total,
      }
    };
  }, 'fetch clients');
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const body = await request.json();
    
    // Validate request body
    const result = clientFormSchema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Transform form data to create data
    const createData = {
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone || undefined,
      address: {
        street: result.data.street,
        city: result.data.city,
        state: result.data.state,
        zipCode: result.data.zipCode,
        country: result.data.country,
      },
    };

    const client = await sheetsService.createClient(createData);
    
    // Log the activity
    await activityLogger.logClientActivity(
      'client_added',
      client.id,
      client.name,
      session.user?.id,
      session.user?.email || undefined,
      undefined,
      client
    );
    
    return client;
  }, 'create client');
}