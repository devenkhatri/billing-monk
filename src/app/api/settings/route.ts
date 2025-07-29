import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { companySettingsFormSchema } from '@/lib/validations';
import { CompanySettings, ApiResponse } from '@/types';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<CompanySettings>>> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const settings = await sheetsService.getCompanySettings();

    if (!settings) {
      return createErrorResponse('NOT_FOUND', 'Company settings not found', 404);
    }

    return createSuccessResponse(settings);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch company settings',
      500,
      error
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<CompanySettings>>> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    console.log('******* Received request body:', body);

    // Transform the data structure to match the form schema
    const formData = {
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      street: body.address?.street || body.street,
      city: body.address?.city || body.city,
      state: body.address?.state || body.state,
      zipCode: body.address?.zipCode || body.zipCode,
      country: body.address?.country || body.country,
      logo: body.logo || '',
      taxRate: body.taxRate,
      paymentTerms: body.paymentTerms,
      invoiceTemplate: body.invoiceTemplate,
      currency: body.currency,
      dateFormat: body.dateFormat,
      timeZone: body.timeZone,
    };

    // Validate request body
    const result = companySettingsFormSchema.safeParse(formData);
    console.log('******* Validation result:', result);
    if (!result.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid company settings data',
        400,
        result.error.issues
      );
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();

    // Transform form data to settings data
    const settingsData: CompanySettings = {
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
      logo: result.data.logo || undefined,
      taxRate: result.data.taxRate,
      paymentTerms: result.data.paymentTerms,
      invoiceTemplate: result.data.invoiceTemplate,
      currency: result.data.currency,
      dateFormat: result.data.dateFormat,
      timeZone: result.data.timeZone,
    };

    const updatedSettings = await sheetsService.updateCompanySettings(settingsData);

    return createSuccessResponse(updatedSettings);
  } catch (error) {
    console.error('Error updating company settings:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to update company settings',
      500,
      error
    );
  }
}