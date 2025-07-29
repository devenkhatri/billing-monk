# General FAQ

This section covers frequently asked questions about Invoice Ninja Clone, including basic functionality, features, and common usage scenarios.

## What is Invoice Ninja Clone?

### Q: What is Invoice Ninja Clone?
**A:** Invoice Ninja Clone is a comprehensive invoice management system built with Next.js that helps businesses manage clients, create professional invoices, track payments, and generate reports. It uses Google Sheets as the backend data store, making it easy to set up and maintain.

### Q: How is this different from the original Invoice Ninja?
**A:** Invoice Ninja Clone is a simplified, Google Sheets-based alternative that focuses on core invoicing functionality. It's designed to be easier to set up and maintain while providing essential features for small to medium businesses.

### Q: Who should use Invoice Ninja Clone?
**A:** This system is ideal for:
- Small to medium businesses
- Freelancers and consultants
- Service-based companies
- Businesses that prefer Google Sheets for data storage
- Organizations wanting a self-hosted invoicing solution

## Features and Functionality

### Q: What are the main features?
**A:** Key features include:
- **Client Management**: Store and organize customer information
- **Invoice Creation**: Create professional invoices with customizable templates
- **Payment Tracking**: Record and track payments against invoices
- **Recurring Invoices**: Set up automatic recurring billing
- **PDF Generation**: Create professional PDF invoices
- **Reports & Analytics**: Generate business insights and reports
- **Google Sheets Integration**: All data stored in Google Sheets
- **Responsive Design**: Works on desktop and mobile devices

### Q: Can I customize invoice templates?
**A:** Yes, you can:
- Create multiple invoice templates
- Customize line items and descriptions
- Set default pricing and services
- Add company branding and logos
- Configure tax rates and payment terms
- Modify invoice layouts and styling

### Q: Does it support multiple currencies?
**A:** Currently, the system supports a single currency per installation, which is configured during setup. Multi-currency support may be added in future versions.

### Q: Can I export my data?
**A:** Yes, since all data is stored in Google Sheets, you can:
- Export data directly from Google Sheets
- Generate CSV reports from the application
- Create PDF reports for specific date ranges
- Access raw data for custom analysis

## Technical Requirements

### Q: What do I need to run Invoice Ninja Clone?
**A:** You need:
- A Google account for Sheets integration
- Node.js 18+ for running the application
- A web server or hosting platform
- Modern web browser for accessing the interface

### Q: Can I run this on shared hosting?
**A:** No, Invoice Ninja Clone requires Node.js hosting. Suitable platforms include:
- Vercel (recommended)
- Netlify
- Heroku
- DigitalOcean App Platform
- AWS, Google Cloud, or Azure
- VPS with Node.js support

### Q: Is it mobile-friendly?
**A:** Yes, the application is fully responsive and works well on:
- Smartphones and tablets
- Desktop computers
- Various screen sizes
- Touch interfaces

## Data and Security

### Q: Where is my data stored?
**A:** All your business data is stored in your own Google Sheets, which means:
- You maintain full control of your data
- Data is backed up by Google's infrastructure
- You can access data directly through Google Sheets
- No third-party servers store your sensitive information

### Q: Is my data secure?
**A:** Yes, security measures include:
- Google OAuth authentication
- HTTPS encryption for all communications
- Data stored in your private Google Sheets
- No sensitive data stored on application servers
- Regular security updates

### Q: Can multiple users access the system?
**A:** Currently, the system is designed for single-user access per Google account. Multi-user support with role-based permissions may be added in future versions.

### Q: What happens if Google Sheets is down?
**A:** If Google Sheets is temporarily unavailable:
- The application will show appropriate error messages
- Data entry will be temporarily unavailable
- Previously loaded data may still be viewable
- Service typically resumes when Google Sheets is back online

## Setup and Installation

### Q: How difficult is it to set up?
**A:** Setup involves:
1. Setting up Google Cloud Console (15-20 minutes)
2. Configuring environment variables (5-10 minutes)
3. Deploying the application (10-15 minutes)
4. Initial configuration through the web interface (5 minutes)

Total setup time is typically 30-60 minutes for first-time users.

