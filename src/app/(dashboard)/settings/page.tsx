'use client';

import { useState, useEffect } from 'react';
import { CompanySettings, CompanySettingsFormData, ApiResponse } from '@/types';
import { SettingsForm } from '@/components/forms/settings-form';
import { LoadingState } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings');
      const data: ApiResponse<CompanySettings> = await response.json();
      
      if (data.success) {
        setSettings(data.data);
      } else {
        setError(data.error.message);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: CompanySettingsFormData) => {
    try {
      setIsSaving(true);
      setError(null);

      const settingsData: CompanySettings = {
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

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });

      const data: ApiResponse<CompanySettings> = await response.json();
      
      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.error.message);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error; // Re-throw to let the form handle the error notification
    } finally {
      setIsSaving(false);
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
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <SettingsForm
        initialData={settings || undefined}
        onSubmit={handleSubmit}
        isLoading={isSaving}
      />
    </div>
  );
}