# Billing Monk

A comprehensive billing and invoice management system built specifically for Indian businesses. Built with Next.js and Google Sheets as the backend, Billing Monk provides all the essential features needed for managing clients, creating GST-compliant invoices, tracking payments, and generating business reports.

## Features

- **Client Management**: Store and organize customer information
- **GST-Compliant Invoicing**: Create beautiful, GST-compliant invoices for Indian businesses
- **Invoice Templates**: Create and manage reusable invoice templates with predefined line items
- **Payment Tracking**: Monitor payments and outstanding balances in INR
- **Recurring Billing**: Automate regular billing cycles
- **Project & Task Management**: Organize work with projects and tasks
- **Time Tracking**: Log time entries for accurate billing
- **Activity Logging**: Comprehensive audit trail of all system activities
- **Business Analytics**: Generate insights with comprehensive reports
- **Google Sheets Integration**: All data stored securely in your own Google Sheets
- **Google Drive Storage**: Automatic invoice PDF storage with folder management
- **Mobile Responsive**: Works seamlessly on all devices
- **PDF Generation**: Create professional PDF invoices with GST details
- **Template Management**: Full CRUD operations for invoice templates
- **Indian Localization**: Built specifically for Indian business practices and compliance

## Quick Start

### For Users
If you have an existing installation and want to start using the system:

1. Navigate to your application URL
2. Sign in with your Google account
3. Complete the initial setup wizard
4. Start adding clients and creating invoices

