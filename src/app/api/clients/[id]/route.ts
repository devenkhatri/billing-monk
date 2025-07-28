import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { clientFormSchema } from '@/lib/validations';
import { ApiResponse, Client } from '@/types';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Client ID is required',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const client = await sheetsService.getClient(id);

    if (!client) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Client> = {
      success: true,
      data: client,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching client:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch client',
        details: error,
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Client ID is required',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

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
    
    // Transform form data to update data
    const updateData = {
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

    const updatedClient = await sheetsService.updateClient(id, updateData);

    if (!updatedClient) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Client> = {
      success: true,
      data: updatedClient,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating client:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update client',
        details: error,
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Client ID is required',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const success = await sheetsService.deleteClient(id);

    if (!success) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting client:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete client',
        details: error,
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}