#!/usr/bin/env node

/**
 * Setup script for Activity Logging feature
 * This script helps initialize the activity logging feature in an existing installation
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Activity Logging feature...\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root directory.');
  process.exit(1);
}

// Check if required files exist
const requiredFiles = [
  'src/lib/google-sheets.ts',
  'src/types/index.ts',
  'src/lib/api-client.ts'
];

console.log('📋 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('\n❌ Error: Some required files are missing. Please ensure you have a complete installation.');
  process.exit(1);
}

// Check if activity logging files exist
const activityFiles = [
  'src/app/api/activity-logs/route.ts',
  'src/lib/activity-logger.ts',
  'src/components/activity/activity-log-table.tsx',
  'src/app/(dashboard)/activity-logs/page.tsx',
  'docs/features/activity-logging.md',
  'docs/user-guide/activity-logging-guide.md'
];

console.log('\n📋 Checking activity logging files...');
let existingFiles = [];
let newFiles = [];

activityFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - EXISTS`);
    existingFiles.push(file);
  } else {
    console.log(`⚠️  ${file} - NEW`);
    newFiles.push(file);
  }
});

// Check Google Sheets integration
console.log('\n📋 Checking Google Sheets integration...');

const googleSheetsPath = path.join(process.cwd(), 'src/lib/google-sheets.ts');
const googleSheetsContent = fs.readFileSync(googleSheetsPath, 'utf8');

if (googleSheetsContent.includes('ActivityLogs')) {
  console.log('✅ ActivityLogs sheet integration - EXISTS');
} else {
  console.log('⚠️  ActivityLogs sheet integration - NEEDS UPDATE');
}

if (googleSheetsContent.includes('getActivityLogs')) {
  console.log('✅ Activity logging methods - EXISTS');
} else {
  console.log('⚠️  Activity logging methods - NEEDS UPDATE');
}

// Check types
console.log('\n📋 Checking type definitions...');

const typesPath = path.join(process.cwd(), 'src/types/index.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

if (typesContent.includes('ActivityLog')) {
  console.log('✅ ActivityLog types - EXISTS');
} else {
  console.log('⚠️  ActivityLog types - NEEDS UPDATE');
}

// Check API client
console.log('\n📋 Checking API client...');

const apiClientPath = path.join(process.cwd(), 'src/lib/api-client.ts');
const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');

if (apiClientContent.includes('activityLogsApi')) {
  console.log('✅ Activity logs API client - EXISTS');
} else {
  console.log('⚠️  Activity logs API client - NEEDS UPDATE');
}

// Summary
console.log('\n📊 Setup Summary:');
console.log(`✅ Existing files: ${existingFiles.length}`);
console.log(`⚠️  New files needed: ${newFiles.length}`);

if (newFiles.length === 0) {
  console.log('\n🎉 Activity Logging feature is already set up!');
} else {
  console.log('\n📝 Next Steps:');
  console.log('1. Ensure all activity logging files are created (see file list above)');
  console.log('2. Update Google Sheets service with ActivityLogs sheet and methods');
  console.log('3. Update type definitions with ActivityLog interfaces');
  console.log('4. Update API client with activity logs endpoints');
  console.log('5. Run the application and navigate to /activity-logs to test');
}

// Environment check
console.log('\n🔧 Environment Check:');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredEnvVars = [
    'GOOGLE_SHEETS_SPREADSHEET_ID',
    'GOOGLE_SHEETS_PRIVATE_KEY',
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'GOOGLE_SHEETS_PROJECT_ID'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar} - SET`);
    } else {
      console.log(`❌ ${envVar} - MISSING`);
    }
  });
} else {
  console.log('❌ .env.local file not found');
}

// Final instructions
console.log('\n🚀 Final Setup Instructions:');
console.log('1. Ensure your Google Sheets spreadsheet is accessible');
console.log('2. Run the application: npm run dev');
console.log('3. Navigate to /api/sheets/initialize to initialize sheets (if needed)');
console.log('4. Navigate to /activity-logs to view the activity logging interface');
console.log('5. Test by creating a client or invoice to see activities logged');

console.log('\n📚 Documentation:');
console.log('- Feature documentation: docs/features/activity-logging.md');
console.log('- User guide: docs/user-guide/activity-logging-guide.md');

console.log('\n✨ Activity Logging setup check complete!');