'use client';

import { useState, useEffect } from 'react';
import { Template, ApiResponse } from '@/types';
import { TemplateFormData } from '@/lib/validations';
import { TemplateForm } from '@/components/forms/template-form';
import { TemplateTable } from '@/components/tables/template-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/templates');
      const data: ApiResponse<Template[]> = await response.json();

      if (data.success) {
        // Convert date strings back to Date objects
        const templatesWithDates = data.data.map(template => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt)
        }));
        setTemplates(templatesWithDates);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to fetch templates. Please try again.');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (!confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE'
      });

      const data: ApiResponse<{ message: string }> = await response.json();

      if (data.success) {
        setTemplates(prev => prev.filter(t => t.id !== template.id));
        setSuccess('Template deleted successfully');
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to delete template. Please try again.');
      console.error('Error deleting template:', err);
    }
  };

  const handleFormSubmit = async (formData: TemplateFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data: ApiResponse<Template> = await response.json();

      if (data.success) {
        // Convert date strings back to Date objects
        const templateWithDates = {
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };

        if (editingTemplate) {
          setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? templateWithDates : t));
          setSuccess('Template updated successfully');
        } else {
          setTemplates(prev => [templateWithDates, ...prev]);
          setSuccess('Template created successfully');
        }

        setIsFormOpen(false);
        setEditingTemplate(null);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to save template. Please try again.');
      console.error('Error saving template:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Invoice Templates</h1>
          <p className="text-gray-600">Create and manage reusable invoice templates</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Template
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

      {/* Templates Table */}
      <TemplateTable
        templates={templates}
        onEdit={handleEditTemplate}
        onDelete={handleDeleteTemplate}
        isLoading={isLoading}
      />

      {/* Template Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingTemplate ? 'Edit Template' : 'Create New Template'}
        size="xl"
      >
        <TemplateForm
          template={editingTemplate || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}