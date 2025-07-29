import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if required environment variables are present
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_SHEETS_SPREADSHEET_ID',
      'GOOGLE_SHEETS_PROJECT_ID',
      'GOOGLE_SHEETS_CLIENT_EMAIL',
      'GOOGLE_SHEETS_PRIVATE_KEY',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    const response = {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasRequiredEnvVars: missingVars.length === 0,
        missingEnvVars: missingVars
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Status check failed:', error);
    
    const response = {
      success: false,
      error: {
        code: 'STATUS_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to check application status'
      }
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}