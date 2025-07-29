'use client';

import { useState, useEffect } from 'react';
import { Task, Project, Client, ApiResponse, TaskStatus, TaskPriority } from '@/types';
import { TaskFormData } from '@/lib/validations';
import { TaskForm } from '@/components/forms/task-form';
import { TaskTable } from '@/components/tables/task-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Fetch tasks, projects, and clients on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [tasksResponse, projectsResponse, clientsResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/clients')
      ]);

      const tasksData: ApiResponse<Task[]> = await tasksResponse.json();
      const projectsData: ApiResponse<Project[]> = await projectsResponse.json();
      const clientsData: ApiResponse<Client[]> = await clientsResponse.json();

      if (tasksData.success) {
        // Convert date strings back to Date objects
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

      if (projectsData.success) {
        const projectsWithDates = projectsData.data.map(project => ({
          ...project,
          startDate: new Date(project.startDate),
          endDate: project.endDate ? new Date(project.endDate) : undefined,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }));
        setProjects(projectsWithDates);
      } else {
        setError(projectsData.error.message);
      }

      if (clientsData.success) {
        // Handle the clients API response structure
        const clientsArray: Client[] = Array.isArray(clientsData.data) 
          ? clientsData.data 
          : (clientsData.data as any)?.clients || [];
        
        const clientsWithDates = clientsArray.map((client: Client) => ({
          ...client,
          createdAt: new Date(client.createdAt),
          updatedAt: new Date(client.updatedAt)
        }));
        setClients(clientsWithDates);
      } else {
        setError(clientsData.error.message);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
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
    if (!confirm(`Are you sure you want to delete task "${task.title}"? This will also delete all associated time entries.`)) {
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
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data: ApiResponse<Task> = await response.json();

      if (data.success) {
        // Convert date strings back to Date objects
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

  // Filter tasks by selected project
  const filteredTasks = selectedProject 
    ? tasks.filter(task => task.projectId === selectedProject)
    : tasks;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage your tasks and track progress</p>
        </div>
        <Button onClick={handleCreateTask}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Project Filter */}
      <div className="flex items-center space-x-4">
        <label htmlFor="project-filter" className="text-sm font-medium text-gray-700">
          Filter by Project:
        </label>
        <select
          id="project-filter"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Projects</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
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
        tasks={filteredTasks}
        projects={projects}
        clients={clients}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
        isLoading={isLoading}
      />

      {/* Task Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="xl"
      >
        <TaskForm
          projects={projects}
          task={editingTask || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}