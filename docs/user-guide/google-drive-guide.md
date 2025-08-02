# Google Drive User Guide

This guide walks you through using the Google Drive integration features in Billing Monk for automatic invoice storage and management.

## Getting Started

### Prerequisites

Before using Google Drive features, ensure:
- You have a Google account
- You're signed in to Billing Monk with your Google account
- Google Drive integration is enabled by your administrator
- You have granted the necessary permissions

### First-Time Setup

1. **Navigate to Settings**
   - Click on "Settings" in the sidebar menu
   - Scroll down to the "Google Drive Storage" section

2. **Enable Google Drive Storage**
   - Toggle the "Google Drive Storage" switch to ON
   - You may be prompted to grant additional permissions

3. **Choose Your Storage Folder**
   - Click "Browse Folders" to open the folder browser
   - Select where you want to store your invoice PDFs

## Using the Folder Browser

### Opening the Folder Browser

The folder browser can be accessed from:
- Settings page → Google Drive Storage → "Browse Folders" button
- Any time you need to change your storage folder

### Browsing Folders

**Viewing Available Folders:**
- All your accessible Google Drive folders are displayed
- Folders show their names and last modified dates
- Use the scroll bar to navigate through long lists

**Searching for Folders:**
1. Type in the search box at the top
2. Results filter automatically as you type
3. Search is case-insensitive (typing "invoice" finds "Invoice" and "INVOICE")
4. The counter shows how many folders match your search

**Selecting a Folder:**
1. Click the radio button next to your desired folder
2. The selected folder will be highlighted
3. Click "Select Folder" to confirm your choice

### Default Folder Option

**Using the Default Option:**
- Select "Default (Invoices)" to use a standard setup
- This creates an "Invoices" folder in your Google Drive root
- Perfect for users who want a simple, organized approach
- No additional setup required

### Creating New Folders

**When to Create New Folders:**
- You want a specific organization structure
- You need separate folders for different clients or years
- You want to keep invoices separate from other documents

**How to Create a Folder:**
1. Click the "New Folder" button in the folder browser
2. A form will appear with a text input
3. Enter your desired folder name
4. Click "Create" to create the folder

**Folder Name Guidelines:**
- Use descriptive names like "2024 Invoices" or "Client Invoices"
- Avoid special characters: `< > : " / \ | ? *`
- Keep names under 255 characters
- Choose names that make sense for your organization

**What Happens After Creation:**
- The new folder is created in your Google Drive
- It's automatically selected in the folder browser
- You can immediately start using it for invoice storage
- The folder appears in your regular Google Drive interface

## Managing Invoice Storage

### Automatic Storage

**How It Works:**
- When you generate an invoice PDF, it's automatically uploaded to your selected folder
- Files are named clearly: `Invoice-INV001-ClientName-2024-01-15.pdf`
- You don't need to do anything - it happens in the background

**Checking Storage Status:**
- Each invoice shows its storage status
- Look for these indicators:
  - ✅ **Stored**: Successfully saved to Google Drive
  - ⏳ **Pending**: Upload in progress
  - ❌ **Failed**: Upload failed (can be retried)
  - ⚪ **Disabled**: Google Drive storage is turned off

### Manual Control

**Disabling Auto-Upload:**
1. Go to Settings → Google Drive Storage
2. Toggle "Automatic Upload" to OFF
3. You can now manually upload invoices as needed

**Manual Upload Process:**
1. Open an invoice that hasn't been uploaded
2. Click "Upload to Google Drive" (if available)
3. Wait for the upload to complete
4. Check the status indicator for confirmation

### Handling Upload Failures

**Why Uploads Might Fail:**
- Temporary internet connection issues
- Google Drive storage space full
- Temporary Google service issues
- Permission problems

**Retrying Failed Uploads:**

**For Individual Invoices:**
1. Open the invoice with failed upload
2. Look for the "Retry Upload" button
3. Click it to attempt upload again
4. Wait for the new status to appear

**For Multiple Invoices:**
1. Go to Settings → Google Drive Storage
2. Look for "Retry Failed Uploads" option
3. Click to retry all failed uploads at once
4. Monitor the progress and results

## Organizing Your Invoices

### File Naming System

**Standard Format:**
- `Invoice-INV001-ClientName-2024-01-15.pdf`
- Invoice number, client name, and date are included
- Makes files easy to find and sort

**Recurring Invoices:**
- `Invoice-INV001-ClientName-2024-01-15-Recurring-Monthly.pdf`
- Includes frequency information for easy identification

### Folder Organization Strategies

**By Year:**
- Create folders like "2024 Invoices", "2023 Invoices"
- Good for businesses with seasonal patterns
- Easy for annual tax preparation

**By Client:**
- Create folders for major clients
- Useful for businesses with long-term client relationships
- Makes client-specific reporting easier

**By Project:**
- Create folders for different projects or services
- Good for project-based businesses
- Helps with project profitability analysis

**Mixed Approach:**
- Use a main "Invoices" folder with subfolders
- Organize by whatever makes sense for your business
- You can always reorganize later in Google Drive

## Accessing Your Stored Invoices

### From Google Drive

**Direct Access:**
1. Open Google Drive in your browser
2. Navigate to your chosen invoice folder
3. Find and open the invoice PDF you need
4. Download, share, or view as needed

