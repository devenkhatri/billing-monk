import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Simple health check - just try to get spreadsheet info
    const startTime = Date.now();
    await sheetsService.sheetsClient.spreadsheets.get({
      spreadsheetId: sheetsService.spreadsheetIdValue
    });
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      message: 'Google Sheets API is accessible'
    });

  } catch (error: any) {
    console.error('Google Sheets health check failed:', error);
    
    const isQuotaError = error?.message?.includes('quota exceeded') || 
                        error?.message?.includes('Quota exceeded') ||
                        error?.response?.status === 429;

    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      isQuotaError,
      timestamp: new Date().toISOString(),
      suggestion: isQuotaError ? 
        'Quota exceeded. Please wait before making more requests.' : 
        'Check Google Sheets API credentials and permissions.'
    }, { status: isQuotaError ? 429 : 500 });
  }
}