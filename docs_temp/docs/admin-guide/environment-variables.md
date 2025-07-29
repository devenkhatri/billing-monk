# Environment Variables

Environment variables are crucial for configuring Billing Monk. This guide provides comprehensive documentation for all environment variables, their purposes, and configuration examples.

## Overview

Billing Monk uses environment variables to configure:
- Application settings
- Google OAuth authentication
- Google Sheets integration
- Security settings
- Feature toggles
- Performance optimizations

## Configuration File

Create a `.env.local` file in your project root:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your values
nano .env.local
```

## Required Environment Variables

### Application Configuration

#### NODE_ENV
- **Purpose**: Defines the application environment
- **Required**: Yes
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Example**: `NODE_ENV=production`

#### NEXTAUTH_URL
- **Purpose**: Base URL for NextAuth.js authentication
- **Required**: Yes
- **Format**: Full URL including protocol
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Example**: `NEXTAUTH_URL=https://invoice.yourcompany.com`

#### NEXTAUTH_SECRET
- **Purpose**: Secret key for NextAuth.js session encryption
- **Required**: Yes
- **Format**: Random string (minimum 32 characters)
- **Generation**: `openssl rand -base64 32`
- **Example**: `NEXTAUTH_SECRET=your-super-secret-key-here`
- **Security**: Keep this secret and unique per environment

### Google OAuth Configuration

#### GOOGLE_CLIENT_ID
- **Purpose**: Google OAuth 2.0 client identifier
- **Required**: Yes
- **Source**: Google Cloud Console > Credentials
- **Format**: Long alphanumeric string ending in `.apps.googleusercontent.com`
- **Example**: `GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com`

#### GOOGLE_CLIENT_SECRET
- **Purpose**: Google OAuth 2.0 client secret
- **Required**: Yes
- **Source**: Google Cloud Console > Credentials
- **Format**: Alphanumeric string
- **Example**: `GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret`
- **Security**: Keep this secret and never expose publicly

### Google Sheets API Configuration

#### GOOGLE_SHEETS_PRIVATE_KEY
- **Purpose**: Service account private key for Sheets API
- **Required**: Yes
- **Source**: Service account JSON key file
- **Format**: RSA private key (multi-line)
- **Example**: 
```bash
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```
- **Note**: Replace `\n` with actual newlines in some environments

#### GOOGLE_SHEETS_CLIENT_EMAIL
- **Purpose**: Service account email address
- **Required**: Yes
- **Source**: Service account JSON key file
- **Format**: Email address format
- **Example**: `GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com`

#### GOOGLE_SHEETS_PROJECT_ID
- **Purpose**: Google Cloud project identifier
- **Required**: Yes
- **Source**: Google Cloud Console project settings
- **Format**: Lowercase with hyphens
- **Example**: `GOOGLE_SHEETS_PROJECT_ID=invoice-ninja-clone-123456`

#### GOOGLE_SPREADSHEET_ID
- **Purpose**: ID of the Google Spreadsheet to use for data storage
- **Required**: No (can be set via UI)
- **Source**: Google Sheets URL
- **Format**: Alphanumeric string from sheets URL
- **Example**: `GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
- **Note**: Can be configured through the application interface

## Optional Environment Variables

### Application Settings

#### DEFAULT_CURRENCY
- **Purpose**: Default currency for invoices
- **Required**: No
- **Default**: `USD`
- **Format**: 3-letter ISO currency code
- **Example**: `DEFAULT_CURRENCY=EUR`
- **Supported**: USD, EUR, GBP, CAD, AUD, etc.

#### DEFAULT_TAX_RATE
- **Purpose**: Default tax rate for new invoices
- **Required**: No
- **Default**: `0.00`
- **Format**: Decimal (0.10 = 10%)
- **Example**: `DEFAULT_TAX_RATE=0.08`
- **Range**: 0.00 to 1.00

#### COMPANY_NAME
- **Purpose**: Default company name for invoices
- **Required**: No
- **Default**: Empty (set via UI)
- **Format**: Text string
- **Example**: `COMPANY_NAME=Acme Corporation`
- **Note**: Can be overridden in application settings

#### INVOICE_NUMBER_PREFIX
- **Purpose**: Prefix for auto-generated invoice numbers
- **Required**: No
- **Default**: `INV`
- **Format**: Text string (no spaces)
- **Example**: `INVOICE_NUMBER_PREFIX=ACME`
- **Result**: ACME-2024-0001

### Feature Toggles

#### ENABLE_RECURRING_INVOICES
- **Purpose**: Enable/disable recurring invoice functionality
- **Required**: No
- **Default**: `true`
- **Values**: `true`, `false`
- **Example**: `ENABLE_RECURRING_INVOICES=false`

#### ENABLE_PDF_GENERATION
- **Purpose**: Enable/disable PDF generation
- **Required**: No
- **Default**: `true`
- **Values**: `true`, `false`
- **Example**: `ENABLE_PDF_GENERATION=true`

#### ENABLE_EMAIL_NOTIFICATIONS
- **Purpose**: Enable/disable email notifications
- **Required**: No
- **Default**: `false`
- **Values**: `true`, `false`
- **Example**: `ENABLE_EMAIL_NOTIFICATIONS=true`

### Performance Settings

#### CACHE_TTL
- **Purpose**: Cache time-to-live in seconds
- **Required**: No
- **Default**: `300` (5 minutes)
- **Format**: Integer (seconds)
- **Example**: `CACHE_TTL=600`

#### MAX_CLIENTS_PER_PAGE
- **Purpose**: Maximum clients displayed per page
- **Required**: No
- **Default**: `50`
- **Format**: Integer
- **Example**: `MAX_CLIENTS_PER_PAGE=100`

#### MAX_INVOICES_PER_PAGE
- **Purpose**: Maximum invoices displayed per page
- **Required**: No
- **Default**: `25`
- **Format**: Integer
- **Example**: `MAX_INVOICES_PER_PAGE=50`

### Security Settings

#### SESSION_MAX_AGE
- **Purpose**: Maximum session age in seconds
- **Required**: No
- **Default**: `86400` (24 hours)
- **Format**: Integer (seconds)
- **Example**: `SESSION_MAX_AGE=3600`

#### ALLOWED_DOMAINS
- **Purpose**: Comma-separated list of allowed email domains
- **Required**: No
- **Default**: Empty (all domains allowed)
- **Format**: Comma-separated domain list
- **Example**: `ALLOWED_DOMAINS=yourcompany.com,partner.com`

## Environment-Specific Configurations

### Development Environment

```bash
# Development settings
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-change-in-production

