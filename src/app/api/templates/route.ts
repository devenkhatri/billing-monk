import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { templateFormSchema } from '@/lib/validations';
import { ApiResponse, Template } from '@/types';
import { withErrorHandling } from '@/lib/error-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const templates = await sheetsService.getTemplates();

    return templates;
  }, 'fetch templates');
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
    const result = templateFormSchema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Transform form data to create data
    const createData = {
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

    const template = await sheetsService.createTemplate(createData);
    return template;
  }, 'create template');
}