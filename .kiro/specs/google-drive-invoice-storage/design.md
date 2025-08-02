# Design Document

## Overview

The Google Drive Invoice Storage feature integrates with the existing invoice generation system to automatically store generated invoice PDFs in a user's Google Drive. This feature leverages Google Drive API v3 for file operations and follows the existing authentication patterns used by the Google Sheets integration.

The system will hook into the existing PDF generation workflow, adding a post-generation step that uploads the PDF to Google Drive. The feature includes configuration management, error handling with retry logic, and status tracking for each invoice.

## Architecture

### High-Level Flow
1. User generates an invoice PDF (existing flow)
2. PDF generation completes successfully
3. Google Drive storage service is triggered
4. PDF is uploaded to configured Google Drive folder
5. Upload status is tracked and stored
6. User can view storage status and retry failed uploads

### Integration Points
- **PDF Generation**: Hooks into existing `PDFGenerator` class after successful PDF creation
- **Authentication**: Extends existing Google OAuth 2.0 implementation used by Google Sheets
- **Settings Management**: Integrates with existing settings system for configuration
- **Error Handling**: Uses similar patterns to existing Google Sheets error handling
- **Activity Logging**: Leverages existing activity logging system for audit trail

## Components and Interfaces

### 1. GoogleDriveService Class

```typescript
interface GoogleDriveConfig {
  folderId?: string;
  folderName?: string;
  enabled: boolean;
}

interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
  retryCount?: number;
}

class GoogleDriveService {
  // Core upload functionality
  async uploadInvoicePDF(pdfBuffer: Uint8Array, fileName: string): Promise<DriveUploadResult>
  
  // Folder management
  async ensureInvoiceFolder(): Promise<string>
  async listFolders(): Promise<DriveFolder[]>
  
  // Configuration
  async getConfig(): Promise<GoogleDriveConfig>
  async updateConfig(config: Partial<GoogleDriveConfig>): Promise<void>
  
  // Retry mechanism
  async retryUpload(invoiceId: string): Promise<DriveUploadResult>
}
```

### 2. Invoice Storage Status Tracking

```typescript
interface InvoiceStorageStatus {
  invoiceId: string;
  driveFileId?: string;
  status: 'pending' | 'stored' | 'failed' | 'disabled';
  uploadedAt?: Date;
  lastAttempt?: Date;
  retryCount: number;
  errorMessage?: string;
}
```

### 3. Enhanced PDF Generation Hook

```typescript
interface PDFGenerationResult {
  pdfBuffer: Uint8Array;
  fileName: string;
  invoice: Invoice;
  client: Client;
}

// Enhanced PDF route to include Google Drive upload
async function generateAndStorePDF(invoiceId: string): Promise<{
  pdfBuffer: Uint8Array;
  driveUploadResult?: DriveUploadResult;
}>
```

### 4. Settings Integration

```typescript
interface AppSettings {
  // Existing settings...
  googleDrive: {
    enabled: boolean;
    folderId?: string;
    folderName: string;
    autoUpload: boolean;
  };
}
```

## Data Models

### Google Drive Configuration Storage
The configuration will be stored in the existing Google Sheets settings system:

**Settings Sheet Structure:**
- Column A: Setting Key (`google_drive_enabled`, `google_drive_folder_id`, `google_drive_folder_name`)
- Column B: Setting Value
- Column C: Updated At

### Invoice Storage Status Tracking
A new sheet "InvoiceStorage" will track upload status:

**InvoiceStorage Sheet Structure:**
- Column A: Invoice ID
- Column B: Drive File ID
- Column C: Status (pending/stored/failed/disabled)
- Column D: Uploaded At
- Column E: Last Attempt
- Column F: Retry Count
- Column G: Error Message
- Column H: Created At
- Column I: Updated At

## Error Handling

### Error Types
```typescript
class GoogleDriveError extends Error {
  constructor(message: string, public code: string, public retryable: boolean = false)
}

class DriveAuthenticationError extends GoogleDriveError
class DriveQuotaError extends GoogleDriveError  
class DriveNetworkError extends GoogleDriveError
class DrivePermissionError extends GoogleDriveError
```

### Retry Strategy
- **Maximum Retries**: 3 attempts
- **Backoff Strategy**: Exponential backoff (1s, 2s, 4s)
- **Retryable Errors**: Network errors, temporary API errors, quota errors
- **Non-Retryable Errors**: Authentication errors, permission errors, invalid file format

### Graceful Degradation
- If Google Drive upload fails after all retries, the invoice PDF generation still succeeds
- Users can manually retry failed uploads from the UI
- System continues to function normally even if Google Drive integration is disabled

## Testing Strategy

### Unit Tests
- `GoogleDriveService` class methods
- File name sanitization logic
- Error parsing and classification
- Retry mechanism logic
- Configuration management

### Integration Tests
- End-to-end PDF generation and upload flow
- Google Drive API authentication
- Folder creation and management
- Error scenarios and recovery

### Manual Testing Scenarios
1. **Happy Path**: Generate invoice → PDF created → Uploaded to Google Drive
2. **Folder Configuration**: Change target folder → Verify uploads go to new location
3. **Authentication Failure**: Revoke tokens → Verify re-authentication prompt
4. **Network Issues**: Simulate network failures → Verify retry logic
5. **Quota Exceeded**: Simulate quota limits → Verify graceful handling
6. **Disabled Feature**: Turn off Google Drive → Verify no upload attempts

### Performance Testing
- Upload time for various PDF sizes
- Concurrent upload handling
- Memory usage during large file uploads
- Impact on existing PDF generation performance

## Security Considerations

### Authentication & Authorization
- Use OAuth 2.0 with minimal required scopes (`https://www.googleapis.com/auth/drive.file`)
- Store access tokens securely using existing token management
- Implement token refresh logic similar to Google Sheets integration

### Data Privacy
- PDFs are uploaded to user's own Google Drive account
- No data is stored on third-party servers
- Users maintain full control over their uploaded files

### Access Control
- Only authenticated users can configure Google Drive settings
- Users can only access their own invoice storage status
- Proper validation of folder permissions before upload

## Implementation Phases

### Phase 1: Core Infrastructure
- Create `GoogleDriveService` class
- Implement basic upload functionality
- Add configuration management
- Create storage status tracking

### Phase 2: Integration
- Hook into existing PDF generation flow
- Add settings UI components
- Implement error handling and retry logic
- Add activity logging

### Phase 3: User Experience
- Add storage status indicators to invoice lists
- Implement manual retry functionality
- Create folder browser for configuration
- Add bulk retry capabilities

### Phase 4: Optimization
- Implement background upload queue
- Add upload progress indicators
- Optimize for large file handling
- Performance monitoring and metrics