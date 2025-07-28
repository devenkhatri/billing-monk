'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema, ClientFormData } from '@/lib/validations';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/loading';
import { useFormSubmission } from '@/lib/hooks/use-async-operation';
import { useNotifications } from '@/lib/notification-context';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: ClientFormData) => Promise<Client>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const { state, submit } = useFormSubmission<Client>();
  const { addErrorNotification } = useNotifications();

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
    const result = await submit(
      () => onSubmit(data),
      {
        successMessage: client ? 'Client updated successfully' : 'Client created successfully',
        errorMessage: client ? 'Failed to update client' : 'Failed to create client'
      }
    );

    // If successful and this is a create operation, you might want to reset the form
    if (result && !client) {
      // Form will be closed by parent component typically
    }
  };

  const isSubmitting = state.loading || isLoading;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {state.error && (
        <Alert variant="error" dismissible onDismiss={() => {}}>
          {state.error}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <Spinner size="sm" className="mr-2" />
              Saving...
            </div>
          ) : (
            client ? 'Update Client' : 'Create Client'
          )}
        </Button>
      </div>
    </form>
  );
}