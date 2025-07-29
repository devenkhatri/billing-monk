'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CompanySettings, CompanySettingsFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card } from '@/components/ui/card';
import { FormField } from '@/components/forms/form-field';
import { useNotifications } from '@/lib/notification-context';
import { useTheme } from '@/lib/theme-context';
import { ColorThemeSelector } from '@/components/ui/color-theme-selector';

const settingsSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  logo: z.string().optional(),
  taxRate: z.number().min(0, 'Tax rate must be 0 or greater').max(100, 'Tax rate cannot exceed 100%'),
  paymentTerms: z.number().min(1, 'Payment terms must be at least 1 day'),
  invoiceTemplate: z.string().min(1, 'Invoice template is required'),
  currency: z.string().min(1, 'Currency is required'),
  dateFormat: z.string().min(1, 'Date format is required'),
  timeZone: z.string().min(1, 'Time zone is required'),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  colorTheme: z.enum(['default', 'lavender', 'mint', 'peach', 'sky', 'rose', 'sage', 'coral', 'periwinkle']).default('default')
});

interface SettingsFormProps {
  initialData?: Partial<CompanySettingsFormData>;
  onSubmit: (data: CompanySettingsFormData) => Promise<void>;
  isLoading?: boolean;
}

const currencyOptions = [
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' }
];