### Q: Do I need technical knowledge to install it?
**A:** Basic technical knowledge is helpful, including:
- Understanding of environment variables
- Basic command line usage
- Web hosting concepts
- Google Cloud Console navigation

However, detailed documentation is provided for each step.

### Q: Can I migrate from other invoicing systems?
**A:** Manual migration is possible by:
- Exporting data from your current system
- Formatting data to match Google Sheets structure
- Importing data into the appropriate sheets
- Verifying data integrity after import

Automated migration tools are not currently available.

## Usage and Best Practices

### Q: How do I backup my data?
**A:** Since data is in Google Sheets:
- Google automatically backs up your sheets
- You can manually download sheets as Excel/CSV files
- Consider creating periodic manual backups
- Use Google Sheets version history for recovery

### Q: What's the best way to organize clients?
**A:** Best practices include:
- Use consistent naming conventions
- Include complete contact information
- Add relevant tags or categories
- Keep client information up to date
- Use the search functionality to find clients quickly

### Q: How should I handle recurring invoices?
**A:** For recurring billing:
- Set up templates for common services
- Use the recurring invoice feature for regular clients
- Review and adjust recurring invoices periodically
- Monitor for failed or overdue recurring payments

### Q: What if I make a mistake on an invoice?
**A:** You can:
- Edit draft invoices freely
- Create corrected versions of sent invoices
- Add notes explaining corrections
- Issue credit memos if needed
- Maintain clear communication with clients about changes

## Troubleshooting

### Q: The application won't load. What should I do?
**A:** Try these steps:
1. Check your internet connection
2. Verify the application URL is correct
3. Clear your browser cache and cookies
4. Try a different browser or incognito mode
5. Check if the hosting service is experiencing issues

### Q: I can't sign in with Google. What's wrong?
**A:** Common solutions:
1. Ensure you're using the correct Google account
2. Check that OAuth is properly configured
3. Verify redirect URLs match your domain
4. Clear browser cookies and try again
5. Check Google Cloud Console for API issues

### Q: My data isn't saving. What should I check?
**A:** Verify:
1. Internet connection is stable
2. Google Sheets permissions are correct
3. Service account has proper access
4. Google Sheets API is enabled
5. No browser extensions are blocking requests

### Q: Invoices aren't generating PDFs. Why?
**A:** Check:
1. PDF generation is enabled in settings
2. All required invoice fields are filled
3. Browser allows PDF downloads
4. No popup blockers are interfering
5. Try refreshing the page and trying again

## Pricing and Licensing

### Q: How much does Invoice Ninja Clone cost?
**A:** Invoice Ninja Clone is open source and free to use. Costs you might incur:
- Hosting fees (varies by provider)
- Google Cloud API usage (typically minimal)
- Domain name registration (optional)
- SSL certificate (often included with hosting)

### Q: What license is it released under?
**A:** The project is released under an open source license, allowing you to:
- Use it for commercial purposes
- Modify the code for your needs
- Distribute modified versions
- Contribute back to the project

### Q: Can I sell services based on this software?
**A:** Yes, you can offer services such as:
- Installation and setup
- Customization and development
- Hosting and maintenance
- Training and support
- Custom feature development

## Support and Community

### Q: Where can I get help?
**A:** Support options include:
- Documentation and FAQ sections
- GitHub issues for bug reports
- Community forums and discussions
- Stack Overflow for technical questions
- Professional support services (if available)

### Q: How can I contribute to the project?
**A:** You can contribute by:
- Reporting bugs and issues
- Suggesting new features
- Contributing code improvements
- Improving documentation
- Helping other users in forums
- Translating the interface

### Q: Is there a roadmap for future features?
**A:** Future development may include:
- Multi-user support with roles
- Multi-currency support
- Advanced reporting features
- Integration with payment processors
- Mobile applications
- Additional export formats

Check the project's GitHub repository for the latest roadmap and planned features.

## Related Topics

- [Setup Issues FAQ](./setup-issues.md)
- [Google Sheets FAQ](./google-sheets.md)
- [Invoicing FAQ](./invoicing.md)
- [Payments FAQ](./payments.md)
- [Troubleshooting Guide](./troubleshooting.md)