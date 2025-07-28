# Editing Clients

Client information changes over time, and keeping your database current is important for accurate invoicing. This guide covers how to edit existing client information.

## Accessing Client Edit

There are several ways to edit a client:

### From Client List
1. Navigate to the Clients section
2. Find the client in the list
3. Click the "Edit" button or pencil icon
4. The edit form will open

### From Client Details
1. Open the client details page
2. Click the "Edit Client" button
3. The edit form will open with current information

### From Invoice Creation
1. While creating an invoice
2. Click "Edit" next to the client name
3. Make changes and save
4. Return to invoice creation

## Edit Form Overview

The edit form contains the same fields as the add client form, but pre-populated with existing information:

### Editable Fields
- **Client Name**: Can be modified at any time
- **Email Address**: Can be changed (with validation)
- **Phone Number**: Can be updated or removed
- **Address Fields**: All address components can be modified

### System Fields (Read-Only)
- **Client ID**: Cannot be changed
- **Created Date**: Shows when client was added
- **Last Modified**: Updates automatically when saved

## Making Changes

### Step 1: Open Edit Form
1. Locate and click the edit option for your client
2. Wait for the form to load with current information
3. Review existing data before making changes

### Step 2: Modify Information
1. Click in any field you want to change
2. Update the information as needed
3. Leave unchanged fields as they are
4. Add information to previously empty fields

### Step 3: Save Changes
1. Review all modifications
2. Click "Save Changes" or "Update Client"
3. Wait for confirmation message
4. Changes are immediately reflected in the system

## Common Edit Scenarios

### Updating Contact Information

**Email Address Change**
- Update when client changes email
- Ensure new email is valid and unique
- Future invoices will use new email

**Phone Number Update**
- Add phone if previously missing
- Update when client changes numbers
- Remove by clearing the field

### Address Changes

**Office Relocation**
- Update all address fields
- Verify new address accuracy
- Important for invoice delivery and records

**Partial Address Updates**
- Update only changed components
- Common for city/state changes
- ZIP code updates for postal changes

### Name Changes

**Business Name Changes**
- Update when company rebrands
- Affects all future invoices
- Historical invoices retain original name

**Contact Person Changes**
- Update when primary contact changes
- Important for communication
- Consider adding notes about change

## Validation During Editing

### Email Validation
- New email must be valid format
- Cannot duplicate another client's email
- System checks for conflicts before saving

### Required Field Validation
- Name and email remain required
- Cannot save with empty required fields
- Form highlights missing information

### Data Integrity Checks
- System prevents data corruption
- Validates format requirements
- Ensures consistency across records

## Impact of Client Changes

### Existing Invoices
- **Historical Data**: Past invoices retain original client information
- **Unpaid Invoices**: May show updated information depending on system configuration
- **Invoice References**: Client ID remains constant for tracking

### Future Invoices
- **New Information**: All new invoices use updated client data
- **Email Delivery**: Invoices sent to updated email address
- **Address Display**: Updated address appears on new invoices

### Reports and Analytics
- **Current Reports**: Show updated client information
- **Historical Reports**: May show information as it was at report time
- **Client Lists**: Immediately reflect changes

## Bulk Editing

For editing multiple clients:

### Individual Updates
- Edit clients one at a time
- Most accurate method
- Time-consuming for many clients

### CSV Export/Import
1. Export current client list
2. Make changes in spreadsheet
3. Import updated information
4. Review and confirm changes

## Best Practices

### Before Making Changes
- **Verify Information**: Confirm changes are accurate
- **Check Impact**: Consider effect on pending invoices
- **Backup Data**: Ensure data is backed up
- **Document Changes**: Note significant changes

### During Editing
- **One Change at a Time**: Focus on one client at a time
- **Double-Check Email**: Verify email addresses carefully
- **Complete Information**: Fill in missing fields when possible
- **Consistent Format**: Maintain consistent data formatting

### After Changes
- **Verify Updates**: Check that changes were saved correctly
- **Test Email**: Verify new email addresses work
- **Update Related Records**: Consider impact on other systems
- **Communicate Changes**: Inform team of significant changes

## Troubleshooting Edit Issues

### Cannot Save Changes
- **Check Required Fields**: Ensure name and email are filled
- **Verify Email Format**: Must be valid email address
- **Check for Duplicates**: Email cannot match another client
- **Internet Connection**: Ensure stable connection

### Changes Not Appearing
- **Refresh Page**: Reload to see updates
- **Clear Cache**: Clear browser cache if needed
- **Check Sync Status**: Verify Google Sheets synchronization
- **Wait for Processing**: Allow time for changes to propagate

### Permission Errors
- **Login Status**: Ensure you're still logged in
- **Access Rights**: Verify you have edit permissions
- **Session Timeout**: Re-authenticate if session expired
- **System Maintenance**: Check if system is under maintenance

## Undoing Changes

### Recent Changes
- **Browser Back**: Use browser back button immediately after save
- **Edit Again**: Open edit form and revert changes
- **Manual Restoration**: Re-enter previous information

### Historical Data
- **Backup Restoration**: Restore from backup if available
- **Manual Recreation**: Re-enter information from records
- **Contact Administrator**: Get help with data recovery

## Client Merge and Duplicate Handling

### Identifying Duplicates
- **Similar Names**: Look for variations of same client
- **Same Email**: System prevents duplicate emails
- **Address Matching**: Check for same address, different names

### Merging Clients
- **Manual Process**: Combine information manually
- **Choose Primary**: Select which client record to keep
- **Update References**: Ensure invoices reference correct client
- **Delete Duplicate**: Remove duplicate after merging

## Next Steps

After editing clients:

1. [View updated client details](./client-details.md)
2. [Create invoices with new information](../invoices/creating-invoices.md)
3. [Generate client reports](../reports/client-reports.md) to verify changes
4. [Update recurring invoices](../invoices/recurring-invoices.md) if needed

## Related Topics

- [Adding Clients](./adding-clients.md)
- [Client Details View](./client-details.md)
- [Client Reports](../reports/client-reports.md)
- [Invoice Management](../invoices/creating-invoices.md)