### For Administrators
If you need to install and configure the system, follow the [Administrator Guide](#administrator-guide) below.

## Administrator Guide

This comprehensive guide covers system installation, configuration, and maintenance for administrators.

### System Requirements

#### Minimum Requirements
- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher (or yarn equivalent)
- **RAM**: 2GB minimum
- **Storage**: 10GB available disk space
- **Google Account**: For Sheets API access
- **Internet Connection**: Required for Google Sheets integration

#### Recommended Requirements
- **Node.js**: 20.0 LTS
- **RAM**: 4GB or higher
- **Storage**: SSD for better performance
- **SSL Certificate**: For HTTPS in production
- **CDN**: For static asset delivery

### Pre-Installation Setup

#### 1. Google Cloud Console Configuration

Before installing the application, set up Google Cloud Console:

**Create Google Cloud Project:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select existing project
3. Enter project name (e.g., "Billing Monk")
4. Note the Project ID for later use

**Enable Required APIs:**
1. Navigate to "APIs & Services" > "Library"
2. Search for and enable:
   - Google Sheets API
   - Google Drive API (required for invoice storage)
   - Google OAuth2 API

**Create Service Account:**
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter service account name and description
4. Assign roles:
   - "Editor" role for Google Sheets access
   - "Drive File" role for Google Drive access (recommended)
   - Or "Drive" role for full Drive access (if needed)
5. Download the JSON key file (keep secure)

**Create OAuth 2.0 Client:**
1. In "Credentials", click "Create Credentials" > "OAuth 2.0 Client ID"
2. Select "Web application" as application type
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
5. Note the Client ID and Client Secret

**Configure OAuth Consent Screen:**
1. Go to "OAuth consent screen"
2. Choose "External" user type (unless using Google Workspace)
3. Fill required fields:
   - App name: "Billing Monk" (or your app name)
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Add test users (for development) or publish the app (for production)

### Installation

#### Method 1: Clone from Repository

```bash
# Clone the repository
git clone https://github.com/your-org/billing-monk.git
cd billing-monk

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit environment variables (see configuration section below)
nano .env.local

# Run development server
npm run dev
```

#### Method 2: Docker Installation

```yaml
# docker-compose.yml
version: '3.8'
services:
  billing-monk:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=https://yourdomain.com
      - NEXTAUTH_SECRET=your-secret-key
      - GOOGLE_CLIENT_ID=your-client-id
      - GOOGLE_CLIENT_SECRET=your-client-secret
    volumes:
      - ./data:/app/data
```

```bash
# Build and run
docker-compose up -d
```

### Environment Variables Configuration

Create a `.env.local` file in your project root with the following variables:

#### Required Variables

```bash
# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret-key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Sheets Configuration
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_SHEETS_PROJECT_ID=your-google-cloud-project-id

# Google Drive Configuration (Optional - for invoice PDF storage)
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_NAME=Invoices
```

#### Optional Variables

```bash
# Application Settings
DEFAULT_CURRENCY=INR
DEFAULT_TAX_RATE=0.18
COMPANY_NAME=Your Company Name
INVOICE_NUMBER_PREFIX=INV

# Feature Toggles
ENABLE_RECURRING_INVOICES=true
ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=false

# Performance Settings
CACHE_TTL=300
MAX_CLIENTS_PER_PAGE=50
MAX_INVOICES_PER_PAGE=25

# Security Settings
SESSION_MAX_AGE=86400
ALLOWED_DOMAINS=yourcompany.com,partner.com

# Google Sheets (Optional)
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
```

#### Environment Variable Details

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Application environment | `production` |
| `NEXTAUTH_URL` | Yes | Base URL for authentication | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | Yes | Secret for session encryption | Generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Yes | OAuth client identifier | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth client secret | `GOCSPX-your-client-secret` |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Yes | Service account private key | From JSON key file |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Yes | Service account email | `service-account@project.iam.gserviceaccount.com` |
| `GOOGLE_SHEETS_PROJECT_ID` | Yes | Google Cloud project ID | `invoice-ninja-clone-123456` |
| `DEFAULT_CURRENCY` | No | Default currency code | `INR`, `USD`, `EUR` |
| `DEFAULT_TAX_RATE` | No | Default GST rate (decimal) | `0.18` (18%) |
| `COMPANY_NAME` | No | Default company name | `Acme Corporation` |
| `INVOICE_NUMBER_PREFIX` | No | Invoice number prefix | `INV`, `ACME` |

### Google Sheets Setup

#### Automatic Setup (Recommended)
1. Start the application after configuring environment variables
2. Complete OAuth authentication
3. The setup wizard will create necessary Google Sheets automatically
4. Grant permissions when prompted

### Google Drive Setup

The application includes comprehensive Google Drive integration for automatic invoice PDF storage. This feature allows you to:

- Automatically store generated invoice PDFs in Google Drive
- Browse and select custom folders for invoice storage
- Create new folders directly from the application
- Manage folder permissions and organization
- Track storage status for each invoice

#### Google Drive Configuration Steps

**1. Enable Google Drive API (if not already done):**
- In Google Cloud Console, go to "APIs & Services" > "Library"
- Search for "Google Drive API" and enable it
- Ensure your OAuth consent screen includes the Drive scope

**2. Configure Drive Permissions:**

For **Service Account** (recommended for server operations):
```bash
# The service account needs access to create and manage files
# Grant these roles in Google Cloud Console:
# - "Drive File" role (recommended - can only access files it creates)
# - OR "Drive" role (full access - use with caution)
```

For **OAuth User** (for user-specific folders):
- Users will be prompted to grant Drive permissions during first use
- Required scopes: `https://www.googleapis.com/auth/drive.file`

**3. Application Configuration:**

Add to your `.env.local`:
```bash
# Enable Google Drive integration
GOOGLE_DRIVE_ENABLED=true

# Default folder name (optional)
GOOGLE_DRIVE_FOLDER_NAME=Invoices

# Storage settings (optional)
GOOGLE_DRIVE_AUTO_UPLOAD=true
GOOGLE_DRIVE_RETRY_ATTEMPTS=3
```

#### Google Drive Features

**Folder Browser Component:**
- **Browse Folders**: View all accessible Google Drive folders
- **Search Functionality**: Filter folders by name with real-time search
- **Create Folders**: Create new folders directly from the browser
- **Folder Selection**: Choose specific folders for invoice storage
- **Default Option**: Use default "Invoices" folder in Drive root

**Automatic Storage:**
- **PDF Generation**: Invoices are automatically converted to PDF
- **Smart Naming**: Files use format: `Invoice-{number}-{client}-{date}.pdf`
- **Recurring Invoice Support**: Special naming for recurring invoices
- **Conflict Resolution**: Automatic handling of duplicate filenames

**Storage Management:**
- **Status Tracking**: Monitor upload status for each invoice
- **Retry Mechanism**: Automatic retry for failed uploads
- **Error Handling**: Comprehensive error reporting and recovery
- **Bulk Operations**: Retry multiple failed uploads at once

#### Setting Up Google Drive Storage

**Step 1: Access Settings**
1. Navigate to Settings page in the application
2. Scroll to "Google Drive Storage" section
3. Toggle "Enable Google Drive Storage" to ON

**Step 2: Configure Folder**
1. Click "Browse Folders" to open the folder browser
2. **Option A - Use Default**: Select "Default (Invoices)" to create/use an "Invoices" folder in your Drive root
3. **Option B - Choose Existing**: Select any existing folder from the list
4. **Option C - Create New**: 
   - Click "New Folder" button
   - Enter folder name (validates for invalid characters)
   - Click "Create" to create and select the new folder

**Step 3: Configure Auto-Upload**
1. Toggle "Automatic Upload" to enable/disable automatic PDF storage
2. When enabled, all new invoices will be automatically stored in Google Drive
3. When disabled, you can manually upload invoices as needed

**Step 4: Test Configuration**
1. Create a test invoice
2. Generate PDF to verify Google Drive integration
3. Check the selected folder in Google Drive for the stored PDF
4. Verify the filename format and content

#### Folder Browser Features

**Search and Filter:**
```
- Real-time search as you type
- Case-insensitive folder name matching
- Shows "X folders found" counter
- Empty state for no results
```

**Folder Creation:**
```
- Click "New Folder" button
- Enter folder name with validation:
  - Required field validation
  - Maximum 255 characters
  - Invalid character detection (<>:"/\|?*)
  - Duplicate name checking
- Real-time creation with loading states
- Automatic selection of newly created folder
```

**Folder Selection:**
```
- Radio button selection interface
- Default "Invoices" option always available
- Shows folder modification dates
- Visual folder icons and metadata
- Responsive design with proper scrolling
```

**Error Handling:**
```
- Authentication errors with sign-in prompts
- Network errors with retry buttons
- Permission errors with helpful messages
- Quota exceeded warnings
- Validation errors for folder names
```

#### Google Drive API Quotas and Limits

**Understanding Quotas:**
- **Queries per day**: 1,000,000,000 (typically sufficient)
- **Queries per 100 seconds per user**: 1,000
- **Queries per 100 seconds**: 10,000

**Best Practices:**
- The application implements automatic retry with exponential backoff
- Batch operations where possible
- Cache folder listings to reduce API calls
- Monitor quota usage in Google Cloud Console

**If You Hit Quota Limits:**
1. **Wait**: Quotas reset automatically
2. **Check Usage**: Monitor in Google Cloud Console
3. **Request Increase**: Contact Google for quota increases if needed
4. **Optimize**: Review application usage patterns

#### Troubleshooting Google Drive Integration

**Common Issues:**

1. **"Authentication Required" Error:**
   ```
   Solution:
   - Ensure user is signed in with Google account
   - Check OAuth consent screen configuration
   - Verify redirect URIs are correct
   - Ensure Drive API is enabled
   ```

2. **"Permission Denied" Error:**
   ```
   Solution:
   - Check service account roles in Google Cloud Console
   - Ensure OAuth scopes include drive.file
   - Verify user has granted Drive permissions
   - Check folder sharing permissions
   ```

3. **"Folder Not Found" Error:**
   ```
   Solution:
   - Folder may have been deleted or moved
   - Check folder permissions
   - Try selecting a different folder
   - Use "Default (Invoices)" option as fallback
   ```

4. **"Quota Exceeded" Error:**
   ```
   Solution:
   - Wait for quota reset (usually 100 seconds)
   - Reduce frequency of operations
   - Check Google Cloud Console for quota status
   - Consider requesting quota increase
   ```

5. **Upload Failures:**
   ```
   Solution:
   - Check internet connection
   - Verify file size limits (not applicable for PDFs)
   - Use retry mechanism in invoice details
   - Check Google Drive storage space
   ```

**Debug Steps:**
1. **Check API Status**: Visit `/api/google-drive/folders` endpoint
2. **Review Logs**: Check browser console for detailed errors
3. **Test Authentication**: Try signing out and back in
4. **Verify Configuration**: Double-check environment variables
5. **Test Permissions**: Try creating a file manually in Google Drive

#### Google Drive Security Considerations

**Data Privacy:**
- Invoice PDFs are stored in user's own Google Drive
- Application only accesses files it creates (with drive.file scope)
- No access to existing user files unless explicitly granted

**Access Control:**
- Use minimal required scopes (drive.file recommended)
- Service account has limited, controlled access
- Users can revoke access at any time in Google Account settings

**Best Practices:**
- Regularly audit service account permissions
- Monitor API usage and access patterns
- Use HTTPS in production for secure data transmission
- Keep service account keys secure and rotate regularly

#### Advanced Google Drive Configuration

**Custom Folder Structure:**
```javascript
// Example: Organize by year/month
const folderStructure = {
  root: "Invoices",
  subfolders: {
    year: new Date().getFullYear(),
    month: new Date().toLocaleString('default', { month: 'long' })
  }
}
```

**Batch Operations:**
```javascript
// The application supports batch retry for failed uploads
// Access via Settings > Google Drive > Retry Failed Uploads
```

**Integration with Other Services:**
```javascript
// Google Drive files can be integrated with:
// - Google Docs (for invoice editing)
// - Gmail (for email attachments)
// - Google Sheets (for tracking)
```

#### Manual Setup
If you prefer manual setup:

1. **Create Google Spreadsheet:**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet
   - Name it "Billing Monk Data"

2. **Create Required Sheets:**
   - `Clients`: ID, Name, Email, Phone, Street, City, State, ZipCode, Country, CreatedAt, UpdatedAt
   - `Invoices`: ID, InvoiceNumber, ClientID, TemplateID, Status, IssueDate, DueDate, Subtotal, TaxRate, TaxAmount, Total, PaidAmount, Balance, Notes, CreatedAt, UpdatedAt
   - `LineItems`: ID, InvoiceID, Description, Quantity, Rate, Amount
   - `Payments`: ID, InvoiceID, Amount, PaymentDate, PaymentMethod, Notes, CreatedAt
   - `Settings`: Key, Value, UpdatedAt
   - `Templates`: ID, Name, Description, TaxRate, Notes, IsActive, CreatedAt, UpdatedAt
   - `TemplateLineItems`: ID, TemplateID, Description, Quantity, Rate

3. **Configure Permissions:**
   - Share spreadsheet with service account email
   - Grant "Editor" permissions
   - Add spreadsheet ID to environment variables

### Production Deployment

#### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

#### Process Management with PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "billing-monk" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL Certificate Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### System Maintenance

#### Regular Maintenance Tasks

**Daily:**
- Monitor application logs
- Check system resource usage
- Verify Google Sheets sync status

**Weekly:**
- Review error logs
- Check SSL certificate status
- Monitor API usage quotas
- Backup environment configuration

**Monthly:**
- Update dependencies
- Review security settings
- Rotate API keys if needed
- Performance optimization review

#### Monitoring Setup

**Application Health Check:**
```bash
#!/bin/bash
# health-check.sh
curl -f http://localhost:3000/api/status || exit 1
```

**Log Monitoring:**
```bash
# View application logs
pm2 logs invoice-ninja-clone

# Monitor system logs
sudo journalctl -u nginx -f
sudo tail -f /var/log/nginx/error.log
```

**Performance Monitoring:**
```bash
# Check system resources
htop
df -h
free -m

# Monitor Node.js process
pm2 monit
```

#### Backup and Recovery

**Environment Configuration Backup:**
```bash
# Backup environment variables
cp .env.local .env.local.backup.$(date +%Y%m%d)

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 ~/pm2-backup.$(date +%Y%m%d).json
```

**Google Sheets Backup:**
- Google automatically backs up your sheets
- Manual export: File > Download > Excel (.xlsx)
- Consider periodic automated exports

**Application Code Backup:**
```bash
# Create application backup
tar -czf billing-monk-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  .
```

#### Troubleshooting

**Common Issues:**

1. **Application Won't Start:**
   ```bash
   # Check Node.js version
   node --version
   
   # Verify environment variables
   cat .env.local
   
   # Check port availability
   lsof -i :3000
   ```

2. **Google Sheets Connection Issues:**
   ```bash
   # Verify API credentials
   # Check service account permissions
   # Ensure APIs are enabled in Google Cloud Console
   ```

3. **Authentication Problems:**
   ```bash
   # Verify OAuth configuration
   # Check redirect URIs
   # Ensure HTTPS in production
   ```

4. **Performance Issues:**
   ```bash
   # Monitor resource usage
   # Check Google Sheets API quotas
   # Review application logs
   # Consider caching optimization
   ```

#### Security Best Practices

**Environment Security:**
- Store sensitive variables securely
- Use different values for different environments
- Rotate secrets regularly
- Limit access to configuration files

**Application Security:**
- Keep dependencies updated
- Use HTTPS in production
- Implement proper access controls
- Monitor for security vulnerabilities

**Google Cloud Security:**
- Use minimal required permissions
- Regularly audit service account access
- Enable audit logging
- Monitor API usage

### Updates and Upgrades

#### Updating the Application

```bash
# Backup current installation
cp -r . ../billing-monk-backup-$(date +%Y%m%d)

# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Rebuild application
npm run build

# Restart services
pm2 restart invoice-ninja-clone
```

#### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Security audit
npm audit
npm audit fix
```

### Support and Documentation

#### Getting Help
- **Documentation**: Complete guides available in `/docs`
- **GitHub Issues**: Report bugs and request features
- **Community**: Join discussions and get help
- **Professional Support**: Available for enterprise installations

#### Useful Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linting
npm run test         # Run tests

# Production Management
pm2 start npm --name "billing-monk" -- start
pm2 stop billing-monk
pm2 restart billing-monk
pm2 logs billing-monk
pm2 monit

# System Monitoring
systemctl status nginx
systemctl status pm2-root
journalctl -u nginx -f
```

#### Configuration Examples

**Development Environment:**
```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-change-in-production
GOOGLE_CLIENT_ID=dev-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dev-client-secret
```

**Production Environment:**
```bash
NODE_ENV=production
NEXTAUTH_URL=https://billing.yourcompany.com
NEXTAUTH_SECRET=super-secure-production-secret
GOOGLE_CLIENT_ID=prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod-client-secret
CACHE_TTL=600
SESSION_MAX_AGE=86400
```

## Key Features Guide

### Google Drive Integration

The application includes comprehensive Google Drive integration for automatic invoice PDF storage and management.

#### Google Drive Folder Browser

**Accessing the Folder Browser:**
1. Navigate to Settings page
2. Scroll to "Google Drive Storage" section
3. Click "Browse Folders" button

**Folder Browser Features:**

**Search and Navigation:**
- **Real-time Search**: Type in the search box to filter folders instantly
- **Folder Count**: Shows "X folders found" with current filter results
- **Responsive Design**: Optimized for desktop and mobile devices
- **Keyboard Navigation**: Full keyboard accessibility support

**Folder Selection:**
- **Default Option**: "Default (Invoices)" creates/uses an "Invoices" folder in Drive root
- **Custom Folders**: Select any existing folder from your Google Drive
- **Folder Details**: Shows folder names and last modified dates
- **Visual Indicators**: Folder icons and clear selection states

**Creating New Folders:**
1. Click the "New Folder" button in the folder browser
2. Enter a folder name in the form that appears
3. **Validation Features**:
   - Required field validation
   - Maximum 255 character limit
   - Invalid character detection (prevents <>:"/\|?*)
   - Duplicate name checking
4. Click "Create" to create the folder
5. The new folder is automatically selected and added to the list

**Error Handling and Recovery:**
- **Authentication Errors**: Clear prompts to sign in to Google Drive
- **Network Errors**: Retry buttons for connection issues
- **Permission Errors**: Helpful messages about Drive access
- **Quota Errors**: Information about API limits and wait times
- **Validation Errors**: Real-time feedback for folder name issues

#### Automatic Invoice Storage

**How It Works:**
1. When an invoice PDF is generated, it's automatically uploaded to your selected Google Drive folder
2. Files are named using the format: `Invoice-{number}-{client}-{date}.pdf`
3. For recurring invoices: `Invoice-{number}-{client}-{date}-Recurring-{frequency}.pdf`
4. Duplicate filenames are automatically handled with timestamps

**Storage Configuration:**
- **Enable/Disable**: Toggle Google Drive storage on/off in settings
- **Auto-Upload**: Choose whether to automatically upload all new invoices
- **Folder Selection**: Choose where invoices are stored using the folder browser
- **Status Tracking**: Monitor upload status for each invoice

**Storage Status Indicators:**
- **Pending**: Upload is queued or in progress
- **Stored**: Successfully uploaded to Google Drive
- **Failed**: Upload failed (with retry options)
- **Disabled**: Google Drive storage is turned off

#### Managing Stored Invoices

**Invoice Status Tracking:**
- Each invoice shows its Google Drive storage status
- Failed uploads can be retried individually
- Bulk retry option for multiple failed uploads
- Direct links to view files in Google Drive (when available)

**Retry Mechanisms:**
- **Automatic Retry**: Failed uploads are automatically retried with exponential backoff
- **Manual Retry**: Click retry button on individual invoices
- **Bulk Retry**: Retry all failed uploads from the settings page
- **Smart Retry**: Handles different error types appropriately

**File Management:**
- **Organized Storage**: Files are stored in your chosen folder
- **Consistent Naming**: Standardized filename format for easy organization
- **Conflict Resolution**: Automatic handling of duplicate names
- **Metadata Preservation**: Invoice details are maintained in filenames

#### Google Drive Settings

**Configuration Options:**
- **Storage Toggle**: Enable/disable Google Drive integration
- **Folder Selection**: Choose storage location with folder browser
- **Auto-Upload**: Automatic vs. manual upload control
- **Retry Settings**: Configure retry attempts and timing

**Monitoring and Maintenance:**
- **Storage Status**: Overview of all invoice storage statuses
- **Error Reporting**: Detailed error messages and resolution steps
- **Usage Tracking**: Monitor Google Drive API usage
- **Health Checks**: Verify Google Drive connectivity

#### Benefits of Google Drive Integration

**Automatic Backup:**
- All invoice PDFs are automatically backed up to Google Drive
- No manual file management required
- Secure cloud storage with Google's infrastructure

**Organization:**
- Choose custom folder structures
- Consistent file naming conventions
- Easy integration with existing Google Drive workflows

**Accessibility:**
- Access invoices from any device with Google Drive
- Share invoices directly from Google Drive
- Integrate with other Google Workspace tools

**Reliability:**
- Automatic retry mechanisms for failed uploads
- Comprehensive error handling and recovery
- Status tracking for all storage operations

### Invoice Templates

The application now includes a comprehensive template management system that allows you to create reusable invoice templates for common services or products.

#### Creating Templates

1. **Navigate to Templates**: Click "Templates" in the sidebar or press `Alt+T`
2. **Create New Template**: Click the "Create Template" button
3. **Fill Template Details**:
   - **Name**: Give your template a descriptive name (e.g., "Web Development Services")
   - **Description**: Optional brief description of the template
   - **Line Items**: Add multiple line items with descriptions, quantities, and rates
   - **Tax Rate**: Set a default tax rate for this template
   - **Notes**: Add default notes that will appear on invoices using this template
   - **Status**: Mark as active/inactive to control availability

#### Using Templates in Invoices

1. **Create New Invoice**: Go to Invoices and click "Create Invoice"
2. **Select Template**: Choose a template from the dropdown menu
3. **Auto-Population**: The template will automatically fill in:
   - All line items with descriptions, quantities, and rates
   - Default tax rate
   - Default notes
4. **Customize**: You can still modify any field after applying the template
5. **Apply Template Button**: Use the "Apply Template" button to reapply template data

#### Template Management

- **View All Templates**: See all templates with their status, total amounts, and creation dates
- **Edit Templates**: Modify existing templates - changes won't affect previously created invoices
- **Delete Templates**: Remove templates that are no longer needed
- **Active/Inactive Status**: Control which templates appear in the invoice creation dropdown

#### Template Features

- **Real-time Calculations**: See subtotal, tax, and total amounts as you build templates
- **Multiple Line Items**: Add unlimited line items to templates
- **Flexible Pricing**: Support for different quantities and rates per line item
- **Tax Integration**: Templates include tax rate settings
- **Notes System**: Default notes that can be customized per invoice

#### Navigation and Shortcuts

- **Sidebar Navigation**: Templates appear in the main navigation menu
- **Keyboard Shortcut**: Press `Alt+T` to quickly access templates
- **Quick Actions**: Edit and delete templates directly from the templates table

### Benefits of Using Templates

- **Time Saving**: Quickly create invoices for recurring services
- **Consistency**: Ensure consistent pricing and descriptions across invoices
- **Professional**: Maintain professional standards with pre-defined templates
- **Efficiency**: Reduce data entry errors and speed up invoice creation
- **Flexibility**: Templates serve as starting points that can be customized per invoice

## User Documentation

For end-user documentation, including how to use the application features, please refer to the comprehensive documentation in the `/docs` directory:

### Documentation Structure

- **`/docs/setup/`** - Setup and configuration guides
  - `google-drive-setup.md` - Complete Google Drive integration setup guide
- **`/docs/features/`** - Detailed feature documentation
  - `google-drive-integration.md` - Comprehensive Google Drive features documentation
  - `templates.md` - Complete guide to invoice templates system
- **`/docs/user-guide/`** - Step-by-step user guides
  - `google-drive-guide.md` - Google Drive user guide with workflows and best practices
  - `templates-guide.md` - Templates user guide with workflows and best practices
- **`/docs/api/`** - API documentation for developers
- **`/docs/admin/`** - Administrator guides for system setup and maintenance

### Key Documentation Files

- **Google Drive Quick Start**: `/docs/GOOGLE_DRIVE_QUICK_START.md` - 5-minute setup guide for Google Drive
- **Google Drive Setup**: `/docs/setup/google-drive-setup.md` - Complete Google Drive configuration guide
- **Google Drive Features**: `/docs/features/google-drive-integration.md` - Comprehensive Google Drive features documentation
- **Google Drive User Guide**: `/docs/user-guide/google-drive-guide.md` - Step-by-step Google Drive usage guide
- **Templates Feature**: `/docs/features/templates.md` - Comprehensive templates documentation
- **Templates User Guide**: `/docs/user-guide/templates-guide.md` - Step-by-step templates usage
- **API Reference**: Available in `/docs/api` directory
- **Setup Guide**: Administrator setup instructions in this README

## API Documentation

The application provides a REST API for integration with other systems. API documentation is available in the `/docs/api` directory.

## Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

## License

This project is open source and available under the [MIT License](LICENSE).

## Troubleshooting Common Issues

### Google Sheets API Quota Exceeded

If you encounter "Quota exceeded for quota metric 'Read requests'" errors, this is a common issue that can be resolved with the following steps:

#### Understanding the Issue
- Google Sheets API has rate limits: 100 requests per 100 seconds per user
- The application was making too many API calls during initialization
- Each read operation was triggering a full sheets initialization

#### Solutions Implemented
1. **Initialization Caching**: Sheets are now initialized only once per service instance
2. **Request Batching**: Multiple header checks are batched together
3. **Rate Limiting**: Built-in delays between API requests (100ms minimum)
4. **Caching**: Frequently accessed data is cached for 30-60 seconds
5. **Retry Logic**: Exponential backoff with jitter for rate limit errors

#### Monitoring and Prevention
- **Health Check**: Visit `/api/sheets/health` to check API status
- **Settings Dashboard**: Monitor API status in the Settings page
- **Error Handling**: Improved error messages and retry mechanisms

#### If You Still Experience Issues
1. **Wait**: Quota limits reset every minute - wait 1-2 minutes
2. **Check Status**: Use the health check endpoint or Settings page
3. **Reduce Frequency**: Avoid rapid successive operations
4. **Contact Support**: If issues persist, check GitHub issues

#### Best Practices
- Avoid refreshing pages rapidly
- Use the application's built-in navigation instead of browser refresh
- Allow operations to complete before starting new ones
- Monitor the API status in Settings page

## Support

- **Documentation**: `/docs` directory
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Professional Support**: Contact for enterprise support options
