import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      };
      return NextResponse.json(response, { status: 401 });
    }

    const service = await GoogleSheetsService.getAuthenticatedService();
    
    // Initialize the sheets structure
    await service.initializeSheets();

    const response: ApiResponse<{
      message: string;
      sheetsCreated: string[];
    }> = {
      success: true,
      data: {
        message: 'Google Sheets structure initialized successfully',
        sheetsCreated: ['Clients', 'Invoices', 'LineItems', 'Payments', 'Settings', 'Templates']
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Sheet initialization failed:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'SHEET_INITIALIZATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to initialize Google Sheets structure'
      }
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}