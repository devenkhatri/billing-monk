# Setup Issues FAQ

This section addresses common problems encountered during the initial setup and installation of Billing Monk.

## Google Cloud Console Issues

### Q: I can't find the Google Sheets API in the API Library
**A:** Follow these steps:
1. Ensure you're in the correct Google Cloud project
2. Go to "APIs & Services" > "Library"
3. Search for "Google Sheets API" (not just "Sheets")
4. If still not found, check that billing is enabled for your project
5. Try refreshing the page or using a different browser

### Q: The service account creation fails
**A:** Common solutions:
1. **Check Permissions**: Ensure you have "Project Editor" or "Owner" role
2. **Billing Account**: Verify billing is enabled for the project
3. **API Limits**: You may have reached service account limits
4. **Browser Issues**: Try incognito mode or different browser
5. **Project Selection**: Confirm you're in the correct project

### Q: OAuth 2.0 client creation gives an error
**A:** Troubleshooting steps:
1. **Consent Screen**: Complete OAuth consent screen configuration first
2. **Authorized Domains**: Add your domain to authorized domains list
3. **Redirect URIs**: Ensure URIs exactly match your application URLs
4. **Application Type**: Select "Web application" not "Desktop application"
5. **Verification**: Some domains require verification before OAuth setup

## Environment Variable Issues

### Q: The application won't start due to missing environment variables
**A:** Check these common issues:
1. **File Location**: Ensure `.env.local` is in the project root directory
2. **File Name**: Must be exactly `.env.local` (not `.env` or `.env.local.txt`)
3. **Required Variables**: Verify all required variables are present:
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. **No Spaces**: Ensure no spaces around the `=` sign
5. **Quotes**: Use quotes for values containing spaces or special characters

### Q: Google Sheets private key format errors
**A:** Private key formatting solutions:
1. **Newline Characters**: Replace `\n` with actual newlines:
   ```bash
   # Wrong
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   
   # Correct
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
   MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
   -----END PRIVATE KEY-----"
   ```
2. **Copy from JSON**: Copy the entire private key from the service account JSON file
3. **Escape Characters**: Some environments require escaped newlines (`\\n`)
4. **File Encoding**: Ensure the `.env.local` file is UTF-8 encoded

### Q: OAuth redirect URI mismatch error
**A:** Fix redirect URI issues:
1. **Exact Match**: URLs must match exactly (including trailing slashes)
2. **Development**: Use `http://localhost:3000/api/auth/callback/google`
3. **Production**: Use `https://yourdomain.com/api/auth/callback/google`
4. **NEXTAUTH_URL**: Ensure environment variable matches OAuth configuration
5. **Multiple Environments**: Add URIs for both development and production

## Installation Problems

### Q: npm install fails with permission errors
**A:** Permission solutions:
1. **Fix npm Permissions**:
   ```bash
   sudo chown -R $(whoami) ~/.npm
   sudo chown -R $(whoami) /usr/local/lib/node_modules
   ```
2. **Use Node Version Manager**:
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Install and use Node.js
   nvm install 20
   nvm use 20
   ```
3. **Alternative Package Manager**: Try using `yarn` instead of `npm`

### Q: Build process fails with memory errors
**A:** Memory issue solutions:
1. **Increase Memory Limit**:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```
2. **Close Other Applications**: Free up system memory
3. **Use Swap File**: Add swap space on Linux systems
4. **Cloud Build**: Use cloud build services for limited local resources

### Q: Port 3000 is already in use
**A:** Port conflict solutions:
1. **Find Process Using Port**:
   ```bash
   # On macOS/Linux
   lsof -i :3000
   
   # On Windows
   netstat -ano | findstr :3000
   ```
2. **Kill Process**:
   ```bash
   # Replace PID with actual process ID
   kill -9 PID
   ```
3. **Use Different Port**:
   ```bash
   npm run dev -- -p 3001
   ```
4. **Check for Other Applications**: Ensure no other development servers are running

## Google Sheets Integration Issues

### Q: "Insufficient permissions" error when accessing sheets
**A:** Permission troubleshooting:
1. **Service Account Email**: Copy the service account email from the JSON key file
2. **Share Spreadsheet**: Share your Google Spreadsheet with the service account email
3. **Editor Permissions**: Give "Editor" access, not just "Viewer"
4. **API Enabled**: Verify Google Sheets API is enabled in Google Cloud Console
5. **Correct Project**: Ensure service account is in the same project as enabled APIs

### Q: Spreadsheet not found or access denied
**A:** Access issue solutions:
1. **Spreadsheet ID**: Verify the spreadsheet ID in environment variables
2. **Spreadsheet Sharing**: Ensure spreadsheet is shared with service account
3. **Account Ownership**: Use spreadsheet owned by the same Google account
4. **Public Access**: Don't rely on "Anyone with link" sharing
5. **API Quotas**: Check if you've exceeded Google Sheets API quotas

### Q: Data not syncing with Google Sheets
**A:** Sync troubleshooting:
1. **API Credentials**: Verify all Google Sheets environment variables are correct
2. **Network Connection**: Check internet connectivity
3. **API Limits**: You may have hit rate limits (wait and retry)
4. **Sheet Structure**: Ensure sheets have correct column headers
5. **Browser Console**: Check for JavaScript errors in browser console

## Authentication Problems

