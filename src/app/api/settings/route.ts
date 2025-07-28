import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { CompanySettings, ApiResponse } from '@/types';

export async function GET(): Promise<NextResponse<ApiResponse<CompanySettings>>> {
  try {
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const settings = await sheetsService.getCompanySettings();
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'Company settings not found'
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch company settings'
      }
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<CompanySettings>>> {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.email) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Company name and email are required'
        }
      }, { status: 400 });
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const updatedSettings = await sheetsService.updateCompanySettings(body);

    return NextResponse.json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update company settings'
      }
    }, { status: 500 });
  }
}