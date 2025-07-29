'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, type TaskFormData } from '@/lib/validations';
import { Project, Task } from '@/types';
import { FormField } from './form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface TaskFormProps {
  projects: Project[];
  task?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TaskForm({ 
  projects, 
  task, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task ? {
      projectId: task.projectId,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate?.toISOString().split('T')[0] || '',
      estimatedHours: task.estimatedHours,
      isBillable: task.isBillable,
      tags: task.tags || []
    } : {
      projectId: '',
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
      estimatedHours: undefined,
      isBillable: true,
      tags: []
    }
  });

  const projectOptions = projects
    .filter(project => project.isActive)
    .map(project => ({
      value: project.id,
      label: project.name
    }));

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Task Title"
          error={errors.title?.message}
          required
        >
          <Input
            {...register('title')}
            placeholder="e.g., Design homepage mockup"
            error={errors.title?.message}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Project"
          error={errors.projectId?.message}
          required
        >
          <Select
            value={watch('projectId')}
            onChange={(value) => setValue('projectId', value as string)}
            options={projectOptions}
            placeholder="Select a project"
            error={!!errors.projectId}
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
          label="Priority"
          error={errors.priority?.message}
          required
        >
          <Select
            value={watch('priority')}
            onChange={(value) => setValue('priority', value as any)}
            options={priorityOptions}
            placeholder="Select priority"
            error={!!errors.priority}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Assigned To"
          error={errors.assignedTo?.message}
        >
          <Input
            {...register('assignedTo')}
            placeholder="e.g., John Doe"
            error={errors.assignedTo?.message}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Due Date"
          error={errors.dueDate?.message}
        >
          <Input
            type="date"
            {...register('dueDate')}
            error={errors.dueDate?.message}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Estimated Hours"
          error={errors.estimatedHours?.message}
        >
          <Input
            type="number"
            step="0.5"
            min="0"
            {...register('estimatedHours', { valueAsNumber: true })}
            placeholder="0"
            error={errors.estimatedHours?.message}
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
          placeholder="Task description and requirements..."
          disabled={isLoading}
        />
      </FormField>

      {/* Billable Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isBillable"
          {...register('isBillable')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
          disabled={isLoading}
        />
        <label htmlFor="isBillable" className="ml-2 block text-sm font-medium text-gray-700">
          This task is billable
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
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}