'use client';

import { useState, useEffect } from 'react';
import { Client, ApiResponse } from '@/types';
import { ClientFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';
import { ClientTable } from '@/components/tables/client-table';
import { ClientForm } from '@/components/forms/client-form';
import { ClientDetail } from '@/components/clients/client-detail';

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/clients');
      const data: ApiResponse<Client[]> = await response.json();
      
      if (data.success) {
        setClients(data.data);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (formData: ClientFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data: ApiResponse<Client> = await response.json();
      
      if (data.success) {
        setClients(prev => [...prev, data.data]);
        setViewMode('list');
        setSelectedClient(null);
      } else {
        throw new Error(data.error.message);
      }
    } catch (err) {
      throw err; // Re-throw to be handled by the form
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async (formData: ClientFormData) => {
    if (!selectedClient) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data: ApiResponse<Client> = await response.json();
      
      if (data.success) {
        setClients(prev => prev.map(client => 
          client.id === selectedClient.id ? data.data : client
        ));
        setViewMode('detail');
        setSelectedClient(data.data);
      } else {
        throw new Error(data.error.message);
      }
    } catch (err) {
      throw err; // Re-throw to be handled by the form
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });
      
      const data: ApiResponse<{ id: string }> = await response.json();
      
      if (data.success) {
        setClients(prev => prev.filter(c => c.id !== client.id));
        if (selectedClient?.id === client.id) {
          setSelectedClient(null);
          setViewMode('list');
        }
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to delete client');
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setViewMode('detail');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setViewMode('edit');
  };

  const handleCreateClick = () => {
    setSelectedClient(null);
    setViewMode('create');
  };

  const handleCancel = () => {
    setSelectedClient(null);
    setViewMode('list');
  };

  const handleEditFromDetail = () => {
    setViewMode('edit');
  };

  const handleCloseDetail = () => {
    setSelectedClient(null);
    setViewMode('list');
  };

  if (isLoading) {
    return (
      <LoadingState />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            Manage your client information and view their invoices
          </p>
        </div>
        {viewMode === 'list' && (
          <Button onClick={handleCreateClick}>
            Add Client
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <ClientTable
          clients={clients}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          onView={handleViewClient}
          isLoading={isLoading}
        />
      )}

      {viewMode === 'create' && (
        <div className="max-w-4xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create New Client</h2>
            <p className="text-gray-600 mt-1">Add a new client to your system</p>
          </div>
          <ClientForm
            onSubmit={handleCreateClient}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {viewMode === 'edit' && selectedClient && (
        <div className="max-w-4xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Client</h2>
            <p className="text-gray-600 mt-1">Update client information</p>
          </div>
          <ClientForm
            client={selectedClient}
            onSubmit={handleUpdateClient}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {viewMode === 'detail' && selectedClient && (
        <ClientDetail
          client={selectedClient}
          onEdit={handleEditFromDetail}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}