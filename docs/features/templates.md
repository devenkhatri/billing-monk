# Invoice Templates

Billing Monk includes a comprehensive template management system that allows you to create reusable invoice templates for common services or products. This feature significantly speeds up invoice creation and ensures consistency across your GST-compliant billing.

## Overview

Invoice templates are pre-configured invoice structures that include:
- Multiple line items with descriptions, quantities, and rates
- Default GST rates
- Standard notes or terms
- Active/inactive status for availability control

## Accessing Templates

### Navigation
- **Sidebar Menu**: Click "Templates" in the main navigation
- **Keyboard Shortcut**: Press `Alt+T` to quickly access templates
- **URL**: Navigate directly to `/templates`

## Creating Templates

### Step-by-Step Guide

1. **Navigate to Templates**
   - Click "Templates" in the sidebar or press `Alt+T`

2. **Start Template Creation**
   - Click the "Create Template" button in the top-right corner

3. **Fill Template Information**
   - **Name**: Enter a descriptive name (e.g., "Web Development Services", "Monthly Consulting")
   - **Description**: Optional brief description of the template's purpose
   - **GST Rate**: Set the default GST rate percentage for this template

4. **Add Line Items**
   - Click "Add Item" to add line items
   - For each line item, enter:
     - **Description**: Detailed description of the service/product
     - **Quantity**: Default quantity (can be decimal values)
     - **Rate**: Price per unit
   - The system automatically calculates the amount for each line item

5. **Add Default Notes**
   - Enter any standard terms, conditions, or notes that should appear on invoices using this template

6. **Set Template Status**
   - Check "Template is active" to make it available in invoice creation
   - Uncheck to hide the template from the invoice dropdown

7. **Save Template**
   - Click "Create Template" to save
   - The template will be stored in Google Sheets and immediately available

### Template Form Features

- **Real-time Calculations**: See subtotal, tax amount, and total as you build the template
- **Multiple Line Items**: Add unlimited line items to templates
- **Flexible Pricing**: Support for different quantities and rates per line item
- **Remove Items**: Delete line items using the trash icon (first item cannot be deleted)

## Using Templates in Invoices

### Applying Templates

1. **Create New Invoice**
   - Go to Invoices and click "Create Invoice"

2. **Select Template**
   - Choose a template from the "Template" dropdown
   - Only active templates will appear in the list

3. **Auto-Population**
   - The template automatically fills in:
     - All line items with descriptions, quantities, and rates
     - Default GST rate
     - Default notes

4. **Customize as Needed**
   - Modify any populated data before saving
   - Add or remove line items
   - Adjust quantities, rates, or descriptions
   - Change tax rate or notes

5. **Apply Template Button**
   - Use the "Apply Template" button to reapply template data if needed
   - This overwrites current line items with template data

### Template Selection Benefits

- **Time Saving**: Instantly populate complex invoices
- **Consistency**: Ensure consistent pricing and descriptions
- **Professional**: Maintain professional standards across invoices
- **Flexibility**: Templates serve as starting points that can be customized

## Managing Templates

### Template Table

The templates page displays all templates in a comprehensive table showing:

- **Name**: Template name and description
- **Items**: Number of line items in the template
- **Total**: Calculated total amount including tax
- **Status**: Active or Inactive status
- **Created**: Creation date
- **Actions**: Edit and delete buttons

### Editing Templates

1. **Access Edit Mode**
   - Click the pencil icon in the Actions column
   - Or click on the template name

2. **Modify Template**
   - Update any template information
   - Add, remove, or modify line items
   - Change tax rates or notes
   - Toggle active/inactive status

3. **Save Changes**
   - Click "Update Template" to save changes
   - Changes won't affect previously created invoices

### Deleting Templates

1. **Delete Action**
   - Click the trash icon in the Actions column

2. **Confirmation**
   - Confirm deletion in the popup dialog
   - Deleted templates cannot be recovered

3. **Impact**
   - Template is permanently removed from Google Sheets
   - Previously created invoices are not affected
   - Template will no longer appear in invoice creation dropdown

### Template Status Management

- **Active Templates**: Appear in invoice creation dropdown
- **Inactive Templates**: Hidden from dropdown but preserved in system
- **Status Toggle**: Change status by editing the template

## Template Examples

