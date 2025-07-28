'use client';

import { useState } from 'react';
import { Client } from '@/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { LoadingState } from '@/components/ui/loading';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView: (client: Client) => void;
  isLoading?: boolean;
}

export function ClientTable({ clients, onEdit, onDelete, onView, isLoading = false }: ClientTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Client | 'address';
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({ isOpen: false, client: null });

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    let aValue: string;
    let bValue: string;

    if (sortConfig.key === 'address') {
      aValue = `${a.address.city}, ${a.address.country}`;
      bValue = `${b.address.city}, ${b.address.country}`;
    } else {
      aValue = String(a[sortConfig.key]);
      bValue = String(b[sortConfig.key]);
    }

    if (sortConfig.direction === 'desc') {
      return bValue.localeCompare(aValue);
    }
    return aValue.localeCompare(bValue);
  });

  const handleSort = (key: keyof Client | 'address') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDeleteClick = (client: Client) => {
    setDeleteModal({ isOpen: true, client });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.client) {
      onDelete(deleteModal.client);
      setDeleteModal({ isOpen: false, client: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, client: null });
  };

  const getSortIcon = (key: keyof Client | 'address') => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-gray-600">
          {sortedClients.length} client{sortedClients.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      {sortedClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No clients found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  sortable
                  onSort={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    <span className="text-xs">{getSortIcon('name')}</span>
                  </div>
                </TableHead>
                <TableHead
                  sortable
                  onSort={() => handleSort('email')}
                  className="hidden sm:table-cell"
                >
                  <div className="flex items-center space-x-1">
                    <span>Email</span>
                    <span className="text-xs">{getSortIcon('email')}</span>
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead
                  sortable
                  onSort={() => handleSort('address')}
                  className="hidden lg:table-cell"
                >
                  <div className="flex items-center space-x-1">
                    <span>Location</span>
                    <span className="text-xs">{getSortIcon('address')}</span>
                  </div>
                </TableHead>
                <TableHead
                  sortable
                  onSort={() => handleSort('createdAt')}
                  className="hidden xl:table-cell"
                >
                  <div className="flex items-center space-x-1">
                    <span>Created</span>
                    <span className="text-xs">{getSortIcon('createdAt')}</span>
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500 sm:hidden">
                      {client.email}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="text-gray-600">{client.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-gray-600">{client.phone || '-'}</div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-gray-600">
                      {client.address.city}, {client.address.country}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="text-gray-600">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(client)}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(client)}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(client)}
                        disabled={isLoading}
                        className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        title="Delete Client"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteModal.client?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}