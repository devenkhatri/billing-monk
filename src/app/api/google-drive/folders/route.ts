import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService } from '@/lib/google-drive';
import { ApiResponse, DriveFolder } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<DriveFolder[]>>> {
  try {
    const driveService = await GoogleDriveService.getAuthenticatedService();
    const folders = await driveService.listFolders();

    return NextResponse.json({
      success: true,
      data: folders
    });
  } catch (error: any) {
    console.error('Error fetching Google Drive folders:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: error.code || 'DRIVE_FOLDERS_ERROR',
        message: error.message || 'Failed to fetch Google Drive folders'
      }
    }, { status: error.statusCode || 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<DriveFolder>>> {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_FOLDER_NAME',
          message: 'Folder name is required and must be a non-empty string'
        }
      }, { status: 400 });
    }

    const folderName = name.trim();

    // Validate folder name
    if (folderName.length > 255) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_FOLDER_NAME',
          message: 'Folder name must be 255 characters or less'
        }
      }, { status: 400 });
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(folderName)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_FOLDER_NAME',
          message: 'Folder name contains invalid characters'
        }
      }, { status: 400 });
    }

    const driveService = await GoogleDriveService.getAuthenticatedService();
    const newFolder = await driveService.createFolder(folderName);

    return NextResponse.json({
      success: true,
      data: newFolder
    });
  } catch (error: any) {
    console.error('Error creating Google Drive folder:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: error.code || 'DRIVE_CREATE_FOLDER_ERROR',
        message: error.message || 'Failed to create Google Drive folder'
      }
    }, { status: error.statusCode || 500 });
  }
}