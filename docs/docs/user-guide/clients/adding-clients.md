# Adding Clients

Managing your client database is essential for effective invoicing. This guide walks you through adding new clients to your Invoice Ninja Clone system.

## Accessing Client Management

1. **From Dashboard**: Click the "Add Client" quick action button
2. **From Navigation**: Click "Clients" in the main navigation menu
3. **From Client List**: Click the "Add New Client" button

## Client Information Form

When adding a new client, you'll need to provide the following information:

### Required Fields

#### Client Name
- **Purpose**: Primary identifier for the client
- **Format**: Full business name or individual name
- **Example**: "Acme Corporation" or "John Smith"
- **Note**: This appears on all invoices and reports

#### Email Address
- **Purpose**: Primary contact method and invoice delivery
- **Format**: Valid email address
- **Example**: "billing@acmecorp.com"
- **Note**: Used for sending invoices and notifications

### Optional Fields

#### Phone Number
- **Purpose**: Alternative contact method
- **Format**: Any phone number format
- **Example**: "+1 (555) 123-4567"
- **Note**: Displayed on invoices for client reference

#### Address Information

**Street Address**
- Full street address including number and street name
- Example: "123 Business Ave, Suite 100"

**City**
- City or locality name
- Example: "New York"

**State/Province**
- State, province, or region
- Example: "NY" or "New York"

**ZIP/Postal Code**
- Postal or ZIP code
- Example: "10001"

**Country**
- Country name
- Example: "United States"

## Step-by-Step Process

### Step 1: Open the Client Form
1. Navigate to the Clients section
2. Click "Add New Client" button
3. The client form will open in a modal or new page

### Step 2: Fill Required Information
1. Enter the client name in the "Name" field
2. Add a valid email address
3. Ensure both fields are completed (marked with *)

### Step 3: Add Optional Details
1. Fill in phone number if available
2. Complete address fields as needed
3. All address fields are optional but recommended

### Step 4: Save the Client
1. Review all entered information
2. Click "Save Client" button
3. Wait for confirmation message
4. The client will appear in your client list

## Form Validation

The system validates your input to ensure data quality:

### Email Validation
- Must be a valid email format
- Cannot be duplicate of existing client
- Required field - cannot be empty

### Name Validation
- Cannot be empty
- Should be unique (warning if duplicate)
- Maximum length of 255 characters

### Phone Validation
- Optional field
- Accepts various phone number formats
- No specific format required

## After Adding a Client

Once a client is successfully added:

### Immediate Actions Available
- **Create Invoice**: Start billing the client immediately
- **Edit Client**: Modify client information
- **View Details**: See complete client profile
- **Delete Client**: Remove if added in error

### Client List Updates
- New client appears in the client list
- Searchable by name or email
- Sortable by various fields
- Filterable by different criteria

### Dashboard Updates
- Total client count increases
- Recent activity shows new client addition
- Client becomes available for invoice creation

## Best Practices

### Data Entry Tips
- **Use Full Names**: Enter complete business or individual names
- **Verify Email**: Double-check email addresses for accuracy
- **Complete Address**: Fill all address fields when possible
- **Consistent Format**: Use consistent naming conventions

### Organization Strategies
- **Naming Convention**: Use consistent client naming (e.g., "Company Name" vs "Name, Company")
- **Contact Information**: Always include primary email
- **Address Completeness**: Complete addresses help with professional invoices
- **Regular Updates**: Keep client information current

## Bulk Client Import

For adding multiple clients at once:

### CSV Import (if available)
1. Download the client template
2. Fill in client information
3. Upload the CSV file
4. Review and confirm imports
5. Address any validation errors

### Manual Entry Tips
- Open multiple browser tabs for efficiency
- Use copy/paste for similar information
- Save frequently to avoid data loss
- Take breaks to maintain accuracy

## Common Issues and Solutions

### Duplicate Email Error
- **Problem**: Email already exists in system
- **Solution**: Check existing clients or use different email
- **Prevention**: Search before adding new clients

### Validation Errors
- **Problem**: Form won't submit due to errors
- **Solution**: Check all required fields are filled
- **Prevention**: Fill required fields first

### Save Failures
- **Problem**: Client information doesn't save
- **Solution**: Check internet connection and try again
- **Prevention**: Ensure stable connection before starting

## Client Categories and Tags

If your system supports client categorization:

### Client Types
- **Individual**: Personal clients
- **Business**: Corporate clients
- **Government**: Government entities
- **Non-Profit**: Non-profit organizations

### Tags and Labels
- Use tags for client segmentation
- Examples: "VIP", "Local", "International"
- Helpful for filtering and reporting
- Can be added during client creation

## Next Steps

After adding clients:

1. [Edit client information](./editing-clients.md) if needed
2. [View client details](./client-details.md) to see full profile
3. [Create your first invoice](../invoices/creating-invoices.md) for the client
4. [Set up recurring invoices](../invoices/recurring-invoices.md) if applicable

## Related Topics

- [Editing Clients](./editing-clients.md)
- [Client Details View](./client-details.md)
- [Creating Invoices](../invoices/creating-invoices.md)
- [Client Reports](../reports/client-reports.md)