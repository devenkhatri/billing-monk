import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Initialize all required sheets
    await sheetsService.initializeSheets();

    return createSuccessResponse({ 
      message: 'Google Sheets initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error initializing Google Sheets:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to initialize Google Sheets',
      500,
      error
    );
  }
}