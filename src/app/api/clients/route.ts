import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { clientFormSchema, clientFiltersSchema, paginationSchema } from '@/lib/validations';
import { ApiResponse, Client, ClientFilters, PaginationParams } from '@/types';

export async function GET(request: NextRequest) {
  try {
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
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: {
            filters: filtersResult.error?.issues,
            pagination: paginationResult.error?.issues,
          },
        },
      };
      return NextResponse.json(response, { status: 400 });
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

    const response: ApiResponse<Client[]> = {
      success: true,
      data: paginatedClients,
      meta: {
        total,
        page: pagination.page!,
        limit: pagination.limit!,
        hasMore: endIndex < total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching clients:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch clients',
        details: error,
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = clientFormSchema.safeParse(body);
    if (!result.success) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid client data',
          details: result.error.issues,
        },
      };
      return NextResponse.json(response, { status: 400 });
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

    const response: ApiResponse<Client> = {
      success: true,
      data: client,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create client',
        details: error,
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}