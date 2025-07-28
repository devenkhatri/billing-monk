import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Check if Google Sheets is configured
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
      const response: ApiResponse<{
        isConnected: boolean;
        sheetsInitialized: boolean;
        clientCount: number;
        hasSettings: boolean;
        message: string;
      }> = {
        success: true,
        data: {
          isConnected: false,
          sheetsInitialized: false,
          clientCount: 0,
          hasSettings: false,
          message: 'Google Sheets Spreadsheet ID not configured'
        }
      };
      return NextResponse.json(response);
    }

    try {
      const service = await GoogleSheetsService.getAuthenticatedService();
      
      // Test connection by trying to fetch data
      const [clients, settings] = await Promise.all([
        service.getClients(),
        service.getCompanySettings()
      ]);

      const response: ApiResponse<{
        isConnected: boolean;
        sheetsInitialized: boolean;
        clientCount: number;
        hasSettings: boolean;
        message: string;
      }> = {
        success: true,
        data: {
          isConnected: true,
          sheetsInitialized: true,
          clientCount: clients.length,
          hasSettings: !!settings,
          message: 'Google Sheets integration is working'
        }
      };
      return NextResponse.json(response);
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      
      const response: ApiResponse<{
        isConnected: boolean;
        sheetsInitialized: boolean;
        clientCount: number;
        hasSettings: boolean;
        message: string;
      }> = {
        success: true,
        data: {
          isConnected: false,
          sheetsInitialized: false,
          clientCount: 0,
          hasSettings: false,
          message: 'Failed to connect to Google Sheets'
        }
      };
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Google Sheets setup error:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'SHEETS_SETUP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to check Google Sheets setup'
      }
    };
    return NextResponse.json(response, { status: 500 });
  }
}

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

    const body = await request.json();
    const { spreadsheetId } = body;

    if (!spreadsheetId) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Spreadsheet ID is required'
        }
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Note: In a real implementation, you would need to update the environment variable
    // or store the spreadsheet ID in a database. For now, we'll just validate the connection.
    try {
      const service = new GoogleSheetsService(session.accessToken, spreadsheetId);
      
      // Test the connection by trying to read from the spreadsheet
      await service.getClients();

      const response: ApiResponse<{
        message: string;
        spreadsheetId: string;
      }> = {
        success: true,
        data: {
          message: 'Google Sheets connection validated successfully',
          spreadsheetId
        }
      };
      return NextResponse.json(response);
    } catch (error) {
      console.error('Google Sheets validation failed:', error);
      
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'SHEETS_VALIDATION_ERROR',
          message: 'Failed to validate Google Sheets connection. Please check the spreadsheet ID and permissions.'
        }
      };
      return NextResponse.json(response, { status: 400 });
    }
  } catch (error) {
    console.error('Google Sheets setup error:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'SHEETS_SETUP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to setup Google Sheets integration'
      }
    };
    return NextResponse.json(response, { status: 500 });
  }
}