'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/types';
import { ClientFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { AsyncLoadingState } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';
import { ClientTable } from '@/components/tables/client-table';
import { ClientForm } from '@/components/forms/client-form';
import { ClientDetail } from '@/components/clients/client-detail';
import { useAsyncOperation } from '@/lib/hooks/use-async-operation';
import { useNotifications } from '@/lib/notification-context';
import { clientsApi, handleApiError, isRetryableError } from '@/lib/api-client';

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const { state: loadState, execute: loadClients, retry: retryLoad } = useAsyncOperation<{ clients: Client[]; meta: any }>();
  const { state: deleteState, execute: executeDelete } = useAsyncOperation<void>();
  const { addErrorNotification, addSuccessNotification } = useNotifications();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const result = await loadClients(
      () => clientsApi.getAll(),
      {
        errorMessage: 'Failed to load clients',
        showErrorNotification: false // We'll handle this in the UI
      }
    );

    if (result) {
      setClients(result.clients);
    }
  };

  const handleCreateClient = async (formData: ClientFormData): Promise<Client> => {
    const client = await clientsApi.create(formData);
    setClients(prev => [...prev, client]);
    setViewMode('list');
    setSelectedClient(null);
    return client;
  };

  const handleUpdateClient = async (formData: ClientFormData): Promise<Client> => {
    if (!selectedClient) throw new Error('No client selected');
    
    const updatedClient = await clientsApi.update(selectedClient.id, formData);
    setClients(prev => prev.map(client => 
      client.id === selectedClient.id ? updatedClient : client
    ));
    setViewMode('detail');
    setSelectedClient(updatedClient);
    return updatedClient;
  };

  const handleDeleteClient = async (client: Client) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${client.name}? This action cannot be undone.`);
    if (!confirmed) return;

    const result = await executeDelete(
      () => clientsApi.delete(client.id),
      {
        successMessage: `${client.name} has been deleted successfully`,
        errorMessage: `Failed to delete ${client.name}`
      }
    );

    if (result !== null) { // Success (void return)
      setClients(prev => prev.filter(c => c.id !== client.id));
      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
        setViewMode('list');
      }
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

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <AsyncLoadingState
          loading={loadState.loading}
          error={loadState.error}
          onRetry={retryLoad}
          loadingMessage="Loading clients..."
          errorTitle="Failed to load clients"
        >
          <ClientTable
            clients={clients}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
            onView={handleViewClient}
            isLoading={deleteState.loading}
          />
        </AsyncLoadingState>
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