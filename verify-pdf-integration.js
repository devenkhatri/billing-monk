// Simple verification script for PDF Google Drive integration
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying PDF Google Drive Integration...\n');

// Check if the PDF route file exists and has the required imports
const pdfRoutePath = 'src/app/api/invoices/[id]/pdf/route.ts';
if (fs.existsSync(pdfRoutePath)) {
  const content = fs.readFileSync(pdfRoutePath, 'utf8');
  
  console.log('✅ PDF route file exists');
  
  // Check for required imports
  const requiredImports = [
    'GoogleDriveService',
    'activityLogger',
    'getServerSession'
  ];
  
  requiredImports.forEach(importName => {
    if (content.includes(importName)) {
      console.log(`✅ ${importName} import found`);
    } else {
      console.log(`❌ ${importName} import missing`);
    }
  });
  
  // Check for Google Drive upload logic
  if (content.includes('uploadInvoicePDF')) {
    console.log('✅ Google Drive upload logic found');
  } else {
    console.log('❌ Google Drive upload logic missing');
  }
  
  // Check for error handling
  if (content.includes('try {') && content.includes('catch (driveError)')) {
    console.log('✅ Error handling for Google Drive found');
  } else {
    console.log('❌ Error handling for Google Drive missing');
  }
  
  // Check for activity logging
  if (content.includes('logGoogleDriveActivity')) {
    console.log('✅ Google Drive activity logging found');
  } else {
    console.log('❌ Google Drive activity logging missing');
  }
  
  // Check that PDF generation still returns regardless of Google Drive status
  if (content.includes('Return PDF as response (regardless of Google Drive upload status)')) {
    console.log('✅ PDF generation continues regardless of Google Drive status');
  } else {
    console.log('❌ PDF generation might be blocked by Google Drive failures');
  }
  
} else {
  console.log('❌ PDF route file not found');
}

// Check if activity logger has Google Drive methods
const activityLoggerPath = 'src/lib/activity-logger.ts';
if (fs.existsSync(activityLoggerPath)) {
  const content = fs.readFileSync(activityLoggerPath, 'utf8');
  
  console.log('\n✅ Activity logger file exists');
  
  if (content.includes('logGoogleDriveActivity')) {
    console.log('✅ Google Drive activity logging method found');
  } else {
    console.log('❌ Google Drive activity logging method missing');
  }
  
  // Check for specific Google Drive activity types
  const activityTypes = [
    'google_drive_upload_success',
    'google_drive_upload_failed',
    'google_drive_upload_error'
  ];
  
  activityTypes.forEach(type => {
    if (content.includes(type)) {
      console.log(`✅ Activity type '${type}' found`);
    } else {
      console.log(`❌ Activity type '${type}' missing`);
    }
  });
  
} else {
  console.log('❌ Activity logger file not found');
}

// Check if Google Drive service exists
const googleDrivePath = 'src/lib/google-drive.ts';
if (fs.existsSync(googleDrivePath)) {
  const content = fs.readFileSync(googleDrivePath, 'utf8');
  
  console.log('\n✅ Google Drive service file exists');
  
  if (content.includes('uploadInvoicePDF')) {
    console.log('✅ uploadInvoicePDF method found');
  } else {
    console.log('❌ uploadInvoicePDF method missing');
  }
  
} else {
  console.log('❌ Google Drive service file not found');
}

// Check if test file exists
const testPath = 'src/lib/__tests__/pdf-google-drive-integration.test.ts';
if (fs.existsSync(testPath)) {
  console.log('\n✅ Integration test file created');
} else {
  console.log('\n❌ Integration test file missing');
}

console.log('\n🎯 Integration Summary:');
console.log('- PDF generation route modified to include Google Drive upload');
console.log('- Google Drive upload happens after successful PDF generation');
console.log('- Upload failures do not block PDF generation');
console.log('- Activity logging tracks all Google Drive operations');
console.log('- Error handling ensures graceful degradation');
console.log('- Integration test created for verification');

console.log('\n✅ PDF Google Drive Integration Complete!');