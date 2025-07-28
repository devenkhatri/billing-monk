# Invoice Ninja Clone

A comprehensive invoice management system built with Next.js and Google Sheets as the backend. This application provides all the essential features needed for managing clients, creating professional invoices, tracking payments, and generating business reports.

## Features

- **Client Management**: Store and organize customer information
- **Professional Invoicing**: Create beautiful, customizable invoices
- **Payment Tracking**: Monitor payments and outstanding balances
- **Recurring Billing**: Automate regular billing cycles
- **Business Analytics**: Generate insights with comprehensive reports
- **Google Sheets Integration**: All data stored in your own Google Sheets
- **Mobile Responsive**: Works seamlessly on all devices
- **PDF Generation**: Create professional PDF invoices
- **Template System**: Reusable invoice templates for efficiency

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
3. Enter project name (e.g., "Invoice Ninja Clone")
4. Note the Project ID for later use

**Enable Required APIs:**
1. Navigate to "APIs & Services" > "Library"
2. Search for and enable:
   - Google Sheets API
   - Google Drive API
   - Google OAuth2 API

**Create Service Account:**
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter service account name and description
4. Assign "Editor" role for Google Sheets access
5. Download the JSON key file (keep secure)

**Create OAuth 2.0 Client:**
1. In "Credentials", click "Create Credentials" > "OAuth 2.0 Client ID"
2. Select "Web application" as application type
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
4. Note the Client ID and Client Secret

### Installation

#### Method 1: Clone from Repository

```bash
# Clone the repository
git clone https://github.com/your-org/invoice-ninja-clone.git
cd invoice-ninja-clone

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
  invoice-ninja-clone:
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
```

#### Optional Variables

```bash
# Application Settings
DEFAULT_CURRENCY=USD
DEFAULT_TAX_RATE=0.10
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
| `DEFAULT_CURRENCY` | No | Default currency code | `USD`, `EUR`, `GBP` |
| `DEFAULT_TAX_RATE` | No | Default tax rate (decimal) | `0.08` (8%) |
| `COMPANY_NAME` | No | Default company name | `Acme Corporation` |
| `INVOICE_NUMBER_PREFIX` | No | Invoice number prefix | `INV`, `ACME` |

### Google Sheets Setup

#### Automatic Setup (Recommended)
1. Start the application after configuring environment variables
2. Complete OAuth authentication
3. The setup wizard will create necessary Google Sheets automatically
4. Grant permissions when prompted

#### Manual Setup
If you prefer manual setup:

1. **Create Google Spreadsheet:**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet
   - Name it "Invoice Ninja Clone Data"

2. **Create Required Sheets:**
   - `Clients`: ID, Name, Email, Phone, Street, City, State, ZipCode, Country, CreatedAt, UpdatedAt
   - `Invoices`: ID, InvoiceNumber, ClientID, Status, IssueDate, DueDate, Subtotal, TaxRate, TaxAmount, Total, PaidAmount, Balance, Notes, CreatedAt, UpdatedAt
   - `LineItems`: ID, InvoiceID, Description, Quantity, Rate, Amount
   - `Payments`: ID, InvoiceID, Amount, PaymentDate, PaymentMethod, Notes, CreatedAt
   - `Settings`: Key, Value, UpdatedAt
   - `Templates`: ID, Name, Description, LineItems, CreatedAt, UpdatedAt

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
pm2 start npm --name "invoice-ninja-clone" -- start

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
tar -czf invoice-ninja-backup-$(date +%Y%m%d).tar.gz \
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
cp -r . ../invoice-ninja-backup-$(date +%Y%m%d)

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
pm2 start npm --name "invoice-ninja-clone" -- start
pm2 stop invoice-ninja-clone
pm2 restart invoice-ninja-clone
pm2 logs invoice-ninja-clone
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
NEXTAUTH_URL=https://invoice.yourcompany.com
NEXTAUTH_SECRET=super-secure-production-secret
GOOGLE_CLIENT_ID=prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod-client-secret
CACHE_TTL=600
SESSION_MAX_AGE=86400
```

## User Documentation

For end-user documentation, including how to use the application features, please refer to the comprehensive documentation in the `/docs` directory or visit the documentation website.

## API Documentation

The application provides a REST API for integration with other systems. API documentation is available in the `/docs/api` directory.

## Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

- **Documentation**: `/docs` directory
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Professional Support**: Contact for enterprise support options
