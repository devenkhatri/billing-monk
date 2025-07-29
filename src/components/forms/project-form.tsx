'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectFormSchema, type ProjectFormData } from '@/lib/validations';
import { Client, Project } from '@/types';
import { FormField } from './form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface ProjectFormProps {
  clients: Client[];
  project?: Project;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProjectForm({ 
  clients, 
  project, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: project ? {
      name: project.name,
      description: project.description || '',
      clientId: project.clientId,
      status: project.status,
      startDate: project.startDate.toISOString().split('T')[0],
      endDate: project.endDate?.toISOString().split('T')[0] || '',
      budget: project.budget,
      hourlyRate: project.hourlyRate,
      isActive: project.isActive
    } : {
      name: '',
      description: '',
      clientId: '',
      status: 'planning',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: undefined,
      hourlyRate: undefined,
      isActive: true
    }
  });

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: `${client.name} (${client.email})`
  }));

  const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Project Name"
          error={errors.name?.message}
          required
        >
          <Input
            {...register('name')}
            placeholder="e.g., Website Redesign"
            error={errors.name?.message}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Client"
          error={errors.clientId?.message}
          required
        >
          <Select
            value={watch('clientId')}
            onChange={(value) => setValue('clientId', value as string)}
            options={clientOptions}
            placeholder="Select a client"
            error={!!errors.clientId}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Status"
          error={errors.status?.message}
          required
        >
          <Select
            value={watch('status')}
            onChange={(value) => setValue('status', value as any)}
            options={statusOptions}
            placeholder="Select status"
            error={!!errors.status}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Start Date"
          error={errors.startDate?.message}
          required
        >
          <Input
            type="date"
            {...register('startDate')}
            error={errors.startDate?.message}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="End Date"
          error={errors.endDate?.message}
        >
          <Input
            type="date"
            {...register('endDate')}
            error={errors.endDate?.message}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Budget (₹)"
          error={errors.budget?.message}
        >
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register('budget', { valueAsNumber: true })}
            placeholder="0.00"
            error={errors.budget?.message}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Hourly Rate (₹)"
          error={errors.hourlyRate?.message}
        >
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register('hourlyRate', { valueAsNumber: true })}
            placeholder="0.00"
            error={errors.hourlyRate?.message}
            disabled={isLoading}
          />
        </FormField>
      </div>

      <FormField
        label="Description"
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          rows={4}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="Project description and objectives..."
          disabled={isLoading}
        />
      </FormField>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          {...register('isActive')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
          disabled={isLoading}
        />
        <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
          Project is active
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
        >
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}