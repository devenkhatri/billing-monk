'use client';

import { useState, useEffect } from 'react';
import { Project, Client, ApiResponse, ProjectStatus } from '@/types';
import { ProjectFormData } from '@/lib/validations';
import { ProjectForm } from '@/components/forms/project-form';
import { ProjectTable } from '@/components/tables/project-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch projects and clients on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [projectsResponse, clientsResponse] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/clients')
      ]);

      const projectsData: ApiResponse<Project[]> = await projectsResponse.json();
      const clientsData: ApiResponse<Client[]> = await clientsResponse.json();

      if (projectsData.success) {
        // Convert date strings back to Date objects
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
        
        // Convert date strings back to Date objects
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

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete project "${project.name}"? This will also delete all associated tasks.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      });

      const data: ApiResponse<{ message: string }> = await response.json();

      if (data.success) {
        setProjects(prev => prev.filter(p => p.id !== project.id));
        setSuccess('Project deleted successfully');
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to delete project. Please try again.');
      console.error('Error deleting project:', err);
    }
  };

  const handleStatusChange = async (project: Project, newStatus: ProjectStatus) => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...project,
          status: newStatus,
          startDate: project.startDate.toISOString().split('T')[0],
          endDate: project.endDate?.toISOString().split('T')[0] || ''
        })
      });

      const data: ApiResponse<Project> = await response.json();

      if (data.success) {
        const projectWithDates = {
          ...data.data,
          startDate: new Date(data.data.startDate),
          endDate: data.data.endDate ? new Date(data.data.endDate) : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };

        setProjects(prev => prev.map(p => p.id === project.id ? projectWithDates : p));
        setSuccess(`Project status updated to ${newStatus}`);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to update project status. Please try again.');
      console.error('Error updating project status:', err);
    }
  };

  const handleFormSubmit = async (formData: ProjectFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data: ApiResponse<Project> = await response.json();

      if (data.success) {
        // Convert date strings back to Date objects
        const projectWithDates = {
          ...data.data,
          startDate: new Date(data.data.startDate),
          endDate: data.data.endDate ? new Date(data.data.endDate) : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };

        if (editingProject) {
          setProjects(prev => prev.map(p => p.id === editingProject.id ? projectWithDates : p));
          setSuccess('Project updated successfully');
        } else {
          setProjects(prev => [projectWithDates, ...prev]);
          setSuccess('Project created successfully');
        }

        setIsFormOpen(false);
        setEditingProject(null);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to save project. Please try again.');
      console.error('Error saving project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProject(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your projects and track progress</p>
        </div>
        <Button onClick={handleCreateProject}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Project
        </Button>
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

      {/* Projects Table */}
      <ProjectTable
        projects={projects}
        clients={clients}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
        onStatusChange={handleStatusChange}
        isLoading={isLoading}
      />

      {/* Project Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        size="xl"
      >
        <ProjectForm
          clients={clients}
          project={editingProject || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}