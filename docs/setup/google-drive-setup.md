# Google Drive Setup Guide

This comprehensive guide covers setting up Google Drive integration for automatic invoice PDF storage in Billing Monk.

## Overview

The Google Drive integration provides:
- Automatic invoice PDF storage
- Advanced folder browser with search and creation
- Comprehensive error handling and retry mechanisms
- Storage status tracking and management
- Flexible folder organization options

## Prerequisites

Before setting up Google Drive integration, ensure you have:
- A Google Cloud Console project
- Google Drive API enabled
- OAuth 2.0 credentials configured
- Billing Monk application installed and running

## Google Cloud Console Setup

### 1. Enable Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to "APIs & Services" > "Library"
4. Search for "Google Drive API"
5. Click on "Google Drive API" and click "Enable"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose user type:
   - **Internal**: For Google Workspace organizations only
   - **External**: For general use (recommended)
3. Fill in required information:
   - **App name**: "Billing Monk" (or your preferred name)
   - **User support email**: Your email address
   - **App logo**: Optional but recommended
   - **App domain**: Your application domain
   - **Developer contact information**: Your email address

4. Configure scopes:
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.file`

5. Add test users (for development):
   - Add email addresses of users who will test the application
   - For production, you'll need to publish the app

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Select "Web application"
4. Configure the client:
   - **Name**: "Billing Monk Web Client"
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

5. Save the Client ID and Client Secret for environment configuration

### 4. Create Service Account (Optional but Recommended)

For server-side operations, create a service account:

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details:
   - **Name**: "Billing Monk Service Account"
   - **Description**: "Service account for Billing Monk Google Drive operations"
4. Assign roles:
   - **Google Drive**: "Drive File" role (recommended)
   - **Google Sheets**: "Editor" role
5. Create and download the JSON key file
6. Store the key file securely (never commit to version control)

## Application Configuration

### Environment Variables

Add these variables to your `.env.local` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Google Service Account (if using)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_SHEETS_PROJECT_ID=your-google-cloud-project-id

# Google Drive Configuration
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_NAME=Invoices
GOOGLE_DRIVE_AUTO_UPLOAD=true
GOOGLE_DRIVE_RETRY_ATTEMPTS=3
```

### Configuration Details

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret | `GOCSPX-your-client-secret` |
| `GOOGLE_DRIVE_ENABLED` | No | Enable/disable Drive integration | `true` or `false` |
| `GOOGLE_DRIVE_FOLDER_NAME` | No | Default folder name | `Invoices` |
| `GOOGLE_DRIVE_AUTO_UPLOAD` | No | Auto-upload new invoices | `true` or `false` |
| `GOOGLE_DRIVE_RETRY_ATTEMPTS` | No | Number of retry attempts | `3` |

## Application Setup

### 1. Initial Configuration

1. Start your Billing Monk application
2. Sign in with your Google account
3. Grant the requested permissions:
   - Access to Google Sheets
   - Access to Google Drive files
   - Basic profile information

### 2. Configure Google Drive Storage

1. Navigate to the Settings page
2. Scroll to the "Google Drive Storage" section
3. Toggle "Google Drive Storage" to enable it
4. Configure your storage preferences:
   - **Folder Selection**: Choose where to store invoices
   - **Auto Upload**: Enable/disable automatic uploads

### 3. Select Storage Folder

#### Option A: Use Default Folder
1. In the folder selection, choose "Default (Invoices)"
2. This will create an "Invoices" folder in your Google Drive root
3. All invoice PDFs will be stored in this folder

#### Option B: Choose Existing Folder
1. Click "Browse Folders" to open the folder browser
2. Search for your desired folder using the search box
3. Select the folder from the list
4. Click "Select Folder" to confirm

#### Option C: Create New Folder
1. Click "Browse Folders" to open the folder browser
2. Click the "New Folder" button
3. Enter a folder name (validation will check for invalid characters)
4. Click "Create" to create the folder
5. The new folder will be automatically selected

## Using the Folder Browser

### Features

**Search Functionality:**
- Type in the search box to filter folders in real-time
- Search is case-insensitive
- Shows count of matching folders

**Folder Creation:**
- Click "New Folder" to create folders directly in the browser
- Validates folder names for:
  - Required field
  - Maximum 255 characters
  - Invalid characters: `<>:"/\|?*`
  - Duplicate names
- Shows loading state during creation
- Automatically selects newly created folders

**Error Handling:**
- Authentication errors with sign-in prompts
- Network errors with retry buttons
- Permission errors with helpful messages
- Quota exceeded warnings with wait times
- Validation errors with specific feedback

### Navigation

**Keyboard Shortcuts:**
- `Tab`: Navigate between elements
- `Enter`: Select highlighted folder
- `Escape`: Close the folder browser
- `Arrow keys`: Navigate folder list

**Mouse/Touch:**
- Click folder names to select
- Use search box to filter
- Scroll through long folder lists
- Click buttons for actions