const dateFormatOptions = [
  { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy (31/12/2023)' },
  { value: 'dd-MM-yyyy', label: 'dd-MM-yyyy (31-12-2023)' },
  { value: 'dd MMM yyyy', label: 'dd MMM yyyy (31 Dec 2023)' },
  { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy (12/31/2023)' },
  { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd (2023-12-31)' }
];

const timeZoneOptions = [
  { value: 'Asia/Kolkata', label: 'Indian Standard Time (IST)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
];

const templateOptions = [
  { value: 'default', label: 'Default Template' },
  { value: 'modern', label: 'Modern Template' },
  { value: 'classic', label: 'Classic Template' },
  { value: 'minimal', label: 'Minimal Template' }
];

export function SettingsForm({ initialData, onSubmit, isLoading = false }: SettingsFormProps) {
  const { addNotification } = useNotifications();
  const { setTheme, setColorTheme } = useTheme();
  const [logoPreview, setLogoPreview] = useState<string | undefined>(initialData?.logo);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      email: initialData.email,
      phone: initialData.phone || '',
      street: initialData.address.street,
      city: initialData.address.city,
      state: initialData.address.state,
      zipCode: initialData.address.zipCode,
      country: initialData.address.country,
      logo: initialData.logo || '',
      taxRate: initialData.taxRate,
      paymentTerms: initialData.paymentTerms,
      invoiceTemplate: initialData.invoiceTemplate,
      currency: initialData.currency,
      dateFormat: initialData.dateFormat,
      timeZone: initialData.timeZone,
      theme: (initialData as any).theme || 'light',
      colorTheme: (initialData as any).colorTheme || 'default'
    } : {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      logo: '',
      taxRate: 18,
      paymentTerms: 30,
      invoiceTemplate: 'default',
      currency: 'INR',
      dateFormat: 'dd/MM/yyyy',
      timeZone: 'Asia/Kolkata',
      theme: 'light' as const,
      colorTheme: 'default' as const
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone || '',
        street: initialData.address.street,
        city: initialData.address.city,
        state: initialData.address.state,
        zipCode: initialData.address.zipCode,
        country: initialData.address.country,
        logo: initialData.logo || '',
        taxRate: initialData.taxRate,
        paymentTerms: initialData.paymentTerms,
        invoiceTemplate: initialData.invoiceTemplate,
        currency: initialData.currency,
        dateFormat: initialData.dateFormat,
        timeZone: initialData.timeZone,
        theme: (initialData as any).theme || 'light',
        colorTheme: (initialData as any).colorTheme || 'default'
      });
      setLogoPreview(initialData.logo);
    }
  }, [initialData, reset]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        addNotification({ title: 'Error', message: 'Logo file size must be less than 2MB', type: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setValue('logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Watch theme changes and apply immediately
  const watchedTheme = watch('theme');
  const watchedColorTheme = watch('colorTheme');
  
  useEffect(() => {
    if (watchedTheme) {
      setTheme(watchedTheme as 'light' | 'dark' | 'system');
    }
  }, [watchedTheme, setTheme]);

  useEffect(() => {
    if (watchedColorTheme) {
      setColorTheme(watchedColorTheme as 'default' | 'lavender' | 'mint' | 'peach' | 'sky' | 'rose' | 'sage' | 'coral' | 'periwinkle');
    }
  }, [watchedColorTheme, setColorTheme]);

  const handleFormSubmit = async (data: CompanySettingsFormData) => {
    try {
      await onSubmit({
        ...data,
        logo: logoPreview
      });
      addNotification({ title: 'Success', message: 'Settings updated successfully', type: 'success' });
    } catch {
      addNotification({ title: 'Error', message: 'Failed to update settings', type: 'error' });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Company Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Company Name"
            error={errors.name?.message}
            required
          >
            <Input
              {...register('name')}
              placeholder="Your Company Name"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Email Address"
            error={errors.email?.message}
            required
          >
            <Input
              {...register('email')}
              type="email"
              placeholder="company@example.com"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Phone Number"
            error={errors.phone?.message}
          >
            <Input
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
              disabled={isLoading}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField
              label="Company Logo"
              error={errors.logo?.message}
            >
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={isLoading}
                />
                {logoPreview && (
                  <div className="mt-2">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-auto object-contain border border-gray-200 rounded"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500">Maximum file size: 2MB. Supported formats: JPG, PNG, GIF</p>
              </div>
            </FormField>
          </div>
        </div>
      </Card>

      {/* Address Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormField
              label="Street Address"
              error={errors.street?.message}
              required
            >
              <Input
                {...register('street')}
                placeholder="123, MG Road, Bandra West"
                disabled={isLoading}
              />
            </FormField>
          </div>

          <FormField
            label="City"
            error={errors.city?.message}
            required
          >
            <Input
              {...register('city')}
              placeholder="Mumbai"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="State"
            error={errors.state?.message}
            required
          >
            <Input
              {...register('state')}
              placeholder="Maharashtra"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="PIN Code"
            error={errors.zipCode?.message}
            required
          >
            <Input
              {...register('zipCode')}
              placeholder="400001"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Country"
            error={errors.country?.message}
            required
          >
            <Input
              {...register('country')}
              placeholder="India"
              disabled={isLoading}
            />
          </FormField>
        </div>
      </Card>

      {/* Invoice Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Default GST Rate (%)"
            error={errors.taxRate?.message}
          >
            <Input
              {...register('taxRate', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="18"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Payment Terms (Days)"
            error={errors.paymentTerms?.message}
          >
            <Input
              {...register('paymentTerms', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="30"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Invoice Template"
            error={errors.invoiceTemplate?.message}
          >
            <select
              {...register('invoiceTemplate')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              {templateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Currency"
            error={errors.currency?.message}
          >
            <select
              {...register('currency')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              {currencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Date Format"
            error={errors.dateFormat?.message}
          >
            <select
              {...register('dateFormat')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              {dateFormatOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Time Zone"
            error={errors.timeZone?.message}
          >
            <select
              {...register('timeZone')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              {timeZoneOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Appearance Settings</h3>
        <div className="space-y-6">
          {/* Light/Dark Mode Selector */}
          <FormField
            label="Display Mode"
            error={errors.theme?.message}
          >
            <select
              {...register('theme')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System (Auto)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              System mode automatically switches between light and dark based on your device settings
            </p>
          </FormField>

          {/* Color Theme Selector */}
          <ColorThemeSelector disabled={isLoading} />
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
}