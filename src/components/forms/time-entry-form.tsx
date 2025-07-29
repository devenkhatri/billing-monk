'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { timeEntryFormSchema, type TimeEntryFormData } from '@/lib/validations';
import { Task, TimeEntry } from '@/types';
import { FormField } from './form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

interface TimeEntryFormProps {
  task: Task;
  timeEntry?: TimeEntry;
  onSubmit: (data: TimeEntryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TimeEntryForm({ 
  task, 
  timeEntry, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TimeEntryFormProps) {
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: timeEntry ? {
      description: timeEntry.description || '',
      startTime: timeEntry.startTime.toISOString().slice(0, 16),
      endTime: timeEntry.endTime?.toISOString().slice(0, 16) || '',
      duration: timeEntry.duration,
      isBillable: timeEntry.isBillable
    } : {
      description: '',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: '',
      duration: 0,
      isBillable: task.isBillable
    }
  });

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerStart) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timerStart.getTime()) / 1000);
        setElapsedTime(elapsed);
        setValue('duration', elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStart, setValue]);

  const startTimer = () => {
    const now = new Date();
    setTimerStart(now);
    setValue('startTime', now.toISOString().slice(0, 16));
    setIsTimerMode(true);
  };

  const stopTimer = () => {
    if (timerStart) {
      const now = new Date();
      setValue('endTime', now.toISOString().slice(0, 16));
      setTimerStart(null);
      setIsTimerMode(false);
    }
  };

  const resetTimer = () => {
    setTimerStart(null);
    setElapsedTime(0);
    setIsTimerMode(false);
    setValue('duration', 0);
    setValue('startTime', new Date().toISOString().slice(0, 16));
    setValue('endTime', '');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDurationFromTimes = () => {
    const startTime = watch('startTime');
    const endTime = watch('endTime');
    
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
      if (duration > 0) {
        setValue('duration', duration);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Task Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
        <p className="text-sm text-gray-600">Logging time for this task</p>
      </div>

      {/* Timer Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Timer</h4>
          <div className="text-2xl font-mono font-bold text-blue-600">
            {formatTime(elapsedTime)}
          </div>
        </div>
        <div className="flex space-x-2">
          {!timerStart ? (
            <Button type="button" onClick={startTimer} className="bg-green-600 hover:bg-green-700">
              Start Timer
            </Button>
          ) : (
            <Button type="button" onClick={stopTimer} className="bg-red-600 hover:bg-red-700">
              Stop Timer
            </Button>
          )}
          <Button type="button" variant="outline" onClick={resetTimer}>
            Reset
          </Button>
        </div>
      </div>

      {/* Manual Time Entry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Start Time"
          error={errors.startTime?.message}
          required
        >
          <Input
            type="datetime-local"
            {...register('startTime')}
            error={errors.startTime?.message}
            disabled={isLoading || !!timerStart}
            onChange={(e) => {
              register('startTime').onChange(e);
              calculateDurationFromTimes();
            }}
          />
        </FormField>

        <FormField
          label="End Time"
          error={errors.endTime?.message}
        >
          <Input
            type="datetime-local"
            {...register('endTime')}
            error={errors.endTime?.message}
            disabled={isLoading || !!timerStart}
            onChange={(e) => {
              register('endTime').onChange(e);
              calculateDurationFromTimes();
            }}
          />
        </FormField>
      </div>

      {/* Duration */}
      <FormField
        label="Duration (seconds)"
        error={errors.duration?.message}
        required
      >
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            min="0"
            {...register('duration', { valueAsNumber: true })}
            error={errors.duration?.message}
            disabled={isLoading || !!timerStart}
            className="flex-1"
          />
          <div className="text-sm text-gray-500">
            {watch('duration') ? `${(watch('duration') / 3600).toFixed(2)} hours` : '0 hours'}
          </div>
        </div>
      </FormField>

      {/* Description */}
      <FormField
        label="Description"
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="What did you work on?"
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
          This time is billable
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
          disabled={!!timerStart}
        >
          {timeEntry ? 'Update Entry' : 'Save Entry'}
        </Button>
      </div>

      {timerStart && (
        <p className="text-sm text-blue-600 text-center">
          Stop the timer before saving the entry
        </p>
      )}
    </form>
  );
}