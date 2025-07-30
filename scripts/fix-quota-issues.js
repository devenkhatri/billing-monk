#!/usr/bin/env node

/**
 * Script to help fix Google Sheets API quota issues
 * This script provides recommendations and can help optimize the application
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Google Sheets API Quota Issue Fixer\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root directory.');
  process.exit(1);
}

console.log('📋 Analyzing quota usage patterns...\n');

// Check Google Sheets service configuration
const googleSheetsPath = path.join(process.cwd(), 'src/lib/google-sheets.ts');
if (fs.existsSync(googleSheetsPath)) {
  const content = fs.readFileSync(googleSheetsPath, 'utf8');
  
  console.log('🔍 Google Sheets Service Analysis:');
  
  // Check for request queue implementation
  if (content.includes('RequestQueue')) {
    console.log('✅ Request queue implementation - FOUND');
  } else {
    console.log('❌ Request queue implementation - MISSING');
    console.log('   Recommendation: Implement request queuing to limit concurrent API calls');
  }
  
  // Check for caching
  if (content.includes('getCachedData')) {
    console.log('✅ Caching implementation - FOUND');
  } else {
    console.log('❌ Caching implementation - MISSING');
    console.log('   Recommendation: Implement caching to reduce API calls');
  }
  
  // Check retry configuration
  if (content.includes('maxRetries: 3')) {
    console.log('✅ Optimized retry configuration - FOUND');
  } else if (content.includes('maxRetries: 5')) {
    console.log('⚠️  High retry count detected - NEEDS OPTIMIZATION');
    console.log('   Recommendation: Reduce maxRetries to 3 to prevent quota exhaustion');
  }
  
  // Check for rate limiting
  if (content.includes('MIN_REQUEST_INTERVAL')) {
    console.log('✅ Rate limiting - FOUND');
  } else {
    console.log('❌ Rate limiting - MISSING');
    console.log('   Recommendation: Implement rate limiting between requests');
  }
  
  console.log('');
}

// Check dashboard API for concurrent calls
const dashboardApiPath = path.join(process.cwd(), 'src/app/api/dashboard/route.ts');
if (fs.existsSync(dashboardApiPath)) {
  const content = fs.readFileSync(dashboardApiPath, 'utf8');
  
  console.log('🔍 Dashboard API Analysis:');
  
  // Count Promise.all usage (indicates concurrent calls)
  const promiseAllMatches = content.match(/Promise\.all/g);
  if (promiseAllMatches && promiseAllMatches.length > 0) {
    console.log(`⚠️  Found ${promiseAllMatches.length} Promise.all usage(s) - POTENTIAL ISSUE`);
    console.log('   Recommendation: Consider sequential execution for Google Sheets calls');
  } else {
    console.log('✅ No concurrent Promise.all calls detected');
  }
  
  // Check for individual API calls
  const apiCallMatches = content.match(/sheetsService\.\w+\(/g);
  if (apiCallMatches && apiCallMatches.length > 5) {
    console.log(`⚠️  Found ${apiCallMatches.length} API calls in dashboard - HIGH USAGE`);
    console.log('   Recommendation: Implement caching or reduce API calls');
  } else if (apiCallMatches) {
    console.log(`✅ Found ${apiCallMatches.length} API calls in dashboard - REASONABLE`);
  }
  
  console.log('');
}

// Provide immediate solutions
console.log('🚀 Immediate Solutions:\n');

console.log('1. 📊 REDUCE CONCURRENT CALLS:');
console.log('   - Avoid Promise.all() for Google Sheets API calls');
console.log('   - Use sequential execution instead of parallel');
console.log('   - Implement request queuing\n');

console.log('2. ⏱️  IMPLEMENT BETTER CACHING:');
console.log('   - Cache API responses for 60+ seconds');
console.log('   - Use cache invalidation on data changes');
console.log('   - Implement client-side caching\n');

console.log('3. 🔄 OPTIMIZE RETRY LOGIC:');
console.log('   - Reduce maxRetries from 5 to 3');
console.log('   - Increase delay between retries');
console.log('   - Add exponential backoff with jitter\n');

console.log('4. 🚦 RATE LIMITING:');
console.log('   - Minimum 200ms between requests');
console.log('   - Limit concurrent requests to 2-3');
console.log('   - Use request queuing\n');

console.log('5. 🏗️  INITIALIZATION OPTIMIZATION:');
console.log('   - Make sheet initialization sequential');
console.log('   - Cache initialization results');
console.log('   - Skip unnecessary header checks\n');

// Environment recommendations
console.log('🌍 Environment Recommendations:\n');

console.log('1. 📈 GOOGLE CLOUD CONSOLE:');
console.log('   - Check your quota limits in Google Cloud Console');
console.log('   - Consider requesting quota increases if needed');
console.log('   - Monitor API usage patterns\n');

console.log('2. 🔧 APPLICATION SETTINGS:');
console.log('   - Set NODE_ENV=production for better performance');
console.log('   - Enable caching in production');
console.log('   - Use connection pooling\n');

console.log('3. 📊 MONITORING:');
console.log('   - Monitor API call frequency');
console.log('   - Set up alerts for quota usage');
console.log('   - Log API response times\n');

// Quick fixes
console.log('⚡ Quick Fixes to Apply Now:\n');

console.log('1. Restart your application to reset quota counters');
console.log('2. Wait 1-2 minutes before making new requests');
console.log('3. Reduce concurrent users/browser tabs');
console.log('4. Clear browser cache and cookies');
console.log('5. Check for infinite loops or recursive calls\n');

// Code snippets
console.log('💻 Code Optimization Examples:\n');

console.log('❌ AVOID (Concurrent calls):');
console.log('```javascript');
console.log('const [clients, invoices, payments] = await Promise.all([');
console.log('  sheetsService.getClients(),');
console.log('  sheetsService.getInvoices(),');
console.log('  sheetsService.getPayments()');
console.log(']);');
console.log('```\n');

console.log('✅ PREFER (Sequential calls):');
console.log('```javascript');
console.log('const clients = await sheetsService.getClients();');
console.log('const invoices = await sheetsService.getInvoices();');
console.log('const payments = await sheetsService.getPayments();');
console.log('```\n');

console.log('✅ BEST (Cached calls):');
console.log('```javascript');
console.log('const clients = await cachedApiClient.getCached(\'/clients\', undefined, 60000);');
console.log('const invoices = await cachedApiClient.getCached(\'/invoices\', undefined, 60000);');
console.log('```\n');

console.log('🎯 Next Steps:\n');
console.log('1. Apply the request queue implementation');
console.log('2. Update retry configuration');
console.log('3. Implement better caching');
console.log('4. Test with reduced concurrent calls');
console.log('5. Monitor quota usage');

console.log('\n✨ Quota optimization analysis complete!');
console.log('📚 For more details, check: https://developers.google.com/sheets/api/limits');