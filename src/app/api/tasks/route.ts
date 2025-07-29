import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { taskFormSchema } from '@/lib/validations';
import { ApiResponse, Task } from '@/types';
import { withErrorHandling } from '@/lib/error-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    if (projectId) {
      const tasks = await sheetsService.getTasksByProject(projectId);
      return tasks;
    } else {
      const tasks = await sheetsService.getTasks();
      return tasks;
    }
  }, 'fetch tasks');
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const body = await request.json();
    
    // Validate request body
    const result = taskFormSchema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Transform form data to create data
    const createData = {
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

    const task = await sheetsService.createTask(createData);
    return task;
  }, 'create task');
}