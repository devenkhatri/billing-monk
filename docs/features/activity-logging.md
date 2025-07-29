# Activity Logging

The Activity Logging feature provides comprehensive tracking of all activities and changes within the application. This feature helps maintain an audit trail and provides visibility into system usage.

## Overview

Activity logging automatically tracks:
- Invoice operations (create, update, send, payment, cancellation)
- Payment transactions (received, updated, deleted)
- Client management (add, update, delete)
- Project lifecycle (create, update, complete, delete)
- Task management (create, update, complete, delete)
- Time entry tracking (create, update, delete)
- Template management (create, update, delete)
- Settings changes

## Features

### Automatic Logging
- All major operations are automatically logged
- Captures user information, timestamps, and context
- Stores previous and new values for audit purposes
- Includes metadata for additional context

### Comprehensive Data Capture
Each activity log entry includes:
- **Activity Type**: The specific action performed
- **Description**: Human-readable description of the activity
- **Entity Information**: Type, ID, and name of the affected entity
- **User Information**: User ID and email (when available)
- **Technical Details**: IP address and user agent
- **Financial Data**: Amount involved (for financial transactions)
- **Change Tracking**: Previous and new values (for updates)
- **Metadata**: Additional context data
- **Timestamp**: When the activity occurred

### Filtering and Search
- Filter by activity type
- Filter by entity type
- Date range filtering
- Search by description, entity name, or user email
- Real-time filtering with instant results

### User Interface
- Clean, intuitive activity log viewer
- Visual icons for different activity types
- Color-coded entity type badges
- Relative timestamps (e.g., "2 hours ago")
- Pagination for large datasets
- Responsive design for mobile and desktop

## Implementation

### Google Sheets Integration
Activity logs are stored in a dedicated "ActivityLogs" sheet with the following columns:
- ID: Unique identifier
- Type: Activity type
- Description: Human-readable description
- EntityType: Type of entity affected
- EntityID: ID of the affected entity
- EntityName: Name of the affected entity
- UserID: ID of the user who performed the action
- UserEmail: Email of the user
- IPAddress: IP address of the request
- UserAgent: Browser/client information
- Amount: Financial amount (if applicable)
- PreviousValue: JSON string of previous state
- NewValue: JSON string of new state
- Metadata: Additional context data
- Timestamp: When the activity occurred

### API Endpoints

#### GET /api/activity-logs
Retrieve activity logs with optional filtering and pagination.

**Query Parameters:**
- `type`: Filter by activity type
- `entityType`: Filter by entity type
- `entityId`: Filter by specific entity ID
- `userId`: Filter by user ID
- `dateFrom`: Start date for filtering
- `dateTo`: End date for filtering
- `search`: Search in description, entity name, or user email
- `page`: Page number for pagination
- `limit`: Number of items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "total": 150,
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

#### POST /api/activity-logs
Create a new activity log entry.

**Request Body:**
```json
{
  "type": "invoice_created",
  "description": "Invoice INV-2024-0001 was created",
  "entityType": "invoice",
  "entityId": "inv_123",
  "entityName": "INV-2024-0001",
  "userId": "user_123",
  "userEmail": "user@example.com",
  "amount": 1500.00,
  "newValue": "{...}",
  "metadata": {...}
}
```

### Activity Logger Utility

The `ActivityLogger` class provides convenient methods for logging activities:

```typescript
import { activityLogger } from '@/lib/activity-logger';

// Log invoice activity
await activityLogger.logInvoiceActivity(
  'invoice_created',
  invoiceId,
  invoiceNumber,
  amount,
  userId,
  userEmail
);

// Log client activity
await activityLogger.logClientActivity(
  'client_updated',
  clientId,
  clientName,
  userId,
  userEmail,
  previousClientData,
  newClientData
);
```

## Usage Examples

### Viewing Activity Logs
Navigate to `/activity-logs` to view all system activities with filtering options.

### Filtering Activities
- Use the filter dropdowns to narrow down activities by type or entity
- Set date ranges to view activities within specific time periods
- Use the search box to find specific activities

### Integration in Components
```typescript
import { ActivityLogTable } from '@/components/activity/activity-log-table';

// Show activities for a specific entity
<ActivityLogTable 
  filters={{ entityType: 'invoice', entityId: 'inv_123' }}
  showFilters={false}
  maxHeight="300px"
/>
```

## Activity Types

### Invoice Activities
- `invoice_created`: New invoice created
- `invoice_updated`: Invoice details modified
- `invoice_sent`: Invoice sent to client
- `invoice_paid`: Invoice marked as paid
- `invoice_cancelled`: Invoice cancelled

### Payment Activities
- `payment_received`: Payment received for invoice
- `payment_updated`: Payment details modified
- `payment_deleted`: Payment record deleted

### Client Activities
- `client_added`: New client added
- `client_updated`: Client information updated
- `client_deleted`: Client removed

### Project Activities
- `project_created`: New project created
- `project_updated`: Project details modified
- `project_completed`: Project marked as completed
- `project_deleted`: Project removed

### Task Activities
- `task_created`: New task created
- `task_updated`: Task details modified
- `task_completed`: Task marked as completed
- `task_deleted`: Task removed

### Time Entry Activities
- `time_entry_created`: New time entry logged
- `time_entry_updated`: Time entry modified
- `time_entry_deleted`: Time entry removed

### Template Activities
- `template_created`: New template created
- `template_updated`: Template modified
- `template_deleted`: Template removed

### Settings Activities
- `settings_updated`: Application settings modified

## Best Practices

### When to Log Activities
- Log all user-initiated actions that modify data
- Log system-generated actions (like recurring invoice creation)
- Log important state changes (invoice status changes)
- Log financial transactions

### What to Include
- Always include descriptive messages
- Capture entity names for better readability
- Include user information when available
- Store previous and new values for audit trails
- Add relevant metadata for context

### Performance Considerations
- Activity logging is asynchronous and won't block main operations
- Failed logging attempts are logged as warnings but don't break functionality
- Use pagination when displaying large numbers of activities
- Consider archiving old activity logs periodically

## Security and Privacy

### Data Protection
- IP addresses and user agents are logged for security purposes
- Sensitive data in previous/new values should be sanitized
- Access to activity logs should be restricted to authorized users

### Audit Compliance
- Activity logs provide a complete audit trail
- Timestamps are stored in ISO format for consistency
- All changes are tracked with before/after states
- User attribution is maintained for accountability

## Troubleshooting

### Common Issues

**Activity logs not appearing:**
- Check that the ActivityLogs sheet exists in Google Sheets
- Verify API permissions and authentication
- Check browser console for JavaScript errors

**Filtering not working:**
- Ensure date formats are correct (YYYY-MM-DD)
- Check that filter values match expected formats
- Clear filters and try again

**Performance issues:**
- Reduce the number of items per page
- Use more specific filters to reduce dataset size
- Check network connectivity

### Maintenance

**Regular Cleanup:**
- Consider archiving logs older than 1 year
- Monitor sheet size and performance
- Review and optimize filter queries

**Monitoring:**
- Monitor API response times
- Check for failed logging attempts
- Review storage usage in Google Sheets

## Future Enhancements

Potential improvements to the activity logging system:
- Export activity logs to CSV/PDF
- Email notifications for critical activities
- Advanced analytics and reporting
- Integration with external audit systems
- Automated cleanup and archiving
- Real-time activity feeds
- Activity log dashboards and visualizations