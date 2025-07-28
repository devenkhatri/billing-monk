'use client';

import { useState } from 'react';
import { Invoice, Client, InvoiceStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface InvoiceTableProps {
  invoices: Invoice[];
  clients: Client[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onStatusChange?: (invoice: Invoice, status: InvoiceStatus) => void;
  isLoading?: boolean;
}

interface Filters {
  status: InvoiceStatus | '';
  clientId: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

export function InvoiceTable({ 
  invoices, 
  clients, 
  onEdit, 
  onDelete, 
  onView,
  onStatusChange,
  isLoading = false 
}: InvoiceTableProps) {
  const [filters, setFilters] = useState<Filters>({
    status: '',
    clientId: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sortBy, setSortBy] = useState<'invoiceNumber' | 'issueDate' | 'dueDate' | 'total'>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    if (filters.status && invoice.status !== filters.status) return false;
    if (filters.clientId && invoice.clientId !== filters.clientId) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const client = clients.find(c => c.id === invoice.clientId);
      const clientName = client?.name.toLowerCase() || '';
      const invoiceNumber = invoice.invoiceNumber.toLowerCase();
      
      if (!clientName.includes(searchLower) && !invoiceNumber.includes(searchLower)) {
        return false;
      }
    }
    if (filters.dateFrom && invoice.issueDate < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && invoice.issueDate > new Date(filters.dateTo)) return false;
    
    return true;
  });

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let aValue: string | number | Date;
    let bValue: string | number | Date;

    switch (sortBy) {
      case 'invoiceNumber':
        aValue = a.invoiceNumber;
        bValue = b.invoiceNumber;
        break;
      case 'issueDate':
        aValue = a.issueDate;
        bValue = b.issueDate;
        break;
      case 'dueDate':
        aValue = a.dueDate;
        bValue = b.dueDate;
        break;
      case 'total':
        aValue = a.total;
        bValue = b.total;
        break;
      default:
        aValue = a.issueDate;
        bValue = b.issueDate;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map(client => ({
      value: client.id,
      label: client.name
    }))
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilters({
              status: '',
              clientId: '',
              search: '',
              dateFrom: '',
              dateTo: ''
            })}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value as InvoiceStatus | '' }))}
              options={statusOptions}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <Select
              value={filters.clientId}
              onChange={(value) => setFilters(prev => ({ ...prev, clientId: value as string }))}
              options={clientOptions}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Invoice # or client..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoiceNumber')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Invoice #</span>
                    {sortBy === 'invoiceNumber' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('issueDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Issue Date</span>
                    {sortBy === 'issueDate' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Due Date</span>
                    {sortBy === 'dueDate' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Total</span>
                    {sortBy === 'total' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getClientName(invoice.clientId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={invoice.balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {formatCurrency(invoice.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(invoice)}
                          className="text-blue-600 hover:text-blue-700"
                          title="View Invoice"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        
                        {/* Status change buttons */}
                        {onStatusChange && (
                          <>
                            {invoice.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onStatusChange(invoice, 'sent')}
                                className="text-green-600 hover:text-green-700"
                                title="Mark as Sent"
                              >
                                <PaperAirplaneIcon className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && invoice.balance > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onStatusChange(invoice, 'paid')}
                                className="text-green-600 hover:text-green-700"
                                title="Mark as Paid"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onStatusChange(invoice, 'cancelled')}
                                className="text-red-600 hover:text-red-700"
                                title="Cancel Invoice"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(invoice)}
                          className="text-gray-600 hover:text-gray-700"
                          title="Edit Invoice"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(invoice)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Invoice"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && sortedInvoices.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Invoices:</span>
              <span className="ml-2 font-medium">{sortedInvoices.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Amount:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(sortedInvoices.reduce((sum, inv) => sum + inv.total, 0))}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Paid:</span>
              <span className="ml-2 font-medium text-green-600">
                {formatCurrency(sortedInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0))}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Outstanding:</span>
              <span className="ml-2 font-medium text-red-600">
                {formatCurrency(sortedInvoices.reduce((sum, inv) => sum + inv.balance, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}