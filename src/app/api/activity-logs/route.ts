import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { ActivityLogFilters } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: ActivityLogFilters = {
      type: searchParams.get('type') as any || undefined,
      entityType: searchParams.get('entityType') as any || undefined,
      entityId: searchParams.get('entityId') || undefined,
      userId: searchParams.get('userId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await sheetsService.getActivityLogs(filters, { page, limit });

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch activity logs',
      500,
      error
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const body = await request.json();

    // Extract user info from headers if available
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    const activityData = {
      ...body,
      userAgent,
      ipAddress,
    };

    const activity = await sheetsService.createActivityLog(activityData);

    return createSuccessResponse(activity, 201);
  } catch (error) {
    console.error('Error creating activity log:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to create activity log',
      500,
      error
    );
  }
}