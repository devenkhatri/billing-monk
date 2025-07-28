import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { clientFormSchema } from '@/lib/validations';
import { ApiResponse, Client } from '@/types';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;

    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 'Client ID is required', 400);
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const client = await sheetsService.getClient(id);

    if (!client) {
      return createErrorResponse('NOT_FOUND', 'Client not found', 404);
    }

    return createSuccessResponse(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch client',
      500,
      error
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;

    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 'Client ID is required', 400);
    }

    const body = await request.json();
    
    // Validate request body
    const result = clientFormSchema.safeParse(body);
    if (!result.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid client data',
        400,
        result.error.issues
      );
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
      return createErrorResponse('NOT_FOUND', 'Client not found', 404);
    }

    return createSuccessResponse(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to update client',
      500,
      error
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await context.params;

    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 'Client ID is required', 400);
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const success = await sheetsService.deleteClient(id);

    if (!success) {
      return createErrorResponse('NOT_FOUND', 'Client not found', 404);
    }

    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Error deleting client:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to delete client',
      500,
      error
    );
  }
}