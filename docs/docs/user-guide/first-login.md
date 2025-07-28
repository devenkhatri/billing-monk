# First Login

This guide walks you through your first login experience and initial setup of Invoice Ninja Clone.

## Authentication Process

Invoice Ninja Clone uses Google OAuth for secure authentication. Here's what happens during your first login:

### Step 1: Access the Application

1. Navigate to your Invoice Ninja Clone URL
2. You'll see the login screen with a "Sign in with Google" button
3. Click the button to begin authentication

### Step 2: Google Authentication

1. You'll be redirected to Google's authentication page
2. Sign in with your Google account credentials
3. Grant the necessary permissions for Google Sheets access
4. You'll be redirected back to the application

### Step 3: Initial Setup Check

After successful authentication, the system will check if Google Sheets is properly configured:

- **If configured**: You'll be taken directly to the dashboard
- **If not configured**: You'll see the setup wizard

## Setup Wizard

If this is your first time or Google Sheets isn't configured, you'll see the setup wizard:

### Google Sheets Setup

1. **Create Spreadsheet**: The system will guide you through creating a new Google Spreadsheet
2. **Configure Permissions**: Ensure the application has proper access to your sheets
3. **Initialize Structure**: The system will create the necessary sheets and columns
4. **Verify Connection**: Test the connection to ensure everything is working

### Company Information

During setup, you'll be prompted to enter:

- **Company Name**: Your business name
- **Address**: Business address information
- **Contact Details**: Phone and email
- **Tax Information**: Default tax rates and settings

## Post-Setup Dashboard

Once setup is complete, you'll see the main dashboard with:

- **Welcome Message**: Confirmation that setup was successful
- **Quick Actions**: Buttons to add your first client or create an invoice
- **Empty State**: Since this is your first login, most sections will be empty
- **Navigation Menu**: Access to all application features

## What to Do Next

After your first successful login:

1. **Explore the Dashboard**: Familiarize yourself with the layout
2. **Add Company Settings**: Complete your company profile in Settings
3. **Create Your First Client**: Add a client to your database
4. **Set Up Invoice Templates**: Customize your invoice appearance
5. **Create Your First Invoice**: Generate your first invoice

## Troubleshooting First Login

### Common Issues

**Google Authentication Fails**
- Ensure you're using a valid Google account
- Check that your browser allows pop-ups
- Clear browser cache and cookies if needed

**Setup Wizard Doesn't Appear**
- Refresh the page
- Check browser console for errors
- Ensure you have proper Google Sheets permissions

**Permissions Error**
- Make sure you granted all requested permissions during Google OAuth
- Try signing out and signing in again
- Contact your administrator if issues persist

### Getting Help

If you encounter issues during first login:

1. Check the [Setup Issues FAQ](../faq/setup-issues.md)
2. Review the [Google Sheets troubleshooting guide](../faq/google-sheets.md)
3. Contact your system administrator

## Security Notes

- Your Google account credentials are never stored by the application
- All data is stored in your own Google Sheets
- The application only requests necessary permissions
- You can revoke access at any time through your Google account settings

## Next Steps

Once you've successfully completed your first login:

- [Explore the Dashboard Overview](./dashboard-overview.md)
- [Learn about Client Management](./clients/adding-clients.md)
- [Configure Company Settings](./settings/company-settings.md)