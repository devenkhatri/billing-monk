# Creating Invoices

Creating professional invoices is at the heart of Billing Monk. This comprehensive guide walks you through the invoice creation process, from basic invoices to advanced features.

## Getting Started

### Accessing Invoice Creation

**From Dashboard**
1. Click the "Create Invoice" quick action button
2. Opens the invoice creation form immediately

**From Navigation Menu**
1. Click "Invoices" in the main navigation
2. Click "New Invoice" or "Create Invoice" button

**From Client Details**
1. Open a client's detail page
2. Click "Create Invoice" button
3. Client information is pre-filled

## Invoice Creation Form

The invoice form is organized into several sections:

### Invoice Header

**Invoice Number**
- Automatically generated unique number
- Format: INV-YYYY-NNNN (e.g., INV-2024-0001)
- Can be customized in settings
- Cannot be duplicated

**Client Selection**
- Dropdown list of all clients
- Search functionality for quick selection
- Option to add new client if needed
- Required field - cannot be empty

**Invoice Dates**
- **Issue Date**: Date invoice is created (defaults to today)
- **Due Date**: Payment due date (configurable default terms)
- Both dates can be manually adjusted
- Due date affects overdue calculations

### Template Selection

**Choose Template**
- Select from available invoice templates
- Templates include pre-defined line items
- Saves time for recurring services
- Can be modified after selection

**Template Benefits**
- Consistent pricing and descriptions
- Faster invoice creation
- Reduced errors
- Professional appearance

### Line Items Section

This is where you define what you're billing for:

#### Adding Line Items

**Manual Entry**
1. Click "Add Line Item" button
2. Fill in description, quantity, and rate
3. Amount calculates automatically
4. Add additional items as needed

**From Template**
1. Select a template from dropdown
2. Line items populate automatically
3. Modify quantities or rates as needed
4. Add or remove items as required

#### Line Item Fields

**Description**
- Detailed description of product/service
- Appears on client's invoice
- Be specific and professional
- Examples: "Web Design Services", "Monthly Hosting"

**Quantity**
- Number of units being billed
- Can be whole numbers or decimals
- Examples: 1, 2.5, 10
- Multiplied by rate for line total

**Rate**
- Price per unit
- Enter as decimal number
- Currency symbol added automatically
- Examples: 100.00, 75.50

**Amount**
- Automatically calculated (Quantity × Rate)
- Read-only field
- Updates in real-time
- Includes currency formatting

### Invoice Calculations

The system automatically calculates:

**Subtotal**
- Sum of all line item amounts
- Updates as you add/modify items
- Displayed prominently

**Tax Calculation**
- Applied based on company tax settings
- Can be overridden per invoice
- Shows tax rate and amount
- Added to subtotal for total

**Total Amount**
- Subtotal + Tax Amount
- Final amount client owes
- Displayed prominently
- Used for payment tracking

### Additional Options

**Invoice Notes**
- Optional field for special instructions
- Appears at bottom of invoice
- Examples: Payment terms, thank you message
- Supports basic formatting

**Internal Notes**
- Private notes not shown to client
- For internal tracking and reference
- Useful for special arrangements
- Not included in PDF or emails

## Step-by-Step Creation Process

### Step 1: Start New Invoice
1. Access invoice creation form
2. System generates new invoice number
3. Form opens with default settings

### Step 2: Select Client
1. Click client dropdown
2. Search or scroll to find client
3. Select appropriate client
4. Client information populates automatically

### Step 3: Set Dates
1. Verify issue date (defaults to today)
2. Set due date based on payment terms
3. Adjust dates if needed
4. Consider client's payment preferences

### Step 4: Choose Template (Optional)
1. Select from available templates
2. Review populated line items
3. Modify as needed for this invoice
4. Skip if creating custom invoice

### Step 5: Add Line Items
1. Click "Add Line Item"
2. Enter description, quantity, and rate
3. Verify amount calculation
4. Repeat for additional items

### Step 6: Review Calculations
1. Check subtotal accuracy
2. Verify tax calculation
3. Confirm total amount
4. Make adjustments if needed

