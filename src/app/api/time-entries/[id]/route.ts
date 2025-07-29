import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { timeEntryUpdateSchema } from '@/lib/validations';
import { ApiResponse, TimeEntry } from '@/types';
import { withErrorHandling } from '@/lib/error-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const result = timeEntryUpdateSchema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();

    // Get task to determine project ID
    const task = await sheetsService.getTask(result.data.taskId!);
    if (!task) {
      throw new Error('Task not found');
    }

    // Calculate duration if not provided
    let duration = result.data.duration;
    if (!duration && result.data.startTime && result.data.endTime) {
      const startTime = new Date(result.data.startTime);
      const endTime = new Date(result.data.endTime);
      duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // in minutes
    }

    if (!duration) {
      throw new Error('Duration must be provided or calculated from start/end times');
    }

    // Transform form data to update data
    const updateData = {
      taskId: result.data.taskId!,
      projectId: task.projectId,
      description: result.data.description || undefined,
      startTime: new Date(result.data.startTime),
      endTime: result.data.endTime ? new Date(result.data.endTime) : undefined,
      duration,
      isBillable: result.data.isBillable,
      hourlyRate: result.data.hourlyRate,
    };

    const timeEntry = await sheetsService.updateTimeEntry(id, updateData);

    if (!timeEntry) {
      throw new Error('Time entry not found');
    }

    return timeEntry;
  }, 'update time entry');
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const { id } = await params;
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const success = await sheetsService.deleteTimeEntry(id);

    if (!success) {
      throw new Error('Time entry not found');
    }

    return { message: 'Time entry deleted successfully' };
  }, 'delete time entry');
}