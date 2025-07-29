import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { projectFormSchema } from '@/lib/validations';
import { ApiResponse, Project } from '@/types';
import { withErrorHandling } from '@/lib/error-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
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
    const project = await sheetsService.getProject(id);

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }, 'fetch project');
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
    const result = projectFormSchema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Transform form data to update data
    const updateData = {
      name: result.data.name,
      description: result.data.description || undefined,
      clientId: result.data.clientId,
      status: result.data.status,
      startDate: new Date(result.data.startDate),
      endDate: result.data.endDate ? new Date(result.data.endDate) : undefined,
      budget: result.data.budget,
      hourlyRate: result.data.hourlyRate,
      isActive: result.data.isActive,
    };

    const project = await sheetsService.updateProject(id, updateData);
    
    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }, 'update project');
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
    const success = await sheetsService.deleteProject(id);

    if (!success) {
      throw new Error('Project not found');
    }

    return { message: 'Project deleted successfully' };
  }, 'delete project');
}