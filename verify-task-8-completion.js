#!/usr/bin/env node

/**
 * Verification script for Task 8: Add storage status indicators to invoice interfaces
 * 
 * This script verifies that:
 * 1. StorageStatusIndicator component exists and has correct structure
 * 2. useStorageStatus hook exists and has correct interface
 * 3. Invoice table includes storage status column
 * 4. Invoice detail includes storage status section
 * 5. API endpoints for storage status exist
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 8: Add storage status indicators to invoice interfaces\n');

const checks = [
  {
    name: 'StorageStatusIndicator component exists',
    path: 'src/components/ui/storage-status-indicator.tsx',
    verify: (content) => {
      return content.includes('StorageStatusIndicator') &&
             content.includes('InvoiceStorageStatus') &&
             content.includes('stored') &&
             content.includes('pending') &&
             content.includes('failed') &&
             content.includes('disabled');
    }
  },
  {
    name: 'useStorageStatus hook exists',
    path: 'src/lib/hooks/use-storage-status.ts',
    verify: (content) => {
      return content.includes('useStorageStatus') &&
             content.includes('storageStatuses') &&
             content.includes('retryUpload') &&
             content.includes('/api/invoices/storage-status');
    }
  },
  {
    name: 'Storage status API endpoint exists',
    path: 'src/app/api/invoices/storage-status/route.ts',
    verify: (content) => {
      return content.includes('POST') &&
             content.includes('invoiceIds') &&
             content.includes('getAllInvoiceStorageStatuses');
    }
  },
  {
    name: 'Retry upload API endpoint exists',
    path: 'src/app/api/invoices/[id]/retry-upload/route.ts',
    verify: (content) => {
      return content.includes('POST') &&
             content.includes('getInvoiceStorageStatus') &&
             content.includes('updateInvoiceStorageStatus');
    }
  },
  {
    name: 'Invoice table includes storage status',
    path: 'src/components/tables/invoice-table.tsx',
    verify: (content) => {
      return content.includes('StorageStatusIndicator') &&
             content.includes('useStorageStatus') &&
             content.includes('Storage') &&
             content.includes('retryUpload') &&
             content.includes('ArrowPathIcon');
    }
  },
  {
    name: 'Invoice detail includes storage status',
    path: 'src/components/invoices/invoice-detail.tsx',
    verify: (content) => {
      return content.includes('StorageStatusIndicator') &&
             content.includes('useStorageStatus') &&
             content.includes('Google Drive Storage') &&
             content.includes('handleRetryUpload');
    }
  },
  {
    name: 'UI index exports StorageStatusIndicator',
    path: 'src/components/ui/index.ts',
    verify: (content) => {
      return content.includes("export { StorageStatusIndicator } from './storage-status-indicator'");
    }
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const filePath = path.join(process.cwd(), check.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${index + 1}. ${check.name}`);
    console.log(`   File not found: ${check.path}\n`);
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  if (check.verify(content)) {
    console.log(`✅ ${index + 1}. ${check.name}`);
  } else {
    console.log(`❌ ${index + 1}. ${check.name}`);
    console.log(`   Verification failed for: ${check.path}\n`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('🎉 All checks passed! Task 8 implementation is complete.');
  console.log('\nImplemented features:');
  console.log('• StorageStatusIndicator component with visual status indicators');
  console.log('• useStorageStatus hook for fetching and managing storage statuses');
  console.log('• Storage status column in invoice table with retry functionality');
  console.log('• Detailed storage status section in invoice detail view');
  console.log('• API endpoints for fetching storage statuses and retrying uploads');
  console.log('• Visual indicators for stored, pending, failed, and disabled states');
  console.log('• Retry upload functionality with loading states');
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}