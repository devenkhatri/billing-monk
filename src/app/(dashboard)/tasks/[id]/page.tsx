'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Task, Project, Client, TimeEntry, ApiResponse } from '@/types';
import { TaskDetail } from '@/components/tasks/task-detail';
import { TimeEntryTable } from '@/components/tables/time-entry-table';
import { TimeEntryForm } from '@/components/forms/time-entry-form';
import { TaskForm } from '@/components/forms/task-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  ClockIcon, 
  PlusIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isTimeFormOpen, setIsTimeFormOpen] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [taskId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [taskResponse, timeEntriesResponse, projectsResponse, clientsResponse] = await Promise.all([
        fetch(`/api/tasks/${taskId}`),
        fetch(`/api/time-entries?taskId=${taskId}`),
        fetch('/api/projects'),
        fetch('/api/clients')
      ]);

      const taskData: ApiResponse<Task> = await taskResponse.json();
      const timeEntriesData: ApiResponse<TimeEntry[]> = await timeEntriesResponse.json();
      const projectsData: ApiResponse<Project[]> = await projectsResponse.json();
      const clientsData: ApiResponse<Client[]> = await clientsResponse.json();

      if (taskData.success) {
        const taskWithDates = {
          ...taskData.data,
          dueDate: taskData.data.dueDate ? new Date(taskData.data.dueDate) : undefined,
          createdAt: new Date(taskData.data.createdAt),
          updatedAt: new Date(taskData.data.updatedAt)
        };
        setTask(taskWithDates);

        // Fetch project details
        if (projectsData.success) {
          const projectsWithDates = projectsData.data.map(project => ({
            ...project,
            startDate: new Date(project.startDate),
            endDate: project.endDate ? new Date(project.endDate) : undefined,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt)
          }));
          setProjects(projectsWithDates);

          const taskProject = projectsWithDates.find(p => p.id === taskWithDates.projectId);
          if (taskProject) {
            setProject(taskProject);

            // Fetch client details
            if (clientsData.success) {
              const clientsArray: Client[] = Array.isArray(clientsData.data) 
                ? clientsData.data 
                : (clientsData.data as any)?.clients || [];
              
              const clientsWithDates = clientsArray.map((client: Client) => ({
                ...client,
                createdAt: new Date(client.createdAt),
                updatedAt: new Date(client.updatedAt)
              }));

              const taskClient = clientsWithDates.find(c => c.id === taskProject.clientId);
              if (taskClient) {
                setClient(taskClient);
              }
            }
          }
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
      setError('Failed to fetch task details. Please try again.');
      console.error('Error fetching task details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTask = () => {
    setIsEditFormOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!task || !confirm(`Are you sure you want to delete task "${task.title}"? This will also delete all associated time entries.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      });

      const data: ApiResponse<{ message: string }> = await response.json();

      if (data.success) {
        setSuccess('Task deleted successfully');
        setTimeout(() => {
          router.push('/tasks');
        }, 1500);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error('Error deleting task:', err);
    }
  };

  const handleTaskFormSubmit = async (formData: any) => {
    if (!task) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data: ApiResponse<Task> = await response.json();

      if (data.success) {
        const taskWithDates = {
          ...data.data,
          dueDate: data.data.dueDate ? new Date(data.data.dueDate) : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };

        setTask(taskWithDates);
        setSuccess('Task updated successfully');
        setIsEditFormOpen(false);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error('Error updating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTimeEntry = () => {
    setEditingTimeEntry(null);
    setIsTimeFormOpen(true);
  };

  const handleEditTimeEntry = (timeEntry: TimeEntry) => {
    setEditingTimeEntry(timeEntry);
    setIsTimeFormOpen(true);
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
        setTimeEntries(prev => prev.filter(entry => entry.id !== timeEntry.id));
        setSuccess('Time entry deleted successfully');
        
        // Refresh task data to update hours
        fetchData();
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to delete time entry. Please try again.');
      console.error('Error deleting time entry:', err);
    }
  };

  const handleTimeEntryFormSubmit = async (formData: any) => {
    if (!task) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const timeEntryData = {
        ...formData,
        taskId: task.id
      };

      const url = editingTimeEntry ? `/api/time-entries/${editingTimeEntry.id}` : '/api/time-entries';
      const method = editingTimeEntry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timeEntryData)
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
          setTimeEntries(prev => prev.map(entry => 
            entry.id === editingTimeEntry.id ? timeEntryWithDates : entry
          ));
          setSuccess('Time entry updated successfully');
        } else {
          setTimeEntries(prev => [timeEntryWithDates, ...prev]);
          setSuccess('Time entry created successfully');
        }

        setIsTimeFormOpen(false);
        setEditingTimeEntry(null);
        
        // Refresh task data to update hours
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
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!task || !project || !client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h2>
        <p className="text-gray-600 mb-6">The task you're looking for doesn't exist.</p>
        <Link href="/tasks">
          <Button>
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
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleCreateTimeEntry}>
            <ClockIcon className="h-4 w-4 mr-2" />
            Log Time
          </Button>
          <Button variant="outline" onClick={handleEditTask}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Task
          </Button>
          <Button variant="outline" onClick={handleDeleteTask} className="text-red-600 hover:text-red-700">
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
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

      {/* Task Details */}
      <TaskDetail 
        task={task} 
        project={project} 
        client={client} 
        timeEntries={timeEntries}
      />

      {/* Time Entries */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Time Entries</h3>
          <Button size="sm" onClick={handleCreateTimeEntry}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
        <TimeEntryTable
          timeEntries={timeEntries}
          onEdit={handleEditTimeEntry}
          onDelete={handleDeleteTimeEntry}
          showTaskColumn={false}
          isLoading={false}
        />
      </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        title="Edit Task"
        size="xl"
      >
        <TaskForm
          projects={projects}
          task={task}
          onSubmit={handleTaskFormSubmit}
          onCancel={() => setIsEditFormOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Time Entry Form Modal */}
      <Modal
        isOpen={isTimeFormOpen}
        onClose={() => setIsTimeFormOpen(false)}
        title={editingTimeEntry ? 'Edit Time Entry' : 'Log Time'}
        size="lg"
      >
        <TimeEntryForm
          task={task}
          timeEntry={editingTimeEntry || undefined}
          onSubmit={handleTimeEntryFormSubmit}
          onCancel={() => setIsTimeFormOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}