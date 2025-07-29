import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';

export async function GET() {
  try {
    console.log('Testing Google Sheets connection...');
    console.log('Spreadsheet ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
    console.log('Service Account Email:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
    console.log('Project ID:', process.env.GOOGLE_SHEETS_PROJECT_ID);
    
    // Test environment variables
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const projectId = process.env.GOOGLE_SHEETS_PROJECT_ID;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!privateKey || !clientEmail || !projectId || !spreadsheetId) {
      throw new Error('Missing required environment variables');
    }

    // Test service account creation directly
    const { google } = require('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: projectId,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: clientEmail,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    console.log('Created GoogleAuth instance');
    
    const authClient = await auth.getClient();
    console.log('Got auth client');
    
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    console.log('Created sheets client');
    
    // Test basic connection
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    console.log('Successfully got spreadsheet info');
    
    const response = {
      success: true,
      data: {
        spreadsheetId: spreadsheetId,
        title: spreadsheetInfo.data.properties?.title,
        sheets: spreadsheetInfo.data.sheets?.map((sheet: any) => ({
          name: sheet.properties?.title,
          id: sheet.properties?.sheetId
        })) || [],
        serviceAccountEmail: clientEmail
      }
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Google Sheets test failed:', error);
    
    const response = {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.response?.data || error.cause
      },
      debug: {
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        serviceAccountEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        projectId: process.env.GOOGLE_SHEETS_PROJECT_ID,
        hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
        privateKeyLength: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.length,
        privateKeyStart: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.substring(0, 50)
      }
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}