# Activity Logging User Guide

This guide explains how to use the Activity Logging feature to track and monitor all activities within your billing system.

## What is Activity Logging?

Activity Logging automatically tracks every action performed in your billing system, creating a comprehensive audit trail. This includes:

- Creating, updating, or deleting invoices
- Receiving or managing payments
- Adding or modifying client information
- Managing projects and tasks
- Logging time entries
- Changing system settings

## Accessing Activity Logs

1. **Navigate to Activity Logs**: Click on "Activity Logs" in the main navigation menu
2. **View Recent Activities**: The most recent activities are displayed at the top
3. **Use Filters**: Apply filters to find specific activities

## Understanding Activity Entries

Each activity entry shows:

### Visual Elements
- **Icon**: Represents the type of activity (📄 for invoices, 💰 for payments, etc.)
- **Color Badge**: Shows the entity type (blue for invoices, green for payments, etc.)
- **Amount**: Financial amount involved (if applicable)

### Information Displayed
- **Description**: What happened (e.g., "Invoice INV-2024-0001 was created")
- **Timestamp**: When the activity occurred (e.g., "2 hours ago")
- **User**: Who performed the action (if available)
- **Entity**: What was affected (e.g., invoice number, client name)

## Using Filters

### Activity Type Filter
Filter by specific actions:
- **Invoice Activities**: Created, Updated, Sent, Paid, Cancelled
- **Payment Activities**: Received, Updated, Deleted
- **Client Activities**: Added, Updated, Deleted
- **Project Activities**: Created, Updated, Completed, Deleted
- **Task Activities**: Created, Updated, Completed, Deleted
- **Time Entry Activities**: Created, Updated, Deleted
- **Template Activities**: Created, Updated, Deleted
- **Settings Activities**: Updated

### Entity Type Filter
Filter by the type of item affected:
- **Invoices**: All invoice-related activities
- **Payments**: All payment-related activities
- **Clients**: All client-related activities
- **Projects**: All project-related activities
- **Tasks**: All task-related activities
- **Time Entries**: All time tracking activities
- **Templates**: All template-related activities
- **Settings**: All settings changes

### Date Range Filters
- **Date From**: Show activities from this date onwards
- **Date To**: Show activities up to this date
- Use both to see activities within a specific time period

### Search
- Search in activity descriptions
- Search by entity names (invoice numbers, client names, etc.)
- Search by user email addresses

## Common Use Cases

### Tracking Invoice Changes
1. Set **Entity Type** filter to "Invoices"
2. Optionally filter by **Activity Type** (e.g., "Invoice Updated")
3. Use **Search** to find specific invoice numbers

### Monitoring Payments
1. Set **Entity Type** filter to "Payments"
2. Use **Date Range** to see payments in a specific period
3. Look for payment amounts in the activity entries

### Auditing Client Changes
1. Set **Entity Type** filter to "Clients"
2. Search for specific client names
3. Review what changes were made and when

### Reviewing Project Progress
1. Set **Entity Type** filter to "Projects" or "Tasks"
2. Use **Date Range** to see recent project activities
3. Track project completion and task updates

### Time Tracking Audit
1. Set **Entity Type** filter to "Time Entries"
2. Review time logging activities
3. Verify time entries for billing accuracy

## Tips for Effective Use

### Regular Monitoring
- Check activity logs regularly to stay informed about system usage
- Review recent activities to catch any unexpected changes
- Use date filters to focus on recent activities

### Troubleshooting
- If something seems wrong, check the activity logs first
- Look for recent changes that might have caused issues
- Use search to find specific activities related to problems

### Compliance and Auditing
- Activity logs provide a complete audit trail for compliance
- Export or document important activities for record-keeping
- Use date ranges to generate activity reports for specific periods

### Performance Tips
- Use filters to reduce the amount of data loaded
- Start with recent date ranges and expand as needed
- Clear filters if the page loads slowly

## Understanding Activity Icons

| Icon | Activity Type | Description |
|------|---------------|-------------|
| 📄 | Invoice Created | New invoice was created |
| ✏️ | Updated | Item was modified |
| 📧 | Invoice Sent | Invoice was sent to client |
| 💰 | Invoice Paid | Invoice was marked as paid |
| ❌ | Cancelled | Item was cancelled |
| 💳 | Payment Received | Payment was recorded |
| 🗑️ | Deleted | Item was removed |
| 👤 | Client Added | New client was added |
| 📁 | Project Created | New project was created |
| ✅ | Completed | Item was marked as complete |
| 📝 | Task Created | New task was created |
| ⏰ | Time Entry | Time was logged |
| 📋 | Template | Template activity |
| ⚙️ | Settings | Settings were changed |

## Privacy and Security

### What is Logged
- All user actions that modify data
- System-generated activities (like recurring invoices)
- User information (email, IP address) for security
- Timestamps for all activities

### What is NOT Logged
- Viewing or reading data (only changes are logged)
- Sensitive personal information beyond what's necessary
- Passwords or authentication details

### Data Retention
- Activity logs are stored in your Google Sheets
- You control how long to keep activity logs
- Consider archiving old logs periodically for performance

## Troubleshooting

### Activities Not Showing
- **Check Filters**: Make sure filters aren't too restrictive
- **Clear Filters**: Click "Clear Filters" to reset all filters
- **Refresh Page**: Reload the page to get latest activities
- **Check Date Range**: Ensure date filters include the expected time period

### Slow Loading
- **Use Filters**: Apply filters to reduce the amount of data
- **Limit Date Range**: Use shorter date ranges
- **Check Internet**: Ensure stable internet connection

### Missing Information
- **User Information**: May not be available for system-generated activities
- **Amounts**: Only shown for financial activities
- **Entity Names**: May be missing if the related item was deleted

## Best Practices

### Regular Review
- Check activity logs weekly to stay informed
- Review activities after making important changes
- Use logs to verify that automated processes are working

### Filter Effectively
- Start with broad filters and narrow down as needed
- Use date ranges to focus on relevant time periods
- Combine multiple filters for precise results

### Documentation
- Take screenshots of important activities for records
- Note down significant changes and their timestamps
- Use activity logs to create change documentation

### Security Monitoring
- Watch for unexpected activities
- Review activities from different IP addresses
- Monitor for activities outside normal business hours

## Getting Help

If you need assistance with activity logs:

1. **Check this guide** for common questions and solutions
2. **Review the filters** to ensure they're set correctly
3. **Contact support** if you notice suspicious activities
4. **Report issues** if activities are missing or incorrect

Remember: Activity logs are your audit trail and security monitor. Regular review helps maintain system integrity and provides valuable insights into your business operations.