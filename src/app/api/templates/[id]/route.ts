import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { templateFormSchema } from '@/lib/validations';
import { ApiResponse, Template } from '@/types';
import { withErrorHandling } from '@/lib/error-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const { id } = await params;
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const template = await sheetsService.getTemplate(id);

    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }, 'fetch template');
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const { id } = await params;
    const body = await request.json();
    
    // Validate request body
    const result = templateFormSchema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Transform form data to update data
    const updateData = {
      name: result.data.name,
      description: result.data.description || undefined,
      lineItems: result.data.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate
      })),
      taxRate: result.data.taxRate,
      notes: result.data.notes || undefined,
      isActive: result.data.isActive,
    };

    const template = await sheetsService.updateTemplate(id, updateData);
    return template;
  }, 'update template');
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const { id } = await params;
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    await sheetsService.deleteTemplate(id);

    return { message: 'Template deleted successfully' };
  }, 'delete template');
}