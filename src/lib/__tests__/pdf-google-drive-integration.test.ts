import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/invoices/[id]/pdf/route';

// Mock dependencies
jest.mock('@/lib/google-sheets');
jest.mock('@/lib/pdf-generator');
jest.mock('@/lib/google-drive');
jest.mock('@/lib/activity-logger');
jest.mock('next-auth');

import { GoogleSheetsService } from '@/lib/google-sheets';
import { PDFGenerator } from '@/lib/pdf-generator';
import { GoogleDriveService } from '@/lib/google-drive';
import { activityLogger } from '@/lib/activity-logger';
import { getServerSession } from 'next-auth';

const mockGoogleSheetsService = GoogleSheetsService as jest.Mocked<typeof GoogleSheetsService>;
const mockPDFGenerator = PDFGenerator as jest.Mocked<typeof PDFGenerator>;
const mockGoogleDriveService = GoogleDriveService as jest.Mocked<typeof GoogleDriveService>;
const mockActivityLogger = activityLogger as jest.Mocked<typeof activityLogger>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('PDF Route Google Drive Integration', () => {
  const mockInvoice = {
    id: 'invoice-123',
    invoiceNumber: 'INV-001',
    clientId: 'client-123',
    issueDate: new Date('2024-01-15'),
    isRecurring: false,
    recurringSchedule: null
  };

  const mockClient = {
    id: 'client-123',
    name: 'Test Client',
    email: 'test@example.com'
  };

  const mockCompanySettings = {
    name: 'Test Company',
    email: 'company@example.com'
  };

  const mockSession = {
    user: {
      email: 'user@example.com'
    }
  };

  const mockPDFBuffer = new Uint8Array([1, 2, 3, 4]); // Mock PDF data

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockGoogleSheetsService.getAuthenticatedService.mockResolvedValue({
      getInvoice: jest.fn().mockResolvedValue(mockInvoice),
      getClient: jest.fn().mockResolvedValue(mockClient),
      getCompanySettings: jest.fn().mockResolvedValue(mockCompanySettings)
    } as any);

    mockPDFGenerator.prototype.generateInvoicePDF = jest.fn().mockResolvedValue(mockPDFBuffer);
    mockGetServerSession.mockResolvedValue(mockSession as any);
    mockActivityLogger.logGoogleDriveActivity = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should successfully generate PDF and upload to Google Drive', async () => {
    // Mock successful Google Drive upload
    const mockDriveService = {
      uploadInvoicePDF: jest.fn().mockResolvedValue({
        success: true,
        fileId: 'drive-file-123',
        fileName: 'Invoice-INV-001-Test-Client-2024-01-15.pdf'
      })
    };
    mockGoogleDriveService.getAuthenticatedService.mockResolvedValue(mockDriveService as any);

    const request = new NextRequest('http://localhost/api/invoices/invoice-123/pdf');
    const params = Promise.resolve({ id: 'invoice-123' });

    const response = await GET(request, { params });

    // Verify PDF generation
    expect(mockPDFGenerator.prototype.generateInvoicePDF).toHaveBeenCalledWith({
      invoice: mockInvoice,
      client: mockClient,
      companySettings: mockCompanySettings
    });

    // Verify Google Drive upload was attempted
    expect(mockDriveService.uploadInvoicePDF).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'invoice-INV-001.pdf',
      {
        invoiceNumber: 'INV-001',
        clientName: 'Test Client',
        date: new Date('2024-01-15'),
        isRecurring: false,
        recurrenceInfo: undefined
      }
    );

    // Verify successful upload was logged
    expect(mockActivityLogger.logGoogleDriveActivity).toHaveBeenCalledWith(
      'google_drive_upload_success',
      'invoice-123',
      'INV-001',
      'user@example.com',
      'user@example.com',
      {
        driveFileId: 'drive-file-123',
        fileName: 'Invoice-INV-001-Test-Client-2024-01-15.pdf'
      }
    );

    // Verify PDF response
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="invoice-INV-001.pdf"');
  });

  it('should continue PDF generation even if Google Drive upload fails', async () => {
    // Mock failed Google Drive upload
    const mockDriveService = {
      uploadInvoicePDF: jest.fn().mockResolvedValue({
        success: false,
        error: 'Upload failed due to quota exceeded',
        retryCount: 3
      })
    };
    mockGoogleDriveService.getAuthenticatedService.mockResolvedValue(mockDriveService as any);

    const request = new NextRequest('http://localhost/api/invoices/invoice-123/pdf');
    const params = Promise.resolve({ id: 'invoice-123' });

    const response = await GET(request, { params });

    // Verify PDF generation still succeeded
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');

    // Verify failed upload was logged
    expect(mockActivityLogger.logGoogleDriveActivity).toHaveBeenCalledWith(
      'google_drive_upload_failed',
      'invoice-123',
      'INV-001',
      'user@example.com',
      'user@example.com',
      {
        error: 'Upload failed due to quota exceeded',
        retryCount: 3
      }
    );
  });

  it('should continue PDF generation even if Google Drive service throws error', async () => {
    // Mock Google Drive service error
    mockGoogleDriveService.getAuthenticatedService.mockRejectedValue(
      new Error('Authentication failed')
    );

    const request = new NextRequest('http://localhost/api/invoices/invoice-123/pdf');
    const params = Promise.resolve({ id: 'invoice-123' });

    const response = await GET(request, { params });

    // Verify PDF generation still succeeded
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');

    // Verify error was logged
    expect(mockActivityLogger.logGoogleDriveActivity).toHaveBeenCalledWith(
      'google_drive_upload_error',
      'invoice-123',
      'INV-001',
      'user@example.com',
      'user@example.com',
      {
        error: 'Authentication failed'
      }
    );
  });

  it('should handle recurring invoices with proper filename generation', async () => {
    // Mock recurring invoice
    const recurringInvoice = {
      ...mockInvoice,
      isRecurring: true,
      recurringSchedule: {
        frequency: 'monthly' as const,
        interval: 1
      }
    };

    mockGoogleSheetsService.getAuthenticatedService.mockResolvedValue({
      getInvoice: jest.fn().mockResolvedValue(recurringInvoice),
      getClient: jest.fn().mockResolvedValue(mockClient),
      getCompanySettings: jest.fn().mockResolvedValue(mockCompanySettings)
    } as any);

    const mockDriveService = {
      uploadInvoicePDF: jest.fn().mockResolvedValue({
        success: true,
        fileId: 'drive-file-123',
        fileName: 'Invoice-INV-001-Test-Client-2024-01-15-monthly-1.pdf'
      })
    };
    mockGoogleDriveService.getAuthenticatedService.mockResolvedValue(mockDriveService as any);

    const request = new NextRequest('http://localhost/api/invoices/invoice-123/pdf');
    const params = Promise.resolve({ id: 'invoice-123' });

    await GET(request, { params });

    // Verify recurring invoice data was passed correctly
    expect(mockDriveService.uploadInvoicePDF).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'invoice-INV-001.pdf',
      {
        invoiceNumber: 'INV-001',
        clientName: 'Test Client',
        date: new Date('2024-01-15'),
        isRecurring: true,
        recurrenceInfo: 'monthly-1'
      }
    );
  });
});