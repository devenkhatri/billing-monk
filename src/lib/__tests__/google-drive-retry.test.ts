import { GoogleDriveService } from '../google-drive';

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

describe('GoogleDriveService Retry Mechanism', () => {
  let service: GoogleDriveService;
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    service = new GoogleDriveService(mockAccessToken);
    jest.clearAllMocks();
  });

  describe('executeWithRetry basic functionality', () => {
    it('should succeed on first attempt when operation succeeds', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await (service as any).executeWithRetry(mockOperation, 'testOperation');
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should not retry non-retryable errors', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).response = { status: 401 };
      
      const mockOperation = jest.fn().mockRejectedValue(authError);
      
      await expect((service as any).executeWithRetry(mockOperation, 'testOperation'))
        .rejects.toThrow('Authentication failed');
      
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle different error types correctly', async () => {
      const testCases = [
        {
          error: { response: { status: 401 }, message: 'Unauthorized' },
          expectedType: 'DriveAuthenticationError',
          shouldRetry: false
        },
        {
          error: { response: { status: 403 }, message: 'Permission denied' },
          expectedType: 'DrivePermissionError',
          shouldRetry: false
        },
        {
          error: { response: { status: 404 }, message: 'Not found' },
          expectedType: 'DriveFileNotFoundError',
          shouldRetry: false
        },
        {
          error: { response: { status: 429 }, message: 'Rate limit' },
          expectedType: 'DriveQuotaError',
          shouldRetry: true
        },
        {
          error: { code: 'ENOTFOUND', message: 'Network error' },
          expectedType: 'DriveNetworkError',
          shouldRetry: true
        }
      ];

      for (const testCase of testCases) {
        const mockOperation = jest.fn().mockRejectedValue(testCase.error);
        
        try {
          await (service as any).executeWithRetry(mockOperation, 'testOperation');
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.constructor.name).toBe(testCase.expectedType);
          expect(error.retryable).toBe(testCase.shouldRetry);
          
          // Non-retryable errors should only be called once
          if (!testCase.shouldRetry) {
            expect(mockOperation).toHaveBeenCalledTimes(1);
          }
        }
        
        jest.clearAllMocks();
      }
    });
  });

  describe('retry behavior with mocked delays', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry retryable errors with exponential backoff', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const networkError = new Error('Network error');
      (networkError as any).code = 'ENOTFOUND';
      
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');
      
      const resultPromise = (service as any).executeWithRetry(mockOperation, 'testOperation');
      
      // Fast-forward through the delays
      jest.advanceTimersByTime(1000); // First retry delay
      await Promise.resolve(); // Let the promise resolve
      jest.advanceTimersByTime(2000); // Second retry delay
      await Promise.resolve(); // Let the promise resolve
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      
      consoleWarnSpy.mockRestore();
    });

    it('should stop retrying after max attempts', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const networkError = new Error('Network error');
      (networkError as any).code = 'ENOTFOUND';
      
      const mockOperation = jest.fn().mockRejectedValue(networkError);
      
      const resultPromise = (service as any).executeWithRetry(mockOperation, 'testOperation');
      
      // Fast-forward through all retry delays
      jest.advanceTimersByTime(1000); // First retry
      await Promise.resolve();
      jest.advanceTimersByTime(2000); // Second retry
      await Promise.resolve();
      jest.advanceTimersByTime(4000); // Third retry
      await Promise.resolve();
      
      await expect(resultPromise).rejects.toThrow('Network error');
      
      expect(mockOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
      
      consoleWarnSpy.mockRestore();
    });

    it('should use correct exponential backoff delays', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const networkError = new Error('Network error');
      (networkError as any).code = 'ENOTFOUND';
      
      const mockOperation = jest.fn().mockRejectedValue(networkError);
      
      const resultPromise = (service as any).executeWithRetry(mockOperation, 'testOperation');
      
      // Check that delays follow exponential backoff pattern
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(999); // Just before first retry
      await Promise.resolve();
      expect(mockOperation).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(1); // Trigger first retry
      await Promise.resolve();
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('testOperation failed (attempt 1/4), retrying in 1000ms')
      );
      
      jest.advanceTimersByTime(1999); // Just before second retry
      await Promise.resolve();
      expect(mockOperation).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(1); // Trigger second retry
      await Promise.resolve();
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('testOperation failed (attempt 2/4), retrying in 2000ms')
      );
      
      await expect(resultPromise).rejects.toThrow();
      
      consoleWarnSpy.mockRestore();
    });

    it('should add jitter for quota errors', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const quotaError = new Error('Quota exceeded');
      (quotaError as any).response = { status: 429 };
      
      const mockOperation = jest.fn().mockRejectedValue(quotaError);
      
      // Mock Math.random to return a predictable value
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5);
      
      const resultPromise = (service as any).executeWithRetry(mockOperation, 'testOperation');
      
      jest.advanceTimersByTime(1500); // 1000ms * (1 + 0.5) = 1500ms
      await Promise.resolve();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('testOperation failed (attempt 1/4), retrying in 1500ms')
      );
      
      // Restore Math.random
      Math.random = originalRandom;
      
      await expect(resultPromise).rejects.toThrow();
      
      consoleWarnSpy.mockRestore();
    });

    it('should respect max delay limit', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Create service with custom retry config to test max delay
      const customRetryConfig = {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 3000,
        backoffMultiplier: 2
      };
      const customService = new GoogleDriveService(mockAccessToken, customRetryConfig);
      
      const networkError = new Error('Network error');
      (networkError as any).code = 'ENOTFOUND';
      
      const mockOperation = jest.fn().mockRejectedValue(networkError);
      
      const resultPromise = (customService as any).executeWithRetry(mockOperation, 'testOperation');
      
      // Skip to the 4th retry where delay would be 8000ms but should be capped at 3000ms
      jest.advanceTimersByTime(1000); // 1st retry
      await Promise.resolve();
      jest.advanceTimersByTime(2000); // 2nd retry
      await Promise.resolve();
      jest.advanceTimersByTime(3000); // 3rd retry (capped at maxDelay)
      await Promise.resolve();
      jest.advanceTimersByTime(3000); // 4th retry (capped at maxDelay)
      await Promise.resolve();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('retrying in 3000ms')
      );
      
      await expect(resultPromise).rejects.toThrow();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('upload retry integration', () => {
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
      
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry upload on network errors', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ENOTFOUND';
      
      mockDriveFiles.create
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ data: { id: 'file-123' } });
      
      const pdfBuffer = new Uint8Array([1, 2, 3, 4]);
      
      const resultPromise = service.uploadInvoicePDF(pdfBuffer, 'test.pdf');
      
      // Fast-forward through retry delays
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      
      const result = await resultPromise;
      
      expect(result.success).toBe(true);
      expect(result.fileId).toBe('file-123');
      expect(mockDriveFiles.create).toHaveBeenCalledTimes(3);
    });

    it('should not retry upload on authentication errors', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).response = { status: 401 };
      
      mockDriveFiles.create.mockRejectedValue(authError);
      
      const pdfBuffer = new Uint8Array([1, 2, 3, 4]);
      
      const result = await service.uploadInvoicePDF(pdfBuffer, 'test.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
      expect(mockDriveFiles.create).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ENOTFOUND';
      
      mockDriveFiles.create.mockRejectedValue(networkError);
      
      const pdfBuffer = new Uint8Array([1, 2, 3, 4]);
      
      const resultPromise = service.uploadInvoicePDF(pdfBuffer, 'test.pdf');
      
      // Fast-forward through all retry attempts
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
      
      const result = await resultPromise;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(mockDriveFiles.create).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });
});