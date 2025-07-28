import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/middleware'
import { GoogleSheetsService } from '@/lib/google-sheets'

async function handler(_request: NextRequest) {
  try {
    const service = await GoogleSheetsService.getAuthenticatedService()
    
    // Test connectivity and initialize sheets if needed
    await service.initializeSheets()
    
    // Test basic operations
    const clients = await service.getClients()
    const settings = await service.getSettings()
    
    return createSuccessResponse({
      isConnected: true,
      sheetsInitialized: true,
      clientCount: clients.length,
      hasSettings: Object.keys(settings).length > 0,
      message: 'Google Sheets integration is working correctly'
    })
  } catch (error) {
    console.error('Google Sheets setup error:', error)
    
    return createErrorResponse(
      'SHEETS_SETUP_ERROR',
      error instanceof Error ? error.message : 'Failed to setup Google Sheets integration',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler)
}

export async function POST(request: NextRequest) {
  return withAuth(request, handler)
}