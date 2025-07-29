# Installation Guide

This comprehensive guide walks you through installing Billing Monk on your system. The application is built with Next.js and uses Google Sheets as the backend data store.

## System Requirements

### Minimum Requirements

**Server Environment**
- Node.js 18.0 or higher
- npm 8.0 or higher (or yarn equivalent)
- 2GB RAM minimum
- 10GB available disk space

**Browser Support**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**External Services**
- Google Account with Sheets API access
- Internet connection for Google Sheets integration

### Recommended Requirements

**Production Environment**
- Node.js 20.0 LTS
- 4GB RAM or higher
- SSD storage for better performance
- CDN for static asset delivery
- SSL certificate for HTTPS

## Pre-Installation Setup

### Google Cloud Console Setup

Before installing the application, you need to set up Google Cloud Console:

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select existing project
3. Enter project name (e.g., "Billing Monk")
4. Note the Project ID for later use

#### Step 2: Enable Required APIs
1. Navigate to "APIs & Services" > "Library"
2. Search for and enable:
   - Google Sheets API
   - Google Drive API (for file access)
   - Google OAuth2 API (for authentication)

#### Step 3: Create Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter service account name and description
4. Assign "Editor" role for Google Sheets access
5. Download the JSON key file (keep secure)

#### Step 4: Create OAuth 2.0 Client
1. In "Credentials", click "Create Credentials" > "OAuth 2.0 Client ID"
2. Select "Web application" as application type
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
4. Note the Client ID and Client Secret

## Installation Methods

### Method 1: Clone from Repository

#### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/invoice-ninja-clone.git
cd invoice-ninja-clone
```

#### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

#### Step 3: Environment Configuration
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration (see [Environment Variables](./environment-variables.md))

#### Step 4: Run Development Server
```bash
npm run dev
# or
yarn dev
```

### Method 2: Docker Installation

#### Step 1: Create Docker Compose File
```yaml
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

#### Step 2: Build and Run
```bash
docker-compose up -d
```

### Method 3: Manual Build

#### Step 1: Download Source
1. Download the latest release from GitHub
2. Extract to your desired directory
3. Navigate to the extracted folder

#### Step 2: Install and Build
```bash
npm install
npm run build
npm start
```

## Configuration

### Environment Variables Setup

Create `.env.local` file with required variables:

```bash
# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Sheets Configuration
GOOGLE_SHEETS_PRIVATE_KEY=your-service-account-private-key
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email
GOOGLE_SHEETS_PROJECT_ID=your-google-cloud-project-id

# Application Settings
DEFAULT_CURRENCY=USD
DEFAULT_TAX_RATE=0.10
COMPANY_NAME=Your Company Name
```

See [Environment Variables](./environment-variables.md) for complete configuration details.

### Database Setup (Google Sheets)

The application will automatically create the required Google Sheets structure on first run, but you can also set it up manually:

#### Automatic Setup
1. Start the application
2. Complete the authentication flow
3. The system will create necessary sheets automatically

#### Manual Setup
1. Create a new Google Spreadsheet
2. Create sheets: Clients, Invoices, LineItems, Payments, Settings
3. Set up column headers as specified in [Google Sheets Setup](./google-sheets-setup.md)
4. Share the spreadsheet with your service account email

## Post-Installation Configuration

### Initial Admin Setup

#### Step 1: First Login
1. Navigate to your application URL
2. Click "Sign in with Google"
3. Complete OAuth authentication
4. Follow the setup wizard

#### Step 2: Company Configuration
1. Go to Settings > Company Settings
2. Enter your company information:
   - Company name and address
   - Contact information
   - Tax settings
   - Invoice preferences

#### Step 3: Template Setup
1. Navigate to Templates section
2. Create your first invoice template
3. Set default template preferences
4. Configure line items and pricing

### Security Configuration

#### SSL Certificate Setup
```bash
# For production, ensure SSL is configured
# Example with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

#### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22  # SSH access
sudo ufw enable
```

#### Environment Security
- Store sensitive environment variables securely
- Use strong passwords and secrets
- Regularly rotate API keys
- Monitor access logs

## Verification

### Installation Verification

#### Step 1: Application Health Check
```bash
curl http://localhost:3000/api/status
```
Should return: `{"status": "ok", "timestamp": "..."}`

#### Step 2: Authentication Test
1. Navigate to the application URL
2. Click "Sign in with Google"
3. Verify successful authentication
4. Check that dashboard loads correctly

#### Step 3: Google Sheets Integration Test
1. Create a test client
2. Create a test invoice
3. Verify data appears in Google Sheets
4. Test data synchronization

### Performance Testing

#### Basic Load Test
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test application performance
ab -n 100 -c 10 http://localhost:3000/
```

#### Database Connection Test
1. Create multiple clients rapidly
2. Generate several invoices
3. Record payments
4. Verify Google Sheets sync performance

## Troubleshooting Installation

### Common Issues

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Update Node.js if needed
nvm install 20
nvm use 20
```

#### Permission Errors
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Google API Errors
- Verify API keys are correct
- Check that required APIs are enabled
- Ensure service account has proper permissions
- Verify OAuth redirect URIs are configured

#### Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Log Analysis

#### Application Logs
```bash
# View application logs
npm run logs

# Or check specific log files
tail -f logs/application.log
tail -f logs/error.log
```

#### System Logs
```bash
# Check system logs for errors
sudo journalctl -u your-app-service
sudo tail -f /var/log/nginx/error.log
```

## Production Deployment

### Build for Production

#### Step 1: Optimize Build
```bash
npm run build
npm run start
```

#### Step 2: Process Management
```bash
# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start npm --name "invoice-ninja-clone" -- start
pm2 save
pm2 startup
```

#### Step 3: Reverse Proxy Setup (Nginx)
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

### Monitoring Setup

#### Health Monitoring
```bash
# Create health check script
#!/bin/bash
curl -f http://localhost:3000/api/status || exit 1
```

#### Performance Monitoring
- Set up application performance monitoring
- Configure error tracking
- Monitor Google Sheets API usage
- Track user activity and performance

## Next Steps

After successful installation:

1. [Configure environment variables](./environment-variables.md)
2. [Set up Google Sheets integration](./google-sheets-setup.md)
3. [Configure authentication](./authentication-setup.md)
4. [Plan your deployment strategy](./deployment/vercel.md)
5. [Set up monitoring and maintenance](./maintenance/monitoring.md)

## Related Topics

- [Environment Variables](./environment-variables.md)
- [Google Sheets Setup](./google-sheets-setup.md)
- [Authentication Setup](./authentication-setup.md)
- [Deployment Options](./deployment/vercel.md)
- [Troubleshooting](./maintenance/troubleshooting.md)