### Web Development Template
```
Name: Web Development Services
Description: Standard web development project template
GST Rate: 18%

Line Items:
1. Frontend Development - 40 hours @ ₹6,000/hour = ₹2,40,000
2. Backend Development - 30 hours @ ₹7,000/hour = ₹2,10,000
3. Database Setup - 10 hours @ ₹6,500/hour = ₹65,000
4. Testing & QA - 15 hours @ ₹5,000/hour = ₹75,000

Notes: Payment terms: Net 30 days. 50% advance required to begin work.
```

### Monthly Consulting Template
```
Name: Monthly Consulting Package
Description: Standard monthly consulting services
GST Rate: 18%

Line Items:
1. Strategic Consulting - 20 hours @ ₹12,000/hour = ₹2,40,000
2. Implementation Support - 10 hours @ ₹10,000/hour = ₹1,00,000
3. Monthly Report - 1 item @ ₹40,000/item = ₹40,000

Notes: Monthly retainer. Payment due by the 15th of each month.
```

## Technical Implementation

### Data Storage

Templates are stored in Google Sheets across two sheets:

1. **Templates Sheet**
   - ID, Name, Description, TaxRate, Notes, IsActive, CreatedAt, UpdatedAt

2. **TemplateLineItems Sheet**
   - ID, TemplateID, Description, Quantity, Rate

### API Endpoints

- `GET /api/templates` - Fetch all templates
- `POST /api/templates` - Create new template
- `GET /api/templates/[id]` - Fetch specific template
- `PUT /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template

### Integration Points

- **Invoice Form**: Template dropdown and application logic
- **Navigation**: Sidebar menu item with keyboard shortcut
- **Google Sheets**: Automatic synchronization with spreadsheet
- **Validation**: Zod schema validation for template data

## Best Practices

### Template Organization

1. **Descriptive Names**: Use clear, descriptive template names
2. **Logical Grouping**: Create templates for different service types
3. **Regular Updates**: Keep templates current with pricing changes
4. **Status Management**: Deactivate outdated templates instead of deleting

### Template Design

1. **Comprehensive Line Items**: Include all typical services/products
2. **Realistic Quantities**: Use typical quantities as defaults
3. **Current Pricing**: Keep rates up-to-date with current pricing
4. **Clear Descriptions**: Use detailed, professional descriptions
5. **Appropriate Tax Rates**: Set correct tax rates for your jurisdiction

### Workflow Integration

1. **Template First**: Create templates before regular invoice creation
2. **Customize After**: Use templates as starting points, customize as needed
3. **Regular Review**: Periodically review and update templates
4. **Team Training**: Ensure team members know how to use templates effectively

## Troubleshooting

### Common Issues

1. **Template Not Appearing in Dropdown**
   - Check if template is marked as active
   - Refresh the page to reload templates
   - Verify template was saved successfully

2. **Template Data Not Applying**
   - Ensure template is selected before clicking "Apply Template"
   - Check that template has line items configured
   - Try refreshing the page and reselecting the template

3. **Calculation Errors**
   - Verify quantity and rate values are numeric
   - Check tax rate is entered as percentage (e.g., 8.25 for 8.25%)
   - Ensure all required fields are filled

### Error Messages

- **"Template name is required"**: Enter a template name
- **"At least one line item is required"**: Add at least one line item
- **"Invalid quantity or rate"**: Ensure numeric values for quantities and rates
- **"Tax rate cannot exceed 100%"**: Enter tax rate as percentage (0-100)

## Future Enhancements

Potential future improvements to the template system:

1. **Template Categories**: Organize templates by service type or category
2. **Template Duplication**: Clone existing templates for quick creation
3. **Template Import/Export**: Share templates between installations
4. **Template Analytics**: Track template usage and performance
5. **Template Versioning**: Maintain template history and versions
6. **Bulk Template Operations**: Manage multiple templates simultaneously

## Support

For additional help with templates:

1. **Documentation**: Refer to this guide and the main user documentation
2. **GitHub Issues**: Report bugs or request features
3. **Community**: Join discussions for tips and best practices
4. **Professional Support**: Available for enterprise installations

The template system is designed to streamline your invoicing workflow while maintaining flexibility and professional standards. Regular use of templates will significantly improve your invoicing efficiency and consistency.