## Testing the Integration

### 1. Create Test Invoice

1. Go to the Invoices page
2. Click "Create Invoice"
3. Fill in the required information
4. Save the invoice

### 2. Generate PDF

1. Open the created invoice
2. Click "Generate PDF" or "Download PDF"
3. The PDF should be automatically uploaded to Google Drive
4. Check the storage status in the invoice details

### 3. Verify in Google Drive

1. Open Google Drive in your browser
2. Navigate to your selected folder
3. Verify the invoice PDF is present
4. Check the filename format: `Invoice-{number}-{client}-{date}.pdf`

## Troubleshooting

### Common Issues

#### Authentication Errors

**Error**: "Google Drive authentication required"

**Solutions:**
1. Sign out and sign back in to the application
2. Check OAuth consent screen configuration
3. Verify redirect URIs in Google Cloud Console
4. Ensure Google Drive API is enabled

#### Permission Errors

**Error**: "You don't have permission to access Google Drive folders"

**Solutions:**
1. Check OAuth scopes include `drive.file`
2. Verify service account roles in Google Cloud Console
3. Ensure user has granted Drive permissions
4. Check folder sharing permissions

#### Quota Exceeded Errors

**Error**: "Google Drive quota exceeded"

**Solutions:**
1. Wait for quota reset (usually 100 seconds)
2. Reduce frequency of operations
3. Check quota usage in Google Cloud Console
4. Request quota increase if needed

#### Upload Failures

**Error**: Various upload-related errors

**Solutions:**
1. Check internet connection
2. Verify Google Drive storage space
3. Use retry mechanism in invoice details
4. Check file permissions and folder access

### Debug Steps

1. **Check API Status:**
   ```bash
   curl http://localhost:3000/api/google-drive/folders
   ```

2. **Review Browser Console:**
   - Open browser developer tools
   - Check console for JavaScript errors
   - Look for network request failures

3. **Verify Environment Variables:**
   ```bash
   # Check if variables are set
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_DRIVE_ENABLED
   ```

4. **Test Google Drive API:**
   - Try accessing Google Drive directly
   - Create a test file manually
   - Check API quotas in Google Cloud Console

## Advanced Configuration

### Custom Folder Structures

You can organize invoices using custom folder structures:

```javascript
// Example: Year/Month organization
const folderPath = `Invoices/${new Date().getFullYear()}/${new Date().toLocaleString('default', { month: 'long' })}`;
```

### Batch Operations

The application supports batch operations for managing multiple invoices:

- **Bulk Retry**: Retry all failed uploads at once
- **Bulk Download**: Download multiple invoices as PDFs
- **Bulk Status Check**: Check storage status for multiple invoices

### Integration with Other Google Services

**Google Sheets Integration:**
- Invoice metadata can be tracked in Google Sheets
- Storage status is recorded for reporting
- Custom reports can include Drive file links

**Gmail Integration:**
- Invoice PDFs can be attached to emails
- Direct sharing from Google Drive
- Email templates with Drive links

## Security Considerations

### Data Privacy

- Invoice PDFs are stored in the user's own Google Drive
- Application only accesses files it creates (with `drive.file` scope)
- No access to existing user files unless explicitly granted

### Access Control

- Use minimal required scopes (`drive.file` recommended over full `drive`)
- Service account has limited, controlled access
- Users can revoke access at any time in Google Account settings

### Best Practices

- Regularly audit service account permissions
- Monitor API usage and access patterns
- Use HTTPS in production for secure data transmission
- Keep service account keys secure and rotate regularly
- Implement proper error handling and user feedback

## Monitoring and Maintenance

### Health Checks

Regular monitoring endpoints:
- `/api/google-drive/folders` - Test folder access
- `/api/status` - Overall application health
- Settings page - Google Drive status indicator

### Performance Monitoring

- Monitor API quota usage in Google Cloud Console
- Track upload success/failure rates
- Monitor response times for Drive operations
- Set up alerts for quota approaching limits

### Maintenance Tasks

**Daily:**
- Check for failed uploads and retry if needed
- Monitor error logs for Drive-related issues
- Verify storage status for recent invoices

**Weekly:**
- Review API quota usage trends
- Check for any permission or access issues
- Verify folder organization and cleanup if needed

**Monthly:**
- Audit service account permissions
- Review and rotate API keys if needed
- Update OAuth consent screen if required
- Performance optimization review

## Support and Resources

### Documentation
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)

### Getting Help
- Check the application logs for detailed error messages
- Review Google Cloud Console for API usage and errors
- Use the application's built-in error reporting
- Contact support for complex configuration issues

### Useful Links
- [Google Drive API Quotas](https://developers.google.com/drive/api/guides/limits)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Service Account Setup](https://cloud.google.com/iam/docs/creating-managing-service-accounts)
- [API Key Security](https://cloud.google.com/docs/authentication/api-keys)