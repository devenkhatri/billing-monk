'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Task, TimeEntry, Project, ApiResponse } from '@/types';
import { TimeEntryFormData } from '@/lib/validations';
import { TimeEntryForm } from '@/components/forms/time-entry-form';
import { TimeEntryTable } from '@/components/tables/time-entry-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { PlusIcon, ArrowLeftIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function TaskTimeTrackingPage() {
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    fetchData();
  }, [taskId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timerStart) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - timerStart.getTime()) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerStart]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [taskResponse, timeEntriesResponse] = await Promise.all([
        fetch(`/api/tasks/${taskId}`),
        fetch(`/api/time-entries?taskId=${taskId}`)
      ]);

      const taskData: ApiResponse<Task> = await taskResponse.json();
      const timeEntriesData: ApiResponse<TimeEntry[]> = await timeEntriesResponse.json();

      if (taskData.success) {
        const taskWithDates = {
          ...taskData.data,
          dueDate: taskData.data.dueDate ? new Date(taskData.data.dueDate) : undefined,
          createdAt: new Date(taskData.data.createdAt),
          updatedAt: new Date(taskData.data.updatedAt)
        };
        setTask(taskWithDates);

        // Fetch project data
        const projectResponse = await fetch(`/api/projects/${taskWithDates.projectId}`);
        const projectData: ApiResponse<Project> = await projectResponse.json();
        
        if (projectData.success) {
          setProject({
            ...projectData.data,
            startDate: new Date(projectData.data.startDate),
            endDate: projectData.data.endDate ? new Date(projectData.data.endDate) : undefined,
            createdAt: new Date(projectData.data.createdAt),
            updatedAt: new Date(projectData.data.updatedAt)
          });
        }
      } else {
        setError(taskData.error.message);
      }

      if (timeEntriesData.success) {
        const timeEntriesWithDates = timeEntriesData.data.map(entry => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }));
        setTimeEntries(timeEntriesWithDates);
      } else {
        setError(timeEntriesData.error.message);
      }
    } catch (err) {
      setError('Failed to fetch task data. Please try again.');
      console.error('Error fetching task data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimer = () => {
    setTimerStart(new Date());
    setIsTimerRunning(true);
    setElapsedTime(0);
  };

  const handleStopTimer = async () => {
    if (!timerStart || !task) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timerStart.getTime()) / (1000 * 60)); // in minutes

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: task.id,
          startTime: timerStart.toISOString(),
          endTime: endTime.toISOString(),
          duration,
          isBillable: task.isBillable,
          hourlyRate: project?.hourlyRate
        })
      });

      const data: ApiResponse<TimeEntry> = await response.json();

      if (data.success) {
        const timeEntryWithDates = {
          ...data.data,
          startTime: new Date(data.data.startTime),
          endTime: data.data.endTime ? new Date(data.data.endTime) : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };

        setTimeEntries(prev => [timeEntryWithDates, ...prev]);
        setSuccess(`Time entry created: ${(duration / 60).toFixed(1)} hours`);
        
        // Refresh task data to get updated hours
        fetchData();
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to save time entry. Please try again.');
      console.error('Error saving time entry:', err);
    }

    setIsTimerRunning(false);
    setTimerStart(null);
    setElapsedTime(0);
  };

  const handleCreateTimeEntry = () => {
    setEditingTimeEntry(null);
    setIsFormOpen(true);
  };

  const handleEditTimeEntry = (timeEntry: TimeEntry) => {
    setEditingTimeEntry(timeEntry);
    setIsFormOpen(true);
  };

  const handleDeleteTimeEntry = async (timeEntry: TimeEntry) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/time-entries/${timeEntry.id}`, {
        method: 'DELETE'
      });

      const data: ApiResponse<{ message: string }> = await response.json();

      if (data.success) {
        setTimeEntries(prev => prev.filter(t => t.id !== timeEntry.id));
        setSuccess('Time entry deleted successfully');
        
        // Refresh task data to get updated hours
        fetchData();
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to delete time entry. Please try again.');
      console.error('Error deleting time entry:', err);
    }
  };

  const handleFormSubmit = async (formData: TimeEntryFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingTimeEntry ? `/api/time-entries/${editingTimeEntry.id}` : '/api/time-entries';
      const method = editingTimeEntry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data: ApiResponse<TimeEntry> = await response.json();

      if (data.success) {
        const timeEntryWithDates = {
          ...data.data,
          startTime: new Date(data.data.startTime),
          endTime: data.data.endTime ? new Date(data.data.endTime) : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };

        if (editingTimeEntry) {
          setTimeEntries(prev => prev.map(t => t.id === editingTimeEntry.id ? timeEntryWithDates : t));
          setSuccess('Time entry updated successfully');
        } else {
          setTimeEntries(prev => [timeEntryWithDates, ...prev]);
          setSuccess('Time entry created successfully');
        }

        setIsFormOpen(false);
        setEditingTimeEntry(null);
        
        // Refresh task data to get updated hours
        fetchData();
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to save time entry. Please try again.');
      console.error('Error saving time entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingTimeEntry(null);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate totals
  const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const billableMinutes = timeEntries.filter(entry => entry.isBillable).reduce((sum, entry) => sum + entry.duration, 0);
  const totalHours = totalMinutes / 60;
  const billableHours = billableMinutes / 60;

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error, success]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Task not found</h2>
        <p className="mt-2 text-gray-600">The task you're looking for doesn't exist.</p>
        <Link href="/tasks">
          <Button className="mt-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600">
              {project?.name} • Time Tracking
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleCreateTimeEntry} variant="outline">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
          {isTimerRunning ? (
            <Button onClick={handleStopTimer} className="bg-red-600 hover:bg-red-700">
              <StopIcon className="h-4 w-4 mr-2" />
              Stop Timer
            </Button>
          ) : (
            <Button onClick={handleStartTimer} className="bg-green-600 hover:bg-green-700">
              <PlayIcon className="h-4 w-4 mr-2" />
              Start Timer
            </Button>
          )}
        </div>
      </div>

      {/* Timer Display */}
      {isTimerRunning && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl font-mono font-bold text-green-800 mb-2">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-green-600">Timer running...</div>
        </div>
      )}

      {/* Time Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Time Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</div>
            <div className="text-sm text-gray-500">Total Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{billableHours.toFixed(1)}h</div>
            <div className="text-sm text-gray-500">Billable Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{task.estimatedHours?.toFixed(1) || '?'}h</div>
            <div className="text-sm text-gray-500">Estimated Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {project?.hourlyRate && billableHours > 0 
                ? formatCurrency(project.hourlyRate * billableHours)
                : '-'
              }
            </div>
            <div className="text-sm text-gray-500">Billable Amount</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Time Entries Table */}
      <TimeEntryTable
        timeEntries={timeEntries}
        onEdit={handleEditTimeEntry}
        onDelete={handleDeleteTimeEntry}
        showTaskColumn={false}
        isLoading={false}
      />

      {/* Time Entry Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingTimeEntry ? 'Edit Time Entry' : 'Create Time Entry'}
        size="lg"
      >
        <TimeEntryForm
          task={task}
          timeEntry={editingTimeEntry || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}