import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { appSettingsFormSchema } from '@/lib/validations';
import { AppSettings, ApiResponse } from '@/types';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(): Promise<NextResponse<ApiResponse<AppSettings>>> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const settings = await sheetsService.getAppSettings();

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings: AppSettings = {
        isSetupComplete: false,
        autoBackup: true,
        backupFrequency: 'weekly',
        theme: 'light',
        colorTheme: 'default'
      };
      return createSuccessResponse(defaultSettings);
    }

    return createSuccessResponse(settings);
  } catch (error) {
    console.error('Error fetching app settings:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch app settings',
      500,
      error
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<AppSettings>>> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();

    // Validate request body
    const result = appSettingsFormSchema.safeParse(body);
    if (!result.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid app settings data',
        400,
        result.error.issues
      );
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();

    // Transform form data to settings data
    const settingsData: AppSettings = {
      googleSheetsId: result.data.googleSheetsId || undefined,
      isSetupComplete: true, // Assume setup is complete if updating settings
      autoBackup: result.data.autoBackup,
      backupFrequency: result.data.backupFrequency,
      theme: result.data.theme,
      colorTheme: result.data.colorTheme,
      lastBackup: undefined // This will be set by the backup process
    };

    const updatedSettings = await sheetsService.updateAppSettings(settingsData);

    return createSuccessResponse(updatedSettings);
  } catch (error) {
    console.error('Error updating app settings:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to update app settings',
      500,
      error
    );
  }
}