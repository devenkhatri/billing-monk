'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Project, Task, Client, ApiResponse, TaskStatus } from '@/types';
import { TaskFormData } from '@/lib/validations';
import { TaskForm } from '@/components/forms/task-form';
import { TaskTable } from '@/components/tables/task-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [projectResponse, tasksResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/tasks?projectId=${projectId}`)
      ]);

      const projectData: ApiResponse<Project> = await projectResponse.json();
      const tasksData: ApiResponse<Task[]> = await tasksResponse.json();

      if (projectData.success) {
        const projectWithDates = {
          ...projectData.data,
          startDate: new Date(projectData.data.startDate),
          endDate: projectData.data.endDate ? new Date(projectData.data.endDate) : undefined,
          createdAt: new Date(projectData.data.createdAt),
          updatedAt: new Date(projectData.data.updatedAt)
        };
        setProject(projectWithDates);

        // Fetch client data
        const clientResponse = await fetch('/api/clients');
        const clientsData: ApiResponse<Client[]> = await clientResponse.json();
        
        if (clientsData.success) {
          const clientsArray: Client[] = Array.isArray(clientsData.data) 
            ? clientsData.data 
            : (clientsData.data as any)?.clients || [];
          
          const projectClient = clientsArray.find(c => c.id === projectWithDates.clientId);
          if (projectClient) {
            setClient({
              ...projectClient,
              createdAt: new Date(projectClient.createdAt),
              updatedAt: new Date(projectClient.updatedAt)
            });
          }
        }
      } else {
        setError(projectData.error.message);
      }

      if (tasksData.success) {
        const tasksWithDates = tasksData.data.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        }));
        setTasks(tasksWithDates);
      } else {
        setError(tasksData.error.message);
      }
    } catch (err) {
      setError('Failed to fetch project data. Please try again.');
      console.error('Error fetching project data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      });

      const data: ApiResponse<{ message: string }> = await response.json();

      if (data.success) {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        setSuccess('Task deleted successfully');
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error('Error deleting task:', err);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...task,
          status: newStatus,
          dueDate: task.dueDate?.toISOString().split('T')[0] || ''
        })
      });

      const data: ApiResponse<Task> = await response.json();

      if (data.success) {
        const taskWithDates = {
          ...data.data,
          dueDate: data.data.dueDate ? new Date(data.data.dueDate) : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };

        setTasks(prev => prev.map(t => t.id === task.id ? taskWithDates : t));
        setSuccess(`Task status updated to ${newStatus}`);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to update task status. Please try again.');
      console.error('Error updating task status:', err);
    }
  };

  const handleFormSubmit = async (formData: TaskFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Ensure the task is created for this project
      const taskData = {
        ...formData,
        projectId: projectId
      };

      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      const data: ApiResponse<Task> = await response.json();

      if (data.success) {
        const taskWithDates = {
          ...data.data,
          dueDate: data.data.dueDate ? new Date(data.data.dueDate) : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };

        if (editingTask) {
          setTasks(prev => prev.map(t => t.id === editingTask.id ? taskWithDates : t));
          setSuccess('Task updated successfully');
        } else {
          setTasks(prev => [taskWithDates, ...prev]);
          setSuccess('Task created successfully');
        }

        setIsFormOpen(false);
        setEditingTask(null);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to save task. Please try again.');
      console.error('Error saving task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  // Calculate project statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalHours = tasks.reduce((sum, task) => sum + task.actualHours, 0);
  const billableHours = tasks.reduce((sum, task) => sum + task.billableHours, 0);
  const estimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

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

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
        <p className="mt-2 text-gray-600">The project you're looking for doesn't exist.</p>
        <Link href="/projects">
          <Button className="mt-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Projects
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
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">
              {client?.name} • {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </p>
          </div>
        </div>
        <Button onClick={handleCreateTask}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Project Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Project Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-sm text-gray-500">Completed Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{totalHours.toFixed(1)}h</div>
            <div className="text-sm text-gray-500">Total Hours ({estimatedHours.toFixed(1)}h est.)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{billableHours.toFixed(1)}h</div>
            <div className="text-sm text-gray-500">Billable Hours</div>
          </div>
        </div>

        {project.description && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{project.description}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Timeline</h3>
            <p className="text-gray-600">
              {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
            </p>
          </div>
          {project.budget && (
            <div>
              <h3 className="text-sm font-medium text-gray-900">Budget</h3>
              <p className="text-gray-600">{formatCurrency(project.budget)}</p>
            </div>
          )}
          {project.hourlyRate && (
            <div>
              <h3 className="text-sm font-medium text-gray-900">Hourly Rate</h3>
              <p className="text-gray-600">{formatCurrency(project.hourlyRate)}/hour</p>
            </div>
          )}
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

      {/* Tasks Table */}
      <TaskTable
        tasks={tasks}
        projects={[project]}
        clients={client ? [client] : []}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
        isLoading={false}
      />

      {/* Task Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="xl"
      >
        <TaskForm
          projects={[project]}
          task={editingTask || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}