# Implementation Plan

- [x] 1. Set up Google Drive service infrastructure
  - Create GoogleDriveService class with authentication and basic file operations
  - Implement error handling classes specific to Google Drive operations
  - Add Google Drive API client configuration and scopes
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Implement core file upload functionality
  - Write PDF upload method with proper file naming and metadata
  - Create folder management methods for ensuring invoice folder exists
  - Implement file name sanitization to handle special characters and conflicts
  - _Requirements: 1.1, 6.1, 6.2, 6.3_

- [x] 3. Create storage status tracking system
  - Design and implement InvoiceStorage sheet structure in Google Sheets
  - Write methods to track upload status, retry counts, and error messages
  - Create data models for invoice storage status tracking
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Add configuration management
  - Extend existing settings system to include Google Drive configuration
  - Implement methods to get and update Google Drive settings (enabled/disabled, folder selection)
  - Create default folder creation logic when no folder is configured
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4_

- [x] 5. Implement retry mechanism with exponential backoff
  - Create retry logic for failed uploads with configurable max attempts
  - Implement exponential backoff strategy for rate limiting and temporary failures
  - Add logic to distinguish between retryable and non-retryable errors
  - _Requirements: 1.3, 1.4_

- [x] 6. Integrate with existing PDF generation workflow
  - Modify PDF generation API route to trigger Google Drive upload after successful PDF creation
  - Ensure Google Drive upload failure doesn't break existing PDF generation flow
  - Add proper error logging and activity tracking for upload operations
  - _Requirements: 1.1, 1.2_

- [x] 7. Create settings UI components
  - Build Google Drive configuration section in settings page
  - Add toggle to enable/disable Google Drive storage feature
  - Implement folder selection interface with browse functionality
  - _Requirements: 2.1, 2.2, 5.1, 5.2_

- [x] 8. Add storage status indicators to invoice interfaces
  - Modify invoice table components to show Google Drive storage status
  - Add visual indicators (stored, pending, failed, disabled) for each invoice
  - Create detailed storage status view in invoice detail pages
  - _Requirements: 4.1, 4.3_

- [x] 9. Implement manual retry functionality
  - Add retry button for failed uploads in invoice detail view
  - Create bulk retry functionality for multiple failed uploads
  - Implement proper status updates and user feedback for retry operations
  - _Requirements: 4.2_

- [x] 10. Add comprehensive error handling and user feedback
  - Implement user-friendly error messages for different failure scenarios
  - Add proper authentication flow for Google Drive access
  - Create fallback behavior when Google Drive is unavailable or disabled
  - _Requirements: 1.4, 3.4, 5.4_

- [x] 11. Write unit tests for Google Drive service
  - Test PDF upload functionality with various file sizes and names
  - Test folder management and creation logic
  - Test error handling and retry mechanisms
  - Test configuration management methods
  - _Requirements: All requirements - testing coverage_

- [x] 14. Implement filename generation with recurring invoice support
  - Create standardized filename format: "Invoice-{number}-{client}-{date}.pdf"
  - Add special handling for recurring invoices in filename generation
  - Implement timestamp appending for duplicate filename conflicts
  - _Requirements: 6.1, 6.4_

- [x] 15. Add Google Drive folder browser component
  - Create UI component to browse and select Google Drive folders
  - Implement folder creation functionality within the browser
  - Add proper loading states and error handling for folder operations
  - _Requirements: 2.1, 2.2_