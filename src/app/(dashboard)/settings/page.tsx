'use client';

import { useState, useEffect } from 'react';
import { CompanySettings, CompanySettingsFormData, AppSettings, AppSettingsFormData, ApiResponse } from '@/types';
import { SettingsForm } from '@/components/forms/settings-form';
import { LoadingState } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme-context';
import { SheetsStatus } from '@/components/monitoring/sheets-status';

export default function SettingsPage() {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { setTheme, setColorTheme } = useTheme();

  useEffect(() => {
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [companyResponse, appResponse] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/app-settings')
      ]);

      const companyData: ApiResponse<CompanySettings> = await companyResponse.json();
      const appData: ApiResponse<AppSettings> = await appResponse.json();

      if (companyData.success) {
        setCompanySettings(companyData.data);
      } else {
        setError(companyData.error.message);
      }

      if (appData.success) {
        setAppSettings(appData.data);
        // Apply theme from settings
        if (appData.data.theme) {
          setTheme(appData.data.theme);
        }
        if (appData.data.colorTheme) {
          setColorTheme(appData.data.colorTheme);
        }
      } else {
        console.warn('Failed to load app settings:', appData.error.message);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleDriveSettingsChange = async (settings: {
    enabled: boolean;
    folderId?: string;
    folderName: string;
    autoUpload: boolean;
  }) => {
    if (!appSettings) return;

    try {
      const updatedAppSettings = {
        ...appSettings,
        googleDrive: {
          enabled: settings.enabled,
          folderId: settings.folderId,
          folderName: settings.folderName,
          autoUpload: settings.autoUpload
        }
      };

      const appSettingsData = {
        googleSheetsId: updatedAppSettings.googleSheetsId || '',
        autoBackup: updatedAppSettings.autoBackup,
        backupFrequency: updatedAppSettings.backupFrequency,
        theme: updatedAppSettings.theme,
        colorTheme: updatedAppSettings.colorTheme,
        googleDriveEnabled: settings.enabled,
        googleDriveFolderId: settings.folderId || '',
        googleDriveFolderName: settings.folderName,
        googleDriveAutoUpload: settings.autoUpload
      };

      const response = await fetch('/api/app-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appSettingsData),
      });

      const data = await response.json();

      if (data.success) {
        setAppSettings(data.data);
      } else {
        throw new Error(data.error.message);
      }
    } catch (error) {
      console.error('Error updating Google Drive settings:', error);
      setError('Failed to update Google Drive settings');
    }
  };

  const handleSubmit = async (formData: CompanySettingsFormData) => {
    try {
      setIsSaving(true);
      setError(null);

      // Separate company and app settings
      const companySettingsData: CompanySettings = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        logo: formData.logo || undefined,
        taxRate: formData.taxRate,
        paymentTerms: formData.paymentTerms,
        invoiceTemplate: formData.invoiceTemplate,
        currency: formData.currency,
        dateFormat: formData.dateFormat,
        timeZone: formData.timeZone
      };

      const appSettingsData: AppSettingsFormData = {
        googleSheetsId: appSettings?.googleSheetsId || '',
        autoBackup: appSettings?.autoBackup || true,
        backupFrequency: appSettings?.backupFrequency || 'weekly',
        theme: formData.theme,
        colorTheme: (formData as any).colorTheme || appSettings?.colorTheme || 'default',
        googleDriveEnabled: appSettings?.googleDrive?.enabled || false,
        googleDriveFolderId: appSettings?.googleDrive?.folderId || '',
        googleDriveFolderName: appSettings?.googleDrive?.folderName || 'Invoices',
        googleDriveAutoUpload: appSettings?.googleDrive?.autoUpload || true
      };

      // Update both settings
      const [companyResponse, appResponse] = await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companySettingsData),
        }),
        fetch('/api/app-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appSettingsData),
        })
      ]);

      const companyData: ApiResponse<CompanySettings> = await companyResponse.json();
      const appData: ApiResponse<AppSettings> = await appResponse.json();

      if (companyData.success) {
        setCompanySettings(companyData.data);
      } else {
        throw new Error(companyData.error.message);
      }

      if (appData.success) {
        setAppSettings(appData.data);
        // Apply theme immediately
        setTheme(appData.data.theme);
        setColorTheme(appData.data.colorTheme);
      } else {
        console.warn('Failed to update app settings:', appData.error.message);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error; // Re-throw to let the form handle the error notification
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitializeSheets = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/sheets/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Google Sheets initialized successfully! All required sheets have been created.');
      } else {
        setError(data.error.message);
      }
    } catch (error) {
      console.error('Error initializing sheets:', error);
      setError('Failed to initialize Google Sheets. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingState message="Loading settings..." />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your company information, invoice settings, and preferences.
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Google Sheets Status and Setup Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SheetsStatus />
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">Google Sheets Setup</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            If you're experiencing issues with projects, tasks, or time tracking, you may need to initialize the required Google Sheets.
            This will create all necessary sheets and headers in your connected spreadsheet.
          </p>
          <Button
            onClick={handleInitializeSheets}
            disabled={isInitializing}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800"
          >
            {isInitializing ? 'Initializing...' : 'Initialize Google Sheets'}
          </Button>
        </div>
      </div>

      <SettingsForm
        initialData={companySettings ? {
          ...companySettings,
          theme: appSettings?.theme || 'light',
          colorTheme: appSettings?.colorTheme || 'default'
        } : undefined}
        appSettings={appSettings ? {
          googleDriveEnabled: appSettings.googleDrive?.enabled || false,
          googleDriveFolderId: appSettings.googleDrive?.folderId,
          googleDriveFolderName: appSettings.googleDrive?.folderName || 'Invoices',
          googleDriveAutoUpload: appSettings.googleDrive?.autoUpload || true
        } : undefined}
        onSubmit={handleSubmit}
        onGoogleDriveSettingsChange={handleGoogleDriveSettingsChange}
        isLoading={isSaving}
      />
    </div>
  );
}