### Q: "Sign in with Google" button doesn't work
**A:** Authentication troubleshooting:
1. **Pop-up Blockers**: Disable pop-up blockers for your domain
2. **Third-party Cookies**: Enable third-party cookies in browser settings
3. **Incognito Mode**: Try signing in using incognito/private browsing
4. **Browser Extensions**: Disable ad blockers and privacy extensions temporarily
5. **Clear Cache**: Clear browser cache and cookies

### Q: Authentication succeeds but redirects to error page
**A:** Redirect error solutions:
1. **Callback URL**: Verify OAuth callback URL configuration
2. **NEXTAUTH_URL**: Ensure environment variable matches your domain
3. **HTTPS**: Use HTTPS in production (required by Google OAuth)
4. **Session Storage**: Clear browser storage and try again
5. **Server Logs**: Check application logs for specific error messages

### Q: "Invalid client" error during OAuth
**A:** Client configuration issues:
1. **Client ID**: Verify `GOOGLE_CLIENT_ID` is correct
2. **Client Secret**: Verify `GOOGLE_CLIENT_SECRET` is correct
3. **OAuth Consent**: Complete OAuth consent screen configuration
4. **Application Type**: Ensure OAuth client is configured as "Web application"
5. **Authorized Domains**: Add your domain to authorized domains list

## First-Time Setup Issues

### Q: Setup wizard doesn't appear after authentication
**A:** Setup wizard troubleshooting:
1. **Clear Browser Data**: Clear cookies, cache, and local storage
2. **Force Setup**: Add `?setup=true` to your URL
3. **Check Permissions**: Ensure Google Sheets permissions are granted
4. **JavaScript Errors**: Check browser console for errors
5. **Refresh Page**: Try refreshing the page after authentication

### Q: Google Sheets structure creation fails
**A:** Sheet creation troubleshooting:
1. **Manual Creation**: Create sheets manually with correct column headers
2. **Permissions**: Ensure service account has "Editor" access
3. **API Quotas**: Check Google Sheets API usage quotas
4. **Sheet Names**: Use exact sheet names: Clients, Invoices, LineItems, Payments, Settings
5. **Column Headers**: Ensure headers match expected format exactly

### Q: Company settings won't save during setup
**A:** Settings save issues:
1. **Required Fields**: Ensure all required fields are filled
2. **Field Validation**: Check for validation errors (email format, etc.)
3. **Network Issues**: Verify stable internet connection
4. **Browser Storage**: Ensure browser allows local storage
5. **Form Submission**: Check if form is actually submitting (network tab)

## Development Environment Issues

### Q: Hot reload not working in development
**A:** Hot reload solutions:
1. **File Watchers**: Increase file watcher limits:
   ```bash
   # On Linux
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```
2. **Port Conflicts**: Ensure no other processes are using the port
3. **File Permissions**: Check file permissions in project directory
4. **Antivirus**: Exclude project directory from antivirus scanning

### Q: Environment variables not loading in development
**A:** Environment variable issues:
1. **File Location**: Ensure `.env.local` is in project root
2. **Restart Server**: Restart development server after changing variables
3. **Variable Names**: Ensure variables start with `NEXT_PUBLIC_` for client-side access
4. **Syntax**: Check for syntax errors in `.env.local` file
5. **Precedence**: `.env.local` overrides other env files

## Deployment Issues

### Q: Build fails during deployment
**A:** Build failure solutions:
1. **Environment Variables**: Ensure all required variables are set in deployment environment
2. **Node Version**: Use same Node.js version as development
3. **Memory Limits**: Increase memory limits for build process
4. **Dependencies**: Ensure all dependencies are properly installed
5. **Build Logs**: Check deployment logs for specific error messages

### Q: Application works locally but not in production
**A:** Production deployment issues:
1. **Environment Variables**: Verify all production environment variables
2. **HTTPS**: Ensure HTTPS is configured (required for OAuth)
3. **Domain Configuration**: Update OAuth settings for production domain
4. **API Limits**: Check if production has different API limits
5. **Error Logs**: Check production error logs for specific issues

## Getting Additional Help

### When to Seek Help
If you've tried the solutions above and still have issues:
1. **Document the Problem**: Note exact error messages and steps to reproduce
2. **Check Logs**: Gather relevant log files and error messages
3. **Environment Details**: Note your operating system, Node.js version, and browser
4. **Screenshots**: Take screenshots of error messages when helpful

### Where to Get Help
- **GitHub Issues**: Report bugs and get community help
- **Documentation**: Review the complete documentation
- **Community Forums**: Ask questions in community discussions
- **Stack Overflow**: Search for similar issues and solutions

### Information to Include When Asking for Help
1. **Operating System**: macOS, Windows, Linux distribution
2. **Node.js Version**: Output of `node --version`
3. **Browser**: Chrome, Firefox, Safari, Edge (with version)
4. **Error Messages**: Complete error messages, not just summaries
5. **Steps to Reproduce**: Exact steps that lead to the problem
6. **Environment Variables**: Sanitized list (remove sensitive values)
7. **Console Logs**: Browser console errors and application logs

## Related Topics

- [Installation Guide](../admin-guide/installation.md)
- [Environment Variables](../admin-guide/environment-variables.md)
- [Google Sheets Setup](../admin-guide/google-sheets-setup.md)
- [General FAQ](./general.md)
- [Troubleshooting Guide](./troubleshooting.md)