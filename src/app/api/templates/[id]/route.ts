import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { templateFormSchema } from '@/lib/validations';
import { ApiResponse, Template, UpdateTemplateData } from '@/types';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await params;

    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 'Template ID is required', 400);
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const template = await sheetsService.getTemplate(id);

    if (!template) {
      return createErrorResponse('NOT_FOUND', 'Template not found', 404);
    }

    return createSuccessResponse(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return createErrorResponse(
      'FETCH_ERROR',
      'Failed to fetch template',
      500,
      error
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await params;

    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 'Template ID is required', 400);
    }

    const body = await request.json();
    
    // Validate request body
    const result = templateFormSchema.safeParse(body);
    if (!result.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid template data',
        400,
        result.error.issues
      );
    }

    const formData = result.data;
    
    // Transform form data to update template data
    const lineItems = formData.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate
    }));

    const updateData: UpdateTemplateData = {
      name: formData.name,
      description: formData.description,
      lineItems,
      taxRate: formData.taxRate,
      notes: formData.notes,
      isActive: formData.isActive
    };

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const template = await sheetsService.updateTemplate(id, updateData);

    if (!template) {
      return createErrorResponse('NOT_FOUND', 'Template not found', 404);
    }

    return createSuccessResponse(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return createErrorResponse(
      'UPDATE_ERROR',
      'Failed to update template',
      500,
      error
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await params;

    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 'Template ID is required', 400);
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const success = await sheetsService.deleteTemplate(id);

    if (!success) {
      return createErrorResponse('NOT_FOUND', 'Template not found', 404);
    }

    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Error deleting template:', error);
    return createErrorResponse(
      'DELETE_ERROR',
      'Failed to delete template',
      500,
      error
    );
  }
}