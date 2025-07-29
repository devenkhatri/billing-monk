import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { projectFormSchema } from '@/lib/validations';
import { ApiResponse, Project } from '@/types';
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

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    const projects = await sheetsService.getProjects();

    return projects;
  }, 'fetch projects');
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
    const result = projectFormSchema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }

    const sheetsService = await GoogleSheetsService.getAuthenticatedService();
    
    // Transform form data to create data
    const createData = {
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

    const project = await sheetsService.createProject(createData);
    return project;
  }, 'create project');
}