# Google OAuth (development)
GOOGLE_CLIENT_ID=your-dev-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-dev-client-secret

# Google Sheets (development)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=dev-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PROJECT_ID=invoice-ninja-dev

# Development features
ENABLE_DEBUG_LOGGING=true
CACHE_TTL=60
```

### Production Environment

```bash
# Production settings
NODE_ENV=production
NEXTAUTH_URL=https://invoice.yourcompany.com
NEXTAUTH_SECRET=super-secure-production-secret-key

# Google OAuth (production)
GOOGLE_CLIENT_ID=your-prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-prod-client-secret

# Google Sheets (production)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=prod-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PROJECT_ID=invoice-ninja-prod

# Production optimizations
CACHE_TTL=600
MAX_CLIENTS_PER_PAGE=100
SESSION_MAX_AGE=86400

# Security
ALLOWED_DOMAINS=yourcompany.com
```

### Testing Environment

```bash
# Test settings
NODE_ENV=test
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key

# Test-specific settings
ENABLE_TEST_MODE=true
SKIP_AUTH_IN_TESTS=true
USE_MOCK_GOOGLE_SHEETS=true
```

## Validation and Troubleshooting

### Environment Variable Validation

The application validates environment variables on startup:

#### Required Variable Check
```javascript
// Example validation
const requiredVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

#### Format Validation
- URLs must be valid HTTP/HTTPS URLs
- Email addresses must be valid format
- Numeric values must be valid numbers
- Boolean values must be 'true' or 'false'

### Common Issues

#### Google Sheets Private Key Format
**Problem**: Private key not recognized
**Solution**: Ensure proper escaping of newlines
```bash
# Correct format
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG...\n-----END PRIVATE KEY-----\n"

# Alternative format (some environments)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG...
-----END PRIVATE KEY-----"
```

#### OAuth Redirect URI Mismatch
**Problem**: Authentication fails with redirect URI error
**Solution**: Ensure NEXTAUTH_URL matches OAuth configuration
```bash
# Development
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://yourdomain.com
```

#### Missing Environment Variables
**Problem**: Application fails to start
**Solution**: Check all required variables are set
```bash
# Check if variables are set
echo $NEXTAUTH_SECRET
echo $GOOGLE_CLIENT_ID
```

### Environment Variable Security

#### Best Practices
1. **Never commit `.env` files** to version control
2. **Use different values** for different environments
3. **Rotate secrets regularly** in production
4. **Limit access** to environment configuration
5. **Use secure storage** for production secrets

#### Secret Management
```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -hex 16     # For other secrets

# Use environment-specific secret management
# AWS: AWS Secrets Manager
# Azure: Azure Key Vault
# GCP: Secret Manager
```

## Deployment-Specific Configuration

### Vercel Deployment
```bash
# Set via Vercel dashboard or CLI
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
```

### Docker Deployment
```dockerfile
# In Dockerfile
ENV NODE_ENV=production
ENV NEXTAUTH_URL=https://yourdomain.com

# Or in docker-compose.yml
environment:
  - NODE_ENV=production
  - NEXTAUTH_URL=https://yourdomain.com
```

### Traditional Server Deployment
```bash
# Set in system environment
export NODE_ENV=production
export NEXTAUTH_URL=https://yourdomain.com

# Or in systemd service file
Environment=NODE_ENV=production
Environment=NEXTAUTH_URL=https://yourdomain.com
```

## Next Steps

After configuring environment variables:

1. [Set up Google Sheets integration](./google-sheets-setup.md)
2. [Configure authentication](./authentication-setup.md)
3. [Test the installation](./installation.md#verification)
4. [Deploy to production](./deployment/vercel.md)
5. [Set up monitoring](./maintenance/monitoring.md)

## Related Topics

- [Installation Guide](./installation.md)
- [Google Sheets Setup](./google-sheets-setup.md)
- [Authentication Setup](./authentication-setup.md)
- [Deployment Options](./deployment/vercel.md)
- [Troubleshooting](./maintenance/troubleshooting.md)