### Step 7: Add Notes (Optional)
1. Add client-facing notes if needed
2. Include internal notes for reference
3. Keep notes professional and clear

### Step 8: Save Invoice
1. Review all information
2. Click "Save Invoice" or "Create Invoice"
3. Wait for confirmation
4. Invoice is saved as draft status

## Invoice Templates

### Using Existing Templates

**Template Selection**
- Choose from dropdown list
- Templates show preview information
- Select based on service type
- Can be modified after selection

**Template Modification**
- Change quantities as needed
- Adjust rates for specific clients
- Add or remove line items
- Maintain template integrity

### Creating Custom Templates

**Template Creation**
1. Create invoice with desired items
2. Save as template option
3. Name template descriptively
4. Use for future similar invoices

**Template Management**
- Edit existing templates
- Delete unused templates
- Organize by service type
- Share templates with team

## Advanced Features

### Recurring Invoices

**Setting Up Recurring**
1. Create initial invoice
2. Enable recurring option
3. Set frequency (monthly, quarterly, etc.)
4. Define end date or number of occurrences

**Recurring Management**
- View upcoming recurring invoices
- Modify recurring schedules
- Pause or stop recurring billing
- Track recurring invoice history

### Bulk Invoice Creation

**Multiple Clients**
1. Select multiple clients
2. Use same template for all
3. Customize individual invoices
4. Save all at once

**Batch Processing**
- Create similar invoices quickly
- Maintain consistency
- Reduce manual work
- Improve efficiency

## Invoice Status Management

### Draft Status
- Initial status for new invoices
- Can be edited freely
- Not visible to clients
- No payment tracking

### Sent Status
- Invoice has been sent to client
- Limited editing capabilities
- Visible to client
- Payment tracking begins

### Paid Status
- Invoice has been fully paid
- Read-only status
- Payment history available
- Affects financial reports

## Best Practices

### Professional Invoice Creation

**Clear Descriptions**
- Use specific, detailed descriptions
- Avoid abbreviations or jargon
- Include relevant details
- Maintain professional tone

**Accurate Pricing**
- Double-check rates and quantities
- Ensure calculations are correct
- Include all applicable charges
- Be transparent about pricing

**Consistent Formatting**
- Use templates for consistency
- Maintain standard descriptions
- Follow company pricing guidelines
- Keep professional appearance

### Efficiency Tips

**Template Usage**
- Create templates for common services
- Use templates to save time
- Maintain template accuracy
- Update templates regularly

**Client Information**
- Keep client database current
- Verify client details before invoicing
- Use consistent client naming
- Maintain accurate contact information

**Regular Review**
- Review invoices before sending
- Check for errors or omissions
- Verify client information
- Confirm pricing accuracy

## Common Issues and Solutions

### Client Not Found
- **Problem**: Client doesn't appear in dropdown
- **Solution**: Add client first, then create invoice
- **Prevention**: Maintain current client database

### Calculation Errors
- **Problem**: Totals don't match expectations
- **Solution**: Check line item quantities and rates
- **Prevention**: Review calculations before saving

### Template Issues
- **Problem**: Template doesn't load correctly
- **Solution**: Refresh page and try again
- **Prevention**: Maintain templates regularly

### Save Failures
- **Problem**: Invoice won't save
- **Solution**: Check required fields and internet connection
- **Prevention**: Save frequently during creation

## Next Steps

After creating an invoice:

1. [Preview the invoice](./sending-invoices.md) before sending
2. [Send the invoice](./sending-invoices.md) to the client
3. [Track invoice status](./invoice-status.md) and payments
4. [Set up recurring billing](./recurring-invoices.md) if needed
5. [Generate reports](../reports/revenue-reports.md) to track performance

## Related Topics

- [Invoice Templates](./invoice-templates.md)
- [Sending Invoices](./sending-invoices.md)
- [Recurring Invoices](./recurring-invoices.md)
- [Invoice Status Management](./invoice-status.md)
- [Recording Payments](../payments/recording-payments.md)