**Sharing Invoices:**
1. Right-click on an invoice PDF in Google Drive
2. Select "Share" or "Get link"
3. Set appropriate permissions
4. Share the link with clients or accountants

### From Billing Monk

**Viewing Storage Status:**
- Invoice lists show storage status icons
- Click on invoices to see detailed storage information
- Failed uploads are clearly marked for easy identification

**Direct Links:**
- Some invoices may show "View in Google Drive" links
- Click to open the file directly in Google Drive
- Useful for quick access without browsing folders

## Troubleshooting Common Issues

### "Authentication Required" Error

**What It Means:**
- You need to sign in to Google Drive
- Your permissions may have expired

**How to Fix:**
1. Click the "Sign In to Google Drive" button when prompted
2. Complete the Google authentication process
3. Grant the requested permissions
4. Try your action again

### "Permission Denied" Error

**What It Means:**
- The app doesn't have permission to access Google Drive
- Your folder permissions may have changed

**How to Fix:**
1. Check your Google Account permissions
2. Go to Google Account → Security → Third-party apps
3. Find Billing Monk and ensure it has Drive access
4. If needed, remove and re-grant permissions

### "Folder Not Found" Error

**What It Means:**
- Your selected folder may have been deleted or moved
- Folder permissions may have changed

**How to Fix:**
1. Go to Settings → Google Drive Storage
2. Click "Browse Folders" to select a new folder
3. Choose an existing folder or create a new one
4. Test with a new invoice to confirm it works

### "Quota Exceeded" Error

**What It Means:**
- Google Drive API limits have been reached
- This is usually temporary

**How to Fix:**
1. Wait 1-2 minutes for the quota to reset
2. Try your action again
3. If it persists, contact your administrator
4. Consider reducing the frequency of operations

### Upload Keeps Failing

**Possible Causes:**
- Internet connection issues
- Google Drive storage space full
- File size too large (unlikely for PDFs)
- Temporary Google service issues

**Troubleshooting Steps:**
1. Check your internet connection
2. Verify you have space in Google Drive
3. Try uploading a different invoice
4. Wait a few minutes and try again
5. Contact support if problems persist

## Best Practices

### Folder Organization

**Keep It Simple:**
- Start with a basic folder structure
- You can always reorganize later
- Don't create too many nested folders initially

**Use Descriptive Names:**
- Choose folder names that will make sense in 6 months
- Include years or date ranges when relevant
- Avoid abbreviations that might be confusing later

**Regular Maintenance:**
- Periodically review your folder structure
- Archive old invoices if needed
- Clean up any duplicate or test files

### Storage Management

**Monitor Storage Status:**
- Check for failed uploads regularly
- Retry failed uploads promptly
- Keep an eye on your Google Drive storage space

**Backup Considerations:**
- Google Drive is already a backup, but consider additional backups for critical data
- Export important invoices periodically
- Keep local copies of critical documents

### Security and Privacy

**Access Control:**
- Only share invoice folders with trusted individuals
- Use Google Drive's sharing permissions carefully
- Regularly review who has access to your folders

**Data Protection:**
- Keep your Google account secure with strong passwords
- Enable two-factor authentication
- Monitor your account for unusual activity

## Advanced Tips

### Keyboard Shortcuts

**In Folder Browser:**
- `Tab`: Navigate between elements
- `Enter`: Select highlighted folder
- `Escape`: Close the folder browser
- `Arrow keys`: Navigate folder list

### Integration with Other Tools

**Google Sheets:**
- Your invoice data is also stored in Google Sheets
- Use both together for comprehensive record-keeping
- Create reports that reference both systems

**Email Integration:**
- Attach invoice PDFs from Google Drive to emails
- Share Google Drive links instead of large attachments
- Use Gmail's Google Drive integration features

**Mobile Access:**
- Install Google Drive app on your phone
- Access invoices from anywhere
- Share invoices directly from mobile device

### Automation Ideas

**Folder Organization:**
- Create folders at the beginning of each year
- Set up consistent naming conventions
- Use Google Drive's organizational features

**Workflow Integration:**
- Bookmark your invoice folder for quick access
- Set up Google Drive notifications for new files
- Use Google Drive's search features to find invoices quickly

## Getting Help

### Built-in Help

**Status Indicators:**
- Pay attention to status icons and messages
- Error messages usually include helpful suggestions
- Use the retry mechanisms when available

**Settings Page:**
- The Google Drive section shows current status
- Health indicators help identify issues
- Configuration options are clearly labeled

### When to Contact Support

**Contact Support If:**
- Errors persist after following troubleshooting steps
- You need help with initial setup
- You have questions about permissions or security
- You need assistance with advanced configurations

**Before Contacting Support:**
- Note any error messages exactly as they appear
- Try the basic troubleshooting steps
- Check your internet connection and Google Drive access
- Have your account information ready

## Conclusion

The Google Drive integration makes invoice management effortless by automatically storing your PDFs in an organized, accessible way. With the advanced folder browser, you have complete control over how your invoices are organized, while the automatic upload feature ensures nothing gets lost.

Take some time to set up your folder structure the way that makes sense for your business, and then let the system handle the rest. Your invoices will be safely stored, easily accessible, and ready for sharing with clients or accountants whenever you need them.