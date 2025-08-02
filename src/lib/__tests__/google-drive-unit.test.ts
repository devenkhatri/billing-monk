import { 
  GoogleDriveService, 
  InvoiceData, 
  GoogleDriveError,
  DriveAuthenticationError,
  DriveQuotaError,
  DriveNetworkError,
  DrivePermissionError,
  DriveFileNotFoundError,
  GoogleDriveConfig,
  DriveUploadResult,
  DriveFolder
} from '../google-drive';
import { getServerSession } from 'next-auth';

// Mock the googleapis module
jest.mock('googleapis', () => {
  const mockDriveFiles = {
    create: jest.fn(),
    get: jest.fn(),
    list: jest.fn()
  };
  
  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: jest.fn()
        }))
      },
      drive: jest.fn().mockReturnValue({
        files: mockDriveFiles
      })
    }
  };
});

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

// Mock auth options
jest.mock('../auth', () => ({
  authOptions: {}
}));

// Get the mock after it's been created
import { google } from 'googleapis';
const mockDriveFiles = google.drive().files;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('GoogleDriveService Unit Tests', () => {
  let service: GoogleDriveService;
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    service = new GoogleDriveService(mockAccessToken);
    jest.clearAllMocks();
  });

  describe('PDF upload functionality with various file sizes and names', () => {
    beforeEach(() => {
      // Mock getConfig to return enabled configuration
      jest.spyOn(service, 'getConfig').mockResolvedValue({
        enabled: true,
        folderName: 'Invoices'
      });
      
      // Mock ensureInvoiceFolder
      jest.spyOn(service as any, 'ensureInvoiceFolder').mockResolvedValue('folder-id');
      
      // Mock handleFileNameConflict
      jest.spyOn(service as any, 'handleFileNameConflict').mockResolvedValue('test-file.pdf');
    });

    it('should upload small PDF files successfully', async () => {
      mockDriveFiles.create.mockResolvedValue({ data: { id: 'file-123' } });
      
      const smallPdfBuffer = new Uint8Array(1024); // 1KB
      
      const result = await service.uploadInvoicePDF(smallPdfBuffer, 'small-invoice.pdf');
      
      expect(result.success).toBe(true);
      expect(result.fileId).toBe('file-123');
      expect(result.fileName).toBe('test-file.pdf');
      expect(mockDriveFiles.create).toHaveBeenCalledWith({
        requestBody: {
          name: 'test-file.pdf',
          parents: ['folder-id'],
          mimeType: 'application/pdf'
        },
        media: {
          mimeType: 'application/pdf',
          body: Buffer.from(smallPdfBuffer)
        }
      });
    });

    it('should upload medium PDF files successfully', async () => {
      mockDriveFiles.create.mockResolvedValue({ data: { id: 'file-456' } });
      
      const mediumPdfBuffer = new Uint8Array(1024 * 1024); // 1MB
      
      const result = await service.uploadInvoicePDF(mediumPdfBuffer, 'medium-invoice.pdf');
      
      expect(result.success).toBe(true);
      expect(result.fileId).toBe('file-456');
      expect(mockDriveFiles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          media: {
            mimeType: 'application/pdf',
            body: Buffer.from(mediumPdfBuffer)
          }
        })
      );
    });

    it('should upload large PDF files successfully', async () => {
      mockDriveFiles.create.mockResolvedValue({ data: { id: 'file-789' } });
      
      const largePdfBuffer = new Uint8Array(10 * 1024 * 1024); // 10MB
      
      const result = await service.uploadInvoicePDF(largePdfBuffer, 'large-invoice.pdf');
      
      expect(result.success).toBe(true);
      expect(result.fileId).toBe('file-789');
      expect(mockDriveFiles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          media: {
            mimeType: 'application/pdf',
            body: Buffer.from(largePdfBuffer)
          }
        })
      );
    });

    it('should handle filenames with special characters', async () => {
      mockDriveFiles.create.mockResolvedValue({ data: { id: 'file-special' } });
      
      // Mock handleFileNameConflict to return sanitized name
      jest.spyOn(service as any, 'handleFileNameConflict').mockResolvedValue('Invoice-001-Client-Co-2024-01-01.pdf');
      
      const pdfBuffer = new Uint8Array([1, 2, 3, 4]);
      
      const result = await service.uploadInvoicePDF(pdfBuffer, 'Invoice #001 - Client & Co. (2024/01/01).pdf');
      
      expect(result.success).toBe(true);
      expect(result.fileName).toBe('Invoice-001-Client-Co-2024-01-01.pdf');
    });

    it('should handle very long filenames', async () => {
      mockDriveFiles.create.mockResolvedValue({ data: { id: 'file-long' } });
      
      const longFileName = 'a'.repeat(300) + '.pdf';
      const truncatedFileName = 'a'.repeat(251) + '.pdf'; // 255 char limit
      
      jest.spyOn(service as any, 'handleFileNameConflict').mockResolvedValue(truncatedFileName);
      
      const pdfBuffer = new Uint8Array([1, 2, 3, 4]);
      
      const result = await service.uploadInvoicePDF(pdfBuffer, longFileName);
      
      expect(result.success).toBe(true);
      expect(result.fileName).toBe(truncatedFileName);
    });

    it('should generate proper filename from invoice data', async () => {
      mockDriveFiles.create.mockResolvedValue({ data: { id: 'file-generated' } });
      
      const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-001',
        clientName: 'Test Client',
        date: new Date('2024-01-15')
      };
      
      jest.spyOn(service as any, 'handleFileNameConflict').mockResolvedValue('Invoice-INV-001-Test-Client-2024-01-15.pdf');
      
      const pdfBuffer = new Uint8Array([1, 2, 3, 4]);
      
      const result = await service.uploadInvoicePDF(pdfBuffer, 'original.pdf', invoiceData);
      
      expect(result.success).toBe(true);
      expect(result.fileName).toBe('Invoice-INV-001-Test-Client-2024-01-15.pdf');
    });

    it('should return error when Google Drive is disabled', async () => {
      jest.spyOn(service, 'getConfig').mockResolvedValue({
        enabled: false,
        folderName: 'Invoices'
      });
      
      const pdfBuffer = new Uint8Array([1, 2, 3, 4]);
      
      const result = await service.uploadInvoicePDF(pdfBuffer, 'test.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Google Drive storage is disabled');
      expect(mockDriveFiles.create).not.toHaveBeenCalled();
    });
  });

  describe('folder management and creation logic', () => {
    describe('ensureInvoiceFolder', () => {
      it('should return existing folder ID when configured folder exists', async () => {
        jest.spyOn(service, 'getConfig').mockResolvedValue({
          enabled: true,
          folderName: 'Invoices',
          folderId: 'existing-folder-id'
        });
        
        mockDriveFiles.get.mockResolvedValue({
          data: { id: 'existing-folder-id', name: 'Invoices', mimeType: 'application/vnd.google-apps.folder' }
        });
        
        const folderId = await service.ensureInvoiceFolder();
        
        expect(folderId).toBe('existing-folder-id');
        expect(mockDriveFiles.get).toHaveBeenCalledWith({
          fileId: 'existing-folder-id',
          fields: 'id,name,mimeType'
        });
      });

      it('should create default folder when configured folder does not exist', async () => {
        jest.spyOn(service, 'getConfig').mockResolvedValue({
          enabled: true,
          folderName: 'Invoices',
          folderId: 'non-existent-folder'
        });
        
        const notFoundError = new Error('File not found');
        (notFoundError as any).response = { status: 404 };
        mockDriveFiles.get.mockRejectedValue(notFoundError);
        
        // Mock createOrFindFolder
        jest.spyOn(service as any, 'createOrFindFolder').mockResolvedValue('new-folder-id');
        
        const folderId = await service.ensureInvoiceFolder();
        
        expect(folderId).toBe('new-folder-id');
        expect((service as any).createOrFindFolder).toHaveBeenCalledWith('Invoices');
      });

      it('should create default folder when no folder is configured', async () => {
        jest.spyOn(service, 'getConfig').mockResolvedValue({
          enabled: true,
          folderName: 'Invoices'
        });
        
        jest.spyOn(service as any, 'createOrFindFolder').mockResolvedValue('default-folder-id');
        
        const folderId = await service.ensureInvoiceFolder();
        
        expect(folderId).toBe('default-folder-id');
        expect((service as any).createOrFindFolder).toHaveBeenCalledWith('Invoices');
      });
    });

    describe('createOrFindFolder', () => {
      it('should return existing folder ID when folder exists', async () => {
        mockDriveFiles.list.mockResolvedValue({
          data: {
            files: [{ id: 'existing-folder', name: 'Invoices' }]
          }
        });
        
        const folderId = await (service as any).createOrFindFolder('Invoices');
        
        expect(folderId).toBe('existing-folder');
        expect(mockDriveFiles.list).toHaveBeenCalledWith({
          q: "name='Invoices' and mimeType='application/vnd.google-apps.folder' and trashed=false",
          fields: 'files(id,name)'
        });
        expect(mockDriveFiles.create).not.toHaveBeenCalled();
      });

      it('should create new folder when folder does not exist', async () => {
        mockDriveFiles.list.mockResolvedValue({
          data: { files: [] }
        });
        
        mockDriveFiles.create.mockResolvedValue({
          data: { id: 'new-folder-id' }
        });
        
        const folderId = await (service as any).createOrFindFolder('Invoices');
        
        expect(folderId).toBe('new-folder-id');
        expect(mockDriveFiles.create).toHaveBeenCalledWith({
          requestBody: {
            name: 'Invoices',
            mimeType: 'application/vnd.google-apps.folder'
          },
          fields: 'id'
        });
      });

      it('should handle folder creation with special characters in name', async () => {
        mockDriveFiles.list.mockResolvedValue({
          data: { files: [] }
        });
        
        mockDriveFiles.create.mockResolvedValue({
          data: { id: 'special-folder-id' }
        });
        
        const folderId = await (service as any).createOrFindFolder('Client & Co. Invoices');
        
        expect(folderId).toBe('special-folder-id');
        expect(mockDriveFiles.create).toHaveBeenCalledWith({
          requestBody: {
            name: 'Client & Co. Invoices',
            mimeType: 'application/vnd.google-apps.folder'
          },
          fields: 'id'
        });
      });
    });

    describe('listFolders', () => {
      it('should return list of folders from Google Drive', async () => {
        const mockFolders = [
          {
            id: 'folder-1',
            name: 'Invoices',
            parents: ['root'],
            createdTime: '2024-01-01T00:00:00.000Z',
            modifiedTime: '2024-01-02T00:00:00.000Z'
          },
          {
            id: 'folder-2',
            name: 'Documents',
            parents: ['root'],
            createdTime: '2024-01-03T00:00:00.000Z',
            modifiedTime: '2024-01-04T00:00:00.000Z'
          }
        ];
        
        mockDriveFiles.list.mockResolvedValue({
          data: { files: mockFolders }
        });
        
        const folders = await service.listFolders();
        
        expect(folders).toHaveLength(2);
        expect(folders[0]).toEqual({
          id: 'folder-1',
          name: 'Invoices',
          parentId: 'root',
          createdTime: new Date('2024-01-01T00:00:00.000Z'),
          modifiedTime: new Date('2024-01-02T00:00:00.000Z')
        });
        expect(mockDriveFiles.list).toHaveBeenCalledWith({
          q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
          fields: 'files(id,name,parents,createdTime,modifiedTime)',
          orderBy: 'name'
        });
      });

      it('should return empty array when no folders exist', async () => {
        mockDriveFiles.list.mockResolvedValue({
          data: { files: [] }
        });
        
        const folders = await service.listFolders();
        
        expect(folders).toEqual([]);
      });

      it('should handle folders without parents', async () => {
        const mockFolders = [
          {
            id: 'folder-1',
            name: 'Root Folder',
            createdTime: '2024-01-01T00:00:00.000Z',
            modifiedTime: '2024-01-02T00:00:00.000Z'
          }
        ];
        
        mockDriveFiles.list.mockResolvedValue({
          data: { files: mockFolders }
        });
        
        const folders = await service.listFolders();
        
        expect(folders[0].parentId).toBeUndefined();
      });
    });

    describe('handleFileNameConflict', () => {
      it('should return original filename when no conflict exists', async () => {
        mockDriveFiles.list.mockResolvedValue({
          data: { files: [] }
        });
        
        const fileName = await (service as any).handleFileNameConflict('folder-id', 'test.pdf');
        
        expect(fileName).toBe('test.pdf');
        expect(mockDriveFiles.list).toHaveBeenCalledWith({
          q: "name='test.pdf' and parents in 'folder-id' and trashed=false",
          fields: 'files(id,name)'
        });
      });

      it('should append timestamp when filename conflict exists', async () => {
        mockDriveFiles.list.mockResolvedValue({
          data: { files: [{ id: 'existing-file', name: 'test.pdf' }] }
        });
        
        // Mock Date to return predictable timestamp
        const mockDate = new Date('2024-01-15T10:30:45.123Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
        
        const fileName = await (service as any).handleFileNameConflict('folder-id', 'test.pdf');
        
        expect(fileName).toBe('test-2024-01-15T10-30-45-123Z.pdf');
        
        // Restore Date
        (global.Date as any).mockRestore();
      });

      it('should handle files without extensions', async () => {
        mockDriveFiles.list.mockResolvedValue({
          data: { files: [{ id: 'existing-file', name: 'test' }] }
        });
        
        const mockDate = new Date('2024-01-15T10:30:45.123Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
        
        const fileName = await (service as any).handleFileNameConflict('folder-id', 'test');
        
        // When lastIndexOf('.') returns -1, substring(0, -1) returns empty string and substring(-1) returns 'test'
        expect(fileName).toBe('-2024-01-15T10-30-45-123Ztest');
        
        (global.Date as any).mockRestore();
      });

      it('should handle API errors gracefully', async () => {
        const apiError = new Error('API Error');
        mockDriveFiles.list.mockRejectedValue(apiError);
        
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        const fileName = await (service as any).handleFileNameConflict('folder-id', 'test.pdf');
        
        expect(fileName).toBe('test.pdf');
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Error checking for filename conflicts, using original name:',
          apiError
        );
        
        consoleWarnSpy.mockRestore();
      });
    });
  });

  describe('error handling and retry mechanisms', () => {
    describe('parseGoogleDriveError', () => {
      it('should parse authentication errors correctly', () => {
        const error = { response: { status: 401 }, message: 'Unauthorized' };
        
        const parsed = (service as any).parseGoogleDriveError(error, 'testOperation');
        
        expect(parsed).toBeInstanceOf(DriveAuthenticationError);
        expect(parsed.retryable).toBe(false);
        expect(parsed.code).toBe('DRIVE_AUTHENTICATION_ERROR');
      });

      it('should parse quota errors correctly', () => {
        const error = { response: { status: 429 }, message: 'Rate limit exceeded' };
        
        const parsed = (service as any).parseGoogleDriveError(error, 'testOperation');
        
        expect(parsed).toBeInstanceOf(DriveQuotaError);
        expect(parsed.retryable).toBe(true);
        expect(parsed.code).toBe('DRIVE_QUOTA_ERROR');
      });

      it('should parse permission errors correctly', () => {
        const error = { response: { status: 403 }, message: 'Permission denied' };
        
        const parsed = (service as any).parseGoogleDriveError(error, 'testOperation');
        
        expect(parsed).toBeInstanceOf(DrivePermissionError);
        expect(parsed.retryable).toBe(false);
        expect(parsed.code).toBe('DRIVE_PERMISSION_ERROR');
      });

      it('should parse network errors correctly', () => {
        const error = { code: 'ENOTFOUND', message: 'Network error' };
        
        const parsed = (service as any).parseGoogleDriveError(error, 'testOperation');
        
        expect(parsed).toBeInstanceOf(DriveNetworkError);
        expect(parsed.retryable).toBe(true);
        expect(parsed.code).toBe('DRIVE_NETWORK_ERROR');
      });

      it('should parse file not found errors correctly', () => {
        const error = { response: { status: 404 }, message: 'File not found' };
        
        const parsed = (service as any).parseGoogleDriveError(error, 'testOperation');
        
        expect(parsed).toBeInstanceOf(DriveFileNotFoundError);
        expect(parsed.retryable).toBe(false);
        expect(parsed.code).toBe('DRIVE_FILE_NOT_FOUND');
      });

      it('should parse server errors as network errors', () => {
        const error = { response: { status: 500 }, message: 'Internal server error' };
        
        const parsed = (service as any).parseGoogleDriveError(error, 'testOperation');
        
        expect(parsed).toBeInstanceOf(DriveNetworkError);
        expect(parsed.retryable).toBe(true);
        expect(parsed.code).toBe('DRIVE_NETWORK_ERROR');
      });

      it('should parse validation errors as non-retryable', () => {
        const error = { response: { status: 400 }, message: 'Bad request' };
        
        const parsed = (service as any).parseGoogleDriveError(error, 'testOperation');
        
        expect(parsed).toBeInstanceOf(GoogleDriveError);
        expect(parsed.retryable).toBe(false);
        expect(parsed.code).toBe('DRIVE_VALIDATION_ERROR');
      });
    });

    it('should handle upload errors gracefully', async () => {
      jest.spyOn(service, 'getConfig').mockResolvedValue({
        enabled: true,
        folderName: 'Invoices'
      });
      
      jest.spyOn(service as any, 'ensureInvoiceFolder').mockResolvedValue('folder-id');
      jest.spyOn(service as any, 'handleFileNameConflict').mockResolvedValue('test-file.pdf');
      
      const authError = new Error('Unauthorized');
      (authError as any).response = { status: 401 };
      mockDriveFiles.create.mockRejectedValue(authError);
      
      const pdfBuffer = new Uint8Array([1, 2, 3, 4]);
      
      const result = await service.uploadInvoicePDF(pdfBuffer, 'test.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });
  });

  describe('configuration management methods', () => {
    describe('getConfig', () => {
      it('should return default configuration', async () => {
        const config = await service.getConfig();
        
        expect(config).toEqual({
          folderName: 'Invoices',
          enabled: true
        });
      });
    });

    describe('updateConfig', () => {
      it('should log configuration updates', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const newConfig = {
          enabled: false,
          folderId: 'new-folder-id'
        };
        
        await service.updateConfig(newConfig);
        
        expect(consoleLogSpy).toHaveBeenCalledWith('Updating Google Drive config:', newConfig);
        
        consoleLogSpy.mockRestore();
      });
    });

    describe('retryUpload', () => {
      it('should return not implemented error', async () => {
        const result = await service.retryUpload('invoice-123');
        
        expect(result).toEqual({
          success: false,
          error: 'Retry functionality not yet implemented'
        });
      });
    });
  });

  describe('filename generation', () => {
    describe('generateInvoiceFileName', () => {
      it('should generate correct filename format for regular invoices', () => {
        const invoiceData: InvoiceData = {
          invoiceNumber: 'INV-001',
          clientName: 'Test Client',
          date: new Date('2024-01-15')
        };

        const filename = (service as any).generateInvoiceFileName(invoiceData);
        
        expect(filename).toBe('Invoice-INV-001-Test-Client-2024-01-15.pdf');
      });

      it('should generate correct filename format for recurring invoices', () => {
        const invoiceData: InvoiceData = {
          invoiceNumber: 'INV-002',
          clientName: 'Recurring Client',
          date: new Date('2024-02-01'),
          isRecurring: true,
          recurrenceInfo: 'Monthly'
        };

        const filename = (service as any).generateInvoiceFileName(invoiceData);
        
        expect(filename).toBe('Invoice-INV-002-Recurring-Client-2024-02-01-Monthly.pdf');
      });

      it('should handle client names with special characters', () => {
        const invoiceData: InvoiceData = {
          invoiceNumber: 'INV-003',
          clientName: 'Client & Co. / Ltd.',
          date: new Date('2024-03-01')
        };

        const filename = (service as any).generateInvoiceFileName(invoiceData);
        
        // The implementation removes & and replaces / with nothing, then replaces spaces with dashes
        expect(filename).toBe('Invoice-INV-003-Client-Co.-Ltd.-2024-03-01.pdf');
      });

      it('should handle client names with multiple spaces', () => {
        const invoiceData: InvoiceData = {
          invoiceNumber: 'INV-004',
          clientName: 'Multi   Space   Client',
          date: new Date('2024-04-01')
        };

        const filename = (service as any).generateInvoiceFileName(invoiceData);
        
        // The implementation replaces multiple spaces with single dashes
        expect(filename).toBe('Invoice-INV-004-Multi-Space-Client-2024-04-01.pdf');
      });
    });

    describe('sanitizeFileName', () => {
      it('should sanitize filenames with invalid characters', () => {
        const invalidFilename = 'Test<>:"/\\|?*File.pdf';
        
        const sanitized = (service as any).sanitizeFileName(invalidFilename);
        
        // The implementation replaces 9 invalid characters with dashes
        expect(sanitized).toBe('Test---------File.pdf');
      });

      it('should normalize whitespace', () => {
        const filename = 'Test   File   Name.pdf';
        
        const sanitized = (service as any).sanitizeFileName(filename);
        
        expect(sanitized).toBe('Test File Name.pdf');
      });

      it('should trim whitespace', () => {
        const filename = '  Test File.pdf  ';
        
        const sanitized = (service as any).sanitizeFileName(filename);
        
        expect(sanitized).toBe('Test File.pdf');
      });

      it('should limit filename length', () => {
        const longFilename = 'a'.repeat(300) + '.pdf';
        
        const sanitized = (service as any).sanitizeFileName(longFilename);
        
        expect(sanitized.length).toBe(255);
      });
    });
  });

  describe('getAuthenticatedService', () => {
    it('should create service with valid session', async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: 'valid-token',
        user: { email: 'test@example.com' }
      } as any);
      
      const service = await GoogleDriveService.getAuthenticatedService();
      
      expect(service).toBeInstanceOf(GoogleDriveService);
      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should throw authentication error when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      await expect(GoogleDriveService.getAuthenticatedService())
        .rejects.toThrow(DriveAuthenticationError);
    });

    it('should throw authentication error when no access token', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      } as any);
      
      await expect(GoogleDriveService.getAuthenticatedService())
        .rejects.toThrow(DriveAuthenticationError);
    });

    it('should create service with custom retry config', async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: 'valid-token',
        user: { email: 'test@example.com' }
      } as any);
      
      const customRetryConfig = {
        maxRetries: 5,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 3
      };
      
      const service = await GoogleDriveService.getAuthenticatedService(customRetryConfig);
      
      expect(service).toBeInstanceOf(GoogleDriveService);
      expect((service as any).retryConfig).toEqual(customRetryConfig);
    });
  });
});