import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { templateFormSchema } from '@/lib/validations';
import { ApiResponse, Template, CreateTemplateData } from '@/types';
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
    const activeOnly = searchParams.get('active') === 'true';

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    let templates = await sheetsService.getTemplates();

    // Filter active templates if requested
    if (activeOnly) {
      templates = templates.filter(template => template.isActive);
    }

    return createSuccessResponse(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return createErrorResponse(
      'FETCH_ERROR',
      'Failed to fetch templates',
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
    
    // Transform form data to create template data
    const lineItems = formData.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate
    }));

    const createData: CreateTemplateData = {
      name: formData.name,
      description: formData.description,
      lineItems,
      taxRate: formData.taxRate,
      notes: formData.notes,
      isActive: formData.isActive
    };

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const template = await sheetsService.createTemplate(createData);

    return createSuccessResponse(template, 201);
  } catch (error) {
    console.error('Error creating template:', error);
    return createErrorResponse(
      'CREATE_ERROR',
      'Failed to create template',
      500,
      error
    );
  }
}