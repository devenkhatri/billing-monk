import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST() {
    try {
        // Get environment variables
        const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
        const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
        const projectId = process.env.GOOGLE_SHEETS_PROJECT_ID;
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        if (!privateKey || !clientEmail || !projectId || !spreadsheetId) {
            throw new Error('Missing required environment variables');
        }

        // Create auth
        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: projectId,
                private_key: privateKey.replace(/\\n/g, '\n'),
                client_email: clientEmail,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Get current spreadsheet info
        const spreadsheetInfo = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId
        });

        const existingSheets = spreadsheetInfo.data.sheets?.map(sheet => sheet.properties?.title) || [];
        console.log('Existing sheets:', existingSheets);

        // Define required sheets with their headers
        const requiredSheets = [
            {
                name: 'Clients',
                headers: ['ID', 'Name', 'Email', 'Phone', 'Street', 'City', 'State', 'ZipCode', 'Country', 'CreatedAt', 'UpdatedAt']
            },
            {
                name: 'Invoices',
                headers: ['ID', 'InvoiceNumber', 'ClientID', 'Status', 'IssueDate', 'DueDate', 'Subtotal', 'TaxRate', 'TaxAmount', 'Total', 'PaidAmount', 'Balance', 'Notes', 'CreatedAt', 'UpdatedAt']
            },
            {
                name: 'LineItems',
                headers: ['ID', 'InvoiceID', 'Description', 'Quantity', 'Rate', 'Amount']
            },
            {
                name: 'Payments',
                headers: ['ID', 'InvoiceID', 'Amount', 'PaymentDate', 'PaymentMethod', 'Notes', 'CreatedAt']
            },
            {
                name: 'Settings',
                headers: ['Key', 'Value', 'UpdatedAt']
            },
            {
                name: 'Templates',
                headers: ['ID', 'Name', 'Description', 'LineItems', 'CreatedAt', 'UpdatedAt']
            }
        ];

        // Create missing sheets
        const sheetsToCreate = requiredSheets.filter(sheet => !existingSheets.includes(sheet.name));
        console.log('Sheets to create:', sheetsToCreate.map(s => s.name));

        if (sheetsToCreate.length > 0) {
            const requests = sheetsToCreate.map(sheet => ({
                addSheet: {
                    properties: {
                        title: sheet.name
                    }
                }
            }));

            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId,
                requestBody: {
                    requests
                }
            });

            console.log(`Created sheets: ${sheetsToCreate.map(s => s.name).join(', ')}`);
        }

        // Add headers to all sheets
        const headerUpdates = [];
        for (const sheet of requiredSheets) {
            const columnLetter = String.fromCharCode(64 + sheet.headers.length); // A=65, so 64+1=A
            headerUpdates.push({
                range: `${sheet.name}!A1:${columnLetter}1`,
                values: [sheet.headers]
            });
        }

        // Update headers in batch
        if (headerUpdates.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: spreadsheetId,
                requestBody: {
                    valueInputOption: 'RAW',
                    data: headerUpdates
                }
            });
            console.log('Updated headers for all sheets');
        }

        // Add default settings
        const defaultSettings = [
            ['company_name', 'Your Company Name', new Date().toISOString()],
            ['company_email', 'contact@yourcompany.com', new Date().toISOString()],
            ['tax_rate', '0.10', new Date().toISOString()],
            ['currency', 'USD', new Date().toISOString()],
            ['invoice_prefix', 'INV', new Date().toISOString()],
            ['payment_terms', '30', new Date().toISOString()]
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Settings!A2:C7',
            valueInputOption: 'RAW',
            requestBody: {
                values: defaultSettings
            }
        });

        console.log('Added default settings');

        const response = {
            success: true,
            data: {
                message: 'Google Sheets structure created successfully',
                sheetsCreated: sheetsToCreate.map(s => s.name),
                headersAdded: requiredSheets.map(s => s.name),
                defaultSettingsAdded: true
            }
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Failed to setup sheets:', error);

        const response = {
            success: false,
            error: {
                message: error.message,
                code: error.code,
                status: error.status,
                details: error.response?.data || error.cause
            }
        };

        return NextResponse.json(response, { status: 500 });
    }
}