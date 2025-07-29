import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { taskFormSchema } from '@/lib/validations';
import { ApiResponse, Task } from '@/types';
import { withErrorHandling } from '@/lib/error-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const { id } = await params;
    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const task = await sheetsService.getTask(id);

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }, 'fetch task');
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
    const result = taskFormSchema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Transform form data to update data
    const updateData = {
      projectId: result.data.projectId,
      title: result.data.title,
      description: result.data.description || undefined,
      status: result.data.status,
      priority: result.data.priority,
      assignedTo: result.data.assignedTo || undefined,
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
      estimatedHours: result.data.estimatedHours,
      isBillable: result.data.isBillable,
      tags: result.data.tags,
    };

    const task = await sheetsService.updateTask(id, updateData);
    
    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }, 'update task');
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
    const success = await sheetsService.deleteTask(id);

    if (!success) {
      throw new Error('Task not found');
    }

    return { message: 'Task deleted successfully' };
  }, 'delete task');
}