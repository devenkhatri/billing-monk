'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema, ClientFormData } from '@/lib/validations';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { Alert } from '@/components/ui/alert';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client ? {
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      street: client.address.street,
      city: client.address.city,
      state: client.address.state,
      zipCode: client.address.zipCode,
      country: client.address.country,
    } : {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Name"
          error={errors.name?.message}
          required
        >
          <Input
            {...register('name')}
            placeholder="Enter client name"
            disabled={isSubmitting || isLoading}
          />
        </FormField>

        <FormField
          label="Email"
          error={errors.email?.message}
          required
        >
          <Input
            {...register('email')}
            type="email"
            placeholder="Enter email address"
            disabled={isSubmitting || isLoading}
          />
        </FormField>

        <FormField
          label="Phone"
          error={errors.phone?.message}
        >
          <Input
            {...register('phone')}
            type="tel"
            placeholder="Enter phone number"
            disabled={isSubmitting || isLoading}
          />
        </FormField>

        <div></div> {/* Empty div for grid spacing */}

        <FormField
          label="Street Address"
          error={errors.street?.message}
          required
        >
          <Input
            {...register('street')}
            placeholder="Enter street address"
            disabled={isSubmitting || isLoading}
          />
        </FormField>

        <FormField
          label="City"
          error={errors.city?.message}
          required
        >
          <Input
            {...register('city')}
            placeholder="Enter city"
            disabled={isSubmitting || isLoading}
          />
        </FormField>

        <FormField
          label="State/Province"
          error={errors.state?.message}
          required
        >
          <Input
            {...register('state')}
            placeholder="Enter state or province"
            disabled={isSubmitting || isLoading}
          />
        </FormField>

        <FormField
          label="ZIP/Postal Code"
          error={errors.zipCode?.message}
          required
        >
          <Input
            {...register('zipCode')}
            placeholder="Enter ZIP or postal code"
            disabled={isSubmitting || isLoading}
          />
        </FormField>

        <FormField
          label="Country"
          error={errors.country?.message}
          required
        >
          <Input
            {...register('country')}
            placeholder="Enter country"
            disabled={isSubmitting || isLoading}
          />
        </FormField>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
}